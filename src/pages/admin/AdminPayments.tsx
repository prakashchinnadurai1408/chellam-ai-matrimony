import { useState, useEffect, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import AdminLayout from "@/components/admin/AdminLayout";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { QrCode, Upload, Save, Check, X, Eye, Clock, IndianRupee } from "lucide-react";
import { toast } from "sonner";

const AdminPayments = () => {
  const { user } = useAuth();
  const [settings, setSettings] = useState<any>(null);
  const [upiId, setUpiId] = useState("");
  const [qrFile, setQrFile] = useState<File | null>(null);
  const [prices, setPrices] = useState({ pm: 499, pa: 3999, cm: 1999, ca: 15999 });
  const [requests, setRequests] = useState<any[]>([]);
  const [saving, setSaving] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    fetchSettings();
    fetchRequests();
  }, []);

  const fetchSettings = async () => {
    const { data } = await supabase.from("payment_settings").select("*").limit(1).single();
    if (data) {
      setSettings(data);
      setUpiId(data.upi_id || "");
      setPrices({
        pm: data.premium_monthly_price,
        pa: data.premium_annual_price,
        cm: data.concierge_monthly_price,
        ca: data.concierge_annual_price,
      });
    }
  };

  const fetchRequests = async () => {
    const { data } = await supabase
      .from("payment_requests")
      .select("*")
      .order("created_at", { ascending: false });
    if (!data) return;

    const enriched = [];
    for (const r of data) {
      const { data: profile } = await supabase
        .from("profiles")
        .select("first_name, last_name, phone")
        .eq("user_id", r.user_id)
        .single();
      enriched.push({
        ...r,
        name: [profile?.first_name, profile?.last_name].filter(Boolean).join(" ") || "Unknown",
        phone: profile?.phone || "—",
      });
    }
    setRequests(enriched);
  };

  const saveSettings = async () => {
    if (!settings) return;
    setSaving(true);

    let qrUrl = settings.qr_image_url;
    if (qrFile) {
      const path = `qr/${Date.now()}.${qrFile.name.split(".").pop()}`;
      const { error } = await supabase.storage.from("payment-uploads").upload(path, qrFile);
      if (error) { toast.error("Failed to upload QR"); setSaving(false); return; }
      const { data: urlData } = supabase.storage.from("payment-uploads").getPublicUrl(path);
      qrUrl = urlData.publicUrl;
    }

    const { error } = await supabase.from("payment_settings").update({
      upi_id: upiId.trim() || null,
      qr_image_url: qrUrl,
      premium_monthly_price: prices.pm,
      premium_annual_price: prices.pa,
      concierge_monthly_price: prices.cm,
      concierge_annual_price: prices.ca,
      updated_by: user?.id,
    }).eq("id", settings.id);

    if (error) toast.error("Failed to save");
    else { toast.success("Payment settings saved"); fetchSettings(); }
    setSaving(false);
  };

  const handleApprove = async (req: any) => {
    // Create membership
    const months = req.plan_type === "annual" ? 12 : 1;
    const expiresAt = new Date();
    expiresAt.setMonth(expiresAt.getMonth() + months);

    // Deactivate old memberships
    await supabase.from("memberships").update({ is_active: false }).eq("user_id", req.user_id).eq("is_active", true);

    await supabase.from("memberships").insert({
      user_id: req.user_id,
      tier: req.tier,
      plan_type: req.plan_type,
      expires_at: expiresAt.toISOString(),
    });

    await supabase.from("payment_requests").update({
      status: "approved",
      reviewed_by: user?.id,
      reviewed_at: new Date().toISOString(),
    }).eq("id", req.id);

    toast.success("Payment approved & membership activated");
    fetchRequests();
  };

  const handleReject = async (req: any) => {
    await supabase.from("payment_requests").update({
      status: "rejected",
      reviewed_by: user?.id,
      reviewed_at: new Date().toISOString(),
    }).eq("id", req.id);
    toast.success("Payment request rejected");
    fetchRequests();
  };

  const statusBadge = (s: string) => {
    if (s === "approved") return <Badge variant="default" className="text-[10px] bg-green-600">Approved</Badge>;
    if (s === "rejected") return <Badge variant="destructive" className="text-[10px]">Rejected</Badge>;
    return <Badge variant="secondary" className="text-[10px]">Pending</Badge>;
  };

  return (
    <AdminLayout>
      <div className="p-6 space-y-6">
        <div>
          <h1 className="font-display text-2xl font-bold text-foreground">Payment Settings</h1>
          <p className="text-sm text-muted-foreground mt-1">Configure UPI payment and manage payment requests</p>
        </div>

        {/* UPI Config */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2"><QrCode className="w-4 h-4" /> UPI Configuration</CardTitle>
            <CardDescription>Set your UPI ID and/or upload QR code for payments</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid sm:grid-cols-2 gap-4">
              <div>
                <Label className="text-xs">UPI ID</Label>
                <Input placeholder="yourname@upi" value={upiId} onChange={(e) => setUpiId(e.target.value)} className="mt-1.5" />
              </div>
              <div>
                <Label className="text-xs">QR Code Image</Label>
                <div
                  className="mt-1.5 border-2 border-dashed border-border rounded-lg p-3 text-center cursor-pointer hover:border-primary/50 transition-colors"
                  onClick={() => fileRef.current?.click()}
                >
                  <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={(e) => setQrFile(e.target.files?.[0] || null)} />
                  {qrFile ? (
                    <p className="text-xs text-foreground">{qrFile.name}</p>
                  ) : settings?.qr_image_url ? (
                    <img src={settings.qr_image_url} alt="QR" className="w-20 h-20 mx-auto rounded object-contain" />
                  ) : (
                    <div className="flex flex-col items-center gap-1 text-muted-foreground">
                      <Upload className="w-4 h-4" />
                      <p className="text-[11px]">Upload QR</p>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Pricing */}
            <div>
              <Label className="text-xs font-semibold">Pricing (₹)</Label>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-2">
                <div>
                  <Label className="text-[10px] text-muted-foreground">Premium/mo</Label>
                  <Input type="number" value={prices.pm} onChange={(e) => setPrices({ ...prices, pm: +e.target.value })} />
                </div>
                <div>
                  <Label className="text-[10px] text-muted-foreground">Premium/yr</Label>
                  <Input type="number" value={prices.pa} onChange={(e) => setPrices({ ...prices, pa: +e.target.value })} />
                </div>
                <div>
                  <Label className="text-[10px] text-muted-foreground">Concierge/mo</Label>
                  <Input type="number" value={prices.cm} onChange={(e) => setPrices({ ...prices, cm: +e.target.value })} />
                </div>
                <div>
                  <Label className="text-[10px] text-muted-foreground">Concierge/yr</Label>
                  <Input type="number" value={prices.ca} onChange={(e) => setPrices({ ...prices, ca: +e.target.value })} />
                </div>
              </div>
            </div>

            <Button onClick={saveSettings} disabled={saving} className="gap-1.5">
              <Save className="w-4 h-4" /> {saving ? "Saving…" : "Save Settings"}
            </Button>
          </CardContent>
        </Card>

        {/* Payment Requests */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2"><IndianRupee className="w-4 h-4" /> Payment Requests</CardTitle>
          </CardHeader>
          <CardContent>
            {requests.length === 0 ? (
              <p className="text-sm text-muted-foreground">No payment requests yet.</p>
            ) : (
              <div className="space-y-3">
                {requests.map((r) => (
                  <div key={r.id} className="flex items-center justify-between py-3 border-b border-border/30 last:border-0">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-xs font-semibold text-primary shrink-0">
                        {r.name[0]?.toUpperCase() || "U"}
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm font-medium text-foreground truncate">{r.name} · {r.phone}</p>
                        <p className="text-xs text-muted-foreground">
                          {r.tier} ({r.plan_type}) · ₹{r.amount} · UTR: {r.upi_transaction_id || "—"}
                        </p>
                        <p className="text-[10px] text-muted-foreground">{new Date(r.created_at).toLocaleString()}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      {r.screenshot_url && (
                        <a href={r.screenshot_url} target="_blank" rel="noopener noreferrer">
                          <Button variant="ghost" size="icon" className="h-7 w-7"><Eye className="w-3.5 h-3.5" /></Button>
                        </a>
                      )}
                      {statusBadge(r.status)}
                      {r.status === "pending" && (
                        <>
                          <Button variant="ghost" size="icon" className="h-7 w-7 text-green-600 hover:text-green-700" onClick={() => handleApprove(r)}>
                            <Check className="w-4 h-4" />
                          </Button>
                          <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive hover:text-destructive" onClick={() => handleReject(r)}>
                            <X className="w-4 h-4" />
                          </Button>
                        </>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </AdminLayout>
  );
};

export default AdminPayments;
