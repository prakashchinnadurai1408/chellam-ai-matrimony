import { Router } from "express";

const router = Router();

// ==========================================
// TRUST & SAFETY VERIFICATION SERVICE STUBS
// ==========================================

// Future Aadhaar eKYC Gateway via Setu / DigiLocker
router.post("/ekyc/aadhaar", async (req, res) => {
  res.json({
    status: "processing",
    service: "Chellam-Verification-Gateway",
    message: "Aadhaar validation request received and queued for async verification.",
    transaction_id: "txn_stub_991203"
  });
});

// Future Computer Vision Face Matcher (Selfie vs Document)
router.post("/biometric/selfie-match", async (req, res) => {
  res.json({
    status: "processing",
    service: "Chellam-Verification-Gateway",
    message: "Selfie biometric payload received. Passing to AI Vision pipeline.",
    match_probability: 0.0 // Stub
  });
});

// Endpoint for internal admin tools to read fraud flags
router.get("/fraud-flags/:userId", async (req, res) => {
  res.json({
    status: "success",
    service: "Chellam-Verification-Gateway",
    data: {
      userId: req.params.userId,
      fraud_markers: ["suspicious_ip", "rapid_swiping"],
      ai_risk_score: 0.12
    }
  });
});

export default router;
