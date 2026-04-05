import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Slider } from "@/components/ui/slider";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  Heart, Save, RotateCcw, Sparkles, MapPin, GraduationCap,
  Users, Star, Loader2,
} from "lucide-react";
import { motion } from "framer-motion";

const religions = ["Hindu", "Muslim", "Christian", "Sikh", "Jain", "Buddhist", "Parsi", "Other"];
const communities = [
  "Brahmin", "Kshatriya", "Vaishya", "Kayastha", "Maratha", "Nair",
  "Reddy", "Yadav", "Jat", "Rajput", "Agarwal", "Iyer", "Iyengar", "Other",
];
const educationOptions = [
  "B.Tech/B.E.", "MBBS/MD", "MBA", "M.Tech/M.E.", "B.Com", "B.Sc",
  "M.Sc", "BBA", "LLB/LLM", "Ph.D", "CA/CS", "Other",
];
const locations = [
  "Mumbai", "Delhi", "Bangalore", "Chennai", "Hyderabad", "Pune",
  "Kolkata", "Ahmedabad", "Jaipur", "Lucknow", "Kochi", "Other",
];
const maritalOptions = ["Never Married", "Divorced", "Widowed", "Annulled"];
const heightOptions = [
  "4'6\"", "4'7\"", "4'8\"", "4'9\"", "4'10\"", "4'11\"",
  "5'0\"", "5'1\"", "5'2\"", "5'3\"", "5'4\"", "5'5\"", "5'6\"", "5'7\"", "5'8\"", "5'9\"", "5'10\"", "5'11\"",
  "6'0\"", "6'1\"", "6'2\"", "6'3\"", "6'4\"", "6'5\"", "6'6\"",
];

