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
  const productRevenue = metrics.product_revenue || 0;
  const totalSub = monthly + annual;
  const cash = metrics.cash_revenue || 0;
  const gcash = metrics.gcash_revenue || 0;
  const totalAmount = metrics.total_revenue || (dailySession + totalSub + ptRevenue + productRevenue);
  
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

        <div id="printable-report" className={styles.reportContainer}>
          <div className={styles.reportHeader}>
            <h4>Daily Sales Report</h4>
            <span className={styles.dateBadge}>{formattedDate}</span>
          </div>
          
          <div className={styles.metricsGrid}>
            <div className={styles.metricCard}>
              <span className={styles.metricLabel}>Daily Session</span>
              <span className={styles.metricValue}>₱{dailySession.toLocaleString()}</span>
            </div>
            <div className={styles.metricCard}>
              <span className={styles.metricLabel}>PT Revenue</span>
              <span className={styles.metricValue}>₱{ptRevenue.toLocaleString()}</span>
            </div>
            <div className={styles.metricCard}>
              <span className={styles.metricLabel}>Monthly Subs</span>
              <span className={styles.metricValue}>₱{monthly > 0 ? monthly.toLocaleString() : "0"}</span>
            </div>
            <div className={styles.metricCard}>
              <span className={styles.metricLabel}>Annual Subs</span>
              <span className={styles.metricValue}>₱{annual > 0 ? annual.toLocaleString() : "0"}</span>
            </div>
            <div className={styles.metricCard}>
              <span className={styles.metricLabel}>Product Sales</span>
              <span className={styles.metricValue}>₱{productRevenue.toLocaleString()}</span>
            </div>
          </div>

          <div className={styles.totalSection}>
            <div className={styles.totalRow}>
              <span>Subtotal Amount</span>
              <span>₱{totalAmount.toLocaleString()}</span>
            </div>
          </div>
          
          <div className={styles.paymentMethods}>
            <h5>Payment Breakdown</h5>
            <div className={styles.paymentRow}>
              <span>Cash</span>
              <span>₱{cash.toLocaleString()}</span>
            </div>
            <div className={styles.paymentRow}>
              <span>GCash</span>
              <span>₱{gcash.toLocaleString()}</span>
            </div>
          </div>

          <div className={styles.grandTotalSection}>
            <div className={styles.totalRow}>
              <span>Total Amount</span>
              <span className={styles.highlight}>₱{totalAmount.toLocaleString()}</span>
            </div>
          </div>

          {metrics.daily_sessions && metrics.daily_sessions.length > 0 && (
            <div className={styles.tableContainer}>
              <h5 className={styles.tableTitle}>Itemized: Daily Sessions</h5>
              <table className={styles.reportTable}>
                <thead>
                  <tr>
                    <th>Client Name</th>
                    <th>Time</th>
                    <th>Payment</th>
                    <th className={styles.rightAlign}>Amount</th>
                  </tr>
                </thead>
                <tbody>
                  {metrics.daily_sessions.map(session => (
                    <tr key={session.id}>
                      <td>{session.client_name}</td>
                      <td>{session.time_in}</td>
                      <td>{session.payment_method.toUpperCase()}</td>
                      <td className={styles.rightAlign}>₱{session.amount_paid.toLocaleString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {metrics.product_sales && metrics.product_sales.length > 0 && (
            <div className={styles.tableContainer}>
              <h5 className={styles.tableTitle}>Itemized: Food & Items</h5>
              <table className={styles.reportTable}>
                <thead>
                  <tr>
                    <th>Item</th>
                    <th>Qty</th>
                    <th>Payment</th>
                    <th className={styles.rightAlign}>Amount</th>
                  </tr>
                </thead>
                <tbody>
                  {metrics.product_sales.map(sale => (
                    <tr key={sale.id}>
                      <td>{sale.product_name}</td>
                      <td>{sale.quantity}</td>
                      <td>{sale.payment_method.toUpperCase()}</td>
                      <td className={styles.rightAlign}>₱{sale.amount_paid.toLocaleString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          <div className={styles.footerSection}>
             <div className={styles.footerRow}>
               <span>Cashout</span>
               <span className={styles.line}></span>
             </div>
             <div className={styles.footerRow}>
               <span>Grand Total</span>
               <span className={styles.line}></span>
             </div>
             <div className={styles.footerRow}>
               <span>Remarks</span>
               <span className={styles.line}></span>
             </div>
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
