# Face Recognition Models

This directory should contain the following ONNX model files for face detection and recognition:

## Required Models

### 1. YuNet Face Detection Model
- **File**: `face_detection_yunet_2023mar.onnx`
- **Description**: OpenCV YuNet face detector (2023 March version)
- **Source**: https://github.com/opencv/opencv_zoo/tree/main/models/face_detection_yunet
- **Direct Download**: https://github.com/opencv/opencv_zoo/raw/main/models/face_detection_yunet/face_detection_yunet_2023mar.onnx

### 2. ArcFace Recognition Model
- **File**: `w600k_r50.onnx`
- **Description**: ArcFace face recognition model (ResNet-50, trained on WebFace600K)
- **Source**: https://github.com/deepinsight/insightface/tree/master/model_zoo
- **Direct Download**: https://github.com/deepinsight/insightface/raw/master/model_zoo/arcface/arcface_r50_webface600k.onnx (rename to w600k_r50.onnx)

## Setup Instructions

1. Download both model files from the links above
2. Place them in this directory: `backend/models/face/`
3. The application will automatically load them from this location

## Model Loading

The models are loaded by `FaceRecognitionService` in `face_recognition/services.py` using the `FACE_MODEL_DIR` setting from Django settings.

## Notes

- These models run locally on the Django backend - no cloud API required
- YuNet is used for face detection (validating exactly one face per image)
- ArcFace generates 512-dimensional face embeddings for recognition
- The same pipeline must be used during attendance face recognition for compatibility

## File Structure

```
backend/
├── models/
│   └── face/
│       ├── face_detection_yunet_2023mar.onnx  (~1.6 MB)
│       └── w600k_r50.onnx                     (~100 MB)
```

## Verification

After placing the model files, you can verify they're loaded correctly:

```bash
cd backend
python manage.py shell -c "
from face_recognition.services import face_recognition_service
faces = face_recognition_service.detect_faces(your_test_image)
print(f'Detected {len(faces)} faces')
"
```