const Preferences = () => {
  const { isAuthenticated, user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [ageRange, setAgeRange] = useState([21, 35]);
  const [minHeight, setMinHeight] = useState("");
  const [maxHeight, setMaxHeight] = useState("");
  const [religion, setReligion] = useState("");
  const [selectedCommunities, setSelectedCommunities] = useState<string[]>([]);
  const [selectedEducation, setSelectedEducation] = useState<string[]>([]);
  const [selectedLocations, setSelectedLocations] = useState<string[]>([]);
  const [maritalStatus, setMaritalStatus] = useState("");

  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      navigate("/auth");
    }
  }, [authLoading, isAuthenticated, navigate]);

  // Load existing preferences
  useEffect(() => {
    if (!user) return;
    const load = async () => {
      const { data } = await supabase
        .from("partner_preferences")
        .select("*")
        .eq("user_id", user.id)
        .single();
      if (data) {
        setAgeRange([data.min_age ?? 21, data.max_age ?? 35]);
        setMinHeight(data.min_height ?? "");
        setMaxHeight(data.max_height ?? "");
        setReligion(data.preferred_religion ?? "");
        setSelectedCommunities(data.preferred_communities ?? []);
        setSelectedEducation(data.preferred_education ?? []);
        setSelectedLocations(data.preferred_locations ?? []);
        setMaritalStatus(data.preferred_marital_status ?? "");
      }
      setLoading(false);
    };
    load();
  }, [user]);

  const toggleItem = (list: string[], setList: (v: string[]) => void, item: string) => {
    setList(list.includes(item) ? list.filter((i) => i !== item) : [...list, item]);
  };

  const handleSave = async () => {
    if (!user) return;
    setSaving(true);
    try {
      const prefs = {
        user_id: user.id,
        min_age: ageRange[0],
        max_age: ageRange[1],
        min_height: minHeight || null,
        max_height: maxHeight || null,
        preferred_religion: religion || null,
        preferred_communities: selectedCommunities.length > 0 ? selectedCommunities : null,
        preferred_education: selectedEducation.length > 0 ? selectedEducation : null,
        preferred_locations: selectedLocations.length > 0 ? selectedLocations : null,
        preferred_marital_status: maritalStatus || null,
      };

      const { data: existing } = await supabase
        .from("partner_preferences")
        .select("id")
        .eq("user_id", user.id)
        .single();

      if (existing) {
        const { error } = await supabase
          .from("partner_preferences")
          .update(prefs)
          .eq("user_id", user.id);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from("partner_preferences")
          .insert(prefs);
        if (error) throw error;
      }

      toast.success("Preferences saved! AI matching will use these for better results.");
    } catch (err: any) {
      toast.error(err.message || "Failed to save preferences");
    } finally {
      setSaving(false);
    }
  };

  const handleReset = () => {
    setAgeRange([21, 35]);
    setMinHeight("");
    setMaxHeight("");
    setReligion("");
    setSelectedCommunities([]);
    setSelectedEducation([]);
    setSelectedLocations([]);
    setMaritalStatus("");
    toast.info("Preferences reset. Save to apply changes.");
  };

  if (authLoading || loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main className="pt-24 pb-16">
        <div className="container mx-auto max-w-3xl px-4">
          {/* Header */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center mb-10"
          >
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 text-primary text-sm font-medium mb-4">
              <Heart className="w-4 h-4" /> Partner Preferences
            </div>
            <h1 className="font-display text-3xl md:text-4xl font-bold text-foreground mb-3">
              Your Ideal Match
            </h1>
            <p className="text-muted-foreground max-w-lg mx-auto">
              Configure your preferences to help our AI find the most compatible matches for you.
            </p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="space-y-8"
          >
            {/* Age Range */}
            <section className="bg-card rounded-2xl border border-border p-6 shadow-sm">
              <div className="flex items-center gap-2 mb-4">
                <Users className="w-5 h-5 text-primary" />
                <h2 className="font-display text-lg font-semibold text-foreground">Age Range</h2>
              </div>
              <div className="space-y-4">
                <Slider
                  value={ageRange}
                  onValueChange={setAgeRange}
                  min={18}
                  max={60}
                  step={1}
                  className="w-full"
                />
                <div className="flex justify-between text-sm text-muted-foreground">
                  <span>Min: <strong className="text-foreground">{ageRange[0]} years</strong></span>
                  <span>Max: <strong className="text-foreground">{ageRange[1]} years</strong></span>
                </div>
              </div>
            </section>

            {/* Height Range */}
            <section className="bg-card rounded-2xl border border-border p-6 shadow-sm">
              <div className="flex items-center gap-2 mb-4">
                <Star className="w-5 h-5 text-secondary" />
                <h2 className="font-display text-lg font-semibold text-foreground">Height Range</h2>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-muted-foreground text-sm mb-1.5 block">Minimum Height</Label>
                  <Select value={minHeight} onValueChange={setMinHeight}>
                    <SelectTrigger><SelectValue placeholder="Any" /></SelectTrigger>
                    <SelectContent>
                      {heightOptions.map((h) => (
                        <SelectItem key={h} value={h}>{h}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label className="text-muted-foreground text-sm mb-1.5 block">Maximum Height</Label>
                  <Select value={maxHeight} onValueChange={setMaxHeight}>
                    <SelectTrigger><SelectValue placeholder="Any" /></SelectTrigger>
                    <SelectContent>
                      {heightOptions.map((h) => (
                        <SelectItem key={h} value={h}>{h}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </section>

            {/* Religion & Marital Status */}
            <section className="bg-card rounded-2xl border border-border p-6 shadow-sm">
              <div className="flex items-center gap-2 mb-4">
                <Sparkles className="w-5 h-5 text-accent" />
                <h2 className="font-display text-lg font-semibold text-foreground">Religion & Marital Status</h2>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-muted-foreground text-sm mb-1.5 block">Preferred Religion</Label>
                  <Select value={religion} onValueChange={setReligion}>
                    <SelectTrigger><SelectValue placeholder="Any religion" /></SelectTrigger>
                    <SelectContent>
                      {religions.map((r) => (
                        <SelectItem key={r} value={r}>{r}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label className="text-muted-foreground text-sm mb-1.5 block">Marital Status</Label>
                  <Select value={maritalStatus} onValueChange={setMaritalStatus}>
                    <SelectTrigger><SelectValue placeholder="Any" /></SelectTrigger>
                    <SelectContent>
                      {maritalOptions.map((m) => (
                        <SelectItem key={m} value={m}>{m}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </section>

            {/* Communities */}
            <section className="bg-card rounded-2xl border border-border p-6 shadow-sm">
              <div className="flex items-center gap-2 mb-4">
                <Users className="w-5 h-5 text-primary" />
                <h2 className="font-display text-lg font-semibold text-foreground">Preferred Communities</h2>
              </div>
              <div className="flex flex-wrap gap-2">
                {communities.map((c) => (
                  <button
                    key={c}
                    onClick={() => toggleItem(selectedCommunities, setSelectedCommunities, c)}
                    className={`px-3 py-1.5 rounded-full text-sm font-medium border transition-all ${
                      selectedCommunities.includes(c)
                        ? "bg-primary text-primary-foreground border-primary"
                        : "bg-muted text-muted-foreground border-border hover:border-primary/50"
                    }`}
                  >
                    {c}
                  </button>
                ))}
              </div>
              {selectedCommunities.length > 0 && (
                <p className="text-xs text-muted-foreground mt-3">{selectedCommunities.length} selected</p>
              )}
            </section>

            {/* Education */}
            <section className="bg-card rounded-2xl border border-border p-6 shadow-sm">
              <div className="flex items-center gap-2 mb-4">
                <GraduationCap className="w-5 h-5 text-secondary" />
                <h2 className="font-display text-lg font-semibold text-foreground">Preferred Education</h2>
              </div>
              <div className="flex flex-wrap gap-2">
                {educationOptions.map((e) => (
                  <button
                    key={e}
                    onClick={() => toggleItem(selectedEducation, setSelectedEducation, e)}
                    className={`px-3 py-1.5 rounded-full text-sm font-medium border transition-all ${
                      selectedEducation.includes(e)
                        ? "bg-primary text-primary-foreground border-primary"
                        : "bg-muted text-muted-foreground border-border hover:border-primary/50"
                    }`}
                  >
                    {e}
                  </button>
                ))}
              </div>
              {selectedEducation.length > 0 && (
                <p className="text-xs text-muted-foreground mt-3">{selectedEducation.length} selected</p>
              )}
            </section>

            {/* Locations */}
            <section className="bg-card rounded-2xl border border-border p-6 shadow-sm">
              <div className="flex items-center gap-2 mb-4">
                <MapPin className="w-5 h-5 text-accent" />
                <h2 className="font-display text-lg font-semibold text-foreground">Preferred Locations</h2>
              </div>
              <div className="flex flex-wrap gap-2">
                {locations.map((l) => (
                  <button
                    key={l}
                    onClick={() => toggleItem(selectedLocations, setSelectedLocations, l)}
                    className={`px-3 py-1.5 rounded-full text-sm font-medium border transition-all ${
                      selectedLocations.includes(l)
                        ? "bg-primary text-primary-foreground border-primary"
                        : "bg-muted text-muted-foreground border-border hover:border-primary/50"
                    }`}
                  >
                    {l}
                  </button>
                ))}
              </div>
              {selectedLocations.length > 0 && (
                <p className="text-xs text-muted-foreground mt-3">{selectedLocations.length} selected</p>
              )}
            </section>

            {/* Actions */}
            <div className="flex items-center justify-between pt-4">
              <Button variant="outline" onClick={handleReset} className="gap-2">
                <RotateCcw className="w-4 h-4" /> Reset All
              </Button>
              <Button variant="hero" onClick={handleSave} disabled={saving} className="gap-2 px-8">
                {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                Save Preferences
              </Button>
            </div>
          </motion.div>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default Preferences;
