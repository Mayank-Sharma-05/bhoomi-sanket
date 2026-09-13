"use client";

import React, { useEffect, useMemo, useState } from "react";

interface CountUpMetricProps {
  value: number | string;
  suffix?: string;
  decimalPlaces?: number;
  className?: string;
}

export const CountUpMetric: React.FC<CountUpMetricProps> = ({
  value,
  suffix = "",
  decimalPlaces = 0,
  className = "",
}) => {
  const numberValue = useMemo(() => {
    if (typeof value === "number") return value;
    const parsed = Number.parseFloat(String(value).replace(/[^0-9.\-]/g, ""));
    return Number.isFinite(parsed) ? parsed : 0;
  }, [value]);

  const prefersReducedMotion =
    typeof window !== "undefined" &&
    window.matchMedia &&
    window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  const [displayValue, setDisplayValue] = useState(prefersReducedMotion ? numberValue : 0);

  useEffect(() => {
    if (prefersReducedMotion) {
      setDisplayValue(numberValue);
      return;
    }

    let animationFrame = 0;
    const start = 0;
    const end = numberValue;
    const duration = 650;
    const startTime = performance.now();

    const tick = (now: number) => {
      const elapsed = now - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      setDisplayValue(start + (end - start) * eased);

      if (progress < 1) {
        animationFrame = window.requestAnimationFrame(tick);
      }
    };

    animationFrame = window.requestAnimationFrame(tick);

    return () => {
      if (animationFrame) {
        window.cancelAnimationFrame(animationFrame);
      }
    };
  }, [numberValue, prefersReducedMotion]);

  const display = Number.isInteger(numberValue)
    ? Math.round(displayValue)
    : displayValue.toFixed(decimalPlaces);

  return (
    <span className={`tabular-nums ${className}`}> 
      {display}
      {suffix}
    </span>
  );
};
