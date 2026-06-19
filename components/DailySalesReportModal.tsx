// components/DailySalesReportModal.tsx
"use client";

import React, { useEffect } from "react";
import { createPortal } from "react-dom";
import styles from "./DailySalesReportModal.module.css";
import { Printer, X, Receipt } from "lucide-react";
import { DashboardMetrics } from "@/lib/api";

interface DailySalesReportModalProps {
  open: boolean;
  onClose: () => void;
  metrics: DashboardMetrics | null;
}

export default function DailySalesReportModal({ open, onClose, metrics }: DailySalesReportModalProps) {
  useEffect(() => {
    if (open) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
  }, [open]);

  if (!open || !metrics) return null;

  const handlePrint = () => {
    window.print();
  };

  // Safe defaults
  const dailySession = metrics.daily_session_revenue || 0;
  const monthly = (metrics.subscription_revenue_1m || 0) + (metrics.subscription_revenue_6m || 0);
  const annual = metrics.subscription_revenue_12m || 0;
  const ptRevenue = metrics.pt_revenue || 0;
  const totalSub = monthly + annual;
  const cash = metrics.cash_revenue || 0;
  const gcash = metrics.gcash_revenue || 0;
  const totalAmount = dailySession + totalSub + ptRevenue;
  
  // Format current date "June 18, 2026"
  const formattedDate = new Intl.DateTimeFormat("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric"
  }).format(new Date());

  const modal = (
    <div className={styles.overlay} onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <div className={styles.modal}>
        <div className={styles.header}>
          <h3 className={styles.title}>
            <Receipt size={18} style={{ color: "var(--accent-fuchsia)" }} />
            Print Daily Sales Report
          </h3>
          <button className={styles.closeButton} onClick={onClose}>
            <X size={20} />
          </button>
        </div>

        <div id="printable-receipt" className={styles.receiptContainer}>
          <div className={styles.receiptHeader}>DAILY SALES REPORT</div>
          
          <div className={styles.receiptRow}>
            <span>DATE</span><span>:</span><span>{formattedDate}</span>
          </div>
          
          <div className={styles.receiptRow}>
            <span>DAILY SESSION</span><span>:</span><span>{dailySession.toLocaleString()}</span>
          </div>
          <div className={styles.receiptRow}>
            <span>WEEKLY</span><span>:</span><span></span>
          </div>
          <div className={styles.receiptRow}>
            <span>MONTHLY</span><span>:</span><span>{monthly > 0 ? monthly.toLocaleString() : ""}</span>
          </div>
          <div className={styles.receiptRow}>
            <span>ANNUAL</span><span>:</span><span>{annual > 0 ? annual.toLocaleString() : ""}</span>
          </div>
          <div className={styles.receiptRow}>
            <span>PT</span><span>:</span><span>{ptRevenue > 0 ? ptRevenue.toLocaleString() : ""}</span>
          </div>
          
          <div className={styles.receiptRow} style={{ marginTop: "8px" }}>
            <span>TOTAL AMOUNT</span><span>:</span><span>{totalAmount.toLocaleString()}</span>
          </div>
          
          <div className={styles.divider} />
          
          <div className={`${styles.receiptRow} ${styles.indented}`}>
            <span>CASH</span><span>:</span><span>{cash.toLocaleString()}</span>
          </div>
          <div className={`${styles.receiptRow} ${styles.indented}`}>
            <span>GCASH</span><span>:</span><span>{gcash.toLocaleString()}</span>
          </div>
          
          <div className={`${styles.receiptRow} ${styles.indented}`} style={{ marginTop: "8px" }}>
            <span>TOTAL AMOUNT</span><span>:</span><span>{totalAmount.toLocaleString()}</span>
          </div>

          <div className={styles.divider} />

          <div className={styles.receiptRow}>
            <span>CASHOUT</span><span>:</span><span></span>
          </div>
          <div className={styles.receiptRow}>
            <span>GRAND TOTAL</span><span>:</span><span></span>
          </div>
          
          <div style={{ marginTop: "16px", fontSize: "0.95rem" }}>
            REMARKS: __________________
          </div>
        </div>

        <div className={styles.actions}>
          <button className={styles.printButton} onClick={handlePrint}>
            <Printer size={16} />
            Print Report
          </button>
        </div>
      </div>
    </div>
  );

  return createPortal(modal, document.body);
}
