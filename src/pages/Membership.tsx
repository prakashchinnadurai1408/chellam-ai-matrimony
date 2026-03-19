import { useState, useEffect, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useMembership } from "@/hooks/useMembership";
import Navbar from "@/components/Navbar";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Crown, Star, Sparkles, Upload, Check, Clock, X, QrCode } from "lucide-react";
import { toast } from "sonner";

const tiers = [
  {
    id: "free" as const,
    name: "Free",
    icon: Star,
    color: "text-muted-foreground",
    features: ["Browse profiles", "Create profile", "Basic search"],
    locked: ["View contact details", "Send messages", "See who viewed you", "AI match scores"],
  },
  {
    id: "premium" as const,
    name: "Premium",
    icon: Crown,
    color: "text-primary",
    features: ["Everything in Free", "View contact details", "Send messages", "See who viewed you", "AI match scores"],
    locked: ["Priority support", "Dedicated matchmaker"],
  },
  {
    id: "concierge" as const,
    name: "Concierge",
    icon: Sparkles,
    color: "text-accent",
    features: ["Everything in Premium", "Priority support", "Dedicated matchmaker", "Profile boosting"],
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
      const { data } = await supabase.from("payment_settings").select("*").limit(1).single();
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
      // Refresh pending
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
        <div className="text-center mb-8">
          <h1 className="font-display text-3xl font-bold text-foreground">Membership Plans</h1>
          <p className="text-muted-foreground mt-2">Unlock premium features for your perfect match</p>
          {membership.tier !== "free" && (
            <Badge className="mt-3 gap-1.5" variant="default">
              <Crown className="w-3 h-3" /> Active: {membership.tier} plan
              {membership.expiresAt && ` · Expires ${new Date(membership.expiresAt).toLocaleDateString()}`}
            </Badge>
          )}
        </div>

        {/* Plan toggle */}
        <div className="flex justify-center gap-2 mb-8">
          <Button variant={planType === "monthly" ? "default" : "outline"} size="sm" onClick={() => setPlanType("monthly")}>Monthly</Button>
          <Button variant={planType === "annual" ? "default" : "outline"} size="sm" onClick={() => setPlanType("annual")}>
            Annual <Badge variant="secondary" className="ml-1.5 text-[10px]">Save 33%</Badge>
          </Button>
        </div>

        {/* Pending request banner */}
        {pendingRequest && (
          <Card className="mb-6 border-secondary/30 bg-secondary/5">
            <CardContent className="py-4 flex items-center gap-3">
              <Clock className="w-5 h-5 text-secondary" />
              <div>
                <p className="text-sm font-medium text-foreground">Payment verification pending</p>
                <p className="text-xs text-muted-foreground">
                  {pendingRequest.tier} plan · ₹{pendingRequest.amount} · Submitted {new Date(pendingRequest.created_at).toLocaleDateString()}
                </p>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Tier cards */}
        <div className="grid md:grid-cols-3 gap-6 mb-10">
          {tiers.map((tier) => {
            const isActive = membership.tier === tier.id;
            const Icon = tier.icon;
            return (
              <Card key={tier.id} className={`relative overflow-hidden transition-all ${isActive ? "ring-2 ring-primary" : ""} ${tier.id === "premium" ? "md:scale-105 shadow-lg" : ""}`}>
                {tier.id === "premium" && (
                  <div className="absolute top-0 right-0 bg-primary text-primary-foreground text-[10px] font-bold px-3 py-1 rounded-bl-lg">POPULAR</div>
                )}
                <CardHeader className="text-center">
                  <Icon className={`w-8 h-8 mx-auto mb-2 ${tier.color}`} />
                  <CardTitle className="font-display text-xl">{tier.name}</CardTitle>
                  <CardDescription>
                    {tier.id === "free" ? "Free forever" : (
                      <span className="text-2xl font-bold text-foreground">
                        ₹{settings ? getPrice(tier.id as "premium" | "concierge") : "..."}{" "}
                        <span className="text-sm font-normal text-muted-foreground">/{planType === "monthly" ? "mo" : "yr"}</span>
                      </span>
                    )}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-2 mb-4">
                    {tier.features.map((f) => (
                      <li key={f} className="flex items-center gap-2 text-sm"><Check className="w-3.5 h-3.5 text-primary" />{f}</li>
                    ))}
                    {tier.locked.map((f) => (
                      <li key={f} className="flex items-center gap-2 text-sm text-muted-foreground"><X className="w-3.5 h-3.5" />{f}</li>
                    ))}
                  </ul>
                  {isActive ? (
                    <Button disabled className="w-full" variant="outline">Current Plan</Button>
                  ) : tier.id !== "free" ? (
                    <Button className="w-full" variant={tier.id === "premium" ? "default" : "outline"} onClick={() => setSelectedTier(tier.id as "premium" | "concierge")}>
                      Upgrade to {tier.name}
                    </Button>
                  ) : null}
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* Payment modal-like section */}
        {selectedTier && settings && (
          <Card className="max-w-lg mx-auto">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <QrCode className="w-5 h-5 text-primary" /> Pay via UPI
              </CardTitle>
              <CardDescription>
                Pay ₹{getPrice(selectedTier)} for {selectedTier} ({planType}) plan
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-5">
              {/* UPI details */}
              <div className="bg-muted/50 rounded-xl p-4 text-center space-y-3">
                {settings.qr_image_url && (
                  <img src={settings.qr_image_url} alt="UPI QR Code" className="w-48 h-48 mx-auto rounded-lg border border-border object-contain" />
                )}
                {settings.upi_id && (
                  <div>
                    <p className="text-xs text-muted-foreground">UPI ID</p>
                    <p className="text-sm font-mono font-semibold text-foreground select-all">{settings.upi_id}</p>
                  </div>
                )}
                {!settings.upi_id && !settings.qr_image_url && (
                  <p className="text-sm text-destructive">Payment not configured yet. Please contact support.</p>
                )}
              </div>

              {/* Transaction ID */}
              <div>
                <Label className="text-xs">UPI Transaction ID / UTR Number</Label>
                <Input placeholder="Enter transaction ID after payment" value={txnId} onChange={(e) => setTxnId(e.target.value)} className="mt-1.5" />
              </div>

              {/* Screenshot upload */}
              <div>
                <Label className="text-xs">Payment Screenshot (optional)</Label>
                <div
                  className="mt-1.5 border-2 border-dashed border-border rounded-lg p-4 text-center cursor-pointer hover:border-primary/50 transition-colors"
                  onClick={() => fileRef.current?.click()}
                >
                  <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={(e) => setScreenshotFile(e.target.files?.[0] || null)} />
                  {screenshotFile ? (
                    <p className="text-sm text-foreground">{screenshotFile.name}</p>
                  ) : (
                    <div className="flex flex-col items-center gap-1 text-muted-foreground">
                      <Upload className="w-5 h-5" />
                      <p className="text-xs">Click to upload screenshot</p>
                    </div>
                  )}
                </div>
              </div>

              <div className="flex gap-3">
                <Button variant="outline" className="flex-1" onClick={() => setSelectedTier(null)}>Cancel</Button>
                <Button className="flex-1" onClick={handleSubmitPayment} disabled={submitting}>
                  {submitting ? "Submitting…" : "Submit Payment"}
                </Button>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
};

export default Membership;
