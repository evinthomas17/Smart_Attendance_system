from django.db import transaction
from rest_framework import serializers

from accounts.models import User
from .models import Student, StudentFaceData
from face_recognition.services import face_recognition_service


class StudentFaceDataSerializer(serializers.ModelSerializer):
    """Safe metadata representation; embeddings remain internal."""

    class Meta:
        model = StudentFaceData
        fields = ["id", "face_angle", "face_image", "created_at", "updated_at"]
        read_only_fields = ["id", "created_at", "updated_at"]


class StudentSerializer(serializers.ModelSerializer):
    email = serializers.EmailField(source="user.email", read_only=True)
    class_code = serializers.CharField(source="class_group.class_code", read_only=True)
    department = serializers.CharField(
        source="class_group.course.department.name", read_only=True
    )
    course = serializers.CharField(source="class_group.course.name", read_only=True)
    semester = serializers.CharField(source="class_group.semester.name", read_only=True)
    division = serializers.CharField(source="class_group.division", read_only=True)
    face_data_available = serializers.SerializerMethodField()

    class Meta:
        model = Student
        fields = [
            "id",
            "student_id",
            "full_name",
            "email",
            "phone",
            "class_group",
            "class_code",
            "department",
            "course",
            "semester",
            "division",
            "enrollment_date",
            "is_active",
            "face_data_available",
            "created_at",
            "updated_at",
        ]
        read_only_fields = [
            "id",
            "email",
            "class_code",
            "department",
            "course",
            "semester",
            "division",
            "face_data_available",
            "created_at",
            "updated_at",
        ]

    def get_face_data_available(self, student):
        return student.face_data.exists()


class StudentRegistrationSerializer(serializers.ModelSerializer):
    """Admin-only input for creating a Student and its authentication account."""

    email = serializers.EmailField()
    password = serializers.CharField(write_only=True, min_length=8)

    class Meta:
        model = Student
        fields = [
            "student_id",
            "full_name",
            "email",
            "password",
            "phone",
            "class_group",
            "enrollment_date",
        ]

    def validate_email(self, value):
        if User.objects.filter(email__iexact=value).exists():
            raise serializers.ValidationError("A user with this email already exists.")
        return value

    @transaction.atomic
    def create(self, validated_data):
        email = validated_data.pop("email")
        password = validated_data.pop("password")
        user = User.objects.create_user(
            email=email,
            password=password,
            role="STUDENT",
        )
        return Student.objects.create(user=user, **validated_data)


class StudentRegistrationWithFaceSerializer(serializers.ModelSerializer):
    """
    Extended registration serializer that handles face image uploads
    and generates face embeddings using YuNet + ArcFace.
    """
    
    email = serializers.EmailField()
    password = serializers.CharField(write_only=True, min_length=8)
    confirm_password = serializers.CharField(write_only=True)
    
    front_face = serializers.ImageField(write_only=True, required=True)
    left_face = serializers.ImageField(write_only=True, required=True)
    right_face = serializers.ImageField(write_only=True, required=True)
    
    date_of_birth = serializers.DateField(required=False, allow_null=True)
    gender = serializers.ChoiceField(
        choices=[('M', 'Male'), ('F', 'Female'), ('O', 'Other')],
        required=False,
        allow_null=True
    )

    class Meta:
        model = Student
        fields = [
            "student_id",
            "full_name",
            "email",
            "password",
            "confirm_password",
            "phone",
            "date_of_birth",
            "gender",
            "class_group",
            "enrollment_date",
            "front_face",
            "left_face",
            "right_face",
        ]

    def validate_email(self, value):
        if User.objects.filter(email__iexact=value).exists():
            raise serializers.ValidationError("A user with this email already exists.")
        return value

    def validate_student_id(self, value):
        if Student.objects.filter(student_id__iexact=value).exists():
            raise serializers.ValidationError("A student with this Student ID already exists.")
        return value

    def validate(self, attrs):
        password = attrs.get('password')
        confirm_password = attrs.get('confirm_password')
        
        if password != confirm_password:
            raise serializers.ValidationError({"confirm_password": "Passwords do not match."})
        
        return attrs

    def validate_front_face(self, value):
        return self._validate_face_image(value, "Front Face")

    def validate_left_face(self, value):
        return self._validate_face_image(value, "Left Face")

    def validate_right_face(self, value):
        return self._validate_face_image(value, "Right Face")

    def _validate_face_image(self, image_file, face_type: str):
        """Validate face image using YuNet face detection."""
        success, error_msg, _ = face_recognition_service.process_face_image_file(image_file)
        if not success:
            raise serializers.ValidationError(f"{face_type}: {error_msg}")
        return image_file

    def _process_face_image(self, image_file, face_type: str):
        """Process face image and return embedding."""
        success, error_msg, embedding = face_recognition_service.process_face_image_file(image_file)
        if not success:
            raise serializers.ValidationError(f"{face_type}: {error_msg}")
        return embedding

    @transaction.atomic
    def create(self, validated_data):
        front_face = validated_data.pop("front_face")
        left_face = validated_data.pop("left_face")
        right_face = validated_data.pop("right_face")
        confirm_password = validated_data.pop("confirm_password")
        date_of_birth = validated_data.pop("date_of_birth", None)
        gender = validated_data.pop("gender", None)
        
        email = validated_data.pop("email")
        password = validated_data.pop("password")
        
        user = User.objects.create_user(
            email=email,
            password=password,
            role="STUDENT",
        )
        
        student = Student.objects.create(user=user, **validated_data)
        
        face_images = [
            ("FRONT", front_face),
            ("LEFT", left_face),
            ("RIGHT", right_face),
        ]
        
        for face_type, face_image in face_images:
            embedding = self._process_face_image(face_image, face_type)
            
            StudentFaceData.objects.create(
                student=student,
                face_angle=face_type,
                face_image=face_image,
                face_embedding=embedding.tolist(),
            )
        
        return student


