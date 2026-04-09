import { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Heart, Sparkles, ArrowLeft, Shield, Phone, Loader2 } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { z } from "zod";

const phoneSchema = z.string().regex(
  /^[6-9]\d{9}$/,
  "Enter a valid 10-digit Indian mobile number"
);
const OTP_CODE = "1234";

const Auth = () => {
  const [step, setStep] = useState<"phone" | "otp">("phone");
  const [phone, setPhone] = useState("");
  const [otp, setOtp] = useState(["", "", "", ""]);
  const [phoneError, setPhoneError] = useState("");
  const [otpError, setOtpError] = useState("");
  const [timer, setTimer] = useState(30);
  const [submitting, setSubmitting] = useState(false);
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);
  const { isAuthenticated, isProfileComplete, loading, login, loginWithGoogle } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

  // Redirect once authenticated
  useEffect(() => {
    if (loading) return;
    if (isAuthenticated && isProfileComplete) navigate("/");
    else if (isAuthenticated && !isProfileComplete) navigate("/create-profile");
  }, [isAuthenticated, isProfileComplete, loading, navigate]);

  // OTP countdown
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
    toast({ title: "OTP Sent!", description: `Verification code sent to +91 ${phone}` });
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

  const handleOtpSubmit = async () => {
    const code = otp.join("");
    if (code.length < 4) { setOtpError("Enter all 4 digits"); return; }
    if (code !== OTP_CODE) { setOtpError("Invalid OTP. Use 1234 for testing"); return; }

    setSubmitting(true);
    try {
      await login(phone);
      toast({ title: "Welcome! 🎉", description: "Logged in successfully" });
      // Navigation handled by useEffect above
    } catch (err: any) {
      setOtpError(err.message || "Login failed. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleGoogleLogin = async () => {
    setSubmitting(true);
    try {
      await loginWithGoogle("/auth");
    } catch (err: any) {
      toast({ title: "Google Login Failed", description: err.message, variant: "destructive" });
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex">
      {/* Left decorative panel */}
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

      {/* Right form panel */}
      <div className="flex-1 flex items-center justify-center p-6 sm:p-12">
        <div className="w-full max-w-md">
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
                  <h2 className="font-display text-2xl font-bold text-foreground">
                    Welcome to Chellam
                  </h2>
                  <p className="text-muted-foreground mt-1">
                    Enter your mobile number to register or sign in
                  </p>
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

                <div className="relative">
                  <div className="absolute inset-0 flex items-center">
                    <span className="w-full border-t border-border" />
                  </div>
                  <div className="relative flex justify-center text-xs uppercase">
                    <span className="bg-background px-2 text-muted-foreground">Or continue with</span>
                  </div>
                </div>

                <Button
                  variant="outline"
                  className="w-full gap-2 h-12"
                  onClick={handleGoogleLogin}
                  disabled={submitting}
                >
                  <svg className="w-4 h-4" viewBox="0 0 24 24">
                    <path fill="currentColor" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                    <path fill="currentColor" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                    <path fill="currentColor" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" />
                    <path fill="currentColor" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                  </svg>
                  {submitting ? "Redirecting…" : "Continue with Google"}
                </Button>

                <div className="flex items-start gap-2 p-3 rounded-xl bg-muted/50 border border-border">
                  <Shield className="w-4 h-4 text-primary mt-0.5 shrink-0" />
                  <p className="text-xs text-muted-foreground">
                    Your number is 100% safe. We never share your personal information with anyone.
                    Each mobile number creates a unique account.
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
                <button
                  onClick={() => { setStep("phone"); setOtp(["", "", "", ""]); }}
                  className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors"
                >
                  <ArrowLeft className="w-4 h-4" /> Change number
                </button>

                <div>
                  <h2 className="font-display text-2xl font-bold text-foreground">Verify OTP</h2>
                  <p className="text-muted-foreground mt-1">
                    Enter the 4-digit code sent to{" "}
                    <span className="font-semibold text-foreground">+91 {phone}</span>
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

                <Button
                  variant="hero"
                  className="w-full gap-2"
                  size="lg"
                  onClick={handleOtpSubmit}
                  disabled={submitting}
                >
                  {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
                  {submitting ? "Verifying…" : "Verify & Continue"}
                </Button>

                <p className="text-center text-sm text-muted-foreground">
                  {timer > 0 ? (
                    <>Resend OTP in <span className="font-semibold text-foreground">{timer}s</span></>
                  ) : (
                    <button
                      onClick={() => {
                        setTimer(30);
                        toast({ title: "OTP Resent!" });
                      }}
                      className="text-primary font-semibold hover:underline"
                    >
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
