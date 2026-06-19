"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import styles from "./page.module.css";
import { Lock, LogIn, Loader2, User, Eye, EyeOff, AlertCircle } from "lucide-react";
import { API_BASE_URL } from "@/lib/api";

export default function LoginPage() {
  const router = useRouter();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const res = await fetch(`${API_BASE_URL}/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password }),
      });

      if (!res.ok) {
        throw new Error("Invalid username or password");
      }

      const data = await res.json();
      if (data.success) {
        // Store simple token in localStorage
        localStorage.setItem("mc_auth_token", data.token);
        // Redirect to dashboard
        router.push("/");
      }
    } catch (err: any) {
      setError(err.message || "Failed to connect to the server");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={styles.container}>
      <div className={styles.loginCard}>
        <div className={styles.logoContainer}>
          <img src="/logo.png" alt="Muscle Check Logo" className={styles.logoImage} />
        </div>

        <div className={styles.titleGroup}>
          <h1 className={styles.title}>Muscle Check</h1>
          <p className={styles.subtitle}>Gym Administration Console</p>
        </div>

        {error && (
          <div className={styles.error}>
            <AlertCircle size={14} />
            {error}
          </div>
        )}

        <form onSubmit={handleLogin} className={styles.form}>
          <div className={styles.field}>
            <label className={styles.label}>Username</label>
            <div className={styles.inputWrapper}>
              <input
                type="text"
                placeholder="Enter username"
                className={styles.input}
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                required
              />
              <User size={16} className={styles.inputIcon} />
            </div>
          </div>

          <div className={styles.field}>
            <label className={styles.label}>Password</label>
            <div className={styles.inputWrapper}>
              <input
                type={showPassword ? "text" : "password"}
                placeholder="Enter password"
                className={styles.input}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
              <Lock size={16} className={styles.inputIcon} />
              <button
                type="button"
                className={styles.togglePassword}
                onClick={() => setShowPassword(!showPassword)}
                tabIndex={-1}
              >
                {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </div>

          <button type="submit" className={styles.button} disabled={loading}>
            {loading ? (
              <>
                <Loader2 size={18} style={{ animation: "spinSlow 1s linear infinite" }} />
                Authenticating...
              </>
            ) : (
              <>
                <LogIn size={18} />
                Secure Login
              </>
            )}
          </button>
        </form>

        <p className={styles.footer}>
          Muscle Check Fitness © {new Date().getFullYear()}
        </p>
      </div>
    </div>
  );
}
