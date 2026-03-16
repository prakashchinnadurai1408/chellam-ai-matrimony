import { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Heart, Sparkles, ArrowLeft, Shield, Phone } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { z } from "zod";

const phoneSchema = z.string().regex(/^[6-9]\d{9}$/, "Enter a valid 10-digit Indian mobile number");
const OTP_CODE = "1234";

const Auth = () => {
  const [step, setStep] = useState<"phone" | "otp">("phone");
  const [phone, setPhone] = useState("");
  const [otp, setOtp] = useState(["", "", "", ""]);
  const [phoneError, setPhoneError] = useState("");
  const [otpError, setOtpError] = useState("");
  const [timer, setTimer] = useState(30);
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);
  const { login, isAuthenticated, isProfileComplete } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    if (isAuthenticated && isProfileComplete) navigate("/");
    else if (isAuthenticated && !isProfileComplete) navigate("/create-profile");
  }, [isAuthenticated, isProfileComplete, navigate]);

  useEffect(() => {
    if (step !== "otp") return;
    setTimer(30);
    const interval = setInterval(() => setTimer((t) => (t > 0 ? t - 1 : 0)), 1000);
    return () => clearInterval(interval);
  }, [step]);

  const handlePhoneSubmit = () => {
    const result = phoneSchema.safeParse(phone);
    if (!result.success) {
      setPhoneError(result.error.errors[0].message);
      return;
    }
    setPhoneError("");
    setStep("otp");
    toast({ title: "OTP Sent!", description: `A verification code has been sent to +91 ${phone}` });
  };

  const handleOtpChange = (index: number, value: string) => {
    if (!/^\d?$/.test(value)) return;
    const newOtp = [...otp];
    newOtp[index] = value;
    setOtp(newOtp);
    setOtpError("");
    if (value && index < 3) inputRefs.current[index + 1]?.focus();
  };

  const handleOtpKeyDown = (index: number, e: React.KeyboardEvent) => {
    if (e.key === "Backspace" && !otp[index] && index > 0) inputRefs.current[index - 1]?.focus();
  };

  const handleOtpSubmit = () => {
    const code = otp.join("");
    if (code.length < 4) { setOtpError("Enter all 4 digits"); return; }
    if (code !== OTP_CODE) { setOtpError("Invalid OTP. Try 1234"); return; }
    login(phone);
    navigate("/create-profile");
  };

  return (
    <div className="min-h-screen bg-background flex">
      {/* Left Decorative Panel */}
      <div className="hidden lg:flex lg:w-1/2 gradient-hero relative items-center justify-center p-12">
        <div className="absolute inset-0 bg-foreground/10" />
        <div className="relative text-center text-primary-foreground space-y-6 max-w-md">
          <div className="w-16 h-16 rounded-2xl bg-primary-foreground/20 backdrop-blur-sm flex items-center justify-center mx-auto">
            <Heart className="w-8 h-8 text-primary-foreground" />
          </div>
          <h1 className="font-display text-4xl font-bold">Find Your Perfect Match</h1>
          <p className="text-primary-foreground/80 text-lg">
            Join millions of verified profiles on India's most intelligent matrimonial platform.
          </p>
          <div className="flex items-center justify-center gap-6 pt-4">
            <div className="text-center">
              <p className="text-2xl font-bold">2M+</p>
              <p className="text-xs text-primary-foreground/70">Verified Profiles</p>
            </div>
            <div className="w-px h-10 bg-primary-foreground/30" />
            <div className="text-center">
              <p className="text-2xl font-bold">50K+</p>
              <p className="text-xs text-primary-foreground/70">Successful Matches</p>
            </div>
            <div className="w-px h-10 bg-primary-foreground/30" />
            <div className="text-center">
              <p className="text-2xl font-bold">96%</p>
              <p className="text-xs text-primary-foreground/70">AI Accuracy</p>
            </div>
          </div>
        </div>
      </div>

      {/* Right Form Panel */}
      <div className="flex-1 flex items-center justify-center p-6 sm:p-12">
        <div className="w-full max-w-md">
          {/* Logo */}
          <div className="flex items-center gap-2 mb-10">
            <div className="w-9 h-9 rounded-lg gradient-hero flex items-center justify-center">
              <Heart className="w-5 h-5 text-primary-foreground" />
            </div>
            <span className="font-display text-xl font-bold text-foreground">
              Chellam<span className="text-primary">.</span>
            </span>
          </div>

          <AnimatePresence mode="wait">
            {step === "phone" ? (
              <motion.div
                key="phone"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-6"
              >
                <div>
                  <h2 className="font-display text-2xl font-bold text-foreground">Welcome to Chellam</h2>
                  <p className="text-muted-foreground mt-1">Enter your mobile number to get started</p>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium text-foreground">Mobile Number</label>
                  <div className="flex gap-2">
                    <div className="flex items-center gap-1.5 px-3 rounded-md border border-input bg-muted text-sm text-muted-foreground shrink-0">
                      🇮🇳 +91
                    </div>
                    <Input
                      type="tel"
                      placeholder="Enter 10-digit number"
                      maxLength={10}
                      value={phone}
                      onChange={(e) => { setPhone(e.target.value.replace(/\D/g, "")); setPhoneError(""); }}
                      onKeyDown={(e) => e.key === "Enter" && handlePhoneSubmit()}
                      className={phoneError ? "border-destructive" : ""}
                    />
                  </div>
                  {phoneError && <p className="text-xs text-destructive">{phoneError}</p>}
                </div>

                <Button variant="hero" className="w-full gap-2" size="lg" onClick={handlePhoneSubmit}>
                  <Phone className="w-4 h-4" /> Send OTP
                </Button>

                <div className="flex items-start gap-2 p-3 rounded-xl bg-muted/50 border border-border">
                  <Shield className="w-4 h-4 text-primary mt-0.5 shrink-0" />
                  <p className="text-xs text-muted-foreground">
                    Your number is 100% safe. We never share your personal information with anyone.
                  </p>
                </div>
              </motion.div>
            ) : (
              <motion.div
                key="otp"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-6"
              >
                <button onClick={() => { setStep("phone"); setOtp(["", "", "", ""]); }} className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors">
                  <ArrowLeft className="w-4 h-4" /> Change number
                </button>

                <div>
                  <h2 className="font-display text-2xl font-bold text-foreground">Verify OTP</h2>
                  <p className="text-muted-foreground mt-1">
                    Enter the 4-digit code sent to <span className="font-semibold text-foreground">+91 {phone}</span>
                  </p>
                </div>

                <div className="flex gap-3 justify-center">
                  {otp.map((digit, i) => (
                    <input
                      key={i}
                      ref={(el) => { inputRefs.current[i] = el; }}
                      type="text"
                      inputMode="numeric"
                      maxLength={1}
                      value={digit}
                      onChange={(e) => handleOtpChange(i, e.target.value)}
                      onKeyDown={(e) => handleOtpKeyDown(i, e)}
                      className={`w-14 h-14 text-center text-2xl font-bold rounded-xl border-2 bg-card text-foreground outline-none transition-all ${
                        digit ? "border-primary shadow-sm" : "border-input"
                      } ${otpError ? "border-destructive" : ""} focus:border-primary focus:ring-2 focus:ring-ring`}
                    />
                  ))}
                </div>
                {otpError && <p className="text-xs text-destructive text-center">{otpError}</p>}

                <Button variant="hero" className="w-full gap-2" size="lg" onClick={handleOtpSubmit}>
                  <Sparkles className="w-4 h-4" /> Verify & Continue
                </Button>

                <p className="text-center text-sm text-muted-foreground">
                  {timer > 0 ? (
                    <>Resend OTP in <span className="font-semibold text-foreground">{timer}s</span></>
                  ) : (
                    <button onClick={() => { setTimer(30); toast({ title: "OTP Resent!" }); }} className="text-primary font-semibold hover:underline">
                      Resend OTP
                    </button>
                  )}
                </p>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
};

export default Auth;
