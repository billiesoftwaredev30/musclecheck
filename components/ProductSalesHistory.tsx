// components/ProductSalesHistory.tsx
"use client";

import React, { useState } from "react";
import styles from "./SessionHistory.module.css";
import { ProductSaleResponse, deleteProductSale } from "@/lib/api";
import { Trash2, ShoppingCart, Loader2 } from "lucide-react";
import ConfirmModal from "./ConfirmModal";
import { useToast } from "./Toast";

interface ProductSalesHistoryProps {
  sales: ProductSaleResponse[];
  onDelete: () => void;
  loading: boolean;
}

export default function ProductSalesHistory({ sales, onDelete, loading }: ProductSalesHistoryProps) {
  const toast = useToast();
  const [deleteModal, setDeleteModal] = useState<{ open: boolean; id: number; name: string }>({
    open: false, id: 0, name: ""
  });
  const [loadingDelete, setLoadingDelete] = useState(false);

  const confirmDelete = async () => {
    setLoadingDelete(true);
    try {
      await deleteProductSale(deleteModal.id);
      toast.success("Product sale deleted");
      onDelete();
    } catch (err: any) {
      toast.error("Delete failed", err.message);
    } finally {
      setLoadingDelete(false);
      setDeleteModal({ open: false, id: 0, name: "" });
    }
  };

  if (loading) {
    return (
      <div style={{ display: "flex", justifyContent: "center", padding: "40px" }}>
        <Loader2 className="spin" size={24} style={{ color: "var(--accent-purple)" }} />
      </div>
    );
  }

  if (sales.length === 0) {
    return (
      <div style={{ padding: "48px 16px", textAlign: "center", color: "var(--foreground-muted)", display: "flex", flexDirection: "column", alignItems: "center", gap: "10px" }}>
        <ShoppingCart size={28} style={{ opacity: 0.3 }} />
        <span style={{ fontWeight: 600, fontSize: "0.9rem" }}>No product sales found</span>
      </div>
    );
  }

  return (
    <div className={styles.tableWrapper}>
      <table className={styles.table}>
        <thead>
          <tr>
            <th className={styles.th}>Product</th>
            <th className={styles.th}>Qty</th>
            <th className={styles.th}>Amount</th>
            <th className={styles.th}>Payment</th>
            <th className={styles.th}>Time</th>
            <th className={styles.th} style={{ textAlign: "right" }}>Actions</th>
          </tr>
        </thead>
        <tbody>
          {sales.map((sale) => (
            <tr key={sale.id} className={styles.tr}>
              <td className={styles.td} style={{ fontWeight: 600 }}>{sale.product_name}</td>
              <td className={styles.td}>{sale.quantity}</td>
              <td className={styles.td} style={{ fontWeight: 700, color: "var(--accent-fuchsia)" }}>
                ₱{sale.amount_paid.toLocaleString()}
              </td>
              <td className={styles.td}>
                <span className={styles.badgeMember}>
                  {sale.payment_method.toUpperCase()}
                </span>
              </td>
              <td className={styles.td} style={{ color: "var(--foreground-muted)", fontSize: "0.8rem" }}>
                {sale.date} {sale.time_sold}
              </td>
              <td className={styles.td}>
                <div style={{ display: "flex", justifyContent: "flex-end", gap: "6px" }}>
                  <button 
                    className={styles.btnDanger}
                    onClick={() => setDeleteModal({ open: true, id: sale.id, name: sale.product_name })}
                  >
                    <Trash2 size={12} />
                  </button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      <ConfirmModal
        open={deleteModal.open}
        variant="danger"
        title="Delete Sale"
        description={`Are you sure you want to delete this sale for ${deleteModal.name}? This will remove it from the revenue calculation.`}
        confirmLabel="Delete Sale"
        loading={loadingDelete}
        onConfirm={confirmDelete}
        onCancel={() => setDeleteModal({ open: false, id: 0, name: "" })}
      />
    </div>
  );
}
