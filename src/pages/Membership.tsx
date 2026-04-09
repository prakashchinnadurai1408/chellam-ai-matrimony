import { useState, useEffect, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useMembership } from "@/hooks/useMembership";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Crown, Star, Sparkles, Upload, Check, Clock, X, QrCode, Copy, Shield, Heart, MessageCircle, Eye, Loader2, ArrowRight, IndianRupee } from "lucide-react";
import { motion } from "framer-motion";
import { toast } from "sonner";

const tiers = [
  {
    id: "free" as const,
    name: "Free",
    icon: Star,
    color: "text-muted-foreground",
    bgColor: "bg-muted/30",
    features: ["Browse profiles", "Create profile", "Basic search", "AI matchmaking", "Send interests"],
    locked: ["View contact details", "Send messages", "See who viewed you", "AI match scores", "Priority support", "Dedicated matchmaker"],
  },
  {
    id: "premium" as const,
    name: "Premium",
    icon: Crown,
    color: "text-primary",
    bgColor: "bg-primary/5",
    features: ["Everything in Free", "View contact details", "Send unlimited messages", "See who viewed you", "AI match scores", "Advanced search"],
    locked: ["Priority support", "Dedicated matchmaker"],
  },
  {
    id: "concierge" as const,
    name: "Concierge",
    icon: Sparkles,
    color: "text-accent",
    bgColor: "bg-accent/5",
    features: ["Everything in Premium", "Priority support", "Dedicated matchmaker", "Profile boosting", "Handpicked matches", "Personal relationship advisor"],
    locked: [],
  },
];

