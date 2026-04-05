import React, { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  User, MapPin, GraduationCap, Briefcase, Heart, Shield, Star, Edit3,
  Save, X, Camera, Loader2, Calendar, Ruler, Users, Home, Globe, CheckCircle2,
} from "lucide-react";
import { motion } from "framer-motion";
import { toast } from "sonner";
import profile1 from "@/assets/profile-1.jpg";

const SELECT_OPTIONS = {
  gender: ["Male", "Female"],
  religion: ["Hindu", "Muslim", "Christian", "Sikh", "Jain", "Buddhist", "Other"],
  community: ["Brahmin", "Kshatriya", "Vaishya", "Nair", "Reddy", "Mudaliar", "Iyengar", "Iyer", "Maratha", "Rajput", "Other"],
  education: ["High School", "Diploma", "Bachelor's", "Master's", "Doctorate", "CA/CS/ICWA", "MBBS/MD", "B.Tech/M.Tech", "MBA", "Other"],
  maritalStatus: ["Never Married", "Divorced", "Widowed", "Awaiting Divorce"],
  height: ["4'10\"", "5'0\"", "5'2\"", "5'4\"", "5'5\"", "5'6\"", "5'8\"", "5'10\"", "6'0\"", "6'2\"", "6'4\""],
  income: ["Below 3 LPA", "3-5 LPA", "5-10 LPA", "10-20 LPA", "20-50 LPA", "50+ LPA", "Not Disclosed"],
  familyType: ["Nuclear", "Joint", "Extended"],
  familyValues: ["Traditional", "Moderate", "Liberal"],
  state: ["Maharashtra", "Karnataka", "Tamil Nadu", "Kerala", "Telangana", "Delhi", "Uttar Pradesh", "Gujarat", "West Bengal", "Rajasthan", "Other"],
};

const getAge = (dob: string | null) => {
  if (!dob) return null;
  return Math.floor((Date.now() - new Date(dob).getTime()) / (365.25 * 24 * 60 * 60 * 1000));
};

const InfoRow = ({ icon: Icon, label, value }: { icon: any; label: string; value: string | null }) => {
  if (!value) return null;
  return (
    <div className="flex items-start gap-3 py-2.5">
      <Icon className="w-4 h-4 text-primary mt-0.5 shrink-0" />
      <div>
        <p className="text-xs text-muted-foreground">{label}</p>
        <p className="text-sm font-medium text-foreground">{value}</p>
      </div>
    </div>
  );
};

const EditField = ({ label, value, onChange, type = "text", options }: {
  label: string; value: string; onChange: (v: string) => void; type?: string; options?: string[];
}) => (
  <div className="space-y-1.5">
    <label className="text-xs font-medium text-muted-foreground">{label}</label>
    {options ? (
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
      >
        <option value="">Select {label}</option>
        {options.map((o) => <option key={o} value={o}>{o}</option>)}
      </select>
    ) : type === "textarea" ? (
      <textarea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        maxLength={500}
        className="flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring resize-none"
      />
    ) : (
      <Input type={type} value={value} onChange={(e) => onChange(e.target.value)} />
    )}
  </div>
);

