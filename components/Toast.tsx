// components/Toast.tsx
"use client";

import React, { useState, useEffect, useCallback, createContext, useContext } from "react";
import { createPortal } from "react-dom";
import styles from "./Toast.module.css";
import { CheckCircle2, AlertTriangle, XCircle, Info, X } from "lucide-react";

type ToastVariant = "success" | "error" | "warning" | "info";

interface ToastItem {
  id: string;
  variant: ToastVariant;
  title: string;
  message?: string;
  duration?: number;
  exiting?: boolean;
}

interface ToastContextType {
  addToast: (toast: Omit<ToastItem, "id">) => void;
  success: (title: string, message?: string) => void;
  error: (title: string, message?: string) => void;
  warning: (title: string, message?: string) => void;
  info: (title: string, message?: string) => void;
}

const ToastContext = createContext<ToastContextType | null>(null);

export function useToast(): ToastContextType {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error("useToast must be used within a ToastProvider");
  }
  return context;
}

const iconMap: Record<ToastVariant, React.ReactNode> = {
  success: <CheckCircle2 size={16} />,
  error: <XCircle size={16} />,
  warning: <AlertTriangle size={16} />,
  info: <Info size={16} />,
};

const iconStyleMap: Record<ToastVariant, string> = {
  success: styles.iconSuccess,
  error: styles.iconError,
  warning: styles.iconWarning,
  info: styles.iconInfo,
};

const progressStyleMap: Record<ToastVariant, string> = {
  success: styles.progressSuccess,
  error: styles.progressError,
  warning: styles.progressWarning,
  info: styles.progressInfo,
};

function ToastItemComponent({ toast, onDismiss }: { toast: ToastItem; onDismiss: (id: string) => void }) {
  const duration = toast.duration || 4000;

  useEffect(() => {
    const timer = setTimeout(() => {
      onDismiss(toast.id);
    }, duration);
    return () => clearTimeout(timer);
  }, [toast.id, duration, onDismiss]);

  return (
    <div className={`${styles.toast} ${toast.exiting ? styles.exiting : ""}`} role="alert">
      <div className={iconStyleMap[toast.variant]}>
        {iconMap[toast.variant]}
      </div>
      <div className={styles.content}>
        <span className={styles.title}>{toast.title}</span>
        {toast.message && <span className={styles.message}>{toast.message}</span>}
      </div>
      <button className={styles.closeBtn} onClick={() => onDismiss(toast.id)} aria-label="Close notification">
        <X size={14} />
      </button>
      <div
        className={progressStyleMap[toast.variant]}
        style={{ animationDuration: `${duration}ms` }}
      />
    </div>
  );
}

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<ToastItem[]>([]);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const addToast = useCallback((toast: Omit<ToastItem, "id">) => {
    const id = `toast-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
    setToasts((prev) => [...prev.slice(-4), { ...toast, id }]); // Keep max 5 toasts
  }, []);

  const dismissToast = useCallback((id: string) => {
    setToasts((prev) =>
      prev.map((t) => (t.id === id ? { ...t, exiting: true } : t))
    );
    // Remove after exit animation
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 300);
  }, []);

  const contextValue: ToastContextType = {
    addToast,
    success: (title, message) => addToast({ variant: "success", title, message }),
    error: (title, message) => addToast({ variant: "error", title, message }),
    warning: (title, message) => addToast({ variant: "warning", title, message }),
    info: (title, message) => addToast({ variant: "info", title, message }),
  };

  return (
    <ToastContext.Provider value={contextValue}>
      {children}
      {mounted &&
        createPortal(
          <div className="toast-container" aria-live="polite">
            {toasts.map((toast) => (
              <ToastItemComponent key={toast.id} toast={toast} onDismiss={dismissToast} />
            ))}
          </div>,
          document.body
        )}
    </ToastContext.Provider>
  );
}
