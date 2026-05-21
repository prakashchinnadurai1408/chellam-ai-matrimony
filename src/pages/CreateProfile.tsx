import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Heart, ArrowLeft, ArrowRight, User, GraduationCap, Users, Sparkles,
  CheckCircle2, Loader2, Camera, X as XIcon
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

const STEPS = [
  { label: "Personal", icon: User },
  { label: "Education & Career", icon: GraduationCap },
  { label: "Family", icon: Users },
  { label: "Preferences", icon: Sparkles },
];

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

interface FormData {
  first_name: string; last_name: string; gender: string; date_of_birth: string;
  religion: string; community: string; location: string; state: string;
  education: string; profession: string; income: string; height: string;
  marital_status: string; bio: string; father_occupation: string; mother_occupation: string;
  siblings: string; family_type: string; family_values: string;
  partner_age_min: string; partner_age_max: string; partner_education: string;
  partner_community: string; partner_location: string;
}

const emptyForm: FormData = {
  first_name: "", last_name: "", gender: "", date_of_birth: "",
  religion: "", community: "", location: "", state: "",
  education: "", profession: "", income: "", height: "",
  marital_status: "", bio: "", father_occupation: "", mother_occupation: "",
  siblings: "", family_type: "", family_values: "",
  partner_age_min: "", partner_age_max: "", partner_education: "",
  partner_community: "", partner_location: "",
};

const SelectField = ({ label, value, options, onChange }: { label: string; value: string; options: string[]; onChange: (v: string) => void }) => (
  <div className="space-y-1.5">
    <label className="text-sm font-medium text-foreground">{label}</label>
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
    >
      <option value="">Select {label.replace(" *", "")}</option>
      {options.map((opt) => <option key={opt} value={opt}>{opt}</option>)}
    </select>
  </div>
);

const TextField = ({ label, value, onChange, placeholder, type = "text" }: { label: string; value: string; onChange: (v: string) => void; placeholder?: string; type?: string }) => (
  <div className="space-y-1.5">
    <label className="text-sm font-medium text-foreground">{label}</label>
    <Input type={type} value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder} maxLength={100} />
  </div>
);

