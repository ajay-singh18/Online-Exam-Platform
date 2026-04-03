import { useEffect, useRef, useState, useCallback } from 'react';
import { useExamStore } from '../store/examStore';

/**
 * AI-Powered Face Proctoring Hook (Free, Client-Side)
 * Uses MediaPipe Face Detection via CDN — runs entirely in the browser.
 *
 * Detects:
 *  - No face present (noFace)
 *  - Multiple faces present (multipleFaces)
 *  - Looking away from screen (lookingAway) — based on face bounding box position
 *
 * Separate AI violation limit: 5 (independent from browser violations)
 */

const FACE_DETECTION_CDN = 'https://cdn.jsdelivr.net/npm/@mediapipe/face_detection/face_detection.js';
const CAMERA_UTILS_CDN = 'https://cdn.jsdelivr.net/npm/@mediapipe/camera_utils/camera_utils.js';

/* Cooldown: minimum ms between same violation type */
const VIOLATION_COOLDOWN_MS = 8000;
/* Smart Directional Limits (seconds) */
const LIMIT_SIDE_SECS = 3;
const LIMIT_UP_SECS = 6;
const LIMIT_DOWN_SECS = 12;
/* AI violation limit for force-submit */
const AI_VIOLATION_LIMIT = 5;

function loadScript(src) {
  return new Promise((resolve, reject) => {
    if (document.querySelector(`script[src="${src}"]`)) {
      resolve();
      return;
    }
    const script = document.createElement('script');
    script.src = src;
    script.async = true;
    script.onload = resolve;
    script.onerror = reject;
    document.head.appendChild(script);
  });
}

