import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Heart, Shield, Loader2, Eye, EyeOff, Mail } from "lucide-react";
import { motion } from "framer-motion";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import { useAdminRole } from "@/hooks/useAdminRole";

const AdminLogin = () => {
  const [mode, setMode] = useState<"login" | "reset">("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const { user } = useAuth();
  const { isAdmin, loading: roleLoading } = useAdminRole(user?.id);
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    if (!roleLoading && user && isAdmin) {
      navigate("/admin");
    }
  }, [user, isAdmin, roleLoading, navigate]);

  const handleLogin = async () => {
    if (!email || !password) { setError("Enter email and password"); return; }
    setLoading(true);
    setError("");

    const { error: signInError } = await supabase.auth.signInWithPassword({
      email: email.trim(),
      password,
    });

    if (signInError) {
      setError(signInError.message);
      setLoading(false);
      return;
    }

    toast({ title: "Welcome, Admin! 🔐", description: "Redirecting to dashboard..." });
    // useEffect will handle redirect once role is confirmed
    setLoading(false);
  };

  const handlePasswordReset = async () => {
    if (!email) { setError("Enter your registered email"); return; }
    setLoading(true);
    setError("");

    const { error: resetError } = await supabase.auth.resetPasswordForEmail(email.trim(), {
      redirectTo: `${window.location.origin}/admin/reset-password`,
    });

    if (resetError) {
      setError(resetError.message);
    } else {
      toast({ title: "Reset Link Sent", description: "Check your email for the password reset link." });
      setMode("login");
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-6">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md"
      >
        <div className="text-center mb-8">
          <div className="w-14 h-14 rounded-2xl gradient-hero flex items-center justify-center mx-auto mb-4">
            <Shield className="w-7 h-7 text-primary-foreground" />
          </div>
          <h1 className="font-display text-2xl font-bold text-foreground">Admin Portal</h1>
          <p className="text-muted-foreground text-sm mt-1">
            {mode === "login" ? "Sign in to manage Chellam" : "Reset your admin password"}
          </p>
        </div>

        <div className="bg-card rounded-2xl border border-border p-6 shadow-card space-y-5">
          <div className="space-y-2">
            <Label>Email</Label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                type="email"
                placeholder="admin@example.com"
                value={email}
                onChange={(e) => { setEmail(e.target.value); setError(""); }}
                onKeyDown={(e) => e.key === "Enter" && (mode === "login" ? handleLogin() : handlePasswordReset())}
                className="pl-10"
              />
            </div>
          </div>

          {mode === "login" && (
            <div className="space-y-2">
              <Label>Password</Label>
              <div className="relative">
                <Input
                  type={showPassword ? "text" : "password"}
                  placeholder="Enter password"
                  value={password}
                  onChange={(e) => { setPassword(e.target.value); setError(""); }}
                  onKeyDown={(e) => e.key === "Enter" && handleLogin()}
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
          )}

          {error && <p className="text-xs text-destructive">{error}</p>}

          <Button
            variant="hero"
            className="w-full gap-2"
            size="lg"
            onClick={mode === "login" ? handleLogin : handlePasswordReset}
            disabled={loading}
          >
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Shield className="w-4 h-4" />}
            {loading ? "Please wait…" : mode === "login" ? "Sign In" : "Send Reset Link"}
          </Button>

          <div className="text-center">
            {mode === "login" ? (
              <button
                onClick={() => { setMode("reset"); setError(""); }}
                className="text-sm text-primary hover:underline"
              >
                Forgot Password?
              </button>
            ) : (
              <button
                onClick={() => { setMode("login"); setError(""); }}
                className="text-sm text-primary hover:underline"
              >
                Back to Sign In
              </button>
            )}
          </div>
        </div>

        <p className="text-center text-xs text-muted-foreground mt-6">
          <button onClick={() => navigate("/")} className="hover:text-foreground transition-colors">
            ← Back to Chellam
          </button>
        </p>
      </motion.div>
    </div>
  );
};

export default AdminLogin;
