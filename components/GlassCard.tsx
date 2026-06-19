// components/GlassCard.tsx
import React, { ReactNode } from "react";
import styles from "./GlassCard.module.css";

interface GlassCardProps {
  children: ReactNode;
  className?: string;
  hoverable?: boolean;
  roundedLarge?: boolean;
  ai?: boolean;
  style?: React.CSSProperties;
}

export default function GlassCard({
  children,
  className = "",
  hoverable = false,
  roundedLarge = false,
  ai = false,
  style,
}: GlassCardProps) {
  const cardClasses = [
    styles.card,
    hoverable ? styles.hoverable : "",
    roundedLarge ? styles.roundedLarge : "",
    ai ? styles.aiCard : "",
    className,
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <div className={cardClasses} style={style}>
      {children}
    </div>
  );
}
