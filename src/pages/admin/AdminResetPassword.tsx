import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Shield, Loader2, Eye, EyeOff, CheckCircle } from "lucide-react";
import { motion } from "framer-motion";
import { useToast } from "@/hooks/use-toast";

const AdminResetPassword = () => {
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState("");
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    // Check for recovery type in hash
    const hash = window.location.hash;
    if (!hash.includes("type=recovery")) {
      // If not a recovery link, redirect
      navigate("/admin-login");
    }
  }, [navigate]);

  const handleReset = async () => {
    if (password.length < 8) { setError("Password must be at least 8 characters"); return; }
    if (password !== confirm) { setError("Passwords don't match"); return; }

    setLoading(true);
    setError("");

    const { error: updateError } = await supabase.auth.updateUser({ password });

    if (updateError) {
      setError(updateError.message);
    } else {
      setSuccess(true);
      toast({ title: "Password Updated! ✅", description: "You can now sign in with your new password." });
      setTimeout(() => navigate("/admin-login"), 2000);
    }
    setLoading(false);
  };

  if (success) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="text-center space-y-4">
          <CheckCircle className="w-16 h-16 text-secondary mx-auto" />
          <h1 className="font-display text-2xl font-bold text-foreground">Password Updated!</h1>
          <p className="text-muted-foreground">Redirecting to login...</p>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-6">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="w-14 h-14 rounded-2xl gradient-hero flex items-center justify-center mx-auto mb-4">
            <Shield className="w-7 h-7 text-primary-foreground" />
          </div>
          <h1 className="font-display text-2xl font-bold text-foreground">Reset Password</h1>
          <p className="text-muted-foreground text-sm mt-1">Enter your new password</p>
        </div>

        <div className="bg-card rounded-2xl border border-border p-6 shadow-card space-y-5">
          <div className="space-y-2">
            <Label>New Password</Label>
            <div className="relative">
              <Input
                type={showPassword ? "text" : "password"}
                placeholder="Min 8 characters"
                value={password}
                onChange={(e) => { setPassword(e.target.value); setError(""); }}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          <div className="space-y-2">
            <Label>Confirm Password</Label>
            <Input
              type="password"
              placeholder="Re-enter password"
              value={confirm}
              onChange={(e) => { setConfirm(e.target.value); setError(""); }}
              onKeyDown={(e) => e.key === "Enter" && handleReset()}
            />
          </div>

          {error && <p className="text-xs text-destructive">{error}</p>}

          <Button variant="hero" className="w-full" size="lg" onClick={handleReset} disabled={loading}>
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : "Update Password"}
          </Button>
        </div>
      </motion.div>
    </div>
  );
};

export default AdminResetPassword;
