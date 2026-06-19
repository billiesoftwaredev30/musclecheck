"use client";

import React, { useState, useEffect, useCallback } from "react";
import GlassCard from "./GlassCard";
import { useToast } from "./Toast";
import { fetchTrainerPayroll, TrainerPayrollMetrics } from "@/lib/api";
import { Activity, Banknote, CalendarDays, Wallet } from "lucide-react";

export default function TrainerPayrollPanel() {
  const [metrics, setMetrics] = useState<TrainerPayrollMetrics[]>([]);
  const [loading, setLoading] = useState(true);
  const toast = useToast();

  const [dateRange, setDateRange] = useState<"today" | "week" | "month" | "custom">("today");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");

  const applyPreset = useCallback((preset: "today" | "week" | "month") => {
    const today = new Date();
    const endStr = today.toISOString().split("T")[0];
    let startStr = endStr;

    if (preset === "week") {
      const weekAgo = new Date();
      weekAgo.setDate(today.getDate() - 7);
      startStr = weekAgo.toISOString().split("T")[0];
    } else if (preset === "month") {
      const monthAgo = new Date();
      monthAgo.setMonth(today.getMonth() - 1);
      startStr = monthAgo.toISOString().split("T")[0];
    }

    setStartDate(startStr);
    setEndDate(endStr);
    setDateRange(preset);
  }, []);

  useEffect(() => {
    // Initial load: Today
    applyPreset("today");
  }, [applyPreset]);

  useEffect(() => {
    if (startDate && endDate) {
      loadPayroll();
    }
  }, [startDate, endDate]);

  const loadPayroll = async () => {
    setLoading(true);
    try {
      const data = await fetchTrainerPayroll(startDate, endDate);
      setMetrics(data);
    } catch (err: any) {
      toast.error("Failed to load payroll", err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleCustomDateChange = () => {
    setDateRange("custom");
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "20px", animation: "fadeInUp 0.5s var(--ease-out-expo) both" }}>
      <GlassCard>
        <div style={{ display: "flex", flexWrap: "wrap", justifyContent: "space-between", alignItems: "center", gap: "16px", marginBottom: "20px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
            <h2 style={{ display: "flex", alignItems: "center", gap: "8px", fontSize: "1.15rem", fontWeight: 700 }}>
              <Banknote size={18} style={{ color: "var(--accent-fuchsia)" }} />
              Trainer Payroll
            </h2>
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: "8px", flexWrap: "wrap" }}>
            {["today", "week", "month"].map((preset) => (
              <button
                key={preset}
                onClick={() => applyPreset(preset as any)}
                style={{
                  padding: "6px 12px",
                  background: dateRange === preset ? "var(--accent-purple)" : "rgba(0, 0, 0, 0.02)",
                  color: dateRange === preset ? "white" : "var(--foreground-muted)",
                  border: dateRange === preset ? "none" : "1px solid var(--glass-border)",
                  borderRadius: "var(--radius-xs)",
                  cursor: "pointer",
                  fontSize: "0.78rem",
                  fontWeight: 600,
                  fontFamily: "var(--font-family)",
                  transition: "var(--transition-fast)",
                  textTransform: "capitalize",
                }}
              >
                {preset === "week" ? "Last 7 Days" : preset === "month" ? "Last 30 Days" : "Today"}
              </button>
            ))}

            <div style={{ display: "flex", alignItems: "center", gap: "8px", background: "rgba(0,0,0,0.02)", border: "1px solid var(--glass-border)", padding: "5px 10px", borderRadius: "var(--radius-xs)" }}>
              <CalendarDays size={13} style={{ color: "var(--foreground-muted)" }} />
              <input
                type="date"
                value={startDate}
                onChange={(e) => {
                  setStartDate(e.target.value);
                  handleCustomDateChange();
                }}
                style={{ background: "transparent", border: "none", color: "var(--foreground)", outline: "none", fontFamily: "var(--font-family)", fontSize: "0.82rem" }}
              />
              <span style={{ color: "var(--foreground-muted)" }}>to</span>
              <input
                type="date"
                value={endDate}
                onChange={(e) => {
                  setEndDate(e.target.value);
                  handleCustomDateChange();
                }}
                style={{ background: "transparent", border: "none", color: "var(--foreground)", outline: "none", fontFamily: "var(--font-family)", fontSize: "0.82rem" }}
              />
            </div>
          </div>
        </div>

        {loading ? (
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "48px", gap: "12px", color: "var(--foreground-muted)" }}>
            <Activity size={24} style={{ color: "var(--accent-purple)", animation: "spinSlow 0.8s linear infinite" }} />
            <p style={{ fontSize: "0.88rem" }}>Calculating payroll...</p>
          </div>
        ) : (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: "20px" }}>
            {metrics.map((trainer) => (
              <div 
                key={trainer.trainer_name}
                style={{ 
                  background: "rgba(0,0,0,0.02)", 
                  border: "1px solid var(--glass-border)", 
                  borderRadius: "16px", 
                  padding: "20px",
                  display: "flex",
                  flexDirection: "column",
                  gap: "12px"
                }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                  <div style={{ 
                    width: "48px", height: "48px", borderRadius: "50%", 
                    background: "linear-gradient(135deg, #7c3aed, #a855f7)", 
                    display: "flex", alignItems: "center", justifyContent: "center",
                    color: "white", fontSize: "1.2rem", fontWeight: 800
                  }}>
                    {trainer.trainer_name.charAt(0)}
                  </div>
                  <div>
                    <h3 style={{ margin: 0, fontSize: "1.2rem", fontWeight: 800 }}>{trainer.trainer_name}</h3>
                    <span style={{ fontSize: "0.85rem", color: "var(--foreground-muted)", fontWeight: 600 }}>Personal Trainer</span>
                  </div>
                </div>

                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: "10px", padding: "12px", background: "var(--bg-elevated)", borderRadius: "12px" }}>
                  <div style={{ display: "flex", flexDirection: "column", gap: "2px" }}>
                    <span style={{ fontSize: "0.75rem", color: "var(--foreground-muted)", textTransform: "uppercase", letterSpacing: "0.05em", fontWeight: 700 }}>Total Assists</span>
                    <span style={{ fontSize: "1.2rem", fontWeight: 800 }}>{trainer.total_assists}</span>
                  </div>
                  <div style={{ display: "flex", flexDirection: "column", gap: "2px", alignItems: "flex-end" }}>
                    <span style={{ fontSize: "0.75rem", color: "var(--foreground-muted)", textTransform: "uppercase", letterSpacing: "0.05em", fontWeight: 700 }}>Commission</span>
                    <span style={{ fontSize: "1.4rem", fontWeight: 800, color: "var(--accent-fuchsia)", display: "flex", alignItems: "center", gap: "4px" }}>
                      <Wallet size={16} />
                      ₱{trainer.total_commission.toLocaleString()}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </GlassCard>
    </div>
  );
}
