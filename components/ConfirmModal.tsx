// components/ConfirmModal.tsx
"use client";

import React, { useEffect, useCallback } from "react";
import { createPortal } from "react-dom";
import { AlertTriangle, Trash2 } from "lucide-react";
import styles from "./ConfirmModal.module.css";

interface ConfirmModalProps {
  open: boolean;
  title: string;
  description: React.ReactNode;
  confirmLabel?: string;
  cancelLabel?: string;
  variant?: "danger" | "warning";
  loading?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

export default function ConfirmModal({
  open,
  title,
  description,
  confirmLabel = "Delete",
  cancelLabel = "Cancel",
  variant = "danger",
  loading = false,
  onConfirm,
  onCancel,
}: ConfirmModalProps) {
  // Close on Escape key
  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (e.key === "Escape" && !loading) onCancel();
    },
    [onCancel, loading]
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

  if (!open) return null;

  const Icon = variant === "danger" ? Trash2 : AlertTriangle;

  const modal = (
    <div
      className={styles.overlay}
      onClick={(e) => {
        if (e.target === e.currentTarget && !loading) onCancel();
      }}
    >
      <div className={styles.modal} role="alertdialog" aria-modal="true" aria-labelledby="confirm-title">
        <div className={`${styles.iconWrapper} ${variant === "danger" ? styles.iconDanger : styles.iconWarning}`}>
          <Icon size={22} />
        </div>

        <div className={styles.body}>
          <h3 className={styles.title} id="confirm-title">{title}</h3>
          <p className={styles.description}>{description}</p>
        </div>

        <div className={styles.actions}>
          <button className={styles.btnCancel} onClick={onCancel} disabled={loading}>
            {cancelLabel}
          </button>
          <button
            className={`${styles.btnConfirm} ${variant === "danger" ? styles.btnDanger : styles.btnWarning}`}
            onClick={onConfirm}
            disabled={loading}
          >
            {loading ? "Deleting..." : confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );

  return createPortal(modal, document.body);
}
