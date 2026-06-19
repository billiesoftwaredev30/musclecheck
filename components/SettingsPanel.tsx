// components/SettingsPanel.tsx
"use client";

import React, { useState, useEffect } from "react";
import GlassCard from "./GlassCard";
import styles from "./SettingsPanel.module.css";
import { useToast } from "./Toast";
import { GymRatesResponse, updateRates } from "@/lib/api";
import { Settings, Save, CheckCircle2, Activity } from "lucide-react";

interface SettingsPanelProps {
  initialRates: GymRatesResponse | null;
  onRatesUpdated: () => void;
}

export default function SettingsPanel({ initialRates, onRatesUpdated }: SettingsPanelProps) {
  const toast = useToast();
  const [rates, setRates] = useState<GymRatesResponse>({
    rate_pt_fee: initialRates?.rate_pt_fee || 500,
    rate_daily_member: initialRates?.rate_daily_member || 150,
    rate_daily_non_member: initialRates?.rate_daily_non_member || 200,
    rate_monthly_subscription_1m: initialRates?.rate_monthly_subscription_1m || 1500,
    rate_monthly_subscription_6m: initialRates?.rate_monthly_subscription_6m || 8000,
    rate_monthly_subscription_12m: initialRates?.rate_monthly_subscription_12m || 15000,
    rate_student_subscription_1m: initialRates?.rate_student_subscription_1m || 1349,
    rate_student_subscription_3m: initialRates?.rate_student_subscription_3m || 3500,
    rate_student_subscription_6m: initialRates?.rate_student_subscription_6m || 7000,
    rate_student_subscription_12m: initialRates?.rate_student_subscription_12m || 14000,
    rate_monthly_subscription_3m: initialRates?.rate_monthly_subscription_3m || 4000,
    rate_daily_student: initialRates?.rate_daily_student || 150,
    rate_boxing_fee: initialRates?.rate_boxing_fee || 4000,
    rate_12_sessions_fee: initialRates?.rate_12_sessions_fee || 4000,
    rate_bottled_water: initialRates?.rate_bottled_water || 15,
    rate_black_coffee: initialRates?.rate_black_coffee || 25,
    rate_coffee_creamer: initialRates?.rate_coffee_creamer || 30,
    rate_cucumber_lemonade: initialRates?.rate_cucumber_lemonade || 50,
  } as GymRatesResponse);
  const [loading, setLoading] = useState(false);

  const [activeCategory, setActiveCategory] = useState<"walkin" | "subscriptions" | "services" | "beverages">("walkin");

  useEffect(() => {
    if (initialRates) setRates(initialRates);
  }, [initialRates]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!rates) return;
    const { name, value } = e.target;
    setRates({ ...rates, [name]: parseFloat(value) || 0 });
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!rates) return;
    setLoading(true);
    try {
      await updateRates(rates);
      toast.success("Settings saved successfully!");
      onRatesUpdated();
    } catch (err: any) {
      toast.error("Failed to save settings", err.message);
    } finally {
      setLoading(false);
    }
  };

  if (!rates) {
    return (
      <div style={{ display: "flex", justifyContent: "center", padding: "40px" }}>
        <Activity size={24} style={{ color: "var(--foreground-muted)", animation: "spinSlow 1s linear infinite" }} />
      </div>
    );
  }

  const renderField = (label: string, name: string, value: number) => (
    <div className={styles.field}>
      <label className={styles.label}>{label}</label>
      <div className={styles.inputGroup}>
        <span className={styles.inputPrefix}>₱</span>
        <input
          type="number"
          name={name}
          value={value ?? 0}
          onChange={handleChange}
          className={styles.input}
          required
          min="0"
        />
      </div>
    </div>
  );

  return (
    <div className={styles.container}>
      <GlassCard>
        <div className={styles.header}>
          <div className={styles.headerIcon}>
            <Settings size={18} />
          </div>
          <div>
            <h3 className={styles.headerTitle}>System Pricing</h3>
          </div>
        </div>
        <p className={styles.headerDesc}>
          Update pricing for daily walk-ins, subscriptions, and services. Changes take effect immediately.
        </p>

        {/* Category Navigation */}
        <div className={styles.categoryNav}>
          <button 
            type="button"
            className={`${styles.categoryBtn} ${activeCategory === "walkin" ? styles.categoryBtnActive : ""}`}
            onClick={() => setActiveCategory("walkin")}
          >
            Walk-Ins
          </button>
          <button 
            type="button"
            className={`${styles.categoryBtn} ${activeCategory === "subscriptions" ? styles.categoryBtnActive : ""}`}
            onClick={() => setActiveCategory("subscriptions")}
          >
            Subscriptions
          </button>
          <button 
            type="button"
            className={`${styles.categoryBtn} ${activeCategory === "services" ? styles.categoryBtnActive : ""}`}
            onClick={() => setActiveCategory("services")}
          >
            Services & Payroll
          </button>
          <button 
            type="button"
            className={`${styles.categoryBtn} ${activeCategory === "beverages" ? styles.categoryBtnActive : ""}`}
            onClick={() => setActiveCategory("beverages")}
          >
            Beverages
          </button>
        </div>

        <form onSubmit={handleSave} style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
          <div className={styles.sectionsContainer}>
            
            {activeCategory === "walkin" && (
              <div className={`${styles.section} ${styles.fadeIn}`}>
                <h4 className={styles.sectionTitle}>Daily Walk-In Rates</h4>
                <div className={styles.sectionGridThree}>
                  {renderField("Member", "rate_daily_member", rates.rate_daily_member)}
                  {renderField("Non-Member", "rate_daily_non_member", rates.rate_daily_non_member)}
                  {renderField("Student", "rate_daily_student", rates.rate_daily_student)}
                </div>
              </div>
            )}

            {activeCategory === "subscriptions" && (
              <div className={`${styles.fadeIn}`} style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
                <div className={styles.section}>
                  <h4 className={styles.sectionTitle}>Member Subscriptions</h4>
                  <div className={styles.sectionGrid}>
                    {renderField("1 Month", "rate_monthly_subscription_1m", rates.rate_monthly_subscription_1m)}
                    {renderField("3 Months", "rate_monthly_subscription_3m", rates.rate_monthly_subscription_3m)}
                    {renderField("6 Months", "rate_monthly_subscription_6m", rates.rate_monthly_subscription_6m)}
                    {renderField("12 Months", "rate_monthly_subscription_12m", rates.rate_monthly_subscription_12m)}
                  </div>
                </div>

                <div className={styles.section}>
                  <h4 className={styles.sectionTitle}>Student Subscriptions</h4>
                  <div className={styles.sectionGrid}>
                    {renderField("1 Month", "rate_student_subscription_1m", rates.rate_student_subscription_1m)}
                    {renderField("3 Months", "rate_student_subscription_3m", rates.rate_student_subscription_3m)}
                    {renderField("6 Months", "rate_student_subscription_6m", rates.rate_student_subscription_6m)}
                    {renderField("12 Months", "rate_student_subscription_12m", rates.rate_student_subscription_12m)}
                  </div>
                </div>
              </div>
            )}

            {activeCategory === "services" && (
              <div className={`${styles.section} ${styles.fadeIn}`}>
                <h4 className={styles.sectionTitle}>Coaching & Payroll</h4>
                <div className={styles.sectionGridThree}>
                  {renderField("Standard PT", "rate_pt_fee", rates.rate_pt_fee)}
                  {renderField("Boxing", "rate_boxing_fee", rates.rate_boxing_fee)}
                  {renderField("12 Sessions", "rate_12_sessions_fee", rates.rate_12_sessions_fee)}
                  {renderField("Trainer Commission (Flat)", "rate_trainer_commission", rates.rate_trainer_commission)}
                </div>
              </div>
            )}

            {activeCategory === "beverages" && (
              <div className={`${styles.section} ${styles.fadeIn}`}>
                <h4 className={styles.sectionTitle}>Beverages & Products</h4>
                <div className={styles.sectionGrid}>
                  {renderField("Bottled Water", "rate_bottled_water", rates.rate_bottled_water)}
                  {renderField("Black Coffee", "rate_black_coffee", rates.rate_black_coffee)}
                  {renderField("Coffee w/ Creamer", "rate_coffee_creamer", rates.rate_coffee_creamer)}
                  {renderField("Cucumber Lemonade", "rate_cucumber_lemonade", rates.rate_cucumber_lemonade)}
                </div>
              </div>
            )}
          </div>

          <div className={styles.saveRow}>
            <button type="submit" disabled={loading} className={styles.saveBtn}>
              {loading ? <Save size={16} style={{ animation: "spinSlow 1s linear infinite" }} /> : <CheckCircle2 size={16} />}
              {loading ? "Saving..." : "Save Settings"}
            </button>
          </div>
        </form>
      </GlassCard>
    </div>
  );
}
