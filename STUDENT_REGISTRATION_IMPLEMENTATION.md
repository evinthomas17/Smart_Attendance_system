# Student Registration Feature - Implementation Summary

## Overview
Complete Student Registration feature with face detection (YuNet) and face embedding generation (ArcFace) integrated into the existing Smart Attendance System.

---

## Files Created

### Backend

1. **`backend/face_recognition/__init__.py`**
   - Package initialization for face recognition module

2. **`backend/face_recognition/services.py`**
   - `FaceRecognitionService` class implementing:
     - YuNet face detection using `face_detection_yunet_2023mar.onnx`
     - Face validation (exactly one face required)
     - Face alignment using landmarks
     - ArcFace embedding generation using `w600k_r50.onnx`
     - Complete pipeline: detect → validate → align → embed
     - File upload processing

3. **`backend/models/face/README.md`**
   - Documentation for required ONNX model files
   - Download links for YuNet and ArcFace models
   - Setup instructions

### Frontend

4. **`frontend/src/pages/admin/StudentRegistration.jsx`**
   - Complete registration page with:
     - Academic information display (passed from StudentManage)
     - Student information form (Student ID, Full Name, Email, Phone, DOB, Gender)
     - Password & Confirm Password fields
     - Face Registration section with 3 upload areas (Front, Left, Right)
     - Image preview, replace, clear functionality
     - Form validation (client-side + server-side error display)
     - Loading states and duplicate submission prevention
     - Responsive design (desktop/tablet/mobile)
     - Matches existing admin dashboard design

5. **`frontend/src/pages/admin/StudentRegistration.css`**
   - Styles for registration page
   - Academic badges, form layouts, face upload cards
   - Responsive grid layouts
   - Error states, button styles, form actions

---

## Files Modified

### Backend

1. **`backend/config/settings.py`**
   - Added `FACE_MODEL_DIR = BASE_DIR / 'models' / 'face'`
   - Added `MEDIA_URL = 'media/'` and `MEDIA_ROOT = BASE_DIR / 'media'`

2. **`backend/config/urls.py`**
   - Added media file serving in DEBUG mode

3. **`backend/students/serializers.py`**
   - Added `StudentRegistrationWithFaceSerializer` with:
     - All student fields + password confirmation
     - Three required image fields (front_face, left_face, right_face)
     - Optional date_of_birth and gender fields
     - Face image validation using YuNet (via FaceRecognitionService)
     - Embedding generation using ArcFace
     - Atomic transaction for User + Student + FaceData creation
     - Duplicate validation (student_id, email)

4. **`backend/students/views.py`**
   - Updated `StudentListCreateAPIView.get_serializer_class()` to use multipart serializer for file uploads
   - Added `StudentRegistrationWithFaceAPIView` for dedicated face registration endpoint

5. **`backend/students/urls.py`**
   - Added `/register/` endpoint for face registration

### Frontend

6. **`frontend/src/services/studentService.js`**
   - Added `registerStudentWithFace()` function for multipart form submission

7. **`frontend/src/App.jsx`**
   - Added route `/admin/students/register` for StudentRegistration page

8. **`frontend/src/pages/StudentManage.jsx`**
   - Updated `handleRegisterStudent()` to navigate to registration page with academic context via React Router state

---

## New Dependencies

Add to `backend/requirements.txt`:
```
opencv-python==5.0.0.93
numpy==2.5.2
```

---

## Required Model Files

Place in `backend/models/face/`:
1. `face_detection_yunet_2023mar.onnx` (~1.6 MB)
   - Download: https://github.com/opencv/opencv_zoo/raw/main/models/face_detection_yunet/face_detection_yunet_2023mar.onnx

2. `w600k_r50.onnx` (~100 MB)
   - Download: https://github.com/deepinsight/insightface/raw/master/model_zoo/arcface/arcface_r50_webface600k.onnx

---

## Database

- **Existing models used**: `Student`, `StudentFaceData` (no new migrations needed)
- **StudentFaceData fields utilized**:
  - `face_angle`: "FRONT", "LEFT", "RIGHT"
  - `face_image`: FileField for uploaded images
  - `face_embedding`: JSONField for 512-dim ArcFace embeddings

