// components/LogSessionModal.tsx
"use client";

import React, { useEffect, useCallback, useState } from "react";
import { createPortal } from "react-dom";
import styles from "./ConfirmModal.module.css";
import SessionLogger from "./SessionLogger";
import GlassCard from "./GlassCard";
import { X } from "lucide-react";
import { ClientResponse, GymRatesResponse, DailySessionResponse } from "@/lib/api";

interface LogSessionModalProps {
  open: boolean;
  onClose: () => void;
  clients: ClientResponse[];
  rates: GymRatesResponse | null;
  dailySessions: DailySessionResponse[];
  onSessionLogged: () => void;
  startWithCamera?: boolean;
}

export default function LogSessionModal({ open, onClose, clients, rates, dailySessions, onSessionLogged, startWithCamera = false }: LogSessionModalProps) {
  const [cameraActive, setCameraActive] = useState(false);

  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    },
    [onClose]
  );

  useEffect(() => {
    if (open) {
      document.addEventListener("keydown", handleKeyDown);
      document.body.style.overflow = "hidden";
      setCameraActive(false); // Reset on open
    }
    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      document.body.style.overflow = "";
    };
  }, [open, handleKeyDown]);

  if (!open) return null;

  const modal = (
    <div
      className={styles.overlay}
      style={{ overflowY: "auto", padding: "40px 20px", display: cameraActive ? "none" : "flex" }}
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div style={{ width: "100%", maxWidth: "480px", margin: "auto", display: "flex", flexDirection: "column", gap: "20px", animation: "modalIn 0.35s var(--ease-out-expo) both" }}>
        
        <GlassCard style={{ position: "relative" }}>
          <button 
            onClick={onClose} 
            style={{ position: "absolute", top: "20px", right: "20px", background: "none", border: "none", color: "var(--foreground-muted)", cursor: "pointer" }}
          >
            <X size={20} />
          </button>
          <SessionLogger
            clients={clients}
            rates={rates}
            dailySessions={dailySessions}
            startWithCamera={startWithCamera}
            onCameraToggle={(active) => setCameraActive(active)}
            onSessionLogged={() => {
              onSessionLogged();
              onClose();
            }}
            onCancel={onClose}
          />
        </GlassCard>
      </div>
    </div>
  );

  return createPortal(modal, document.body);
}