export function useFaceProctoring(enabled = true) {
  const addViolation = useExamStore((s) => s.addViolation);
  const violations = useExamStore((s) => s.violations);

  const videoRef = useRef(null);
  const cameraRef = useRef(null);
  const detectorRef = useRef(null);

  const [faceStatus, setFaceStatus] = useState({
    faceCount: 0,
    isLookingAway: false,
    status: 'initializing', // 'initializing' | 'running' | 'error' | 'denied'
  });
  const [cameraError, setCameraError] = useState(null);

  /* Track cooldowns and gaze timing */
  const lastViolationTime = useRef({});
  const gazeAwayStart = useRef(null);
  const currentGazeDirection = useRef(null);
  const sessionStartTime = useRef(Date.now());
  const WARM_UP_MS = 5000;

  /* Count only AI violations */
  const aiViolationCount = violations.filter((v) =>
    ['noFace', 'multipleFaces', 'lookingAway'].includes(v.type)
  ).length;

  const shouldForceSubmitAI = aiViolationCount >= AI_VIOLATION_LIMIT;

  const fireViolation = useCallback(
    (type) => {
      const now = Date.now();
      const lastTime = lastViolationTime.current[type] || 0;
      if (now - lastTime < VIOLATION_COOLDOWN_MS) return;
      lastViolationTime.current[type] = now;
      addViolation({ type, timestamp: new Date().toISOString() });
    },
    [addViolation]
  );

  /* Process face detection results */
  const onResults = useCallback(
    (results) => {
      const faceCount = results.detections ? results.detections.length : 0;

      let isLookingAway = false;

      if (faceCount === 1) {
        /* Check gaze via bounding box center position */
        const detection = results.detections[0];
        const bbox = detection.boundingBox;

        if (bbox && detection.landmarks) {
          const centerX = bbox.xCenter;
          const centerY = bbox.yCenter;
 
          /* Head Rotation (Yaw) Detection using landmarks 
             Landmarks: 0=RightEye, 1=LeftEye, 2=NoseTip [6 total]
          */
          let isHeadTurned = false;
          if (detection.landmarks) {
            const rightEye = detection.landmarks[0];
            const leftEye = detection.landmarks[1];
            const nose = detection.landmarks[2];
   
            if (rightEye && leftEye && nose) {
              const eyeDist = Math.abs(leftEye.x - rightEye.x);
              const noseToLeft = Math.abs(nose.x - leftEye.x);
              const noseToRight = Math.abs(nose.x - rightEye.x);
              
              /* If nose is too close to one eye (< 25% of eye-to-eye distance), head is turned */
              if (noseToLeft < eyeDist * 0.25 || noseToRight < eyeDist * 0.25) {
                isHeadTurned = true;
              }
            }
          }
 
          /* Determine Gaze Direction */
          let direction = null;

          if (isHeadTurned) {
             direction = 'side';
          } else if (centerX < 0.3 || centerX > 0.7) {
             direction = 'side';
          } else if (centerY < 0.2) {
             direction = 'up';
          } else if (centerY > 0.8) {
             direction = 'down';
          }

          if (direction) {
            /* If direction changed, reset the timer */
            if (currentGazeDirection.current !== direction) {
              currentGazeDirection.current = direction;
              gazeAwayStart.current = Date.now();
            } else if (!gazeAwayStart.current) {
              gazeAwayStart.current = Date.now();
            }

            const elapsed = (Date.now() - gazeAwayStart.current) / 1000;
            
            /* Apply specific threshold based on direction */
            let threshold = LIMIT_SIDE_SECS;
            if (direction === 'up') threshold = LIMIT_UP_SECS;
            if (direction === 'down') threshold = LIMIT_DOWN_SECS;

            if (elapsed >= threshold) {
              isLookingAway = true;
              fireViolation('lookingAway');
            }
          } else {
            gazeAwayStart.current = null;
            currentGazeDirection.current = null;
          }
        }
      } else {
        gazeAwayStart.current = null;
      }

      /* Fire violations */
      if (faceCount === 0) {
        // Skip noFace check during initial warm-up to allow camera to start
        if (Date.now() - sessionStartTime.current < WARM_UP_MS) return;
        fireViolation('noFace');
      } else if (faceCount >= 2) {
        fireViolation('multipleFaces');
      }

      setFaceStatus({
        faceCount,
        isLookingAway,
        status: 'running',
      });
    },
    [fireViolation]
  );

  /* Initialize MediaPipe */
  useEffect(() => {
    if (!enabled) return;
    sessionStartTime.current = Date.now();
 
    let cancelled = false;

    const init = async () => {
      try {
        /* Load CDN scripts */
        await loadScript(CAMERA_UTILS_CDN);
        await loadScript(FACE_DETECTION_CDN);

        if (cancelled) return;

        /* Wait for the global to be available */
        const FaceDetection = window.FaceDetection;
        if (!FaceDetection) {
          throw new Error('FaceDetection not loaded');
        }

        const detector = new FaceDetection({
          locateFile: (file) =>
            `https://cdn.jsdelivr.net/npm/@mediapipe/face_detection/${file}`,
        });

        detector.setOptions({
          model: 'short',
          minDetectionConfidence: 0.5,
        });

        detector.onResults(onResults);
        detectorRef.current = detector;

        /* Get webcam stream */
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { width: 320, height: 240, facingMode: 'user' },
          audio: false,
        });

        if (cancelled) {
          stream.getTracks().forEach((t) => t.stop());
          return;
        }

        if (videoRef.current) {
          videoRef.current.srcObject = stream;

          const Camera = window.Camera;
          if (Camera) {
            const camera = new Camera(videoRef.current, {
              onFrame: async () => {
                if (detectorRef.current && videoRef.current) {
                  await detectorRef.current.send({ image: videoRef.current });
                }
              },
              width: 320,
              height: 240,
            });
            camera.start();
            cameraRef.current = camera;
          }
        }

        setFaceStatus((prev) => ({ ...prev, status: 'running' }));
      } catch (err) {
        console.warn('Face proctoring init failed:', err);
        if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
          setCameraError('Camera access was denied.');
          setFaceStatus((prev) => ({ ...prev, status: 'denied' }));
        } else {
          setCameraError(err.message || 'Failed to initialize face detection.');
          setFaceStatus((prev) => ({ ...prev, status: 'error' }));
        }
      }
    };

    init();

    return () => {
      cancelled = true;
      /* Stop camera */
      if (cameraRef.current && typeof cameraRef.current.stop === 'function') {
        cameraRef.current.stop();
      }
      /* Stop video tracks */
      if (videoRef.current && videoRef.current.srcObject) {
        videoRef.current.srcObject.getTracks().forEach((t) => t.stop());
      }
      detectorRef.current = null;
    };
  }, [enabled, onResults]);

  return {
    videoRef,
    faceStatus,
    cameraError,
    aiViolationCount,
    shouldForceSubmitAI,
  };
}
