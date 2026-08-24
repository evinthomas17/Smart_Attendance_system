"""
Face recognition service using OpenCV YuNet for face detection
and ArcFace (w600k_r50.onnx) for face embedding generation.
"""
import os
import cv2
import numpy as np
from django.conf import settings
from typing import Tuple, Optional, List, Dict, Any


class FaceRecognitionService:
    """
    Service for face detection and embedding generation.
    
    Uses:
    - OpenCV YuNet (face_detection_yunet_2023mar.onnx) for face detection
    - ArcFace (w600k_r50.onnx) for face embedding generation
    """
    
    def __init__(self):
        self._yunet_detector = None
        self._arcface_recognizer = None
        self._models_loaded = False
        
    def _get_model_path(self, model_name: str) -> str:
        """Get the full path to a model file."""
        base_dir = getattr(settings, 'FACE_MODEL_DIR', None)
        if base_dir is None:
            base_dir = os.path.join(settings.BASE_DIR, 'models', 'face')
        return os.path.join(base_dir, model_name)
    
    def _load_models(self) -> bool:
        """Load YuNet and ArcFace models."""
        if self._models_loaded:
            return True
            
        try:
            yunet_path = self._get_model_path('face_detection_yunet_2023mar.onnx')
            arcface_path = self._get_model_path('w600k_r50.onnx')
            
            if not os.path.exists(yunet_path):
                raise FileNotFoundError(f"YuNet model not found at: {yunet_path}")
            if not os.path.exists(arcface_path):
                raise FileNotFoundError(f"ArcFace model not found at: {arcface_path}")
            
            self._yunet_detector = cv2.FaceDetectorYN.create(
                yunet_path,
                "",
                (320, 320),
                score_threshold=0.9,
                nms_threshold=0.3,
                top_k=5000,
                backend_id=cv2.dnn.DNN_BACKEND_OPENCV,
                target_id=cv2.dnn.DNN_TARGET_CPU
            )
            
            self._arcface_recognizer = cv2.FaceRecognizerSF.create(
                arcface_path,
                "",
                backend_id=cv2.dnn.DNN_BACKEND_OPENCV,
                target_id=cv2.dnn.DNN_TARGET_CPU
            )
            
            self._models_loaded = True
            return True
            
        except Exception as e:
            raise RuntimeError(f"Failed to load face recognition models: {str(e)}")
    
    def detect_faces(self, image: np.ndarray) -> List[Dict[str, Any]]:
        """
        Detect faces in an image using YuNet.
        
        Args:
            image: Input image as numpy array (BGR format)
            
        Returns:
            List of detected faces with bounding boxes and landmarks
        """
        if not self._load_models():
            raise RuntimeError("Face detection models not loaded")
        
        height, width = image.shape[:2]
        self._yunet_detector.setInputSize((width, height))
        
        _, faces = self._yunet_detector.detect(image)
        
        if faces is None:
            return []
        
        results = []
        for face in faces:
            x, y, w, h = face[:4].astype(int)
            confidence = face[4]
            landmarks = face[5:15].reshape(5, 2).astype(int)
            
            results.append({
                'bbox': (x, y, w, h),
                'confidence': float(confidence),
                'landmarks': landmarks.tolist()
            })
        
        return results
    
    def validate_single_face(self, image: np.ndarray) -> Tuple[bool, str, Optional[Dict]]:
        """
        Validate that exactly one face is present in the image.
        
        Args:
            image: Input image as numpy array (BGR format)
            
        Returns:
            Tuple of (is_valid, error_message, face_data)
        """
        faces = self.detect_faces(image)
        
        if len(faces) == 0:
            return False, "No face detected in the image.", None
        elif len(faces) > 1:
            return False, "Multiple faces detected in the image. Please upload an image with only one face.", None
        
        return True, "", faces[0]
    
    def align_face(self, image: np.ndarray, face_data: Dict) -> np.ndarray:
        """
        Align and crop face using landmarks.
        
        Args:
            image: Input image as numpy array (BGR format)
            face_data: Face data from detect_faces containing landmarks
            
        Returns:
            Aligned face image (112x112) for ArcFace
        """
        landmarks = np.array(face_data['landmarks'], dtype=np.float32)
        aligned_face = self._arcface_recognizer.alignCrop(image, landmarks)
        return aligned_face
    
    def generate_embedding(self, aligned_face: np.ndarray) -> np.ndarray:
        """
        Generate face embedding using ArcFace.
        
        Args:
            aligned_face: Aligned face image (112x112)
            
        Returns:
            Face embedding as numpy array (normalized)
        """
        if not self._load_models():
            raise RuntimeError("Face recognition models not loaded")
        
        embedding = self._arcface_recognizer.feature(aligned_face)
        embedding = embedding.flatten()
        
        norm = np.linalg.norm(embedding)
        if norm > 0:
            embedding = embedding / norm
        
        return embedding
    
    def process_face_image(self, image: np.ndarray) -> Tuple[bool, str, Optional[np.ndarray]]:
        """
        Complete face processing pipeline: detect -> validate -> align -> embed.
        
        Args:
            image: Input image as numpy array (BGR format)
            
        Returns:
            Tuple of (success, error_message, embedding)
        """
        is_valid, error_msg, face_data = self.validate_single_face(image)
        if not is_valid:
            return False, error_msg, None
        
        try:
            aligned_face = self.align_face(image, face_data)
            embedding = self.generate_embedding(aligned_face)
            return True, "", embedding
        except Exception as e:
            return False, f"Face processing failed: {str(e)}", None
    
    def process_face_image_file(self, image_file) -> Tuple[bool, str, Optional[np.ndarray]]:
        """
        Process an uploaded image file.
        
        Args:
            image_file: Django UploadedFile object
            
        Returns:
            Tuple of (success, error_message, embedding)
        """
        try:
            file_bytes = np.frombuffer(image_file.read(), np.uint8)
            image = cv2.imdecode(file_bytes, cv2.IMREAD_COLOR)
            
            if image is None:
                return False, "Unable to read image file. File may be corrupted.", None
            
            image_file.seek(0)
            return self.process_face_image(image)
            
        except Exception as e:
            return False, f"Image processing error: {str(e)}", None


face_recognition_service = FaceRecognitionService()