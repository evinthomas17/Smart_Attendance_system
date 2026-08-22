from django.db import models
from django.contrib.auth.models import AbstractBaseUser, BaseUserManager, PermissionsMixin


# Handles user creation
class UserManager(BaseUserManager):

    def create_user(self, email, password=None, role=None):
        if not email:
            raise ValueError("Email is required")

        email = self.normalize_email(email)

        user = self.model(
            email=email,
            role=role
        )

        # Converts password into encrypted hash
        user.set_password(password)

        user.save(using=self._db)

        return user


    def create_superuser(self, email, password=None):

        user = self.create_user(
            email=email,
            password=password,
            role="ADMIN"
        )

        user.is_staff = True
        user.is_superuser = True

        user.save(using=self._db)

        return user



# User Table
class User(AbstractBaseUser, PermissionsMixin):

    ROLE_CHOICES = (
        ("ADMIN", "Admin"),
        ("STUDENT", "Student"),
        ("FACULTY", "Faculty"),
    )


    # Login field
    email = models.EmailField(
        unique=True
    )


    # Defines user type
    role = models.CharField(
        max_length=10,
        choices=ROLE_CHOICES
    )


    # Account status
    is_active = models.BooleanField(
        default=True
    )


    # Required for Django admin
    is_staff = models.BooleanField(
        default=False
    )


    # Connect manager
    objects = UserManager()


    # Login using email instead of username
    USERNAME_FIELD = "email"


    # Additional required fields during createsuperuser
    REQUIRED_FIELDS = []


    def __str__(self):
        return self.email

# Create your models here.
