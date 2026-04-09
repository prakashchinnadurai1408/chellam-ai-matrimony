import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import AdminLayout from "@/components/admin/AdminLayout";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Sliders, Save, RotateCcw, Loader2, Info } from "lucide-react";

const DEFAULT_WEIGHTS = { age: 20, religion: 25, caste: 15, education: 15, profession: 10, location: 10, height: 5 };
const WEIGHT_META: Record<string, { label: string; description: string }> = {
  age: { label: "Age Compatibility", description: "How much age proximity matters in matching" },
  religion: { label: "Religion", description: "Religious compatibility weight" },
  caste: { label: "Caste / Community", description: "Caste and community matching weight" },
  education: { label: "Education Level", description: "Education qualification matching weight" },
  profession: { label: "Profession", description: "Career and profession compatibility weight" },
  location: { label: "Location", description: "Geographic proximity weight" },
  height: { label: "Height", description: "Physical attribute compatibility weight" },
};

interface ConfigRow { config_key: string; config_value: any }

const AdminMatchmaking = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [weights, setWeights] = useState({ ...DEFAULT_WEIGHTS });
  const [ageFlex, setAgeFlex] = useState(5);
  const [boostVerified, setBoostVerified] = useState(true);
  const [dailyMatchCount, setDailyMatchCount] = useState(10);
  const [requirePhoto, setRequirePhoto] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const fetchConfig = async () => {
    setLoading(true);
    const { data } = await (supabase as any).from("matchmaking_config").select("*");
    if (data) {
      const map = Object.fromEntries((data as ConfigRow[]).map(r => [r.config_key, r.config_value]));
      if (map.weights) setWeights(map.weights);
      if (map.age_flexibility) setAgeFlex(Number(map.age_flexibility));
      if (map.boost_verified !== undefined) setBoostVerified(String(map.boost_verified) === "true");
      if (map.daily_match_count) setDailyMatchCount(Number(map.daily_match_count));
      if (map.require_photo !== undefined) setRequirePhoto(String(map.require_photo) === "true");
    }
    setLoading(false);
  };

  useEffect(() => { fetchConfig(); }, []);

  const weightSum = Object.values(weights).reduce((a, b) => a + b, 0);

  const updateWeight = (key: string, value: number) => {
    setWeights(w => ({ ...w, [key]: Math.max(0, Math.min(100, value)) }));
  };

  const normalizeWeights = () => {
    const total = Object.values(weights).reduce((a, b) => a + b, 0);
    if (total === 0) return;
    const normalized = Object.fromEntries(Object.entries(weights).map(([k, v]) => [k, Math.round((v / total) * 100)]));
    // Adjust rounding error on first key
    const newSum = Object.values(normalized).reduce((a, b) => a + b, 0);
    const diff = 100 - newSum;
    const firstKey = Object.keys(normalized)[0];
    normalized[firstKey] += diff;
    setWeights(normalized as typeof DEFAULT_WEIGHTS);
  };

  const saveConfig = async () => {
    if (weightSum !== 100) { toast({ title: "Weights must sum to 100", description: `Current sum: ${weightSum}. Use "Normalize" to fix.`, variant: "destructive" }); return; }
    setSaving(true);

    const configs = [
      { config_key: "weights", config_value: weights },
      { config_key: "age_flexibility", config_value: String(ageFlex) },
      { config_key: "boost_verified", config_value: String(boostVerified) },
      { config_key: "daily_match_count", config_value: String(dailyMatchCount) },
      { config_key: "require_photo", config_value: String(requirePhoto) },
    ];

    for (const cfg of configs) {
      await (supabase as any).from("matchmaking_config").upsert({ ...cfg, updated_by: user?.id, updated_at: new Date().toISOString() }, { onConflict: "config_key" });
    }

    toast({ title: "Configuration Saved", description: "Algorithm weights updated successfully." });
    setSaving(false);
  };

  const resetToDefaults = () => {
    setWeights({ ...DEFAULT_WEIGHTS });
    setAgeFlex(5);
    setBoostVerified(true);
    setDailyMatchCount(10);
    setRequirePhoto(false);
    toast({ title: "Reset to defaults" });
  };

  const weightColor = (sum: number) => {
    if (sum === 100) return "text-green-600";
    if (sum > 90 && sum < 110) return "text-amber-600";
    return "text-destructive";
  };

  if (loading) return (
    <AdminLayout>
      <div className="p-6 flex items-center justify-center py-16">
        <Loader2 className="w-6 h-6 animate-spin text-primary" />
      </div>
    </AdminLayout>
  );

  return (
    <AdminLayout>
      <div className="p-6 space-y-6 max-w-3xl">
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div>
            <h1 className="font-display text-2xl font-bold text-foreground">Matchmaking Configuration</h1>
            <p className="text-sm text-muted-foreground mt-0.5">Configure algorithm weights and matching parameters</p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={resetToDefaults}>
              <RotateCcw className="w-3 h-3 mr-1.5" /> Reset Defaults
            </Button>
            <Button size="sm" onClick={saveConfig} disabled={saving}>
              {saving ? <Loader2 className="w-4 h-4 animate-spin mr-1" /> : <Save className="w-3 h-3 mr-1.5" />}
              Save Config
            </Button>
          </div>
        </div>

        {/* Algorithm Weights */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-base flex items-center gap-2">
                <Sliders className="w-4 h-4 text-primary" /> Algorithm Weights
              </CardTitle>
              <div className="flex items-center gap-2">
                <span className={`text-sm font-bold ${weightColor(weightSum)}`}>
                  Sum: {weightSum}/100
                </span>
                {weightSum !== 100 && (
                  <Button variant="outline" size="sm" onClick={normalizeWeights} className="text-xs h-7">Normalize</Button>
                )}
              </div>
            </div>
            <p className="text-xs text-muted-foreground mt-1">Weights determine how much each attribute contributes to the overall match score. They must sum to 100.</p>
          </CardHeader>
          <CardContent className="space-y-5">
            {Object.entries(weights).map(([key, value]) => (
              <div key={key} className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-foreground">{WEIGHT_META[key]?.label || key}</p>
                    <p className="text-xs text-muted-foreground">{WEIGHT_META[key]?.description}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <button onClick={() => updateWeight(key, value - 1)}
                      className="w-6 h-6 rounded border border-input flex items-center justify-center text-muted-foreground hover:text-foreground text-xs">−</button>
                    <span className="w-8 text-center text-sm font-bold text-foreground">{value}</span>
                    <button onClick={() => updateWeight(key, value + 1)}
                      className="w-6 h-6 rounded border border-input flex items-center justify-center text-muted-foreground hover:text-foreground text-xs">+</button>
                  </div>
                </div>
                <div className="relative h-2 bg-muted rounded-full overflow-hidden">
                  <input
                    type="range" min="0" max="50" value={value}
                    onChange={e => updateWeight(key, Number(e.target.value))}
                    className="absolute inset-0 w-full opacity-0 cursor-pointer h-2"
                  />
                  <div
                    className="h-full bg-primary rounded-full transition-all"
                    style={{ width: `${(value / 50) * 100}%` }}
                  />
                </div>
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Other Settings */}
        <Card>
          <CardHeader><CardTitle className="text-base">Matching Parameters</CardTitle></CardHeader>
          <CardContent className="space-y-5">
            {/* Age Flexibility */}
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium">Age Flexibility</p>
                <p className="text-xs text-muted-foreground">± years allowed beyond stated preference</p>
              </div>
              <div className="flex items-center gap-2">
                <button onClick={() => setAgeFlex(v => Math.max(0, v - 1))} className="w-6 h-6 rounded border border-input flex items-center justify-center text-xs">−</button>
                <span className="w-8 text-center font-bold">{ageFlex}</span>
                <button onClick={() => setAgeFlex(v => Math.min(15, v + 1))} className="w-6 h-6 rounded border border-input flex items-center justify-center text-xs">+</button>
              </div>
            </div>

            {/* Daily Match Count */}
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium">Daily Match Count</p>
                <p className="text-xs text-muted-foreground">Number of AI-suggested matches per user per day</p>
              </div>
              <div className="flex items-center gap-2">
                <button onClick={() => setDailyMatchCount(v => Math.max(1, v - 1))} className="w-6 h-6 rounded border border-input flex items-center justify-center text-xs">−</button>
                <span className="w-8 text-center font-bold">{dailyMatchCount}</span>
                <button onClick={() => setDailyMatchCount(v => Math.min(50, v + 1))} className="w-6 h-6 rounded border border-input flex items-center justify-center text-xs">+</button>
              </div>
            </div>

            {/* Boost Verified */}
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium">Boost Verified Profiles</p>
                <p className="text-xs text-muted-foreground">Show verified profiles higher in search results</p>
              </div>
              <button
                onClick={() => setBoostVerified(v => !v)}
                className={`w-11 h-6 rounded-full transition-colors relative ${boostVerified ? "bg-primary" : "bg-muted"}`}>
                <span className={`absolute top-0.5 w-5 h-5 bg-white rounded-full shadow transition-all ${boostVerified ? "left-5.5 translate-x-0.5" : "left-0.5"}`} />
              </button>
            </div>

            {/* Require Photo */}
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium">Require Photo in Results</p>
                <p className="text-xs text-muted-foreground">Only include profiles with photos in match results</p>
              </div>
              <button
                onClick={() => setRequirePhoto(v => !v)}
                className={`w-11 h-6 rounded-full transition-colors relative ${requirePhoto ? "bg-primary" : "bg-muted"}`}>
                <span className={`absolute top-0.5 w-5 h-5 bg-white rounded-full shadow transition-all ${requirePhoto ? "left-5.5 translate-x-0.5" : "left-0.5"}`} />
              </button>
            </div>
          </CardContent>
        </Card>

        {/* Weight Distribution Preview */}
        <Card>
          <CardHeader><CardTitle className="text-sm">Weight Distribution Preview</CardTitle></CardHeader>
          <CardContent>
            <div className="space-y-2">
              {Object.entries(weights).sort((a, b) => b[1] - a[1]).map(([key, value]) => (
                <div key={key} className="flex items-center gap-3">
                  <span className="text-xs text-muted-foreground w-28 shrink-0">{WEIGHT_META[key]?.label || key}</span>
                  <div className="flex-1 bg-muted rounded-full h-2">
                    <div className="bg-primary h-2 rounded-full transition-all" style={{ width: `${value}%` }} />
                  </div>
                  <span className="text-xs font-medium w-8 text-right">{value}%</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <div className="flex items-start gap-2 p-3 rounded-lg bg-muted/50 border border-border">
          <Info className="w-4 h-4 text-muted-foreground mt-0.5 shrink-0" />
          <p className="text-xs text-muted-foreground">
            Changes to algorithm weights will take effect for new match calculations. Existing pre-computed scores in <code className="bg-muted px-1 rounded">ai_match_scores</code> are not retroactively updated.
          </p>
        </div>
      </div>
    </AdminLayout>
  );
};

export default AdminMatchmaking;