const Membership = () => {
  const { user } = useAuth();
  const { membership, loading: memLoading } = useMembership(user?.id);
  const [settings, setSettings] = useState<any>(null);
  const [selectedTier, setSelectedTier] = useState<"premium" | "concierge" | null>(null);
  const [planType, setPlanType] = useState<"monthly" | "annual">("monthly");
  const [txnId, setTxnId] = useState("");
  const [screenshotFile, setScreenshotFile] = useState<File | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [pendingRequest, setPendingRequest] = useState<any>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const fetchSettings = async () => {
      const { data } = await supabase.from("payment_settings").select("*").limit(1).maybeSingle();
      setSettings(data);
    };
    fetchSettings();
  }, []);

  useEffect(() => {
    if (!user) return;
    const fetchPending = async () => {
      const { data } = await supabase
        .from("payment_requests")
        .select("*")
        .eq("user_id", user.id)
        .eq("status", "pending")
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();
      setPendingRequest(data);
    };
    fetchPending();
  }, [user]);

  const getPrice = (tier: "premium" | "concierge") => {
    if (!settings) return 0;
    if (tier === "premium") return planType === "monthly" ? settings.premium_monthly_price : settings.premium_annual_price;
    return planType === "monthly" ? settings.concierge_monthly_price : settings.concierge_annual_price;
  };

  const copyUpi = () => {
    if (settings?.upi_id) {
      navigator.clipboard.writeText(settings.upi_id);
      toast.success("UPI ID copied to clipboard!");
    }
  };

  const handleSubmitPayment = async () => {
    if (!user || !selectedTier) return;
    if (!txnId.trim()) { toast.error("Enter UPI transaction ID"); return; }

    setSubmitting(true);
    let screenshotUrl = "";

    if (screenshotFile) {
      const ext = screenshotFile.name.split(".").pop();
      const path = `${user.id}/${Date.now()}.${ext}`;
      const { error } = await supabase.storage.from("payment-uploads").upload(path, screenshotFile);
      if (error) { toast.error("Failed to upload screenshot"); setSubmitting(false); return; }
      const { data: urlData } = supabase.storage.from("payment-uploads").getPublicUrl(path);
      screenshotUrl = urlData.publicUrl;
    }

    const { error } = await supabase.from("payment_requests").insert({
      user_id: user.id,
      tier: selectedTier,
      plan_type: planType,
      amount: getPrice(selectedTier),
      upi_transaction_id: txnId.trim(),
      screenshot_url: screenshotUrl || null,
    });

    if (error) { toast.error("Failed to submit payment"); }
    else {
      toast.success("Payment submitted! We'll verify and activate your plan shortly.");
      setSelectedTier(null);
      setTxnId("");
      setScreenshotFile(null);
      const { data } = await supabase
        .from("payment_requests")
        .select("*")
        .eq("user_id", user.id)
        .eq("status", "pending")
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();
      setPendingRequest(data);
    }
    setSubmitting(false);
  };

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="container mx-auto px-4 pt-24 pb-12 max-w-5xl">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-8"
        >
          <Badge className="bg-primary/10 text-primary border-0 mb-4 gap-1.5">
            <Crown className="w-3.5 h-3.5" /> Membership Plans
          </Badge>
          <h1 className="font-display text-3xl md:text-4xl font-bold text-foreground">
            Choose Your Perfect Plan
          </h1>
          <p className="text-muted-foreground mt-2 max-w-lg mx-auto">
            Unlock premium features and find your perfect match faster with our AI-powered platform
          </p>
          {membership.tier !== "free" && (
            <Badge className="mt-3 gap-1.5" variant="default">
              <Crown className="w-3 h-3" /> Active: {membership.tier} plan
              {membership.expiresAt && ` · Expires ${new Date(membership.expiresAt).toLocaleDateString()}`}
            </Badge>
          )}
        </motion.div>

        {/* Plan toggle */}
        <div className="flex justify-center gap-2 mb-8">
          <Button variant={planType === "monthly" ? "default" : "outline"} size="sm" onClick={() => setPlanType("monthly")}>Monthly</Button>
          <Button variant={planType === "annual" ? "default" : "outline"} size="sm" onClick={() => setPlanType("annual")}>
            Annual <Badge variant="secondary" className="ml-1.5 text-[10px]">Save 33%</Badge>
          </Button>
        </div>

        {/* Pending request banner */}
        {pendingRequest && (
          <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}>
            <Card className="mb-6 border-secondary/30 bg-secondary/5">
              <CardContent className="py-4 flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-secondary/20 flex items-center justify-center">
                  <Clock className="w-5 h-5 text-secondary" />
                </div>
                <div className="flex-1">
                  <p className="text-sm font-medium text-foreground">Payment verification pending</p>
                  <p className="text-xs text-muted-foreground">
                    {pendingRequest.tier} plan · ₹{pendingRequest.amount} · UTR: {pendingRequest.upi_transaction_id} · Submitted {new Date(pendingRequest.created_at).toLocaleDateString()}
                  </p>
                </div>
                <Badge variant="secondary" className="shrink-0">Under Review</Badge>
              </CardContent>
            </Card>
          </motion.div>
        )}

        {/* Tier cards */}
        <div className="grid md:grid-cols-3 gap-6 mb-10">
          {tiers.map((tier, i) => {
            const isActive = membership.tier === tier.id;
            const Icon = tier.icon;
            return (
              <motion.div
                key={tier.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.1 }}
              >
                <Card className={`relative overflow-hidden transition-all h-full ${isActive ? "ring-2 ring-primary" : ""} ${tier.id === "premium" ? "md:scale-105 shadow-lg z-10" : ""}`}>
                  {tier.id === "premium" && (
                    <div className="absolute top-0 right-0 bg-primary text-primary-foreground text-[10px] font-bold px-3 py-1 rounded-bl-lg">MOST POPULAR</div>
                  )}
                  {tier.id === "concierge" && (
                    <div className="absolute top-0 right-0 bg-accent text-accent-foreground text-[10px] font-bold px-3 py-1 rounded-bl-lg">EXCLUSIVE</div>
                  )}
                  <CardHeader className="text-center pb-2">
                    <div className={`w-14 h-14 rounded-2xl ${tier.bgColor} flex items-center justify-center mx-auto mb-3`}>
                      <Icon className={`w-7 h-7 ${tier.color}`} />
                    </div>
                    <CardTitle className="font-display text-xl">{tier.name}</CardTitle>
                    <CardDescription>
                      {tier.id === "free" ? (
                        <span className="text-2xl font-bold text-foreground">Free</span>
                      ) : (
                        <div>
                          <span className="text-3xl font-bold text-foreground">
                            ₹{settings ? getPrice(tier.id as "premium" | "concierge") : "..."}
                          </span>
                          <span className="text-sm font-normal text-muted-foreground">/{planType === "monthly" ? "mo" : "yr"}</span>
                        </div>
                      )}
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <ul className="space-y-2.5 mb-6">
                      {tier.features.map((f) => (
                        <li key={f} className="flex items-center gap-2.5 text-sm">
                          <Check className="w-4 h-4 text-green-500 shrink-0" />{f}
                        </li>
                      ))}
                      {tier.locked.map((f) => (
                        <li key={f} className="flex items-center gap-2.5 text-sm text-muted-foreground">
                          <X className="w-4 h-4 shrink-0" />{f}
                        </li>
                      ))}
                    </ul>
                    {isActive ? (
                      <Button disabled className="w-full" variant="outline">✓ Current Plan</Button>
                    ) : tier.id !== "free" ? (
                      <Button className="w-full gap-2" variant={tier.id === "premium" ? "default" : "outline"} onClick={() => setSelectedTier(tier.id as "premium" | "concierge")}>
                        Upgrade to {tier.name} <ArrowRight className="w-4 h-4" />
                      </Button>
                    ) : null}
                  </CardContent>
                </Card>
              </motion.div>
            );
          })}
        </div>

        {/* Payment Section */}
        {selectedTier && settings && (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
            <Card className="max-w-lg mx-auto shadow-xl border-primary/20">
              <CardHeader className="text-center border-b border-border pb-4">
                <CardTitle className="flex items-center justify-center gap-2 text-xl">
                  <IndianRupee className="w-5 h-5 text-primary" /> Pay via UPI
                </CardTitle>
                <CardDescription className="text-base">
                  Pay <span className="font-bold text-foreground text-lg">₹{getPrice(selectedTier)}</span> for {selectedTier} ({planType}) plan
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6 pt-6">
                {/* UPI QR Code */}
                {(settings.qr_image_url || settings.upi_id) ? (
                  <div className="bg-muted/30 rounded-2xl p-6 text-center space-y-4 border border-border">
                    <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Scan QR or Pay to UPI ID</p>

                    {settings.qr_image_url && (
                      <div className="relative inline-block">
                        <img
                          src={settings.qr_image_url}
                          alt="UPI QR Code"
                          className="w-56 h-56 mx-auto rounded-xl border-2 border-border object-contain bg-white p-2"
                        />
                        <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 bg-primary text-primary-foreground text-[10px] font-bold px-3 py-1 rounded-full">
                          SCAN TO PAY
                        </div>
                      </div>
                    )}

                    {settings.upi_id && (
                      <div className="mt-4">
                        <p className="text-xs text-muted-foreground mb-1.5">UPI ID</p>
                        <div className="flex items-center justify-center gap-2">
                          <div className="bg-card border border-border rounded-lg px-4 py-2.5 inline-flex items-center gap-2">
                            <span className="font-mono font-bold text-foreground text-base select-all">{settings.upi_id}</span>
                            <button
                              onClick={copyUpi}
                              className="w-8 h-8 rounded-md bg-primary/10 hover:bg-primary/20 flex items-center justify-center transition-colors"
                              title="Copy UPI ID"
                            >
                              <Copy className="w-4 h-4 text-primary" />
                            </button>
                          </div>
                        </div>
                      </div>
                    )}

                    <div className="flex items-center justify-center gap-4 pt-2 text-xs text-muted-foreground">
                      <span className="flex items-center gap-1"><Shield className="w-3 h-3" /> Secure Payment</span>
                      <span className="flex items-center gap-1"><Clock className="w-3 h-3" /> Instant Processing</span>
                    </div>
                  </div>
                ) : (
                  <div className="bg-destructive/5 rounded-xl p-4 text-center">
                    <p className="text-sm text-destructive font-medium">Payment not configured yet</p>
                    <p className="text-xs text-muted-foreground mt-1">Please contact support to proceed</p>
                  </div>
                )}

                {/* Steps */}
                <div className="bg-muted/20 rounded-xl p-4 space-y-3">
                  <p className="text-xs font-semibold text-foreground uppercase tracking-wider">How to Pay</p>
                  <div className="space-y-2">
                    {[
                      "Open your UPI app (GPay, PhonePe, Paytm)",
                      settings.qr_image_url ? "Scan the QR code or send to the UPI ID above" : "Send payment to the UPI ID above",
                      `Pay ₹${getPrice(selectedTier)}`,
                      "Copy the transaction ID (UTR number) and paste below",
                    ].map((step, i) => (
                      <div key={i} className="flex gap-3 items-start">
                        <div className="w-5 h-5 rounded-full bg-primary/10 text-primary text-[10px] font-bold flex items-center justify-center shrink-0 mt-0.5">{i + 1}</div>
                        <p className="text-sm text-muted-foreground">{step}</p>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Transaction ID */}
                <div>
                  <Label className="text-sm font-medium">UPI Transaction ID / UTR Number <span className="text-destructive">*</span></Label>
                  <Input
                    placeholder="Enter 12-digit transaction ID"
                    value={txnId}
                    onChange={(e) => setTxnId(e.target.value)}
                    className="mt-1.5 text-base"
                  />
                  <p className="text-[11px] text-muted-foreground mt-1">Find this in your UPI app's transaction history</p>
                </div>

                {/* Screenshot upload */}
                <div>
                  <Label className="text-sm font-medium">Payment Screenshot <span className="text-muted-foreground text-xs">(recommended)</span></Label>
                  <div
                    className="mt-1.5 border-2 border-dashed border-border rounded-xl p-5 text-center cursor-pointer hover:border-primary/50 hover:bg-primary/[0.02] transition-all"
                    onClick={() => fileRef.current?.click()}
                  >
                    <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={(e) => setScreenshotFile(e.target.files?.[0] || null)} />
                    {screenshotFile ? (
                      <div className="flex items-center justify-center gap-2">
                        <Check className="w-4 h-4 text-green-500" />
                        <p className="text-sm text-foreground font-medium">{screenshotFile.name}</p>
                        <button onClick={(e) => { e.stopPropagation(); setScreenshotFile(null); }} className="text-muted-foreground hover:text-destructive">
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    ) : (
                      <div className="flex flex-col items-center gap-2 text-muted-foreground">
                        <Upload className="w-6 h-6" />
                        <p className="text-sm">Click to upload payment screenshot</p>
                        <p className="text-[11px]">Helps us verify faster</p>
                      </div>
                    )}
                  </div>
                </div>

                <div className="flex gap-3 pt-2">
                  <Button variant="outline" className="flex-1" onClick={() => { setSelectedTier(null); setTxnId(""); setScreenshotFile(null); }}>Cancel</Button>
                  <Button variant="hero" className="flex-1 gap-2" onClick={handleSubmitPayment} disabled={submitting}>
                    {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Shield className="w-4 h-4" />}
                    {submitting ? "Submitting…" : "Submit Payment"}
                  </Button>
                </div>

                <p className="text-center text-[11px] text-muted-foreground">
                  🔐 Your payment will be verified within 2-4 hours. Plan activates immediately after verification.
                </p>
              </CardContent>
            </Card>
          </motion.div>
        )}

        {/* Feature Comparison */}
        {!selectedTier && (
          <motion.div
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
          >
            <Card className="overflow-hidden">
              <CardHeader className="text-center">
                <CardTitle className="font-display text-xl">Why Upgrade?</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid sm:grid-cols-3 gap-6">
                  {[
                    { icon: MessageCircle, title: "Unlimited Messages", desc: "Chat directly with potential matches without limits" },
                    { icon: Eye, title: "Profile Visitors", desc: "See exactly who viewed your profile and when" },
                    { icon: Sparkles, title: "AI Match Scores", desc: "Access detailed AI compatibility analysis for every match" },
                    { icon: Shield, title: "Verified Badge", desc: "Get priority verification and a trust badge on your profile" },
                    { icon: Heart, title: "Send Interests", desc: "Send unlimited interests and get priority visibility" },
                    { icon: Crown, title: "Priority Support", desc: "Get dedicated customer support and relationship advice" },
                  ].map((f) => (
                    <div key={f.title} className="text-center p-4">
                      <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center mx-auto mb-3">
                        <f.icon className="w-6 h-6 text-primary" />
                      </div>
                      <h3 className="text-sm font-semibold text-foreground mb-1">{f.title}</h3>
                      <p className="text-xs text-muted-foreground">{f.desc}</p>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}
      </div>
      <Footer />
    </div>
  );
};

export default Membership;
