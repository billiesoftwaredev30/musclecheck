// app/page.tsx
"use client";

import React, { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import styles from "./page.module.css";
import DashboardStats from "@/components/DashboardStats";
import LogSessionModal from "@/components/LogSessionModal";
import SessionHistory from "@/components/SessionHistory";
import SessionHistoryPanel from "@/components/SessionHistoryPanel";
import ClientManager from "@/components/ClientManager";
import SettingsPanel from "@/components/SettingsPanel";
import DailySalesReportModal from "@/components/DailySalesReportModal";
import LogProductModal from "@/components/LogProductModal";
import TrainerPayrollPanel from "@/components/TrainerPayrollPanel";
import GlassCard from "@/components/GlassCard";
import { useToast } from "@/components/Toast";
import {
  fetchDashboardMetrics,
  fetchRates,
  DashboardMetrics,
  GymRatesResponse,
} from "@/lib/api";
import {
  Activity,
  CalendarCheck,
  Users,
  RefreshCw,
  History,
  Sun,
  Moon,
  LogOut,
  Settings,
  Printer,
  Banknote,
} from "lucide-react";

export default function GymDashboardPage() {
  const [metrics, setMetrics] = useState<DashboardMetrics | null>(null);
  const [rates, setRates] = useState<GymRatesResponse | null>(null);
  const [activeTab, setActiveTab] = useState<"checkins" | "clients" | "history" | "payroll" | "settings">("checkins");
  const [theme, setTheme] = useState<"light" | "dark">("dark");
  const [logModalOpen, setLogModalOpen] = useState(false);
  const [productModalOpen, setProductModalOpen] = useState(false);
  const [startWithCamera, setStartWithCamera] = useState(false);
  const [reportModalOpen, setReportModalOpen] = useState(false);
  const router = useRouter();
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [currentTime, setCurrentTime] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const toast = useToast();

  // Theme persistence
  useEffect(() => {
    const savedTheme = localStorage.getItem("mc_theme") as "light" | "dark" | null;
    if (savedTheme) {
      setTheme(savedTheme);
      document.documentElement.setAttribute("data-theme", savedTheme);
    } else {
      document.documentElement.setAttribute("data-theme", "dark");
    }
  }, []);

  const toggleTheme = () => {
    const newTheme = theme === "light" ? "dark" : "light";
    setTheme(newTheme);
    document.documentElement.setAttribute("data-theme", newTheme);
    localStorage.setItem("mc_theme", newTheme);
  };

  // Live clock
  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setCurrentTime(
        now.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit", hour12: true }) +
        "  •  " +
        now.toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" })
      );
    };
    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  // Tab persistence
  useEffect(() => {
    const savedTab = localStorage.getItem("mc_active_tab");
    if (savedTab) {
      setActiveTab(savedTab as typeof activeTab);
    }
  }, []);

  const handleTabChange = (tab: typeof activeTab) => {
    setActiveTab(tab);
    localStorage.setItem("mc_active_tab", tab);
  };

  // Auth check
  useEffect(() => {
    const token = localStorage.getItem("mc_auth_token");
    if (!token) {
      router.push("/login");
    } else {
      setIsAuthenticated(true);
    }
  }, [router]);

  const loadDashboardData = useCallback(async () => {
    try {
      setError(null);
      const [metricsData, ratesData] = await Promise.all([
        fetchDashboardMetrics(),
        fetchRates(),
      ]);
      setMetrics(metricsData);
      setRates(ratesData);
    } catch (err: any) {
      console.error(err);
      setError("Unable to connect to the Muscle Check Fitness API. Check if the backend uvicorn server is running on http://127.0.0.1:8000.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (isAuthenticated) {
      loadDashboardData();
    }
  }, [loadDashboardData, isAuthenticated]);

  // Greeting based on time
  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return "Good morning";
    if (hour < 17) return "Good afternoon";
    return "Good evening";
  };

  // Loading state
  if (loading || !isAuthenticated) {
    return (
      <main className={styles.stateContainer}>
        <div className={styles.spinner} />
        <h2 className={styles.loadingTitle}>Connecting Gym Database</h2>
        <p className={styles.loadingSubtext}>
          Synchronizing monthly records and daily check-ins...
        </p>
      </main>
    );
  }

  // Error state
  if (error || !metrics) {
    return (
      <main className={styles.stateContainer}>
        <div className={styles.errorIconWrap}>
          <Activity size={28} />
        </div>
        <h2 className={styles.errorTitle}>Database Offline</h2>
        <p className={styles.errorText}>{error}</p>
        <button className={styles.retryButton} onClick={() => { setLoading(true); loadDashboardData(); }}>
          <RefreshCw size={14} />
          Retry Connection
        </button>
      </main>
    );
  }

  return (
    <main className={`${styles.container} print-hidden`}>
      {/* ── Sticky Header ── */}
      <header className={styles.header}>
        <div className={styles.headerLeft}>
          <div className={styles.brand}>
            <div className={styles.logoIcon}>
              <img src="/logo.png" alt="Muscle Check Logo" style={{ width: "100%", height: "100%", objectFit: "cover", borderRadius: "inherit" }} />
            </div>
            <h1 className={styles.brandName}>Muscle Check Fitness</h1>
          </div>
          <div className={styles.headerDivider} />
          {currentTime && (
            <div className={styles.clockBadge}>{currentTime}</div>
          )}
        </div>

        <div className={styles.headerRight}>
          <div className={styles.badge}>
            <div className={styles.activeDot} />
            <span>System Online</span>
          </div>
          <button
            className={styles.headerBtn}
            onClick={() => setReportModalOpen(true)}
            title="Print Daily Sales Report"
          >
            <Printer size={14} /> Report
          </button>
          <button
            className={styles.headerBtnIcon}
            onClick={toggleTheme}
            title={`Switch to ${theme === "light" ? "dark" : "light"} mode`}
          >
            {theme === "light" ? <Moon size={16} /> : <Sun size={16} />}
          </button>
          <button
            className={styles.headerBtnDanger}
            onClick={() => {
              localStorage.removeItem("mc_auth_token");
              router.push("/login");
            }}
            title="Log out"
          >
            <LogOut size={14} /> Logout
          </button>
        </div>
      </header>

      {/* ── Welcome Banner ── */}
      <div className={styles.welcomeBanner}>
        <div className={styles.welcomeText}>
          <h2 className={styles.welcomeTitle}>
            {getGreeting()}, <span className={styles.highlightText}>Admin</span>
          </h2>
          <p className={styles.welcomeSubtext}>
            {metrics.daily_sessions.length} check-in{metrics.daily_sessions.length !== 1 ? "s" : ""} today • {metrics.active_subscribers} active subscriber{metrics.active_subscribers !== 1 ? "s" : ""}
          </p>
        </div>
      </div>

      {/* ── Stats ── */}
      <DashboardStats metrics={metrics} rates={rates} />

      {/* ── Tab Navigation ── */}
      <nav className={styles.tabBar}>
        <button
          className={`${styles.tabButton} ${activeTab === "checkins" ? styles.tabActive : styles.tabInactive}`}
          onClick={() => handleTabChange("checkins")}
        >
          <CalendarCheck size={15} />
          Daily Check-Ins
        </button>
        <button
          className={`${styles.tabButton} ${activeTab === "clients" ? styles.tabActive : styles.tabInactive}`}
          onClick={() => handleTabChange("clients")}
        >
          <Users size={15} />
          Client Database
        </button>
        <button
          className={`${styles.tabButton} ${activeTab === "history" ? styles.tabActive : styles.tabInactive}`}
          onClick={() => handleTabChange("history")}
        >
          <History size={15} />
          All History
        </button>
        <button
          className={`${styles.tabButton} ${activeTab === "payroll" ? styles.tabActive : styles.tabInactive}`}
          onClick={() => handleTabChange("payroll")}
        >
          <Banknote size={15} />
          Payroll
        </button>
        <button
          className={`${styles.tabButton} ${activeTab === "settings" ? styles.tabActive : styles.tabInactive}`}
          onClick={() => handleTabChange("settings")}
        >
          <Settings size={15} />
          Settings
        </button>
      </nav>

      {/* ── Content ── */}
      <div className={styles.contentArea} key={activeTab}>
        {activeTab === "checkins" ? (
          <GlassCard>
            <div style={{ display: "flex", justifyContent: "flex-end", marginBottom: "16px", gap: "10px" }}>
              <button 
                onClick={() => setProductModalOpen(true)}
                style={{
                  display: "flex", alignItems: "center", gap: "6px",
                  background: "var(--glass-bg)", border: "1px solid var(--accent-fuchsia)",
                  color: "var(--foreground)", padding: "8px 14px", borderRadius: "var(--radius-sm)",
                  cursor: "pointer", fontWeight: 600, fontSize: "0.82rem",
                  fontFamily: "var(--font-family)"
                }}
              >
                Log Product Sale
              </button>
            </div>
            <SessionHistory
              sessions={metrics.daily_sessions}
              onLogEntry={() => {
                setStartWithCamera(false);
                setLogModalOpen(true);
              }}
              onFaceCheckIn={() => {
                setStartWithCamera(true);
                setLogModalOpen(true);
              }}
              hasFaces={metrics.clients.some((c) => c.face_descriptor)}
            />
          </GlassCard>
        ) : activeTab === "history" ? (
          <SessionHistoryPanel />
        ) : activeTab === "payroll" ? (
          <TrainerPayrollPanel />
        ) : activeTab === "settings" ? (
          <SettingsPanel initialRates={rates} onRatesUpdated={loadDashboardData} />
        ) : (
          <ClientManager
            clients={metrics.clients}
            rates={rates}
            onClientsUpdated={loadDashboardData}
          />
        )}
      </div>

      {/* ── Modals ── */}
      <LogSessionModal
        open={logModalOpen}
        onClose={() => setLogModalOpen(false)}
        clients={metrics.clients}
        rates={rates}
        startWithCamera={startWithCamera}
        onSessionLogged={loadDashboardData}
      />

      <DailySalesReportModal
        open={reportModalOpen}
        onClose={() => setReportModalOpen(false)}
        metrics={metrics}
      />

      <LogProductModal
        open={productModalOpen}
        rates={rates}
        onClose={() => setProductModalOpen(false)}
        onSaleLogged={loadDashboardData}
      />
    </main>
  );
}