const MyProfile = () => {
  const { user, profile, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState<Record<string, string>>({});
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!authLoading && !user) navigate("/auth");
  }, [authLoading, user, navigate]);

  useEffect(() => {
    if (profile) {
      setForm({
        first_name: profile.first_name || "",
        last_name: profile.last_name || "",
        gender: profile.gender || "",
        date_of_birth: profile.date_of_birth || "",
        religion: profile.religion || "",
        community: profile.community || "",
        location: profile.location || "",
        state: profile.state || "",
        education: profile.education || "",
        profession: profile.profession || "",
        income: profile.income || "",
        height: profile.height || "",
        marital_status: profile.marital_status || "",
        bio: profile.bio || "",
        father_occupation: profile.father_occupation || "",
        mother_occupation: profile.mother_occupation || "",
        siblings: profile.siblings || "",
        family_type: profile.family_type || "",
        family_values: profile.family_values || "",
      });
    }
  }, [profile]);

  const update = (field: string, value: string) => setForm((f) => ({ ...f, [field]: value }));

  const handlePhotoSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) { toast.error("File too large (max 5MB)"); return; }
    setPhotoFile(file);
    setPhotoPreview(URL.createObjectURL(file));
  };

  const handleSave = async () => {
    if (!user) return;
    setSaving(true);
    try {
      let photoUrl: string | undefined;
      if (photoFile) {
        const ext = photoFile.name.split(".").pop();
        const path = `${user.id}/avatar.${ext}`;
        const { error: uploadError } = await supabase.storage.from("profile-photos").upload(path, photoFile, { upsert: true });
        if (uploadError) throw uploadError;
        const { data: { publicUrl } } = supabase.storage.from("profile-photos").getPublicUrl(path);
        photoUrl = publicUrl;
      }

      const { error } = await supabase.from("profiles").update({
        ...form,
        ...(photoUrl ? { photo_url: photoUrl } : {}),
      }).eq("user_id", user.id);

      if (error) throw error;
      toast.success("Profile updated!");
      setEditing(false);
      setPhotoFile(null);
      setPhotoPreview(null);
      // Refresh page
      window.location.reload();
    } catch (err: any) {
      toast.error(err.message || "Failed to save");
    } finally {
      setSaving(false);
    }
  };

  const completeness = profile ? (() => {
    const fields = ["first_name", "gender", "date_of_birth", "religion", "community", "education", "profession", "bio", "photo_url", "height", "location", "state", "family_type"];
    const filled = fields.filter((f) => (profile as any)[f]);
    return Math.round((filled.length / fields.length) * 100);
  })() : 0;

  const age = getAge(profile?.date_of_birth || null);

  if (authLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="pt-24 text-center">
          <p className="text-muted-foreground">Complete your profile first</p>
          <Button className="mt-4" onClick={() => navigate("/create-profile")}>Create Profile</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main className="pt-20 pb-16">
        <div className="container mx-auto max-w-4xl px-4">
          {/* Profile Header */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-card rounded-3xl border border-border/50 overflow-hidden shadow-card mb-6"
          >
            <div className="gradient-hero h-32 relative" />
            <div className="px-6 pb-6 -mt-16">
              <div className="flex flex-col sm:flex-row items-start gap-5">
                <div className="relative">
                  <div className="w-28 h-28 rounded-2xl border-4 border-card overflow-hidden bg-muted shadow-lg">
                    <img
                      src={photoPreview || profile.photo_url || profile1}
                      alt="Profile"
                      className="w-full h-full object-cover"
                    />
                  </div>
                  {editing && (
                    <button
                      onClick={() => fileRef.current?.click()}
                      className="absolute bottom-1 right-1 w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center shadow-md"
                    >
                      <Camera className="w-4 h-4" />
                    </button>
                  )}
                  <input
                    ref={fileRef}
                    type="file"
                    accept="image/*"
                    onChange={handlePhotoSelect}
                    className="hidden"
                  />
                </div>
                <div className="flex-1 pt-4 sm:pt-8">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h1 className="font-display text-2xl font-bold text-foreground">
                      {[profile.first_name, profile.last_name].filter(Boolean).join(" ")}
                    </h1>
                    {age && <span className="text-muted-foreground text-lg">, {age}</span>}
                    {profile.verified && (
                      <Badge variant="secondary" className="gap-1">
                        <Shield className="w-3 h-3" /> Verified
                      </Badge>
                    )}
                  </div>
                  <p className="text-sm text-muted-foreground mt-1">
                    {[profile.profession, profile.location].filter(Boolean).join(" · ")}
                  </p>
                  <div className="flex items-center gap-4 mt-3">
                    {/* Completeness */}
                    <div className="flex items-center gap-2">
                      <div className="h-2 w-24 rounded-full bg-muted overflow-hidden">
                        <div className="h-full gradient-hero rounded-full transition-all" style={{ width: `${completeness}%` }} />
                      </div>
                      <span className="text-xs text-muted-foreground">{completeness}% complete</span>
                    </div>
                  </div>
                </div>
                <div className="sm:pt-8">
                  {editing ? (
                    <div className="flex gap-2">
                      <Button size="sm" variant="outline" onClick={() => { setEditing(false); setPhotoFile(null); setPhotoPreview(null); }} className="gap-1.5">
                        <X className="w-3.5 h-3.5" /> Cancel
                      </Button>
                      <Button size="sm" variant="hero" onClick={handleSave} disabled={saving} className="gap-1.5">
                        {saving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
                        Save
                      </Button>
                    </div>
                  ) : (
                    <Button size="sm" variant="outline" onClick={() => setEditing(true)} className="gap-1.5">
                      <Edit3 className="w-3.5 h-3.5" /> Edit Profile
                    </Button>
                  )}
                </div>
              </div>
            </div>
          </motion.div>

          {editing ? (
            /* Edit Mode */
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-6"
            >
              <div className="bg-card rounded-2xl border border-border p-6 shadow-sm">
                <h3 className="font-display text-lg font-semibold text-foreground mb-4 flex items-center gap-2">
                  <User className="w-5 h-5 text-primary" /> Personal Details
                </h3>
                <div className="grid sm:grid-cols-2 gap-4">
                  <EditField label="First Name" value={form.first_name} onChange={(v) => update("first_name", v)} />
                  <EditField label="Last Name" value={form.last_name} onChange={(v) => update("last_name", v)} />
                  <EditField label="Gender" value={form.gender} onChange={(v) => update("gender", v)} options={SELECT_OPTIONS.gender} />
                  <EditField label="Date of Birth" value={form.date_of_birth} onChange={(v) => update("date_of_birth", v)} type="date" />
                  <EditField label="Religion" value={form.religion} onChange={(v) => update("religion", v)} options={SELECT_OPTIONS.religion} />
                  <EditField label="Community" value={form.community} onChange={(v) => update("community", v)} options={SELECT_OPTIONS.community} />
                  <EditField label="Height" value={form.height} onChange={(v) => update("height", v)} options={SELECT_OPTIONS.height} />
                  <EditField label="Marital Status" value={form.marital_status} onChange={(v) => update("marital_status", v)} options={SELECT_OPTIONS.maritalStatus} />
                  <EditField label="City" value={form.location} onChange={(v) => update("location", v)} />
                  <EditField label="State" value={form.state} onChange={(v) => update("state", v)} options={SELECT_OPTIONS.state} />
                  <div className="sm:col-span-2">
                    <EditField label="About Me" value={form.bio} onChange={(v) => update("bio", v)} type="textarea" />
                  </div>
                </div>
              </div>

              <div className="bg-card rounded-2xl border border-border p-6 shadow-sm">
                <h3 className="font-display text-lg font-semibold text-foreground mb-4 flex items-center gap-2">
                  <GraduationCap className="w-5 h-5 text-primary" /> Education & Career
                </h3>
                <div className="grid sm:grid-cols-2 gap-4">
                  <EditField label="Education" value={form.education} onChange={(v) => update("education", v)} options={SELECT_OPTIONS.education} />
                  <EditField label="Profession" value={form.profession} onChange={(v) => update("profession", v)} />
                  <EditField label="Income" value={form.income} onChange={(v) => update("income", v)} options={SELECT_OPTIONS.income} />
                </div>
              </div>

              <div className="bg-card rounded-2xl border border-border p-6 shadow-sm">
                <h3 className="font-display text-lg font-semibold text-foreground mb-4 flex items-center gap-2">
                  <Users className="w-5 h-5 text-primary" /> Family Details
                </h3>
                <div className="grid sm:grid-cols-2 gap-4">
                  <EditField label="Father's Occupation" value={form.father_occupation} onChange={(v) => update("father_occupation", v)} />
                  <EditField label="Mother's Occupation" value={form.mother_occupation} onChange={(v) => update("mother_occupation", v)} />
                  <EditField label="Siblings" value={form.siblings} onChange={(v) => update("siblings", v)} />
                  <EditField label="Family Type" value={form.family_type} onChange={(v) => update("family_type", v)} options={SELECT_OPTIONS.familyType} />
                  <EditField label="Family Values" value={form.family_values} onChange={(v) => update("family_values", v)} options={SELECT_OPTIONS.familyValues} />
                </div>
              </div>
            </motion.div>
          ) : (
            /* View Mode */
            <Tabs defaultValue="about" className="w-full">
              <TabsList className="w-full justify-start bg-muted/50 p-1 rounded-xl h-auto flex-wrap mb-6">
                <TabsTrigger value="about" className="rounded-lg">About</TabsTrigger>
                <TabsTrigger value="career" className="rounded-lg">Career</TabsTrigger>
                <TabsTrigger value="family" className="rounded-lg">Family</TabsTrigger>
              </TabsList>

              <TabsContent value="about">
                <div className="bg-card rounded-2xl border border-border/50 p-6 shadow-card space-y-4">
                  {profile.bio && (
                    <div>
                      <h3 className="font-display text-lg font-semibold text-foreground mb-2">About Me</h3>
                      <p className="text-muted-foreground leading-relaxed">{profile.bio}</p>
                    </div>
                  )}
                  <div className="grid sm:grid-cols-2 gap-x-8">
                    <InfoRow icon={Calendar} label="Date of Birth" value={profile.date_of_birth} />
                    <InfoRow icon={Ruler} label="Height" value={profile.height} />
                    <InfoRow icon={Star} label="Religion" value={profile.religion} />
                    <InfoRow icon={Users} label="Community" value={profile.community} />
                    <InfoRow icon={Heart} label="Marital Status" value={profile.marital_status} />
                    <InfoRow icon={MapPin} label="Location" value={[profile.location, profile.state].filter(Boolean).join(", ")} />
                    <InfoRow icon={Globe} label="Gender" value={profile.gender} />
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="career">
                <div className="bg-card rounded-2xl border border-border/50 p-6 shadow-card">
                  <div className="grid sm:grid-cols-2 gap-x-8">
                    <InfoRow icon={GraduationCap} label="Education" value={profile.education} />
                    <InfoRow icon={Briefcase} label="Profession" value={profile.profession} />
                    <InfoRow icon={Star} label="Income" value={profile.income} />
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="family">
                <div className="bg-card rounded-2xl border border-border/50 p-6 shadow-card">
                  <div className="grid sm:grid-cols-2 gap-x-8">
                    <InfoRow icon={Briefcase} label="Father's Occupation" value={profile.father_occupation} />
                    <InfoRow icon={Briefcase} label="Mother's Occupation" value={profile.mother_occupation} />
                    <InfoRow icon={Users} label="Siblings" value={profile.siblings} />
                    <InfoRow icon={Home} label="Family Type" value={profile.family_type} />
                    <InfoRow icon={Star} label="Family Values" value={profile.family_values} />
                  </div>
                </div>
              </TabsContent>
            </Tabs>
          )}
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default MyProfile;