class StudentUpdateSerializer(serializers.ModelSerializer):
    """Editable student fields; the linked user's role and password stay protected."""

    email = serializers.EmailField(source="user.email", required=False)
    password = serializers.CharField(write_only=True, min_length=8, required=False)
    confirm_password = serializers.CharField(write_only=True, required=False)
    
    front_face = serializers.ImageField(write_only=True, required=False)
    left_face = serializers.ImageField(write_only=True, required=False)
    right_face = serializers.ImageField(write_only=True, required=False)
    
    date_of_birth = serializers.DateField(required=False, allow_null=True)
    gender = serializers.ChoiceField(
        choices=[('M', 'Male'), ('F', 'Female'), ('O', 'Other')],
        required=False,
        allow_null=True
    )

    class Meta:
        model = Student
        fields = [
            "student_id",
            "full_name",
            "email",
            "password",
            "confirm_password",
            "phone",
            "date_of_birth",
            "gender",
            "class_group",
            "enrollment_date",
            "front_face",
            "left_face",
            "right_face",
        ]

    def validate_email(self, value):
        user_id = self.instance.user_id if self.instance else None
        if User.objects.filter(email__iexact=value).exclude(pk=user_id).exists():
            raise serializers.ValidationError("A user with this email already exists.")
        return value

    def validate_student_id(self, value):
        if Student.objects.filter(student_id__iexact=value).exclude(pk=self.instance.pk).exists():
            raise serializers.ValidationError("A student with this Student ID already exists.")
        return value

    def validate(self, attrs):
        password = attrs.get('password')
        confirm_password = attrs.get('confirm_password')
        
        if password and password != confirm_password:
            raise serializers.ValidationError({"confirm_password": "Passwords do not match."})
        
        return attrs

    def validate_front_face(self, value):
        return self._validate_face_image(value, "Front Face")

    def validate_left_face(self, value):
        return self._validate_face_image(value, "Left Face")

    def validate_right_face(self, value):
        return self._validate_face_image(value, "Right Face")

    def _validate_face_image(self, image_file, face_type: str):
        """Validate face image using YuNet face detection."""
        success, error_msg, _ = face_recognition_service.process_face_image_file(image_file)
        if not success:
            raise serializers.ValidationError(f"{face_type}: {error_msg}")
        return image_file

    def _process_face_image(self, image_file, face_type: str):
        """Process face image and return embedding."""
        success, error_msg, embedding = face_recognition_service.process_face_image_file(image_file)
        if not success:
            raise serializers.ValidationError(f"{face_type}: {error_msg}")
        return embedding

    @transaction.atomic
    def update(self, instance, validated_data):
        front_face = validated_data.pop("front_face", None)
        left_face = validated_data.pop("left_face", None)
        right_face = validated_data.pop("right_face", None)
        confirm_password = validated_data.pop("confirm_password", None)
        date_of_birth = validated_data.pop("date_of_birth", None)
        gender = validated_data.pop("gender", None)
        password = validated_data.pop("password", None)
        
        # Update User email if provided
        user_data = validated_data.pop("user", {})
        email = user_data.get("email")
        if email:
            instance.user.email = email
            instance.user.save(update_fields=["email"])
        
        # Update password if provided
        if password:
            instance.user.set_password(password)
            instance.user.save(update_fields=["password"])
        
        # Update Student fields
        for field, value in validated_data.items():
            setattr(instance, field, value)
        
        # Handle optional date_of_birth and gender
        if date_of_birth is not None:
            instance.date_of_birth = date_of_birth
        if gender is not None:
            instance.gender = gender
            
        instance.save()
        
        # Handle face images - only update if new images provided
        face_images = [
            ("FRONT", front_face),
            ("LEFT", left_face),
            ("RIGHT", right_face),
        ]
        
        for face_type, face_image in face_images:
            if face_image:
                embedding = self._process_face_image(face_image, face_type)
                
                # Update existing or create new
                StudentFaceData.objects.update_or_create(
                    student=instance,
                    face_angle=face_type,
                    defaults={
                        "face_image": face_image,
                        "face_embedding": embedding.tolist(),
                    }
                )
        
        return instance