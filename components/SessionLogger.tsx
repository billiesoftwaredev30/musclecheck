// components/SessionLogger.tsx
"use client";

import React, { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import styles from "./SessionLogger.module.css";
import { ClientResponse, GymRatesResponse, DailySessionResponse, logSession, DailySessionCreate } from "@/lib/api";
import { ClipboardCheck, Plus, Check, Camera, AlertCircle } from "lucide-react";
import GlassCard from "./GlassCard";
import modalStyles from "./ConfirmModal.module.css";
import dynamic from "next/dynamic";
const FaceCapture = dynamic(() => import("./FaceCapture"), { ssr: false });

interface SessionLoggerProps {
  clients: ClientResponse[];
  rates: GymRatesResponse | null;
  dailySessions: DailySessionResponse[];
  onSessionLogged: () => void;
  startWithCamera?: boolean;
  onCameraToggle?: (active: boolean) => void;
  onCancel?: () => void;
}

export default function SessionLogger({ clients, rates, dailySessions, onSessionLogged, startWithCamera = false, onCameraToggle, onCancel }: SessionLoggerProps) {
  const [selectedClientId, setSelectedClientId] = useState<string>("walk-in");
  const [clientName, setClientName] = useState("");
  const [timeIn, setTimeIn] = useState("");
  const [clientAssist, setClientAssist] = useState<"JAYSON" | "VINCENT" | "TIN" | "NONE">("NONE");
  const [isMember, setIsMember] = useState(false);
  const [isStudent, setIsStudent] = useState(false);
  const [amountPaid, setAmountPaid] = useState(200);
  const [paymentMethod, setPaymentMethod] = useState<"cash" | "gcash">("cash");
  const [ptPackage, setPtPackage] = useState<"none" | "standard" | "12_sessions" | "boxing">("none");
  const [deductCoaching, setDeductCoaching] = useState(false);
  const [showCamera, setShowCamera] = useState(false);
  const [scannedClient, setScannedClient] = useState<ClientResponse | null>(null);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [showAlreadyCheckedIn, setShowAlreadyCheckedIn] = useState(false);
  const [alreadyCheckedInClient, setAlreadyCheckedInClient] = useState<ClientResponse | null>(null);
  const [alreadyCheckedInSession, setAlreadyCheckedInSession] = useState<DailySessionResponse | null>(null);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Propagate camera status to parent modals
  useEffect(() => {
    if (onCameraToggle) {
      onCameraToggle(showCamera || showSuccessModal || showAlreadyCheckedIn);
    }
  }, [showCamera, showSuccessModal, showAlreadyCheckedIn, onCameraToggle]);

  // Auto-start camera if startWithCamera prop is true
  useEffect(() => {
    if (startWithCamera) {
      setShowCamera(true);
    }
  }, [startWithCamera]);

  // Set default current time formatted like "8:45 AM"
  useEffect(() => {
    const now = new Date();
    let hours = now.getHours();
    const minutes = now.getMinutes().toString().padStart(2, "0");
    const ampm = hours >= 12 ? "PM" : "AM";
    hours = hours % 12;
    hours = hours ? hours : 12; // 0 should be 12
    setTimeIn(`${hours}:${minutes} ${ampm}`);
  }, []);

  // Update rates when clients or selected client changes
  useEffect(() => {
    if (selectedClientId === "walk-in") {
      setClientName("");
      // Set to Non-member rate default
      setAmountPaid(rates?.rate_daily_non_member || 200);
      setIsMember(false);
      setIsStudent(false);
      setDeductCoaching(false);
    } else {
      const client = clients.find((c) => c.id === Number(selectedClientId));
      if (client) {
        setClientName(client.full_name);
        setDeductCoaching(client.pt_sessions_remaining > 0);
        if (client.status === "subscriber") {
          setAmountPaid(0); // Subscriber sessions are pre-paid
          setIsMember(true);
        } else if (client.status === "member") {
          setAmountPaid(rates?.rate_daily_member || 150);
          setIsMember(true);
        } else {
          setAmountPaid(rates?.rate_daily_non_member || 200);
          setIsMember(false);
        }
      }
    }
  }, [selectedClientId, clients, rates]);

  // Check for duplicate check-in helper
  const checkDuplicateSession = (clientId: number): DailySessionResponse | undefined => {
    return dailySessions.find(s => s.client_id === clientId);
  };

  // Handle client selection with duplicate check
  const handleClientSelect = (value: string) => {
    if (value !== "walk-in") {
      const existingSession = checkDuplicateSession(Number(value));
      if (existingSession) {
        const client = clients.find(c => c.id === Number(value));
        if (client) {
          setAlreadyCheckedInClient(client);
          setAlreadyCheckedInSession(existingSession);
          setShowAlreadyCheckedIn(true);
          return;
        }
      }
    }
    setSelectedClientId(value);
  };

  // Handle member checkbox changes for walk-ins
  const handleMemberChange = (checked: boolean) => {
    setIsMember(checked);
    if (checked) setIsStudent(false);
    if (selectedClientId === "walk-in") {
      const rate = checked
        ? rates?.rate_daily_member || 150
        : rates?.rate_daily_non_member || 200;
      setAmountPaid(rate);
    }
  };

  const handleStudentChange = (checked: boolean) => {
    setIsStudent(checked);
    if (checked) setIsMember(false);
    if (selectedClientId === "walk-in") {
      const rate = checked
        ? rates?.rate_daily_student || 150
        : rates?.rate_daily_non_member || 200;
      setAmountPaid(rate);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const finalName = clientName.trim();
    if (!finalName) {
      setError("Please specify the client name.");
      return;
    }

    setLoading(true);
    setError(null);

    const sessionData: DailySessionCreate = {
      client_name: finalName,
      client_id: selectedClientId === "walk-in" ? null : Number(selectedClientId),
      time_in: timeIn.trim(),
      date: new Date().toISOString().split("T")[0],
      client_assist: clientAssist,
      is_member: isMember,
      amount_paid: Number(amountPaid),
      pt_fee: ptPackage === "standard" ? (rates?.rate_pt_fee || 0) : ptPackage === "12_sessions" ? (rates?.rate_12_sessions_fee || 0) : ptPackage === "boxing" ? (rates?.rate_boxing_fee || 0) : 0,
      payment_method: paymentMethod,
      deduct_coaching: deductCoaching,
      pt_sessions_added: ptPackage === "standard" ? 1 : (ptPackage === "12_sessions" || ptPackage === "boxing") ? 12 : 0,
    };

    try {
      await logSession(sessionData);
      setClientName("");
      setSelectedClientId("walk-in");
      setIsMember(false);
      setAmountPaid(rates?.rate_daily_non_member || 200);
      setClientAssist("NONE");
      setPtPackage("none");
      setDeductCoaching(false);
      
      // Update parent dashboard
      onSessionLogged();
    } catch (err: any) {
      setError(err.message || "Failed to log daily session check-in");
    } finally {
      setLoading(false);
    }
  };

  const handleLogSessionForClient = async (client: ClientResponse) => {
    setLoading(true);
    setError(null);

    const isSub = client.status === "subscriber";
    const finalAmount = isSub ? 0 : (client.status === "member" ? (rates?.rate_daily_member || 150) : (rates?.rate_daily_non_member || 200));

    const sessionData: DailySessionCreate = {
      client_name: client.full_name,
      client_id: client.id,
      time_in: timeIn.trim(),
      date: new Date().toISOString().split("T")[0],
      client_assist: clientAssist,
      is_member: client.status !== "non-member",
      amount_paid: finalAmount,
      pt_fee: ptPackage === "standard" ? (rates?.rate_pt_fee || 0) : ptPackage === "12_sessions" ? (rates?.rate_12_sessions_fee || 0) : ptPackage === "boxing" ? (rates?.rate_boxing_fee || 0) : 0,
      payment_method: paymentMethod,
      deduct_coaching: deductCoaching,
      pt_sessions_added: ptPackage === "standard" ? 1 : (ptPackage === "12_sessions" || ptPackage === "boxing") ? 12 : 0,
    };

    try {
      await logSession(sessionData);
      setClientName("");
      setSelectedClientId("walk-in");
      setIsMember(false);
      setAmountPaid(rates?.rate_daily_non_member || 200);
      setClientAssist("NONE");
      setPtPackage("none");
      setDeductCoaching(false);
      
      // Update parent dashboard
      onSessionLogged();
    } catch (err: any) {
      setError(err.message || "Failed to log daily session check-in");
    } finally {
      setLoading(false);
    }
  };

  const clientsWithFaces = clients
    .filter((c) => c.face_descriptor)
    .map((c) => ({
      id: c.id,
      full_name: c.full_name,
      face_descriptor: c.face_descriptor!,
    }));

  const cameraPortal = showCamera && createPortal(
    <div
      className={modalStyles.overlay}
      onClick={(e) => {
        if (e.target === e.currentTarget) setShowCamera(false);
      }}
    >
      <div style={{ width: "100%", maxWidth: "520px", margin: "auto", animation: "modalIn 0.35s var(--ease-out-expo) both" }}>
        <GlassCard style={{ position: "relative" }}>
          <FaceCapture
            title="Scan Face to Identify"
            clientsWithFaces={clientsWithFaces}
            onMatchFound={(clientId) => {
              const matched = clients.find((c) => c.id === clientId);
              if (matched) {
                // Check for duplicate before showing success
                const existingSession = checkDuplicateSession(clientId);
                if (existingSession) {
                  setAlreadyCheckedInClient(matched);
                  setAlreadyCheckedInSession(existingSession);
                  setShowAlreadyCheckedIn(true);
                  setShowCamera(false);
                  return;
                }
                setScannedClient(matched);
                setShowSuccessModal(true);
              }
              setSelectedClientId(String(clientId));
              setShowCamera(false);
            }}
            onCancel={() => setShowCamera(false)}
          />
        </GlassCard>
      </div>
    </div>,
    document.body
  );

  const successModal = showSuccessModal && scannedClient && createPortal(
    <div
      className={modalStyles.overlay}
      onClick={(e) => {
        if (e.target === e.currentTarget) setShowSuccessModal(false);
      }}
    >
      <div style={{ width: "100%", maxWidth: "440px", margin: "auto", animation: "modalIn 0.35s var(--ease-out-expo) both" }}>
        <GlassCard style={{ position: "relative", padding: "24px", border: "1px solid rgba(168, 85, 247, 0.3)", borderRadius: "24px" }}>
          {/* AI Success Header with Purple Gradient */}
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "12px", textAlign: "center", marginBottom: "20px" }}>
            <div style={{ 
              width: "60px", 
              height: "60px", 
              borderRadius: "50%", 
              background: "linear-gradient(135deg, #7c3aed, #a855f7)", 
              display: "flex", 
              alignItems: "center", 
              justifyContent: "center",
              boxShadow: "0 0 20px rgba(124, 58, 237, 0.4)",
              animation: "pulse 2s infinite"
            }}>
              <Check size={28} style={{ color: "white" }} />
            </div>
            <h3 style={{ margin: 0, fontSize: "1.25rem", fontWeight: 800, background: "linear-gradient(to right, #a855f7, #f472b6)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>
              AI Face Scan Verified
            </h3>
            <p style={{ margin: 0, fontSize: "0.85rem", color: "var(--foreground-muted)" }}>
              Client profile identified successfully
            </p>
          </div>

          {/* Client Info Grid */}
          <div style={{ display: "flex", flexDirection: "column", gap: "12px", background: "rgba(255,255,255,0.02)", border: "1px solid var(--glass-border)", padding: "16px", borderRadius: "16px", marginBottom: "20px" }}>
            <div style={{ display: "flex", justifyContent: "space-between", borderBottom: "1px solid rgba(255,255,255,0.05)", paddingBottom: "8px" }}>
              <span style={{ fontSize: "0.85rem", color: "var(--foreground-secondary)" }}>Name</span>
              <span style={{ fontSize: "0.9rem", fontWeight: 700, color: "var(--foreground)" }}>{scannedClient.full_name}</span>
            </div>
            <div style={{ display: "flex", justifyContent: "space-between", borderBottom: "1px solid rgba(255,255,255,0.05)", paddingBottom: "8px" }}>
              <span style={{ fontSize: "0.85rem", color: "var(--foreground-secondary)" }}>Status</span>
              <span style={{ 
                fontSize: "0.8rem", 
                fontWeight: 700, 
                textTransform: "uppercase",
                padding: "2px 8px",
                borderRadius: "12px",
                background: scannedClient.status === "subscriber" ? "rgba(168, 85, 247, 0.15)" : "rgba(255,255,255,0.08)",
                color: scannedClient.status === "subscriber" ? "#c084fc" : "var(--foreground)"
              }}>{scannedClient.status}</span>
            </div>
            <div style={{ display: "flex", justifyContent: "space-between", borderBottom: "1px solid rgba(255,255,255,0.05)", paddingBottom: "8px" }}>
              <span style={{ fontSize: "0.85rem", color: "var(--foreground-secondary)" }}>PT Sessions Left</span>
              <span style={{ fontSize: "0.9rem", fontWeight: 700, color: scannedClient.pt_sessions_remaining > 0 ? "var(--success-light)" : "var(--foreground)" }}>
                {scannedClient.pt_sessions_remaining} {scannedClient.pt_sessions_remaining === 1 ? "session" : "sessions"}
              </span>
            </div>
            {scannedClient.pt_sessions_remaining > 0 && (
              <div style={{ display: "flex", alignItems: "center", gap: "8px", marginTop: "4px" }}>
                <input 
                  type="checkbox" 
                  id="modal-deduct-pt"
                  checked={deductCoaching}
                  onChange={(e) => setDeductCoaching(e.target.checked)}
                  style={{ width: "16px", height: "16px", accentColor: "var(--accent-fuchsia)", cursor: "pointer" }}
                />
                <label htmlFor="modal-deduct-pt" style={{ fontSize: "0.85rem", fontWeight: 600, color: "var(--foreground)", cursor: "pointer" }}>
                  Deduct PT coaching session today
                </label>
              </div>
            )}

            <div style={{ display: "flex", flexDirection: "column", gap: "8px", marginTop: "12px", borderTop: "1px solid rgba(255,255,255,0.05)", paddingTop: "12px" }}>
                <label style={{ fontSize: "0.85rem", fontWeight: 600, color: "var(--foreground-secondary)" }}>Trainer Assist / Coach</label>
                <select 
                  style={{ 
                    padding: "10px", 
                    borderRadius: "8px", 
                    border: "1px solid var(--glass-border)", 
                    background: "rgba(255,255,255,0.03)", 
                    color: "var(--foreground)", 
                    outline: "none", 
                    width: "100%", 
                    appearance: "none",
                    cursor: "pointer"
                  }}
                  value={clientAssist}
                  onChange={(e) => setClientAssist(e.target.value as any)}
                >
                  <option value="NONE" style={{ background: "var(--bg-elevated)", color: "var(--foreground)" }}>None</option>
                  <option value="JAYSON" style={{ background: "var(--bg-elevated)", color: "var(--foreground)" }}>Jayson</option>
                  <option value="VINCENT" style={{ background: "var(--bg-elevated)", color: "var(--foreground)" }}>Vincent</option>
                  <option value="TIN" style={{ background: "var(--bg-elevated)", color: "var(--foreground)" }}>Tin</option>
                </select>
            </div>
          </div>

          {/* Actions */}
          <div style={{ display: "flex", gap: "10px" }}>
            <button
              type="button"
              onClick={() => setShowSuccessModal(false)}
              style={{ flex: 1, padding: "12px", background: "rgba(255, 255, 255, 0.03)", border: "1px solid var(--glass-border)", borderRadius: "14px", color: "var(--foreground-muted)", cursor: "pointer", fontSize: "0.85rem", fontWeight: 700 }}
            >
              Adjust Settings
            </button>
            <button
              type="button"
              disabled={loading}
              onClick={async () => {
                await handleLogSessionForClient(scannedClient);
                setShowSuccessModal(false);
              }}
              style={{ 
                flex: 1, 
                padding: "12px", 
                background: "linear-gradient(135deg, #7c3aed, #a855f7)", 
                border: "none", 
                borderRadius: "14px", 
                color: "white", 
                cursor: loading ? "not-allowed" : "pointer", 
                fontSize: "0.85rem", 
                fontWeight: 700,
                boxShadow: "0 4px 15px rgba(124, 58, 237, 0.3)",
                opacity: loading ? 0.7 : 1
              }}
            >
              {loading ? "Logging..." : "Confirm & Log"}
            </button>
          </div>
        </GlassCard>
      </div>
    </div>,
    document.body
  );

  return (
    <form className={styles.form} onSubmit={handleSubmit}>
      {cameraPortal}
      {successModal}

      {/* Already Checked In Today Modal */}
      {showAlreadyCheckedIn && alreadyCheckedInClient && alreadyCheckedInSession && createPortal(
        <div
          className={modalStyles.overlay}
          onClick={(e) => {
            if (e.target === e.currentTarget) {
              setShowAlreadyCheckedIn(false);
              setAlreadyCheckedInClient(null);
              setAlreadyCheckedInSession(null);
            }
          }}
        >
          <div style={{ width: "100%", maxWidth: "440px", margin: "auto", animation: "modalIn 0.35s var(--ease-out-expo) both" }}>
            <GlassCard style={{ position: "relative", padding: "24px", border: "1px solid rgba(245, 158, 11, 0.3)", borderRadius: "24px" }}>
              {/* Warning Header */}
              <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "12px", textAlign: "center", marginBottom: "20px" }}>
                <div style={{
                  width: "60px",
                  height: "60px",
                  borderRadius: "50%",
                  background: "linear-gradient(135deg, #f59e0b, #f97316)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  boxShadow: "0 0 20px rgba(245, 158, 11, 0.4)",
                  animation: "pulse 2s infinite"
                }}>
                  <AlertCircle size={28} style={{ color: "white" }} />
                </div>
                <h3 style={{ margin: 0, fontSize: "1.25rem", fontWeight: 800, background: "linear-gradient(to right, #f59e0b, #f97316)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>
                  Already Checked In Today
                </h3>
                <p style={{ margin: 0, fontSize: "0.85rem", color: "var(--foreground-muted)" }}>
                  This client already has a session logged for today
                </p>
              </div>

              {/* Client Info */}
              <div style={{ display: "flex", flexDirection: "column", gap: "12px", background: "rgba(255,255,255,0.02)", border: "1px solid var(--glass-border)", padding: "16px", borderRadius: "16px", marginBottom: "20px" }}>
                <div style={{ display: "flex", justifyContent: "space-between", borderBottom: "1px solid rgba(255,255,255,0.05)", paddingBottom: "8px" }}>
                  <span style={{ fontSize: "0.85rem", color: "var(--foreground-secondary)" }}>Name</span>
                  <span style={{ fontSize: "0.9rem", fontWeight: 700, color: "var(--foreground)" }}>{alreadyCheckedInClient.full_name}</span>
                </div>
                <div style={{ display: "flex", justifyContent: "space-between", borderBottom: "1px solid rgba(255,255,255,0.05)", paddingBottom: "8px" }}>
                  <span style={{ fontSize: "0.85rem", color: "var(--foreground-secondary)" }}>Checked In At</span>
                  <span style={{ fontSize: "0.9rem", fontWeight: 700, color: "var(--foreground)" }}>{alreadyCheckedInSession.time_in}</span>
                </div>
                <div style={{ display: "flex", justifyContent: "space-between", borderBottom: "1px solid rgba(255,255,255,0.05)", paddingBottom: "8px" }}>
                  <span style={{ fontSize: "0.85rem", color: "var(--foreground-secondary)" }}>Amount Paid</span>
                  <span style={{ fontSize: "0.9rem", fontWeight: 700, color: "var(--success-light)" }}>₱{alreadyCheckedInSession.amount_paid.toLocaleString()}</span>
                </div>
                <div style={{ display: "flex", justifyContent: "space-between" }}>
                  <span style={{ fontSize: "0.85rem", color: "var(--foreground-secondary)" }}>Payment</span>
                  <span style={{
                    fontSize: "0.8rem",
                    fontWeight: 700,
                    textTransform: "uppercase",
                    padding: "2px 8px",
                    borderRadius: "12px",
                    background: alreadyCheckedInSession.payment_method === "gcash" ? "rgba(234, 179, 8, 0.15)" : "rgba(255,255,255,0.08)",
                    color: alreadyCheckedInSession.payment_method === "gcash" ? "#fbbf24" : "var(--foreground)"
                  }}>{alreadyCheckedInSession.payment_method.toUpperCase()}</span>
                </div>
              </div>

              {/* Actions */}
              <div style={{ display: "flex", gap: "10px" }}>
                <button
                  type="button"
                  onClick={() => {
                    setShowAlreadyCheckedIn(false);
                    setAlreadyCheckedInClient(null);
                    setAlreadyCheckedInSession(null);
                    if (onCancel) onCancel();
                  }}
                  style={{
                    flex: 1,
                    padding: "12px",
                    background: "linear-gradient(135deg, #f59e0b, #f97316)",
                    border: "none",
                    borderRadius: "14px",
                    color: "white",
                    cursor: "pointer",
                    fontSize: "0.85rem",
                    fontWeight: 700,
                    fontFamily: "var(--font-family)",
                    boxShadow: "0 4px 15px rgba(245, 158, 11, 0.3)"
                  }}
                >
                  OK
                </button>
              </div>
            </GlassCard>
          </div>
        </div>,
        document.body
      )}
      <div>
        <h3 className={styles.title}>
          <ClipboardCheck size={20} style={{ color: "var(--accent-fuchsia)" }} />
          Log Daily Session
        </h3>
        <p className={styles.subtitle}>Log walk-ins or member sessions below</p>
      </div>

      {error && (
        <div style={{ color: "var(--error)", background: "var(--error-bg)", padding: "12px", borderRadius: "12px", border: "1px solid rgba(239,68,68,0.2)", fontSize: "0.85rem" }}>
          {error}
        </div>
      )}

      {/* Select Registered Client */}
      <div className={styles.field}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "4px" }}>
          <label className={styles.label} style={{ margin: 0 }}>Select Client Profile</label>
          {clientsWithFaces.length > 0 && (
            <button
              type="button"
              onClick={() => setShowCamera(true)}
              style={{ display: "flex", alignItems: "center", gap: "6px", background: "none", border: "none", color: "var(--accent-fuchsia)", cursor: "pointer", fontSize: "0.8rem", fontWeight: 700 }}
            >
              <Camera size={14} />
              Scan Face to Select
            </button>
          )}
        </div>
        <select
          className={styles.select}
          value={selectedClientId}
          onChange={(e) => handleClientSelect(e.target.value)}
        >
          <option value="walk-in">-- Unregistered / Walk-In --</option>
          {clients.map((c) => (
            <option key={c.id} value={c.id}>
              {c.full_name} ({c.status.toUpperCase()})
            </option>
          ))}
        </select>
      </div>

      {/* Manual Name Input (if walk-in) */}
      {selectedClientId === "walk-in" && (
        <div className={styles.field}>
          <label className={styles.label}>Client Complete Name</label>
          <input
            type="text"
            placeholder="e.g., Andrew Basco"
            className={styles.input}
            value={clientName}
            onChange={(e) => setClientName(e.target.value)}
            required
          />
        </div>
      )}

      {/* Checkboxes for Member/Student Status (Walk-ins only) */}
      {selectedClientId === "walk-in" && (
        <div style={{ display: 'flex', gap: '20px' }}>
          <label className={styles.checkboxContainer}>
            <input
              type="checkbox"
              className={styles.checkbox}
              checked={isMember}
              onChange={(e) => handleMemberChange(e.target.checked)}
            />
            Member
          </label>
          <label className={styles.checkboxContainer}>
            <input
              type="checkbox"
              className={styles.checkbox}
              checked={isStudent}
              onChange={(e) => handleStudentChange(e.target.checked)}
            />
            Student
          </label>
        </div>
      )}

      {/* Row for Time In and Client Assist */}
      <div className={styles.row}>
        <div className={styles.field}>
          <label className={styles.label}>Time In</label>
          <input
            type="text"
            className={styles.input}
            value={timeIn}
            onChange={(e) => setTimeIn(e.target.value)}
            required
          />
        </div>

        <div className={styles.field}>
          <label className={styles.label}>Client Assist (Trainer)</label>
          <select
            className={styles.select}
            value={clientAssist}
            onChange={(e) => setClientAssist(e.target.value as any)}
          >
            <option value="NONE">None</option>
            <option value="JAYSON">Jayson</option>
            <option value="VINCENT">Vincent</option>
            <option value="TIN">Tin</option>
          </select>
        </div>
      </div>

      {/* Row for Payment Method and Custom Amount */}
      <div className={styles.row}>
        <div className={styles.field}>
          <label className={styles.label}>Payment Method</label>
          <select
            className={styles.select}
            value={paymentMethod}
            onChange={(e) => setPaymentMethod(e.target.value as any)}
          >
            <option value="cash">Cash (Over counter)</option>
            <option value="gcash">GCash (E-wallet)</option>
          </select>
        </div>

        <div className={styles.field}>
          <label className={styles.label}>Amount Paid (₱)</label>
          <input
            type="number"
            className={styles.input}
            value={amountPaid}
            onChange={(e) => setAmountPaid(Math.max(0, parseInt(e.target.value) || 0))}
            required
          />
        </div>
      </div>

      {/* Rate telemetry review */}
      <div className={styles.rateDisplay}>
        <span>Configured Rate Applied:</span>
        <span className={styles.rateValue}>₱{amountPaid.toLocaleString()}</span>
      </div>

      {/* Coaching Session Deduction Checkbox (Registered clients only) */}
      {selectedClientId !== "walk-in" && (
        <div style={{ display: "flex", flexDirection: "column", gap: "6px", marginTop: "12px", padding: "12px", background: "rgba(124, 58, 237, 0.05)", borderRadius: "10px", border: "1px solid rgba(124, 58, 237, 0.15)" }}>
          <label className={styles.checkboxContainer} style={{ margin: 0, display: "flex", alignItems: "center", gap: "10px", cursor: "pointer" }}>
            <input
              type="checkbox"
              className={styles.checkbox}
              checked={deductCoaching}
              onChange={(e) => setDeductCoaching(e.target.checked)}
              disabled={(() => {
                const client = clients.find((c) => c.id === Number(selectedClientId));
                return !client || client.pt_sessions_remaining <= 0;
              })()}
            />
            <span style={{ fontWeight: 600, fontSize: "0.85rem", color: "var(--foreground)" }}>
              Deduct Coaching Session
            </span>
          </label>
          <div style={{ fontSize: "0.78rem", color: "var(--foreground-muted)", marginLeft: "26px" }}>
            {(() => {
              const client = clients.find((c) => c.id === Number(selectedClientId));
              const remaining = client?.pt_sessions_remaining || 0;
              return remaining > 0 
                ? `Client has ${remaining} coaching session(s) remaining.` 
                : "Client has 0 remaining coaching sessions. Cannot deduct.";
            })()}
          </div>
        </div>
      )}

      <div style={{ display: "flex", flexDirection: "column", gap: "6px", marginTop: "12px" }}>
        <label className={styles.label}>Coaching Add-on</label>
        <select style={{ padding: "10px", borderRadius: "8px", border: "1px solid var(--glass-border)", background: "rgba(255,255,255,0.03)", color: "var(--foreground)", outline: "none", width: "100%", appearance: "none" }} value={ptPackage} onChange={(e) => setPtPackage(e.target.value as any)}>
          <option value="none" style={{ background: "var(--bg-elevated)", color: "var(--foreground)" }}>None</option>
          <option value="standard" style={{ background: "var(--bg-elevated)", color: "var(--foreground)" }}>Standard PT Session (+₱{(rates?.rate_pt_fee || 0).toLocaleString()})</option>
          <option value="12_sessions" style={{ background: "var(--bg-elevated)", color: "var(--foreground)" }}>12 PT Sessions (+₱{(rates?.rate_12_sessions_fee || 0).toLocaleString()})</option>
          <option value="boxing" style={{ background: "var(--bg-elevated)", color: "var(--foreground)" }}>Boxing (+₱{(rates?.rate_boxing_fee || 0).toLocaleString()})</option>
        </select>
      </div>

      {ptPackage !== "none" && (
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "0 4px", marginTop: "10px" }}>
          <span style={{ fontSize: "0.85rem", color: "var(--foreground-muted)", fontWeight: 600 }}>Grand Total:</span>
          <span style={{ fontSize: "1.1rem", color: "var(--accent-fuchsia)", fontWeight: 700 }}>
            ₱{(Number(amountPaid) + (ptPackage === "standard" ? (rates?.rate_pt_fee || 0) : ptPackage === "12_sessions" ? (rates?.rate_12_sessions_fee || 0) : ptPackage === "boxing" ? (rates?.rate_boxing_fee || 0) : 0)).toLocaleString()}
          </span>
        </div>
      )}

      <div style={{ display: "flex", gap: "10px", width: "100%" }}>
        <button className={styles.button} type="submit" disabled={loading} style={{ width: "100%", margin: 0 }}>
          <Plus size={18} />
          {loading ? "Logging check-in..." : "Check In Client"}
        </button>
      </div>
    </form>
  );
}
