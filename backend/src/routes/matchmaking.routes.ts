import { Router } from "express";
import { computeGunaMilan, NAKSHATRAS, RAASIS } from "../services/astrology";
import type { NakshatraName, RaasiName } from "../services/astrology";

const router = Router();

// ==========================================
// AI MATCHMAKING SERVICE STUBS
// ==========================================

// Trigger an automated sync of user preferences and behavioral logs to the Python AI engine
router.post("/sync/embeddings", async (req, res) => {
  const { userId } = req.body;
  res.json({
    status: "queued",
    service: "Chellam-Matchmaking-Service",
    message: `User ${userId} embedding generation queued for Python Deep Learning Engine.`,
  });
});

// Fetch Top 50 AI Recommendations
router.get("/recommendations/:userId", async (req, res) => {
  res.json({
    status: "success",
    service: "Chellam-Matchmaking-Service",
    data: {
      userId: req.params.userId,
      candidates: [
        { candidate_id: "stub_1", overall_compatibility: 94.2 },
        { candidate_id: "stub_2", overall_compatibility: 89.1 },
        { candidate_id: "stub_3", overall_compatibility: 82.5 }
      ]
    }
  });
});

// Log implicit behavior to train the ML pipeline
router.post("/behavior/log", async (req, res) => {
  const { userId, action, targetId, duration } = req.body;
  res.json({
    status: "success",
    service: "Chellam-Matchmaking-Service",
    message: "Interaction logged successfully into ai_behavior_logs pipeline.",
  });
});

// ==========================================
// CLASSICAL GUNA MILAN (ASHTAKOOTA) ENGINE
// ==========================================

// Return valid Nakshatra and Raasi options for the frontend dropdowns
router.get("/astrology/options", (req, res) => {
  res.json({
    status: "success",
    service: "Chellam-Astrology-Engine",
    data: {
      nakshatras: Object.keys(NAKSHATRAS),
      raasis: Object.keys(RAASIS),
    }
  });
});

// Compute Guna Milan score for a boy-girl Nakshatra/Raasi pair
router.post("/astrology/guna-milan", (req, res) => {
  const { boy_nakshatra, boy_raasi, girl_nakshatra, girl_raasi } = req.body;

  // Input validation
  if (!boy_nakshatra || !boy_raasi || !girl_nakshatra || !girl_raasi) {
    return res.status(400).json({
      status: "error",
      service: "Chellam-Astrology-Engine",
      message: "All four fields are required: boy_nakshatra, boy_raasi, girl_nakshatra, girl_raasi.",
    });
  }

  const validNakshatras = Object.keys(NAKSHATRAS);
  const validRaasis = Object.keys(RAASIS);

  if (!validNakshatras.includes(boy_nakshatra) || !validNakshatras.includes(girl_nakshatra)) {
    return res.status(400).json({
      status: "error",
      service: "Chellam-Astrology-Engine",
      message: `Invalid Nakshatra provided. Valid values: ${validNakshatras.join(", ")}.`,
    });
  }

  if (!validRaasis.includes(boy_raasi) || !validRaasis.includes(girl_raasi)) {
    return res.status(400).json({
      status: "error",
      service: "Chellam-Astrology-Engine",
      message: `Invalid Raasi provided. Valid values: ${validRaasis.join(", ")}.`,
    });
  }

  try {
    const result = computeGunaMilan(boy_nakshatra, boy_raasi, girl_nakshatra, girl_raasi);

    // Derive the horoscope contribution for the PRD's final match formula
    // PRD: Horoscope Contribution = (Guna Points / 36) × 40
    const horoscope_match_contribution = parseFloat(((result.total_score / 36) * 40).toFixed(2));

    // Quality assessment per PRD Section 5.4
    let quality = "Low Match";
    const pct = Math.round((result.total_score / 36) * 100);
    if (pct >= 85) quality = "Excellent Match";
    else if (pct >= 65) quality = "Good Match";
    else if (pct >= 45) quality = "Average Match";

    // Nadi Dosha warning (most critical Koota)
    const warnings: string[] = [];
    if (result.breakdown.nadi.points === 0) {
      warnings.push("⚠ Nadi Dosha detected — same Nadi for both candidates. This is considered the most critical incompatibility in Vedic astrology.");
    }
    if (result.breakdown.bhakoot.points === 0) {
      warnings.push("⚠ Bhakoot Dosha detected — Raasi positions may indicate financial/emotional challenges.");
    }

    res.json({
      status: "success",
      service: "Chellam-Astrology-Engine",
      data: {
        boy: { nakshatra: boy_nakshatra, raasi: boy_raasi },
        girl: { nakshatra: girl_nakshatra, raasi: girl_raasi },
        total_guna_score: result.total_score,
        max_guna_score: result.max_score,
        percentage: pct,
        quality,
        is_recommended: result.is_recommended,
        horoscope_match_contribution,  // The 40% portion of the PRD's final match score
        warnings,
        breakdown: result.breakdown,
        summary: `Guna Milan Score: ${result.total_score}/36 (${pct}%). ${quality}. ${result.is_recommended ? "This match is recommended (≥18 points)." : "This match is NOT recommended (<18 points)."}`
      }
    });
  } catch (err: any) {
    res.status(500).json({
      status: "error",
      service: "Chellam-Astrology-Engine",
      message: err.message || "Failed to compute Guna Milan score.",
    });
  }
});

export default router;
