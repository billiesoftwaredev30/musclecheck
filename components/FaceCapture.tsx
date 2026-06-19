// components/FaceCapture.tsx
"use client";

import React, { useEffect, useRef, useState } from "react";
import * as faceapi from "@vladmandic/face-api";
import { Camera, RefreshCw, CheckCircle, AlertCircle, X } from "lucide-react";

interface FaceCaptureProps {
  onCapture?: (descriptorStr: string) => void;
  onCancel: () => void;
  title?: string;
  actionLabel?: string;
  clientsWithFaces?: { id: number; full_name: string; face_descriptor: string }[];
  onMatchFound?: (clientId: number, clientName: string) => void;
}

export default function FaceCapture({
  onCapture,
  onCancel,
  title = "Facial Scanner",
  actionLabel = "Capture Face Signature",
  clientsWithFaces = [],
  onMatchFound,
}: FaceCaptureProps) {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const animationFrameRef = useRef<number | null>(null);
  const maxEARRef = useRef(0.22);

  const [modelsLoaded, setModelsLoaded] = useState(false);
  const [loadingStatus, setLoadingStatus] = useState("Loading neural networks...");
  const [cameraActive, setCameraActive] = useState(false);
  const [faceDetected, setFaceDetected] = useState(false);
  const [isScanning, setIsScanning] = useState(true);
  const [scannedDescriptor, setScannedDescriptor] = useState<Float32Array | null>(null);
  const [matchName, setMatchName] = useState<string | null>(null);
  const [matchId, setMatchId] = useState<number | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [livenessVerified, setLivenessVerified] = useState(false);
  const [livenessStep, setLivenessStep] = useState<"center" | "turn" | "verified">("center");
  const livenessStepRef = useRef<"center" | "turn" | "verified">("center");
  const centerFramesRef = useRef(0);

  // Load face-api models from jsDelivr CDN
  useEffect(() => {
    let active = true;
    async function loadModels() {
      try {
        setLoadingStatus("Loading facial detection models (TinyFaceDetector)...");
        await faceapi.nets.tinyFaceDetector.loadFromUri("/models");
        
        if (!active) return;
        setLoadingStatus("Loading landmark alignment models (FaceLandmark68)...");
        await faceapi.nets.faceLandmark68Net.loadFromUri("/models");
        
        if (!active) return;
        setLoadingStatus("Loading recognition models (FaceRecognition)...");
        await faceapi.nets.faceRecognitionNet.loadFromUri("/models");
        
        if (!active) return;
        setModelsLoaded(true);
        setLoadingStatus("Models loaded! Starting camera stream...");
      } catch (err: any) {
        console.error("Failed to load face-api models:", err);
        setErrorMsg(`Failed to load neural network models: ${err?.message || err || "Unknown Error"}. Please check your browser developer tools console.`);
      }
    }
    loadModels();
    return () => {
      active = false;
    };
  }, []);

  // Handle Camera stream activation
  useEffect(() => {
    if (!modelsLoaded) return;
    let active = true;

    async function startCamera() {
      try {
        if (streamRef.current) {
          streamRef.current.getTracks().forEach((track) => track.stop());
        }

        const stream = await navigator.mediaDevices.getUserMedia({
          video: { width: 640, height: 480, facingMode: "user" },
          audio: false,
        });

        if (!active) {
          stream.getTracks().forEach((track) => track.stop());
          return;
        }

        streamRef.current = stream;
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          setCameraActive(true);
        }
      } catch (err: any) {
        console.error("Error starting camera:", err);
        setErrorMsg(`Webcam access error: ${err?.message || err || "Unknown Error"}. Please ensure you are running in a secure context (localhost or HTTPS) and have granted camera permissions.`);
      }
    }

    startCamera();

    return () => {
      active = false;
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((track) => track.stop());
      }
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [modelsLoaded]);

  // Main facial recognition rendering & matching loop
  useEffect(() => {
    if (!cameraActive || !videoRef.current || !canvasRef.current) return;
    let active = true;

    const video = videoRef.current;
    const canvas = canvasRef.current;

    const displaySize = { width: 480, height: 360 };
    faceapi.matchDimensions(canvas, displaySize);

    // Parse pre-existing face descriptors for matching
    const knownDescriptors = clientsWithFaces
      .map((c) => {
        try {
          const arr = JSON.parse(c.face_descriptor);
          if (Array.isArray(arr) && arr.length === 128) {
            return {
              id: c.id,
              name: c.full_name,
              descriptor: new Float32Array(arr),
            };
          }
        } catch (e) {
          console.warn(`Invalid face descriptor for client ${c.full_name}`, e);
        }
        return null;
      })
      .filter((x): x is NonNullable<typeof x> => x !== null);

    const calculateEAR = (eye: faceapi.Point[]) => {
      const horizontalDist = Math.sqrt(Math.pow(eye[3].x - eye[0].x, 2) + Math.pow(eye[3].y - eye[0].y, 2));
      const verticalDist1 = Math.sqrt(Math.pow(eye[5].x - eye[1].x, 2) + Math.pow(eye[5].y - eye[1].y, 2));
      const verticalDist2 = Math.sqrt(Math.pow(eye[4].x - eye[2].x, 2) + Math.pow(eye[4].y - eye[2].y, 2));
      return (verticalDist1 + verticalDist2) / (2 * horizontalDist);
    };

    const getEyeCenter = (eye: faceapi.Point[]) => {
      const x = eye.reduce((sum, p) => sum + p.x, 0) / eye.length;
      const y = eye.reduce((sum, p) => sum + p.y, 0) / eye.length;
      return { x, y };
    };

    const detectPlay = async () => {
      if (!active || video.paused || video.ended) return;

      try {
        // Detect single face with landmarks & descriptor
        const detection = await faceapi
          .detectSingleFace(video, new faceapi.TinyFaceDetectorOptions({ inputSize: 224, scoreThreshold: 0.5 }))
          .withFaceLandmarks()
          .withFaceDescriptor();

        if (detection) {
          setFaceDetected(true);
          const resizedDetections = faceapi.resizeResults(detection, displaySize);
          
          const positions = detection.landmarks.positions;
          const leftJaw = positions[0];
          const rightJaw = positions[16];
          const nose = positions[30];
          const yawRatio = (nose.x - leftJaw.x) / (rightJaw.x - leftJaw.x);

          // State Machine: Liveness check steps (center -> turn -> verified)
          let currentStep = livenessStepRef.current;
          
          if (currentStep === "center") {
            if (yawRatio >= 0.44 && yawRatio <= 0.56) {
              centerFramesRef.current += 1;
              if (centerFramesRef.current >= 8) {
                livenessStepRef.current = "turn";
                setLivenessStep("turn");
              }
            } else if (yawRatio < 0.40 || yawRatio > 0.60) {
              centerFramesRef.current = 0;
            }
          } else if (currentStep === "turn") {
            if (yawRatio < 0.36 || yawRatio > 0.64) {
              livenessStepRef.current = "verified";
              setLivenessStep("verified");
              setLivenessVerified(true);
            }
          }
          
          const isLivenessPassed = (livenessStepRef.current === "verified");

          const ctx = canvas.getContext("2d");
          if (ctx) {
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            
            const box = resizedDetections.detection.box;
            
            // Draw pupil/eye trackers
            const leftResized = resizedDetections.landmarks.getLeftEye();
            const rightResized = resizedDetections.landmarks.getRightEye();
            const leftCenter = getEyeCenter(leftResized);
            const rightCenter = getEyeCenter(rightResized);
            
            let indicatorColor = "rgba(245, 158, 11, 0.85)"; // Center step: amber/orange
            let reticleColor = "rgba(245, 158, 11, 0.45)";
            if (currentStep === "turn") {
              indicatorColor = "rgba(168, 85, 247, 0.85)"; // Turn step: purple
              reticleColor = "rgba(168, 85, 247, 0.45)";
            } else if (isLivenessPassed) {
              indicatorColor = "rgba(6, 182, 212, 0.85)"; // Verified: cyan
              reticleColor = "rgba(6, 182, 212, 0.45)";
            }
            
            // Draw pupil centers
            ctx.fillStyle = indicatorColor;
            ctx.beginPath();
            ctx.arc(leftCenter.x, leftCenter.y, 4, 0, 2 * Math.PI);
            ctx.arc(rightCenter.x, rightCenter.y, 4, 0, 2 * Math.PI);
            ctx.fill();
            
            // Draw tracking reticle rings
            ctx.strokeStyle = reticleColor;
            ctx.lineWidth = 1.5;
            ctx.beginPath();
            ctx.arc(leftCenter.x, leftCenter.y, 9, 0, 2 * Math.PI);
            ctx.arc(rightCenter.x, rightCenter.y, 9, 0, 2 * Math.PI);
            ctx.stroke();

            if (isLivenessPassed) {
              ctx.strokeStyle = matchName ? "#10b981" : "rgba(124, 58, 237, 0.85)";
              ctx.lineWidth = 4;
              ctx.shadowBlur = 15;
              ctx.shadowColor = matchName ? "#10b981" : "#a855f7";
              ctx.strokeRect(box.x, box.y, box.width, box.height);
              
              ctx.fillStyle = matchName ? "#10b981" : "#a855f7";
              ctx.font = "bold 12px sans-serif";
              ctx.fillText("LIVENESS VERIFIED", box.x, box.y - 10);
            } else if (currentStep === "center") {
              ctx.strokeStyle = "#f59e0b";
              ctx.lineWidth = 3;
              ctx.shadowBlur = 10;
              ctx.shadowColor = "#f59e0b";
              ctx.strokeRect(box.x, box.y, box.width, box.height);
              
              ctx.fillStyle = "#f59e0b";
              ctx.font = "bold 12px sans-serif";
              const progress = Math.min(100, Math.round((centerFramesRef.current / 8) * 100));
              ctx.fillText(`LOOK STRAIGHT (${progress}%)`, box.x, box.y - 10);
            } else {
              ctx.strokeStyle = "#a855f7";
              ctx.lineWidth = 3;
              ctx.shadowBlur = 10;
              ctx.shadowColor = "#a855f7";
              ctx.strokeRect(box.x, box.y, box.width, box.height);
              
              ctx.fillStyle = "#a855f7";
              ctx.font = "bold 12px sans-serif";
              ctx.fillText("TURN HEAD LEFT OR RIGHT", box.x, box.y - 10);
            }
            ctx.shadowBlur = 0;
          }

          if (isScanning && isLivenessPassed) {
            setScannedDescriptor(detection.descriptor);

            // Perform matching locally
            if (knownDescriptors.length > 0) {
              let bestMatch = { id: -1, name: "", distance: 999.0 };
              
              for (const known of knownDescriptors) {
                const distance = faceapi.euclideanDistance(detection.descriptor, known.descriptor);
                if (distance < distanceThreshold && distance < bestMatch.distance) {
                  bestMatch = { id: known.id, name: known.name, distance };
                }
              }

              if (bestMatch.id !== -1) {
                setMatchName(bestMatch.name);
                setMatchId(bestMatch.id);
                if (onMatchFound) {
                  onMatchFound(bestMatch.id, bestMatch.name);
                  setIsScanning(false);
                }
              } else {
                setMatchName(null);
                setMatchId(null);
              }
            }
          } else if (isScanning && !isLivenessPassed) {
            setScannedDescriptor(null);
          }
        } else {
          setFaceDetected(false);
          centerFramesRef.current = 0;
          livenessStepRef.current = "center";
          setLivenessStep("center");
          setLivenessVerified(false);
          const ctx = canvas.getContext("2d");
          if (ctx) ctx.clearRect(0, 0, canvas.width, canvas.height);
        }
      } catch (err) {
        console.error("Detection error:", err);
      }

      if (active) {
        animationFrameRef.current = requestAnimationFrame(detectPlay);
      }
    };

    const handleVideoPlay = () => {
      detectPlay();
    };

    video.addEventListener("play", handleVideoPlay);
    // Trigger detection manually if video was already playing
    if (!video.paused) {
      detectPlay();
    }

    return () => {
      active = false;
      video.removeEventListener("play", handleVideoPlay);
      if (animationFrameRef.current) cancelAnimationFrame(animationFrameRef.current);
    };
  }, [cameraActive, clientsWithFaces, isScanning, onMatchFound, matchName]);

  const distanceThreshold = 0.55; // Strict threshold for matching accuracy

  const handleConfirmCapture = () => {
    if (scannedDescriptor && onCapture) {
      const arr = Array.from(scannedDescriptor);
      onCapture(JSON.stringify(arr));
    }
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "20px", alignItems: "center", position: "relative", width: "100%", fontFamily: "'Outfit', sans-serif" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", width: "100%" }}>
        <h4 style={{ margin: 0, fontSize: "1.1rem", fontWeight: 800, display: "flex", alignItems: "center", gap: "8px", color: "var(--foreground)" }}>
          <Camera size={20} style={{ color: "var(--accent-fuchsia)", filter: "drop-shadow(0 0 8px rgba(168, 85, 247, 0.5))" }} />
          {title}
        </h4>
        <button
          onClick={onCancel}
          style={{ background: "none", border: "none", color: "var(--foreground-muted)", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", padding: "6px", borderRadius: "50%", transition: "background 0.2s" }}
          onMouseEnter={(e) => (e.currentTarget.style.background = "rgba(255,255,255,0.05)")}
          onMouseLeave={(e) => (e.currentTarget.style.background = "none")}
        >
          <X size={18} />
        </button>
      </div>

      {errorMsg && (
        <div style={{ color: "var(--error-light)", background: "var(--error-bg)", border: "1px solid rgba(239, 68, 68, 0.2)", padding: "12px 16px", borderRadius: "14px", fontSize: "0.85rem", display: "flex", alignItems: "center", gap: "10px", width: "100%", backdropFilter: "blur(8px)" }}>
          <AlertCircle size={16} style={{ flexShrink: 0 }} />
          <span>{errorMsg}</span>
        </div>
      )}

      {!modelsLoaded && !errorMsg && (
        <div style={{ display: "flex", flexDirection: "column", gap: "12px", alignItems: "center", justifyContent: "center", height: "280px", width: "100%", background: "rgba(255,255,255,0.01)", borderRadius: "24px", border: "1px solid var(--glass-border)", padding: "20px", backdropFilter: "blur(20px)" }}>
          <RefreshCw size={28} className="animate-spin" style={{ color: "var(--accent-fuchsia)", animation: "spin 2s linear infinite", filter: "drop-shadow(0 0 10px rgba(168, 85, 247, 0.4))" }} />
          <span style={{ fontSize: "0.88rem", color: "var(--foreground-muted)", textAlign: "center", fontWeight: 500 }}>{loadingStatus}</span>
        </div>
      )}

      {modelsLoaded && !errorMsg && (
        <div style={{ position: "relative", width: "100%", maxWidth: "480px", aspectRatio: "4/3", background: "black", borderRadius: "24px", border: "2px solid rgba(168, 85, 247, 0.25)", overflow: "hidden", display: "flex", alignItems: "center", justifyContent: "center", boxShadow: "0 12px 40px rgba(124, 58, 237, 0.2)" }}>
          <video
            ref={videoRef}
            autoPlay
            playsInline
            muted
            style={{ width: "100%", height: "100%", objectFit: "cover", transform: "scaleX(-1)" }} 
          />
          <canvas
            ref={canvasRef}
            style={{ position: "absolute", top: 0, left: 0, width: "100%", height: "100%", pointerEvents: "none" }}
          />

          {/* High-tech HUD grid lines */}
          <div style={{ position: "absolute", inset: "20px", border: "1px dashed rgba(168, 85, 247, 0.2)", borderRadius: "16px", pointerEvents: "none" }}>
            {/* Camera scanner laser bar animation */}
            {isScanning && (
              <div
                style={{
                  position: "absolute",
                  left: 0,
                  width: "100%",
                  height: "3px",
                  background: "linear-gradient(90deg, transparent, var(--accent-fuchsia), transparent)",
                  boxShadow: "0 0 12px var(--accent-fuchsia)",
                  animation: "scanLine 2.5s cubic-bezier(0.4, 0, 0.2, 1) infinite",
                }}
              />
            )}
          </div>

          {!cameraActive && (
            <div style={{ position: "absolute", color: "var(--foreground-muted)", fontSize: "0.88rem", fontWeight: 600 }}>
              Initializing camera feed...
            </div>
          )}
        </div>
      )}

      {/* Liveness Check Banners */}
      {modelsLoaded && faceDetected && !livenessVerified && (
        <div style={{
          width: "100%",
          padding: "12px 16px",
          background: livenessStep === "center" ? "rgba(245, 158, 11, 0.08)" : "rgba(168, 85, 247, 0.08)",
          border: livenessStep === "center" ? "1px solid rgba(245, 158, 11, 0.25)" : "1px solid rgba(168, 85, 247, 0.25)",
          borderRadius: "14px",
          display: "flex",
          alignItems: "center",
          gap: "10px",
          color: livenessStep === "center" ? "#fbbf24" : "#c084fc",
          fontSize: "0.85rem",
          fontWeight: 600,
          boxShadow: livenessStep === "center" ? "0 4px 15px rgba(245, 158, 11, 0.05)" : "0 4px 15px rgba(168, 85, 247, 0.05)",
          transition: "all 0.3s cubic-bezier(0.22, 1, 0.36, 1)"
        }}>
          <AlertCircle size={18} style={{ color: livenessStep === "center" ? "#f59e0b" : "#a855f7", flexShrink: 0 }} />
          <span>
            {livenessStep === "center"
              ? "Liveness Check Step 1/2: Please look straight at the camera to calibrate."
              : "Liveness Check Step 2/2: Now turn your head slightly to the left or right."}
          </span>
        </div>
      )}

      {modelsLoaded && faceDetected && livenessVerified && !onMatchFound && (
        <div style={{ width: "100%", padding: "12px 16px", background: "rgba(16, 185, 129, 0.08)", border: "1px solid rgba(16, 185, 129, 0.25)", borderRadius: "14px", display: "flex", alignItems: "center", gap: "10px", color: "#34d399", fontSize: "0.85rem", fontWeight: 600, boxShadow: "0 4px 15px rgba(16, 185, 129, 0.05)" }}>
          <CheckCircle size={18} style={{ color: "#10b981", flexShrink: 0 }} />
          <span>Liveness Verified! You can now save your face profile.</span>
        </div>
      )}

      {/* Match result dashboard */}
      {modelsLoaded && faceDetected && livenessVerified && matchName && (
        <div style={{ width: "100%", padding: "12px 16px", background: "rgba(16, 185, 129, 0.08)", border: "1px solid rgba(16, 185, 129, 0.25)", borderRadius: "14px", display: "flex", alignItems: "center", gap: "10px", color: "#34d399", fontSize: "0.85rem", fontWeight: 600, boxShadow: "0 4px 15px rgba(16, 185, 129, 0.05)" }}>
          <CheckCircle size={18} style={{ color: "#10b981", flexShrink: 0 }} />
          <span>Match Identified: {matchName}</span>
        </div>
      )}

      {modelsLoaded && faceDetected && livenessVerified && !matchName && clientsWithFaces.length > 0 && isScanning && (
        <div style={{ width: "100%", padding: "12px 16px", background: "rgba(245, 158, 11, 0.08)", border: "1px solid rgba(245, 158, 11, 0.25)", borderRadius: "14px", display: "flex", alignItems: "center", gap: "10px", color: "#fbbf24", fontSize: "0.85rem", fontWeight: 600, boxShadow: "0 4px 15px rgba(245, 158, 11, 0.05)" }}>
          <AlertCircle size={18} style={{ color: "#f59e0b", flexShrink: 0 }} />
          <span>Scanning... Face detected but no matching profile found.</span>
        </div>
      )}

      {/* Action panel */}
      {modelsLoaded && (
        <div style={{ display: "flex", gap: "12px", width: "100%", justifyContent: "flex-end", marginTop: "4px" }}>
          <button
            onClick={onCancel}
            style={{ padding: "10px 20px", background: "rgba(255, 255, 255, 0.03)", border: "1px solid var(--glass-border)", borderRadius: "12px", color: "var(--foreground-muted)", cursor: "pointer", fontSize: "0.88rem", fontWeight: 700, transition: "var(--transition-fast)" }}
            onMouseEnter={(e) => (e.currentTarget.style.background = "rgba(255,255,255,0.06)")}
            onMouseLeave={(e) => (e.currentTarget.style.background = "rgba(255, 255, 255, 0.03)")}
          >
            Cancel
          </button>
          
          {/* For registration: capture and save */}
          {!onMatchFound && (
            <button
              onClick={handleConfirmCapture}
              disabled={!scannedDescriptor || !livenessVerified}
              style={{
                padding: "10px 24px",
                background: (scannedDescriptor && livenessVerified) ? "linear-gradient(135deg, #7c3aed, #a855f7)" : "rgba(255, 255, 255, 0.05)",
                border: "none",
                borderRadius: "12px",
                color: (scannedDescriptor && livenessVerified) ? "white" : "rgba(255, 255, 255, 0.3)",
                cursor: (scannedDescriptor && livenessVerified) ? "pointer" : "not-allowed",
                fontSize: "0.88rem",
                fontWeight: 700,
                display: "flex",
                alignItems: "center",
                gap: "6px",
                boxShadow: (scannedDescriptor && livenessVerified) ? "0 6px 20px rgba(124, 58, 237, 0.35)" : "none",
                transition: "var(--transition-fast)"
              }}
            >
              <CheckCircle size={16} />
              {actionLabel}
            </button>
          )}
        </div>
      )}

      {/* Scanline keyframe animation */}
      <style jsx global>{`
        @keyframes scanLine {
          0% { top: 0%; }
          50% { top: 100%; }
          100% { top: 0%; }
        }
      `}</style>
    </div>
  );
}
