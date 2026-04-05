/**
 * Guna Milan Score Donut Chart Component
 * Renders the animated donut chart with 8-koota breakdown per PRD Section 5.4.
 */

import { motion } from "framer-motion";

interface KootaScore {
  points: number;
  max: number;
}

interface GunaBreakdown {
  varna: KootaScore;
  vashya: KootaScore;
  tara: KootaScore;
  yoni: KootaScore;
  graha_maitri: KootaScore;
  gana: KootaScore;
  bhakoot: KootaScore;
  nadi: KootaScore;
}

interface GunaScoreChartProps {
  totalScore: number;
  maxScore?: number;
  breakdown?: GunaBreakdown;
  size?: number;
}

const kootaLabels: Record<string, string> = {
  varna: "Varna (Spiritual)",
  vashya: "Vashya (Attraction)",
  tara: "Tara (Destiny)",
  yoni: "Yoni (Compatibility)",
  graha_maitri: "Graha Maitri (Intellect)",
  gana: "Gana (Temperament)",
  bhakoot: "Bhakoot (Prosperity)",
  nadi: "Nadi (Health & Genes)",
};

const getQuality = (pct: number) => {
  if (pct >= 85) return { label: "Excellent Match", color: "text-green-600", bg: "bg-green-50", ring: "#16a34a" };
  if (pct >= 65) return { label: "Good Match", color: "text-teal-600", bg: "bg-teal-50", ring: "#0d9488" };
  if (pct >= 45) return { label: "Average Match", color: "text-amber-600", bg: "bg-amber-50", ring: "#d97706" };
  return { label: "Low Match", color: "text-gray-500", bg: "bg-gray-50", ring: "#6b7280" };
};

const GunaScoreChart = ({ totalScore, maxScore = 36, breakdown, size = 160 }: GunaScoreChartProps) => {
  const pct = Math.round((totalScore / maxScore) * 100);
  const quality = getQuality(pct);
  const radius = (size - 20) / 2;
  const circumference = 2 * Math.PI * radius;
  const dashOffset = circumference - (pct / 100) * circumference;

  return (
    <div className="flex flex-col items-center gap-4">
      {/* Donut Chart */}
      <div className="relative" style={{ width: size, height: size }}>
        <svg width={size} height={size} className="-rotate-90">
          {/* Background circle */}
          <circle
            cx={size / 2} cy={size / 2} r={radius}
            fill="none" stroke="currentColor"
            strokeWidth="10"
            className="text-muted/30"
          />
          {/* Score arc */}
          <motion.circle
            cx={size / 2} cy={size / 2} r={radius}
            fill="none"
            stroke={quality.ring}
            strokeWidth="10"
            strokeLinecap="round"
            strokeDasharray={circumference}
            initial={{ strokeDashoffset: circumference }}
            animate={{ strokeDashoffset: dashOffset }}
            transition={{ delay: 0.3, duration: 1.2, ease: "easeOut" }}
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <motion.span
            className="text-3xl font-bold text-foreground"
            initial={{ opacity: 0, scale: 0.5 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.5, duration: 0.4 }}
          >
            {totalScore}
          </motion.span>
          <span className="text-xs text-muted-foreground">/ {maxScore}</span>
        </div>
      </div>

      {/* Quality Badge */}
      <div className={`px-3 py-1 rounded-full ${quality.bg} ${quality.color} text-sm font-semibold`}>
        {quality.label}
      </div>

      {/* 8 Koota Breakdown Table */}
      {breakdown && (
        <div className="w-full space-y-2 mt-2">
          <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
            Ashtakoota Breakdown
          </h4>
          {Object.entries(breakdown).map(([key, val]) => {
            const isCritical = key === "nadi" || key === "bhakoot";
            const isZero = val.points === 0;
            return (
              <div key={key} className="flex items-center justify-between gap-2">
                <span className={`text-xs ${isCritical && isZero ? "text-destructive font-semibold" : "text-muted-foreground"}`}>
                  {isCritical && isZero ? "⚠ " : ""}
                  {kootaLabels[key] || key}
                </span>
                <div className="flex items-center gap-2">
                  <div className="w-16 h-1.5 rounded-full bg-muted overflow-hidden">
                    <motion.div
                      className={`h-full rounded-full ${isZero && isCritical ? "bg-destructive" : "bg-primary"}`}
                      initial={{ width: 0 }}
                      animate={{ width: `${(val.points / val.max) * 100}%` }}
                      transition={{ delay: 0.8, duration: 0.6 }}
                    />
                  </div>
                  <span className={`text-xs font-medium min-w-[32px] text-right ${isZero && isCritical ? "text-destructive" : "text-foreground"}`}>
                    {val.points}/{val.max}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default GunaScoreChart;