---

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/students/register/` | Register student with face images (multipart/form-data) |
| POST | `/api/students/` | Original registration (JSON) - still works |
| GET | `/api/students/` | List students (with class_id, search) |
| GET | `/api/students/<id>/` | Get student details |
| PUT/PATCH | `/api/students/<id>/` | Update student |
| GET | `/api/students/<id>/face-data/` | Get face data metadata |

---

## Registration Flow

1. **Admin** → Manage Students → Select Department/Course/Semester/Division
2. **Click "+ Register Student"** → Navigates to `/admin/students/register` with academic context
3. **StudentRegistration page** displays selected academic info
4. **Admin fills**: Student ID, Name, Email, Phone, DOB, Gender, Password, Confirm Password
5. **Admin uploads**: Front Face, Left Face, Right Face images (JPG/PNG/WebP, <5MB each)
6. **Submit** → Django API:
   - Validates Admin JWT + role
   - Validates all fields
   - Checks duplicates (student_id, email)
   - Creates User (role=STUDENT) with hashed password
   - Creates Student linked to AcademicClass
   - Processes each face image:
     - YuNet detects faces → validates exactly 1 face
     - Aligns face using landmarks
     - ArcFace generates 512-dim embedding
     - Stores image + embedding in StudentFaceData
   - Returns success response
7. **Frontend** shows success → redirects back to Manage Students with filters restored

---

## Validation Rules

### Frontend (Real-time)
- Student ID: Required
- Full Name: Required
- Email: Required, valid format
- Phone: Required, valid format
- Password: Required, min 8 chars
- Confirm Password: Must match
- DOB: Optional, not future date
- Gender: Optional
- Face Images: All 3 required, valid image types, <5MB

### Backend
- All frontend validations + server-side
- Unique student_id, email
- YuNet face detection: exactly 1 face per image
- ArcFace embedding generation success
- Atomic transaction (rollback on any failure)

---

## Face Processing Pipeline (Future Attendance Compatible)

```
Uploaded Image
    ↓
OpenCV imdecode
    ↓
YuNet FaceDetectorYN
    ↓
Validate: exactly 1 face
    ↓
FaceRecognizerSF.alignCrop (using 5 landmarks)
    ↓
ArcFace FaceRecognizerSF.feature()
    ↓
L2-normalized 512-dim embedding
    ↓
Store in StudentFaceData.face_embedding (JSON)
```

**Critical**: Same pipeline must be used for attendance face recognition to ensure embedding compatibility.

---

## Testing

### Backend
```bash
cd backend
python manage.py check          # Should pass
python manage.py test students  # Run student tests
```

### Frontend
```bash
cd frontend
npm run build                   # Should build successfully
npm run dev                     # Start dev server
```

### Manual Testing
1. Start backend: `python manage.py runserver`
2. Start frontend: `npm run dev`
3. Login as Admin
4. Go to Manage Students
5. Select academic filters
6. Click "+ Register Student"
7. Fill form + upload 3 face images
8. Submit → verify student appears in list
9. Check database: User, Student, StudentFaceData (3 records)

---

## Error Handling

| Error | Response |
|-------|----------|
| No face detected | "No face detected in the [Front/Left/Right] Face image." |
| Multiple faces | "Multiple faces detected in the [Face] image. Please upload an image with only one face." |
| Invalid image | "Unable to read image file. File may be corrupted." |
| Embedding failed | "Face processing failed: [error details]" |
| Duplicate student_id | "A student with this Student ID already exists." |
| Duplicate email | "A user with this email already exists." |
| Password mismatch | "Passwords do not match." |
| Unauthorized | 401 - Session expired |
| Forbidden | 403 - Admin access required |

---

## Responsive Behavior

| Breakpoint | Layout |
|------------|--------|
| Desktop (>1024px) | 2-col form, 3-col face grid |
| Tablet (600-1024px) | 2-col form, 2-col face grid |
| Mobile (<600px) | 1-col form, stacked face cards |

---

## Security

- JWT authentication required
- Admin role verification (IsAdminRole permission)
- Passwords hashed via Django's `create_user()` (PBKDF2)
- Face embeddings stored in DB (not localStorage)
- File type validation (server + client)
- File size limits (5MB)
- Atomic transactions prevent partial registrations
- No password exposure in API responses