const CreateProfile = () => {
  const [step, setStep] = useState(0);
  const [form, setForm] = useState<FormData>(emptyForm);
  const [submitting, setSubmitting] = useState(false);
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { isAuthenticated, isProfileComplete, profile, completeProfile, loading, user } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

  const handlePhotoSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) {
      toast({ title: "File too large", description: "Please select an image under 5MB", variant: "destructive" });
      return;
    }
    if (!file.type.startsWith("image/")) {
      toast({ title: "Invalid file", description: "Please select an image file", variant: "destructive" });
      return;
    }
    setPhotoFile(file);
    setPhotoPreview(URL.createObjectURL(file));
  };

  const removePhoto = () => {
    setPhotoFile(null);
    if (photoPreview) URL.revokeObjectURL(photoPreview);
    setPhotoPreview(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const uploadPhoto = async (): Promise<string | null> => {
    if (!photoFile || !user) return null;
    setUploadingPhoto(true);
    try {
      const ext = photoFile.name.split(".").pop();
      const path = `${user.id}/avatar.${ext}`;
      const { error } = await supabase.storage
        .from("profile-photos")
        .upload(path, photoFile, { upsert: true });
      if (error) throw error;
      const { data: { publicUrl } } = supabase.storage
        .from("profile-photos")
        .getPublicUrl(path);
      return publicUrl;
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Upload failed";
      toast({ title: "Upload failed", description: message, variant: "destructive" });
      return null;
    } finally {
      setUploadingPhoto(false);
    }
  };

  const savePartnerPreferences = async () => {
    if (!user) return;

    const preferences = {
      user_id: user.id,
      min_age: form.partner_age_min ? Number(form.partner_age_min) : 21,
      max_age: form.partner_age_max ? Number(form.partner_age_max) : 35,
      preferred_religion: null,
      preferred_communities:
        form.partner_community && form.partner_community !== "Open to all"
          ? [form.partner_community]
          : null,
      preferred_education: form.partner_education ? [form.partner_education] : null,
      preferred_locations: form.partner_location ? [form.partner_location] : null,
      preferred_marital_status: null,
      min_height: null,
      max_height: null,
    };

    const { data: existingPref } = await supabase
      .from("partner_preferences")
      .select("id")
      .eq("user_id", user.id)
      .maybeSingle();

    if (existingPref) {
      const { error } = await supabase
        .from("partner_preferences")
        .update(preferences)
        .eq("user_id", user.id);
      if (error) throw error;
    } else {
      const { error } = await supabase
        .from("partner_preferences")
        .insert(preferences);
      if (error) throw error;
    }
  };

  useEffect(() => {
    if (loading) return;
    if (!isAuthenticated) navigate("/auth");
    else if (isProfileComplete) navigate("/");
  }, [isAuthenticated, isProfileComplete, loading, navigate]);

  const update = (field: keyof FormData, value: string) => setForm((f) => ({ ...f, [field]: value }));

  const canProceed = () => {
    if (step === 0) return form.first_name && form.gender && form.date_of_birth && form.religion && form.community;
    if (step === 1) return form.education && form.profession;
    if (step === 2) return form.family_type;
    return true;
  };

  const handleFinish = async () => {
    setSubmitting(true);
    try {
      let photoUrl: string | null = null;
      if (photoFile) {
        photoUrl = await uploadPhoto();
      }
      await completeProfile({
        first_name: form.first_name,
        last_name: form.last_name,
        gender: form.gender,
        date_of_birth: form.date_of_birth,
        religion: form.religion,
        community: form.community,
        caste: form.community,
        location: form.location,
        state: form.state,
        education: form.education,
        profession: form.profession,
        income: form.income,
        height: form.height,
        marital_status: form.marital_status,
        bio: form.bio,
        father_occupation: form.father_occupation,
        mother_occupation: form.mother_occupation,
        siblings: form.siblings,
        family_type: form.family_type,
        family_values: form.family_values,
        ...(photoUrl ? { photo_url: photoUrl } : {}),
      });
      await savePartnerPreferences();
      toast({ title: "Profile Created! 🎉", description: "Welcome to Chellam Matrimony" });
      navigate("/");
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Could not save your profile";
      toast({ title: "Error", description: message, variant: "destructive" });
    } finally {
      setSubmitting(false);
    }
  };

  const stepContent = [
    <div key="0" className="space-y-6">
      {/* Photo Upload */}
      <div className="flex flex-col items-center gap-3 pb-4 border-b border-border">
        <div className="relative">
          {photoPreview ? (
            <div className="relative w-28 h-28 rounded-full overflow-hidden border-4 border-primary/20">
              <img src={photoPreview} alt="Preview" className="w-full h-full object-cover" />
              <button
                onClick={removePhoto}
                className="absolute top-0 right-0 w-7 h-7 rounded-full bg-destructive text-destructive-foreground flex items-center justify-center shadow-md"
              >
                <XIcon className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <button
              onClick={() => fileInputRef.current?.click()}
              className="w-28 h-28 rounded-full bg-muted border-2 border-dashed border-border hover:border-primary/50 flex flex-col items-center justify-center gap-1 transition-colors cursor-pointer"
            >
              <Camera className="w-6 h-6 text-muted-foreground" />
              <span className="text-[10px] text-muted-foreground font-medium">Add Photo</span>
            </button>
          )}
          <input
            ref={fileInputRef}
            type="file"
            accept="image/jpeg,image/png,image/webp"
            onChange={handlePhotoSelect}
            className="hidden"
          />
        </div>
        <p className="text-xs text-muted-foreground">Upload a clear photo of yourself (max 5MB)</p>
      </div>

      <div className="grid sm:grid-cols-2 gap-4">
      <TextField label="First Name *" value={form.first_name} onChange={(v) => update("first_name", v)} placeholder="Enter first name" />
      <TextField label="Last Name" value={form.last_name} onChange={(v) => update("last_name", v)} placeholder="Enter last name" />
      <SelectField label="Gender *" value={form.gender} options={SELECT_OPTIONS.gender} onChange={(v) => update("gender", v)} />
      <TextField label="Date of Birth *" value={form.date_of_birth} onChange={(v) => update("date_of_birth", v)} type="date" />
      <SelectField label="Religion *" value={form.religion} options={SELECT_OPTIONS.religion} onChange={(v) => update("religion", v)} />
      <SelectField label="Community *" value={form.community} options={SELECT_OPTIONS.community} onChange={(v) => update("community", v)} />
      <SelectField label="Height" value={form.height} options={SELECT_OPTIONS.height} onChange={(v) => update("height", v)} />
      <SelectField label="Marital Status" value={form.marital_status} options={SELECT_OPTIONS.maritalStatus} onChange={(v) => update("marital_status", v)} />
      <TextField label="City" value={form.location} onChange={(v) => update("location", v)} placeholder="Enter city" />
      <SelectField label="State" value={form.state} options={SELECT_OPTIONS.state} onChange={(v) => update("state", v)} />
      <div className="sm:col-span-2 space-y-1.5">
        <label className="text-sm font-medium text-foreground">About Me</label>
        <textarea
          value={form.bio}
          onChange={(e) => update("bio", e.target.value)}
          placeholder="Write a short bio about yourself..."
          maxLength={500}
          className="flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring resize-none"
        />
      </div>
      </div>
    </div>,
    <div key="1" className="grid sm:grid-cols-2 gap-4">
      <SelectField label="Highest Education *" value={form.education} options={SELECT_OPTIONS.education} onChange={(v) => update("education", v)} />
      <TextField label="Profession *" value={form.profession} onChange={(v) => update("profession", v)} placeholder="e.g., Software Engineer" />
      <SelectField label="Annual Income" value={form.income} options={SELECT_OPTIONS.income} onChange={(v) => update("income", v)} />
    </div>,
    <div key="2" className="grid sm:grid-cols-2 gap-4">
      <TextField label="Father's Occupation" value={form.father_occupation} onChange={(v) => update("father_occupation", v)} placeholder="e.g., Business" />
      <TextField label="Mother's Occupation" value={form.mother_occupation} onChange={(v) => update("mother_occupation", v)} placeholder="e.g., Teacher" />
      <TextField label="Siblings" value={form.siblings} onChange={(v) => update("siblings", v)} placeholder="e.g., 1 Brother, 1 Sister" />
      <SelectField label="Family Type *" value={form.family_type} options={SELECT_OPTIONS.familyType} onChange={(v) => update("family_type", v)} />
      <SelectField label="Family Values" value={form.family_values} options={SELECT_OPTIONS.familyValues} onChange={(v) => update("family_values", v)} />
    </div>,
    <div key="3" className="grid sm:grid-cols-2 gap-4">
      <TextField label="Min Age" value={form.partner_age_min} onChange={(v) => update("partner_age_min", v.replace(/\D/g, ""))} placeholder="e.g., 25" />
      <TextField label="Max Age" value={form.partner_age_max} onChange={(v) => update("partner_age_max", v.replace(/\D/g, ""))} placeholder="e.g., 32" />
      <SelectField label="Education" value={form.partner_education} options={SELECT_OPTIONS.education} onChange={(v) => update("partner_education", v)} />
      <SelectField label="Community" value={form.partner_community} options={[...SELECT_OPTIONS.community, "Open to all"]} onChange={(v) => update("partner_community", v)} />
      <SelectField label="Preferred Location" value={form.partner_location} options={SELECT_OPTIONS.state} onChange={(v) => update("partner_location", v)} />
    </div>,
  ];

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="border-b border-border bg-card/80 backdrop-blur-xl sticky top-0 z-50">
        <div className="container mx-auto flex items-center gap-3 h-16 px-4">
          <div className="w-9 h-9 rounded-lg gradient-hero flex items-center justify-center">
            <Heart className="w-5 h-5 text-primary-foreground" />
          </div>
          <span className="font-display text-xl font-bold text-foreground">
            Chellam<span className="text-primary">.</span>
          </span>
          <span className="text-sm text-muted-foreground ml-2">Create Your Profile</span>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8 max-w-3xl">
        <div className="flex items-center justify-between mb-10">
          {STEPS.map((s, i) => {
            const Icon = s.icon;
            const isActive = i === step;
            const isDone = i < step;
            return (
              <div key={i} className="flex items-center gap-2 flex-1">
                <div className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 transition-all ${
                  isDone ? "gradient-hero" : isActive ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"
                }`}>
                  {isDone ? <CheckCircle2 className="w-5 h-5 text-primary-foreground" /> : <Icon className="w-5 h-5" />}
                </div>
                <span className={`text-xs font-medium hidden sm:block ${isActive ? "text-foreground" : "text-muted-foreground"}`}>
                  {s.label}
                </span>
                {i < STEPS.length - 1 && <div className={`h-0.5 flex-1 mx-2 rounded ${isDone ? "bg-primary" : "bg-border"}`} />}
              </div>
            );
          })}
        </div>

        <AnimatePresence mode="wait">
          <motion.div
            key={step}
            initial={{ opacity: 0, x: 30 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -30 }}
            className="bg-card rounded-2xl border border-border/50 p-6 sm:p-8 shadow-card"
          >
            <h2 className="font-display text-xl font-bold text-foreground mb-1">{STEPS[step].label} Details</h2>
            <p className="text-sm text-muted-foreground mb-6">
              {step === 0 && "Tell us about yourself — this helps find your best matches."}
              {step === 1 && "Your education and career details matter for compatibility."}
              {step === 2 && "Family background helps us find culturally aligned matches."}
              {step === 3 && "Describe your ideal partner — our AI will do the rest!"}
            </p>

            {stepContent[step]}

            <div className="flex justify-between mt-8 pt-6 border-t border-border">
              <Button variant="outline" onClick={() => setStep(step - 1)} disabled={step === 0} className="gap-2">
                <ArrowLeft className="w-4 h-4" /> Back
              </Button>
              {step < STEPS.length - 1 ? (
                <Button variant="hero" onClick={() => setStep(step + 1)} disabled={!canProceed()} className="gap-2">
                  Next <ArrowRight className="w-4 h-4" />
                </Button>
              ) : (
                <Button variant="hero" onClick={handleFinish} disabled={submitting} className="gap-2">
                  {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
                  {submitting ? "Saving…" : "Complete Profile"}
                </Button>
              )}
            </div>
          </motion.div>
        </AnimatePresence>

        <div className="mt-6 text-center">
          <p className="text-xs text-muted-foreground">Step {step + 1} of {STEPS.length}</p>
          <div className="h-1.5 bg-muted rounded-full mt-2 max-w-xs mx-auto overflow-hidden">
            <div className="h-full gradient-hero rounded-full transition-all duration-500" style={{ width: `${((step + 1) / STEPS.length) * 100}%` }} />
          </div>
        </div>
      </div>
    </div>
  );
};

export default CreateProfile;
