"use client";

import React, { useState } from "react";
import styles from "./dj.module.css";
import { Music, Send, CheckCircle } from "lucide-react";
import { requestSong } from "@/lib/api";

export default function DJRequestPage() {
  const [name, setName] = useState("");
  const [title, setTitle] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !title.trim()) return;

    setSubmitting(true);
    setError("");

    try {
      await requestSong({
        requested_by: name,
        title: title,
      });
      setSuccess(true);
      setTitle("");
      setTimeout(() => setSuccess(false), 5000);
    } catch (err: any) {
      setError(err.message || "Failed to submit request.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <main className={styles.container}>
      <div className={styles.glow} />
      
      <div className={styles.card}>
        <div className={styles.header}>
          <Music size={40} style={{ color: "var(--accent-fuchsia)", marginBottom: "12px" }} />
          <h1 className={styles.title}>Gym DJ Request</h1>
          <p className={styles.subtitle}>Drop a YouTube link or a song name, and we'll add it to the gym playlist!</p>
        </div>

        <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
          <div className={styles.formGroup}>
            <label className={styles.label}>Your Name</label>
            <input
              type="text"
              className={styles.input}
              placeholder="e.g. John Doe"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              disabled={submitting}
            />
          </div>

          <div className={styles.formGroup}>
            <label className={styles.label}>Song Title or YouTube Link</label>
            <input
              type="text"
              className={styles.input}
              placeholder="Paste link here..."
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
              disabled={submitting}
            />
          </div>

          {error && <div style={{ color: "var(--error-light)", fontSize: "0.85rem", textAlign: "center" }}>{error}</div>}

          <button 
            type="submit" 
            className={styles.submitBtn}
            disabled={submitting || !name.trim() || !title.trim()}
          >
            {success ? (
              <>
                <CheckCircle size={18} /> Added to Queue!
              </>
            ) : submitting ? (
              "Sending..."
            ) : (
              <>
                <Send size={18} /> Request Song
              </>
            )}
          </button>
        </form>
      </div>
    </main>
  );
}
