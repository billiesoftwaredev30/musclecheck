// components/DashboardStats.tsx
import React from "react";
import styles from "./DashboardStats.module.css";
import GlassCard from "./GlassCard";
import { DashboardMetrics, GymRatesResponse } from "@/lib/api";
import { DollarSign, Users, CalendarDays, ClipboardCheck } from "lucide-react";

interface DashboardStatsProps {
  metrics: DashboardMetrics;
  rates: GymRatesResponse | null;
}

export default function DashboardStats({ metrics, rates }: DashboardStatsProps) {
  return (
    <div className={styles.grid}>
      {/* 1. Daily Collection */}
      <GlassCard className={styles.card} hoverable>
        <div className={styles.header}>
          <span>Daily Collections</span>
          <div className={styles.iconSuccess}>
            <DollarSign size={16} />
          </div>
        </div>
        <div className={styles.value}>
          ₱{metrics.total_revenue.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
        </div>
        <div className={styles.breakdown}>
          <span>Cash: <span className={styles.cashColor}>₱{metrics.cash_revenue}</span></span>
          <span className={styles.breakdownDot} />
          <span>GCash: <span className={styles.gcashColor}>₱{metrics.gcash_revenue}</span></span>
        </div>
      </GlassCard>

      {/* 2. Check-Ins Today */}
      <GlassCard className={styles.card} hoverable>
        <div className={styles.header}>
          <span>Check-Ins Today</span>
          <div className={styles.iconAccent}>
            <ClipboardCheck size={16} />
          </div>
        </div>
        <div className={styles.value}>
          {metrics.daily_sessions.length}
          <span className={styles.valueUnit}>sessions</span>
        </div>
        <div className={styles.breakdown}>
          <span>Members: <span className={styles.cashColor}>{metrics.member_visits}</span></span>
          <span className={styles.breakdownDot} />
          <span>Walk-ins: <span className={styles.gcashColor}>{metrics.non_member_visits}</span></span>
        </div>
      </GlassCard>

      {/* 3. Active Subscribers */}
      <GlassCard className={styles.card} hoverable>
        <div className={styles.header}>
          <span>Monthly Subscribers</span>
          <div className={styles.iconGold}>
            <CalendarDays size={16} />
          </div>
        </div>
        <div className={styles.value}>
          {metrics.active_subscribers}
          <span className={styles.valueUnit}>active</span>
        </div>
        <div className={styles.footer}>
          <span>Rate: ₱{rates?.rate_monthly_subscription_1m || 2500}/month</span>
        </div>
      </GlassCard>

      {/* 4. Client Directory Total */}
      <GlassCard className={styles.card} hoverable>
        <div className={styles.header}>
          <span>Client Database</span>
          <div className={styles.iconMuted}>
            <Users size={16} />
          </div>
        </div>
        <div className={styles.value}>
          {metrics.total_clients}
          <span className={styles.valueUnit}>registered</span>
        </div>
        <div className={styles.footer}>
          <span>Members + Subscribers</span>
        </div>
      </GlassCard>
    </div>
  );
}
