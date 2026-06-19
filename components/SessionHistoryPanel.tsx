// components/SessionHistoryPanel.tsx
"use client";

import React, { useState, useEffect, useCallback } from "react";
import GlassCard from "./GlassCard";
import SessionHistory from "./SessionHistory";
import { useToast } from "./Toast";
import { fetchSessionHistory, deleteSession, DailySessionResponse, fetchProductSalesHistory, ProductSaleResponse } from "@/lib/api";
import { CalendarDays, Filter, RefreshCw, Activity, Download, Dumbbell, ShoppingCart } from "lucide-react";
import histStyles from "./SessionHistory.module.css";
import ProductSalesHistory from "./ProductSalesHistory";

export default function SessionHistoryPanel() {
  const [history, setHistory] = useState<DailySessionResponse[]>([]);
  const [productSales, setProductSales] = useState<ProductSaleResponse[]>([]);
  const [viewType, setViewType] = useState<"sessions" | "products">("sessions");
  const [filterDate, setFilterDate] = useState("");
  const [loading, setLoading] = useState(true);
  const [loadingDelete, setLoadingDelete] = useState(false);
  const toast = useToast();

  const loadHistory = useCallback(async (date?: string) => {
    setLoading(true);
    try {
      if (viewType === "sessions") {
        const data = await fetchSessionHistory(date);
        setHistory(data);
      } else {
        const data = await fetchProductSalesHistory(date);
        setProductSales(data);
      }
    } catch (err: any) {
      toast.error("Failed to load history", err.message);
    } finally {
      setLoading(false);
    }
  }, [toast, viewType]);

  useEffect(() => {
    loadHistory(filterDate || undefined);
  }, [loadHistory, filterDate]);

  const handleDelete = async (id: number) => {
    setLoadingDelete(true);
    try {
      await deleteSession(id);
      toast.success("Session deleted");
      loadHistory(filterDate || undefined);
    } catch (err: any) {
      toast.error("Delete failed", err.message);
    } finally {
      setLoadingDelete(false);
    }
  };

  const handleExportCSV = () => {
    if (viewType === "products") {
      if (productSales.length === 0) {
        toast.warning("No product data to export");
        return;
      }
      const headers = ["ID", "Product", "Quantity", "Date", "Time", "Amount Paid", "Payment Method"];
      const rows = productSales.map(sale => [
        sale.id,
        `"${sale.product_name}"`,
        sale.quantity,
        sale.date,
        `"${sale.time_sold}"`,
        sale.amount_paid,
        sale.payment_method
      ]);
      const csvContent = [headers.join(","), ...rows.map(r => r.join(","))].join("\n");
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.setAttribute("href", url);
      link.setAttribute("download", `musclecheck_products_${filterDate || "all"}.csv`);
      link.style.visibility = "hidden";
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      toast.success("CSV exported successfully");
      return;
    }

    if (history.length === 0) {
      toast.warning("No data to export");
      return;
    }

    const headers = ["ID", "Client Name", "Date", "Time In", "Amount Paid", "Payment Method", "Member", "Trainer Assist"];
    const rows = history.map(session => [
      session.id,
      `"${session.client_name}"`,
      session.date,
      `"${session.time_in}"`,
      session.amount_paid,
      session.payment_method,
      session.is_member ? "Yes" : "No",
      session.client_assist
    ]);

    const csvContent = [
      headers.join(","),
      ...rows.map(r => r.join(","))
    ].join("\n");

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `musclecheck_history_${filterDate || "all"}.csv`);
    link.style.visibility = "hidden";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success("CSV exported successfully");
  };

  // Date presets
  const setDatePreset = (preset: "today" | "week" | "month" | "all") => {
    if (preset === "all") {
      setFilterDate("");
      return;
    }
    const now = new Date();
    if (preset === "today") {
      setFilterDate(now.toISOString().split("T")[0]);
    } else if (preset === "week") {
      const weekAgo = new Date(now);
      weekAgo.setDate(weekAgo.getDate() - 7);
      setFilterDate(weekAgo.toISOString().split("T")[0]);
    } else if (preset === "month") {
      const monthAgo = new Date(now);
      monthAgo.setMonth(monthAgo.getMonth() - 1);
      setFilterDate(monthAgo.toISOString().split("T")[0]);
    }
  };

  const activePreset = (() => {
    if (!filterDate) return "all";
    const today = new Date().toISOString().split("T")[0];
    if (filterDate === today) return "today";
    return "custom";
  })();

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "20px", animation: "fadeInUp 0.5s var(--ease-out-expo) both" }}>
      <GlassCard>
        <div style={{ display: "flex", flexWrap: "wrap", justifyContent: "space-between", alignItems: "center", gap: "16px", marginBottom: "20px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
            <h2 style={{ display: "flex", alignItems: "center", gap: "8px", fontSize: "1.15rem", fontWeight: 700 }}>
              <CalendarDays size={18} style={{ color: "var(--accent-fuchsia)" }} />
              History
            </h2>
            
            <div style={{ display: "flex", gap: "4px", background: "rgba(0,0,0,0.03)", padding: "4px", borderRadius: "var(--radius-sm)", border: "1px solid var(--glass-border)" }}>
              <button
                onClick={() => setViewType("sessions")}
                style={{
                  display: "flex", alignItems: "center", gap: "6px",
                  padding: "6px 12px", background: viewType === "sessions" ? "var(--glass-bg)" : "transparent",
                  color: viewType === "sessions" ? "var(--foreground)" : "var(--foreground-muted)",
                  border: viewType === "sessions" ? "1px solid var(--accent-cyan)" : "1px solid transparent",
                  borderRadius: "var(--radius-xs)", cursor: "pointer", fontSize: "0.82rem", fontWeight: 600,
                  transition: "var(--transition-fast)"
                }}
              >
                <Dumbbell size={14} /> Sessions
              </button>
              <button
                onClick={() => setViewType("products")}
                style={{
                  display: "flex", alignItems: "center", gap: "6px",
                  padding: "6px 12px", background: viewType === "products" ? "var(--glass-bg)" : "transparent",
                  color: viewType === "products" ? "var(--foreground)" : "var(--foreground-muted)",
                  border: viewType === "products" ? "1px solid var(--accent-purple)" : "1px solid transparent",
                  borderRadius: "var(--radius-xs)", cursor: "pointer", fontSize: "0.82rem", fontWeight: 600,
                  transition: "var(--transition-fast)"
                }}
              >
                <ShoppingCart size={14} /> Products
              </button>
            </div>

            {!loading && (
              <span style={{
                fontSize: "0.72rem",
                fontWeight: 700,
                background: "rgba(245, 158, 11, 0.08)",
                color: "var(--accent-purple)",
                padding: "3px 10px",
                borderRadius: "999px",
                border: "1px solid rgba(245, 158, 11, 0.12)",
              }}>
                {viewType === "sessions" ? history.length : productSales.length} record(s)
              </span>
            )}
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: "8px", flexWrap: "wrap" }}>
            {/* Date Presets */}
            {["today", "all"].map((preset) => (
              <button
                key={preset}
                onClick={() => setDatePreset(preset as any)}
                style={{
                  padding: "6px 12px",
                  background: activePreset === preset ? "var(--accent-purple)" : "rgba(0, 0, 0, 0.02)",
                  color: activePreset === preset ? "white" : "var(--foreground-muted)",
                  border: activePreset === preset ? "none" : "1px solid var(--glass-border)",
                  borderRadius: "var(--radius-xs)",
                  cursor: "pointer",
                  fontSize: "0.78rem",
                  fontWeight: 600,
                  fontFamily: "var(--font-family)",
                  transition: "var(--transition-fast)",
                  textTransform: "capitalize",
                }}
              >
                {preset}
              </button>
            ))}

            <div style={{ display: "flex", alignItems: "center", gap: "8px", background: "rgba(0,0,0,0.02)", border: "1px solid var(--glass-border)", padding: "5px 10px", borderRadius: "var(--radius-xs)" }}>
              <Filter size={13} style={{ color: "var(--foreground-muted)" }} />
              <input
                type="date"
                value={filterDate}
                onChange={(e) => setFilterDate(e.target.value)}
                style={{ background: "transparent", border: "none", color: "var(--foreground)", outline: "none", fontFamily: "var(--font-family)", fontSize: "0.82rem" }}
              />
              {filterDate && (
                <button
                  onClick={() => setFilterDate("")}
                  style={{ background: "transparent", border: "none", color: "var(--error-light)", cursor: "pointer", fontSize: "0.72rem", fontWeight: 700 }}
                >
                  ✕
                </button>
              )}
            </div>

            <button
              onClick={() => loadHistory(filterDate || undefined)}
              disabled={loading}
              className={histStyles.paginationBtn}
              style={{ display: "flex", alignItems: "center", gap: "6px" }}
            >
              <RefreshCw size={13} /> Refresh
            </button>

            <button
              onClick={handleExportCSV}
              disabled={loading || history.length === 0}
              className={histStyles.btnPrimary}
            >
              <Download size={13} /> Export CSV
            </button>
          </div>
        </div>

        {loading ? (
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "48px", gap: "12px", color: "var(--foreground-muted)" }}>
            <Activity size={24} style={{ color: "var(--accent-purple)", animation: "spinSlow 0.8s linear infinite" }} />
            <p style={{ fontSize: "0.88rem" }}>Loading history...</p>
          </div>
        ) : viewType === "sessions" ? (
          <SessionHistory
            sessions={history}
            onDelete={handleDelete}
            onBulkDelete={() => {
              toast.success("Selected sessions deleted");
              loadHistory(filterDate || undefined);
            }}
            loadingDelete={loadingDelete}
          />
        ) : (
          <ProductSalesHistory
            sales={productSales}
            onDelete={() => loadHistory(filterDate || undefined)}
            loading={loading}
          />
        )}
      </GlassCard>
    </div>
  );
}
