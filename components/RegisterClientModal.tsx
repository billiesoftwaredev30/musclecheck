// components/RegisterClientModal.tsx
"use client";

import React, { useState, useEffect, useCallback } from "react";
import { createPortal } from "react-dom";
import styles from "./ConfirmModal.module.css";
import GlassCard from "./GlassCard";
import { UserPlus, X, Camera, Check } from "lucide-react";
import { createClient, addSubscription, GymRatesResponse } from "@/lib/api";
import dynamic from "next/dynamic";
const FaceCapture = dynamic(() => import("./FaceCapture"), { ssr: false });

interface RegisterClientModalProps {
  open: boolean;
  rates: GymRatesResponse | null;
  onClose: () => void;
  onSuccess: (msg: string) => void;
  onError: (msg: string) => void;
  onClientsUpdated: () => void;
}

export default function RegisterClientModal({ open, rates, onClose, onSuccess, onError, onClientsUpdated }: RegisterClientModalProps) {
  const [newClientName, setNewClientName] = useState("");
  const [newClientStatus, setNewClientStatus] = useState<"member" | "non-member" | "subscriber" | "coach" | "helper" | "ba">("member");
  
  // Facial recognition state
  const [faceDescriptor, setFaceDescriptor] = useState<string | null>(null);
  const [showCamera, setShowCamera] = useState(false);

  // Subscription state
  const [addInitialSub, setAddInitialSub] = useState(false);
  const [duration, setDuration] = useState<"1m" | "3m" | "6m" | "12m">("1m");
  const [isStudent, setIsStudent] = useState(false);
  const [startDate, setStartDate] = useState(new Date().toISOString().split("T")[0]);
  const [endDate, setEndDate] = useState("");
  const [amount, setAmount] = useState(0);
  const [paymentMethod, setPaymentMethod] = useState<"cash" | "gcash">("gcash");
  const [ptPackage, setPtPackage] = useState<"none" | "standard" | "12_sessions" | "boxing">("none");

  const [loading, setLoading] = useState(false);

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
    }
    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      document.body.style.overflow = "";
    };
  }, [open, handleKeyDown]);

  // Reset form fields only when the modal actually opens
  useEffect(() => {
    if (open) {
      setNewClientName("");
      setNewClientStatus("member");
      setFaceDescriptor(null);
      setShowCamera(false);
      setAddInitialSub(false);
      setDuration("1m");
      setIsStudent(false);
      setStartDate(new Date().toISOString().split("T")[0]);
      setPaymentMethod("gcash");
      setPtPackage("none");
    }
  }, [open]);

  // Auto-calculate end date and amount when start date, duration, rates, or student status change
  useEffect(() => {
    if (!startDate || !rates || !addInitialSub) return;
    
    const start = new Date(startDate);
    const end = new Date(start);
    
    let monthsToAdd = 1;
    let selectedAmount = isStudent ? (rates.rate_student_subscription_1m || 1349) : (rates.rate_monthly_subscription_1m || 1500);

    if (duration === "3m") {
      monthsToAdd = 3;
      selectedAmount = isStudent ? (rates.rate_student_subscription_3m || 3500) : (rates.rate_monthly_subscription_3m || 4000);
    } else if (duration === "6m") {
      monthsToAdd = 6;
      selectedAmount = isStudent ? (rates.rate_student_subscription_6m || 7000) : (rates.rate_monthly_subscription_6m || 8000);
    } else if (duration === "12m") {
      monthsToAdd = 12;
      selectedAmount = isStudent ? (rates.rate_student_subscription_12m || 14000) : (rates.rate_monthly_subscription_12m || 15000);
    }

    end.setMonth(end.getMonth() + monthsToAdd);
    setEndDate(end.toISOString().split("T")[0]);
    setAmount(selectedAmount);
  }, [startDate, duration, rates, isStudent, addInitialSub]);

  const handleRegisterClient = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newClientName.trim()) return;
    setLoading(true);
    try {
      const finalStatus = addInitialSub ? "subscriber" : newClientStatus;
      const client = await createClient({ 
        full_name: newClientName.trim(), 
        status: finalStatus,
        face_descriptor: faceDescriptor || undefined
      });
      
      if (addInitialSub && client && client.id) {
        let ptFee = 0;
        let ptSessionsAdded = 0;
        if (ptPackage === "standard") {
          ptFee = rates?.rate_pt_fee || 0;
          ptSessionsAdded = 1;
        } else if (ptPackage === "12_sessions") {
          ptFee = rates?.rate_12_sessions_fee || 0;
          ptSessionsAdded = 12;
        } else if (ptPackage === "boxing") {
          ptFee = rates?.rate_boxing_fee || 0;
          ptSessionsAdded = 12;
        }

        await addSubscription(client.id, {
          start_date: startDate,
          end_date: endDate,
          amount_paid: amount,
          pt_fee: ptFee,
          payment_method: paymentMethod,
          pt_sessions_added: ptSessionsAdded,
        });
      }

      onSuccess(addInitialSub ? "Client registered and subscription activated!" : "Client registered successfully!");
      onClientsUpdated();
      onClose();
    } catch (err: any) {
      onError(err.message || "Failed to register client");
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

  if (!open) return null;

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
            <UserPlus size={20} style={{ color: "var(--accent-fuchsia)" }} />
            Register Client
          </h3>

          <form onSubmit={handleRegisterClient} style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
            <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
              <label style={{ fontSize: "0.85rem", fontWeight: 600, color: "var(--foreground-secondary)" }}>Full Name</label>
              <input
                type="text"
                placeholder="e.g., Juan Dela Cruz"
                style={{ padding: "10px 14px", borderRadius: "8px", border: "1px solid var(--glass-border)", background: "rgba(255,255,255,0.03)", color: "var(--foreground)", outline: "none", width: "100%" }}
                value={newClientName}
                onChange={(e) => setNewClientName(e.target.value)}
                required
              />
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
              <label style={{ fontSize: "0.85rem", fontWeight: 600, color: "var(--foreground-secondary)" }}>Base Membership Type</label>
              <select
                style={{ padding: "10px 14px", borderRadius: "8px", border: "1px solid var(--glass-border)", background: "rgba(255,255,255,0.03)", color: "var(--foreground)", outline: "none", width: "100%", appearance: "none" }}
                value={newClientStatus}
                onChange={(e) => setNewClientStatus(e.target.value as any)}
                disabled={addInitialSub}
              >
                <option value="member" style={{ background: "var(--bg-elevated)", color: "var(--foreground)" }}>Regular Member</option>
                <option value="non-member" style={{ background: "var(--bg-elevated)", color: "var(--foreground)" }}>Walk-in (Non-member)</option>
                <option value="coach" style={{ background: "var(--bg-elevated)", color: "var(--foreground)" }}>Coach</option>
                <option value="helper" style={{ background: "var(--bg-elevated)", color: "var(--foreground)" }}>Helper</option>
                <option value="ba" style={{ background: "var(--bg-elevated)", color: "var(--foreground)" }}>Branch Admin (BA)</option>
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

            <div style={{ display: "flex", alignItems: "center", gap: "8px", padding: "12px", background: "rgba(255,255,255,0.02)", border: "1px solid var(--glass-border)", borderRadius: "8px", marginTop: "10px" }}>
              <input 
                type="checkbox" 
                id="add-initial-sub" 
                checked={addInitialSub} 
                onChange={(e) => setAddInitialSub(e.target.checked)} 
                style={{ width: "16px", height: "16px", accentColor: "var(--accent-fuchsia)", cursor: "pointer" }}
              />
              <label htmlFor="add-initial-sub" style={{ fontSize: "0.85rem", fontWeight: 600, color: "var(--foreground)", cursor: "pointer", userSelect: "none" }}>
                Activate Subscription Now
              </label>
            </div>

            {addInitialSub && (
              <div style={{ display: "flex", flexDirection: "column", gap: "16px", background: "rgba(0,0,0,0.02)", padding: "16px", borderRadius: "12px", border: "1px solid var(--glass-border)", animation: "fadeIn 0.3s var(--ease-out-expo)" }}>
                <div style={{ display: "flex", gap: "10px", flexWrap: "wrap" }}>
                  <div style={{ display: "flex", flexDirection: "column", gap: "6px", flex: 1, minWidth: "140px" }}>
                    <label style={{ fontSize: "0.85rem", fontWeight: 600, color: "var(--foreground-secondary)" }}>Client Type</label>
                    <select style={{ padding: "10px", borderRadius: "8px", border: "1px solid var(--glass-border)", background: "rgba(255,255,255,0.03)", color: "var(--foreground)", outline: "none", width: "100%", appearance: "none" }} value={isStudent ? "student" : "member"} onChange={(e) => setIsStudent(e.target.value === "student")}>
                      <option value="member" style={{ background: "var(--bg-elevated)", color: "var(--foreground)" }}>Regular Member</option>
                      <option value="student" style={{ background: "var(--bg-elevated)", color: "var(--foreground)" }}>Student</option>
                    </select>
                  </div>
                  <div style={{ display: "flex", flexDirection: "column", gap: "6px", flex: 1, minWidth: "140px" }}>
                    <label style={{ fontSize: "0.85rem", fontWeight: 600, color: "var(--foreground-secondary)" }}>Duration</label>
                    <select style={{ padding: "10px", borderRadius: "8px", border: "1px solid var(--glass-border)", background: "rgba(255,255,255,0.03)", color: "var(--foreground)", outline: "none", width: "100%", appearance: "none" }} value={duration} onChange={(e) => setDuration(e.target.value as any)}>
                      <option value="1m" style={{ background: "var(--bg-elevated)", color: "var(--foreground)" }}>1 Month</option>
                      <option value="3m" style={{ background: "var(--bg-elevated)", color: "var(--foreground)" }}>3 Months</option>
                      <option value="6m" style={{ background: "var(--bg-elevated)", color: "var(--foreground)" }}>6 Months</option>
                      <option value="12m" style={{ background: "var(--bg-elevated)", color: "var(--foreground)" }}>12 Months</option>
                    </select>
                  </div>
                </div>

                <div style={{ display: "flex", gap: "10px", flexWrap: "wrap" }}>
                  <div style={{ display: "flex", flexDirection: "column", gap: "6px", flex: 1, minWidth: "140px" }}>
                    <label style={{ fontSize: "0.85rem", fontWeight: 600, color: "var(--foreground-secondary)" }}>Start Date</label>
                    <input type="date" style={{ padding: "10px", borderRadius: "8px", border: "1px solid var(--glass-border)", background: "rgba(255,255,255,0.03)", color: "var(--foreground)", outline: "none", width: "100%" }} value={startDate} onChange={(e) => setStartDate(e.target.value)} required={addInitialSub} />
                  </div>
                  <div style={{ display: "flex", flexDirection: "column", gap: "6px", flex: 1, minWidth: "140px" }}>
                    <label style={{ fontSize: "0.85rem", fontWeight: 600, color: "var(--foreground-secondary)" }}>Amount (₱)</label>
                    <input type="text" style={{ padding: "10px", borderRadius: "8px", border: "1px solid var(--glass-border)", background: "rgba(255,255,255,0.03)", color: "var(--foreground)", outline: "none", width: "100%", opacity: 0.7, fontWeight: 700 }} value={amount.toLocaleString()} disabled />
                  </div>
                </div>

                <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                  <label style={{ fontSize: "0.85rem", fontWeight: 600, color: "var(--foreground-secondary)" }}>Coaching Add-on</label>
                  <select style={{ padding: "10px", borderRadius: "8px", border: "1px solid var(--glass-border)", background: "rgba(255,255,255,0.03)", color: "var(--foreground)", outline: "none", width: "100%", appearance: "none" }} value={ptPackage} onChange={(e) => setPtPackage(e.target.value as any)}>
                    <option value="none" style={{ background: "var(--bg-elevated)", color: "var(--foreground)" }}>None</option>
                    <option value="standard" style={{ background: "var(--bg-elevated)", color: "var(--foreground)" }}>Standard PT Session (+₱{(rates?.rate_pt_fee || 0).toLocaleString()})</option>
                    <option value="12_sessions" style={{ background: "var(--bg-elevated)", color: "var(--foreground)" }}>12 PT Sessions (+₱{(rates?.rate_12_sessions_fee || 0).toLocaleString()})</option>
                    <option value="boxing" style={{ background: "var(--bg-elevated)", color: "var(--foreground)" }}>Boxing (+₱{(rates?.rate_boxing_fee || 0).toLocaleString()})</option>
                  </select>
                </div>

                {ptPackage !== "none" && (
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "0 4px" }}>
                    <span style={{ fontSize: "0.85rem", color: "var(--foreground-muted)", fontWeight: 600 }}>Grand Total:</span>
                    <span style={{ fontSize: "1.1rem", color: "var(--accent-fuchsia)", fontWeight: 700 }}>
                      ₱{(amount + (ptPackage === "standard" ? (rates?.rate_pt_fee || 0) : ptPackage === "12_sessions" ? (rates?.rate_12_sessions_fee || 0) : ptPackage === "boxing" ? (rates?.rate_boxing_fee || 0) : 0)).toLocaleString()}
                    </span>
                  </div>
                )}

                <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                  <label style={{ fontSize: "0.85rem", fontWeight: 600, color: "var(--foreground-secondary)" }}>Payment Method</label>
                  <select style={{ padding: "10px", borderRadius: "8px", border: "1px solid var(--glass-border)", background: "rgba(255,255,255,0.03)", color: "var(--foreground)", outline: "none", width: "100%", appearance: "none" }} value={paymentMethod} onChange={(e) => setPaymentMethod(e.target.value as any)}>
                    <option value="gcash" style={{ background: "var(--bg-elevated)", color: "var(--foreground)" }}>GCash</option>
                    <option value="cash" style={{ background: "var(--bg-elevated)", color: "var(--foreground)" }}>Cash</option>
                  </select>
                </div>
              </div>
            )}

            <button 
              type="submit" 
              disabled={loading}
              style={{ display: "flex", justifyContent: "center", alignItems: "center", gap: "8px", padding: "12px", background: "var(--gradient-primary)", color: "white", border: "none", borderRadius: "10px", fontWeight: 600, marginTop: "10px", cursor: "pointer", transition: "var(--transition-fast)", opacity: loading ? 0.7 : 1 }}
            >
              <UserPlus size={16} />
              {loading ? "Registering..." : "Register"}
            </button>
          </form>
        </GlassCard>
      </div>
    </div>
  );

  return createPortal(modal, document.body);
}
