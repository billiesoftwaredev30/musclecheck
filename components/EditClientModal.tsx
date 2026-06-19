// components/EditClientModal.tsx
"use client";

import React, { useState, useEffect, useCallback } from "react";
import { createPortal } from "react-dom";
import styles from "./ConfirmModal.module.css";
import GlassCard from "./GlassCard";
import { Pencil, X, Save, Camera, Check } from "lucide-react";
import { updateClient, ClientResponse } from "@/lib/api";
import dynamic from "next/dynamic";
const FaceCapture = dynamic(() => import("./FaceCapture"), { ssr: false });

interface EditClientModalProps {
  client: ClientResponse | null;
  onClose: () => void;
  onSuccess: (msg: string) => void;
  onError: (msg: string) => void;
  onClientsUpdated: () => void;
}

export default function EditClientModal({ client, onClose, onSuccess, onError, onClientsUpdated }: EditClientModalProps) {
  const [clientName, setClientName] = useState("");
  const [clientStatus, setClientStatus] = useState<"member" | "non-member" | "subscriber">("member");
  const [ptSessionsRemaining, setPtSessionsRemaining] = useState(0);
  const [faceDescriptor, setFaceDescriptor] = useState<string | null>(null);
  const [showCamera, setShowCamera] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    },
    [onClose]
  );

  useEffect(() => {
    if (client) {
      document.addEventListener("keydown", handleKeyDown);
      document.body.style.overflow = "hidden";
    } else {
      document.removeEventListener("keydown", handleKeyDown);
      document.body.style.overflow = "";
    }
    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      document.body.style.overflow = "";
    };
  }, [client, handleKeyDown]);

  // Reset form fields only when a new client object is loaded
  useEffect(() => {
    if (client) {
      setClientName(client.full_name);
      setClientStatus(client.status);
      setPtSessionsRemaining(client.pt_sessions_remaining || 0);
      setFaceDescriptor(client.face_descriptor || null);
      setShowCamera(false);
    }
  }, [client]);

  const handleEditClient = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!client || !clientName.trim()) return;
    setLoading(true);
    try {
      await updateClient(client.id, { 
        full_name: clientName.trim(), 
        status: clientStatus,
        pt_sessions_remaining: ptSessionsRemaining,
        face_descriptor: faceDescriptor || undefined
      });
      onSuccess("Client updated successfully!");
      onClientsUpdated();
      onClose();
    } catch (err: any) {
      onError(err.message || "Failed to update client");
    } finally {
      setLoading(false);
    }
  };

  if (showCamera) {
    return createPortal(
      <div
        className={styles.overlay}
        onClick={(e) => {
          if (e.target === e.currentTarget) setShowCamera(false);
        }}
      >
        <div style={{ width: "100%", maxWidth: "520px", margin: "auto", animation: "modalIn 0.35s var(--ease-out-expo) both" }}>
          <GlassCard style={{ position: "relative" }}>
            <FaceCapture
              title="Register Face Scan"
              actionLabel="Enlist Face Scan"
              onCapture={(descriptor) => {
                setFaceDescriptor(descriptor);
                setShowCamera(false);
              }}
              onCancel={() => setShowCamera(false)}
            />
          </GlassCard>
        </div>
      </div>,
      document.body
    );
  }

  if (!client) return null;

  const modal = (
    <div
      className={styles.overlay}
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div style={{ width: "100%", maxWidth: "400px", margin: "auto", animation: "modalIn 0.35s var(--ease-out-expo) both" }}>
        <GlassCard style={{ position: "relative" }}>
          <button 
            onClick={onClose} 
            style={{ position: "absolute", top: "20px", right: "20px", background: "none", border: "none", color: "var(--foreground-muted)", cursor: "pointer" }}
          >
            <X size={20} />
          </button>
          
          <h3 style={{ display: "flex", alignItems: "center", gap: "8px", fontSize: "1.2rem", fontWeight: 700, marginBottom: "20px" }}>
            <Pencil size={20} style={{ color: "var(--accent-fuchsia)" }} />
            Edit Client
          </h3>

          <form onSubmit={handleEditClient} style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
            <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
              <label style={{ fontSize: "0.85rem", fontWeight: 600, color: "var(--foreground-secondary)" }}>Full Name</label>
              <input
                type="text"
                placeholder="e.g., Juan Dela Cruz"
                style={{ padding: "10px 14px", borderRadius: "8px", border: "1px solid var(--glass-border)", background: "rgba(255,255,255,0.03)", color: "var(--foreground)", outline: "none", width: "100%" }}
                value={clientName}
                onChange={(e) => setClientName(e.target.value)}
                required
              />
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
              <label style={{ fontSize: "0.85rem", fontWeight: 600, color: "var(--foreground-secondary)" }}>Membership Type</label>
              <select
                style={{ padding: "10px 14px", borderRadius: "8px", border: "1px solid var(--glass-border)", background: "rgba(255,255,255,0.03)", color: "var(--foreground)", outline: "none", width: "100%", appearance: "none" }}
                value={clientStatus}
                onChange={(e) => setClientStatus(e.target.value as any)}
              >
                <option value="member" style={{ background: "var(--bg-elevated)", color: "var(--foreground)" }}>Regular Member</option>
                <option value="non-member" style={{ background: "var(--bg-elevated)", color: "var(--foreground)" }}>Walk-in (Non-member)</option>
                <option value="subscriber" style={{ background: "var(--bg-elevated)", color: "var(--foreground)" }}>Subscriber</option>
              </select>
            </div>

            {/* Face Scanner Trigger */}
            <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
              <label style={{ fontSize: "0.85rem", fontWeight: 600, color: "var(--foreground-secondary)" }}>Face Biometric Registration</label>
              {faceDescriptor ? (
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "10px 14px", background: "rgba(16,185,129,0.06)", border: "1px solid rgba(16,185,129,0.2)", borderRadius: "8px" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "8px", color: "var(--success-light)", fontSize: "0.85rem", fontWeight: 600 }}>
                    <Check size={16} /> Face Profile Enrolled
                  </div>
                  <button
                    type="button"
                    onClick={() => setFaceDescriptor(null)}
                    style={{ background: "none", border: "none", color: "var(--error-light)", cursor: "pointer", fontSize: "0.78rem", fontWeight: 600 }}
                  >
                    Remove
                  </button>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => setShowCamera(true)}
                  style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "8px", padding: "10px 14px", borderRadius: "8px", border: "1px dashed var(--glass-border)", background: "rgba(255,255,255,0.01)", color: "var(--foreground-secondary)", cursor: "pointer", transition: "var(--transition-fast)", fontSize: "0.85rem", fontWeight: 600 }}
                >
                  <Camera size={16} style={{ color: "var(--accent-fuchsia)" }} />
                  Scan & Enroll Face Profile
                </button>
              )}
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
              <label style={{ fontSize: "0.85rem", fontWeight: 600, color: "var(--foreground-secondary)" }}>Remaining Coaching Sessions</label>
              <input
                type="number"
                placeholder="0"
                style={{ padding: "10px 14px", borderRadius: "8px", border: "1px solid var(--glass-border)", background: "rgba(255,255,255,0.03)", color: "var(--foreground)", outline: "none", width: "100%" }}
                value={ptSessionsRemaining}
                onChange={(e) => setPtSessionsRemaining(Math.max(0, parseInt(e.target.value) || 0))}
                required
                min="0"
              />
            </div>
            <button 
              type="submit" 
              disabled={loading}
              style={{ display: "flex", justifyContent: "center", alignItems: "center", gap: "8px", padding: "12px", background: "var(--gradient-primary)", color: "white", border: "none", borderRadius: "10px", fontWeight: 600, marginTop: "10px", cursor: "pointer", transition: "var(--transition-fast)", opacity: loading ? 0.7 : 1 }}
            >
              <Save size={16} />
              {loading ? "Saving..." : "Save Changes"}
            </button>
          </form>
        </GlassCard>
      </div>
    </div>
  );

  return createPortal(modal, document.body);
}
