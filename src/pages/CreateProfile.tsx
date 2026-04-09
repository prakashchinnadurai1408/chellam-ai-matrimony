import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Heart, ArrowLeft, ArrowRight, User, GraduationCap, Users, Sparkles,
  CheckCircle2, Loader2, Camera, X as XIcon, Moon, Coffee, Eye
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

// ==========================================
// PRD 4.3: FULL 8-STEP ONBOARDING WIZARD
// ==========================================

const STEPS = [
  { label: "Basic Info", icon: User },
  { label: "Horoscope", icon: Moon },
  { label: "Education", icon: GraduationCap },
  { label: "Family", icon: Users },
  { label: "Lifestyle", icon: Coffee },
  { label: "Preferences", icon: Sparkles },
  { label: "Preview", icon: Eye },
];

const SELECT_OPTIONS = {
  gender: ["Male", "Female"],
  religion: ["Hindu", "Muslim", "Christian", "Sikh", "Jain", "Buddhist", "Parsi", "No Religion", "Other"],
  community: ["Brahmin", "Kshatriya", "Vaishya", "Nair", "Reddy", "Mudaliar", "Iyengar", "Iyer", "Maratha", "Rajput", "Gounder", "Naidu", "Prefer Not to Say", "Other"],
  education: ["Below 10th", "10th Pass", "12th Pass", "Diploma", "Bachelor's", "Master's", "Doctorate", "CA/CS/ICWA", "MBBS/MD", "B.Tech/M.Tech", "MBA", "LLB", "Other"],
  maritalStatus: ["Never Married", "Divorced", "Widowed", "Awaiting Divorce"],
  height: Array.from({ length: 25 }, (_, i) => {
    const totalInches = 54 + i; // 4'6" to 6'6"
    const feet = Math.floor(totalInches / 12);
    const inches = totalInches % 12;
    return `${feet}'${inches}"`;
  }),
  income: ["No Income", "< ₹1 Lakh", "₹1-2 Lakh", "₹2-3 Lakh", "₹3-5 Lakh", "₹5-7 Lakh", "₹7-10 Lakh", "₹10-15 Lakh", "₹15-25 Lakh", "₹25-50 Lakh", "₹50 Lakh-₹1 Cr", "> ₹1 Crore"],
  familyType: ["Nuclear", "Joint", "Extended"],
  familyValues: ["Traditional", "Moderate", "Liberal"],
  state: ["Andhra Pradesh", "Assam", "Bihar", "Chhattisgarh", "Delhi", "Goa", "Gujarat", "Haryana", "Himachal Pradesh", "Jharkhand", "Karnataka", "Kerala", "Madhya Pradesh", "Maharashtra", "Manipur", "Meghalaya", "Mizoram", "Nagaland", "Odisha", "Punjab", "Rajasthan", "Sikkim", "Tamil Nadu", "Telangana", "Tripura", "Uttar Pradesh", "Uttarakhand", "West Bengal", "Other"],
  complexion: ["Very Fair", "Fair", "Wheatish", "Wheatish Brown", "Dark"],
  physicalStatus: ["Normal", "Physically Challenged"],
  employedIn: ["Government / PSU", "Private Company", "Business / Self-Employed", "Defence / Civil Services", "Doctor / Medical", "Teaching / Professor", "IT / Software", "Not Employed", "Other"],
  nakshatra: ["Ashwini", "Bharani", "Krittika", "Rohini", "Mrigashira", "Ardra", "Punarvasu", "Pushya", "Ashlesha", "Magha", "Purva Phalguni", "Uttara Phalguni", "Hasta", "Chitra", "Swati", "Vishakha", "Anuradha", "Jyeshtha", "Mula", "Purva Ashadha", "Uttara Ashadha", "Shravana", "Dhanishtha", "Shatabhisha", "Purva Bhadra", "Uttara Bhadra", "Revati", "Don't Know"],
  raasi: ["Mesha", "Vrishabha", "Mithuna", "Karka", "Simha", "Kanya", "Tula", "Vrischika", "Dhanu", "Makara", "Kumbha", "Meena", "Don't Know"],
  manglik: ["No", "Yes", "Partial / Anshik Manglik", "Don't Know"],
  dosham: ["Chevvai Dosham", "Kala Sarpa", "Pitru Dosha", "Naga Dosham", "None", "Don't Know"],
  diet: ["Vegetarian", "Non-Vegetarian", "Eggetarian", "Vegan", "Jain Vegetarian", "No Restriction"],
  smoking: ["Never", "Occasionally", "Regularly"],
  drinking: ["Never", "Occasionally", "Regularly", "Socially"],
  hobbies: ["Cooking", "Reading", "Travel", "Music", "Sports / Fitness", "Yoga / Meditation", "Movies", "Gaming", "Art / Crafts", "Dancing", "Photography", "Volunteering", "Gardening", "Pets", "Writing", "Other"],
  motherTongue: ["Tamil", "Telugu", "Kannada", "Malayalam", "Hindi", "Bengali", "Marathi", "Gujarati", "Punjabi", "Odia", "English", "Urdu", "Other"],
  bodyType: ["Slim", "Athletic", "Average", "Heavy"],
  relocation: ["Yes", "No", "Open to Discussion"],
};

interface FormData {
  first_name: string; last_name: string; gender: string; date_of_birth: string;
  religion: string; community: string; location: string; state: string;
  height: string; marital_status: string; complexion: string; physical_status: string;
  mother_tongue: string; bio: string;
  nakshatra: string; raasi: string; manglik: string; dosham: string;
  birth_time: string; birth_place: string;
  education: string; field_of_study: string; college: string;
  employed_in: string; profession: string; employer_name: string;
  income: string; work_city: string; work_country: string;
  father_occupation: string; mother_occupation: string;
  brothers: string; brothers_married: string;
  sisters: string; sisters_married: string;
  family_type: string; family_values: string; family_location: string;
  about_family: string;
  diet: string; smoking: string; drinking: string;
  hobbies: string[]; languages: string[]; body_type: string;
  open_to_relocation: string;
  partner_age_min: string; partner_age_max: string; partner_education: string;
  partner_community: string; partner_location: string;
  partner_religion: string; partner_diet: string;
  partner_horoscope_required: string;
}

const emptyForm: FormData = {
  first_name: "", last_name: "", gender: "", date_of_birth: "",
  religion: "", community: "", location: "", state: "",
  height: "", marital_status: "", complexion: "", physical_status: "",
  mother_tongue: "", bio: "",
  nakshatra: "", raasi: "", manglik: "", dosham: "",
  birth_time: "", birth_place: "",
  education: "", field_of_study: "", college: "",
  employed_in: "", profession: "", employer_name: "",
  income: "", work_city: "", work_country: "",
  father_occupation: "", mother_occupation: "",
  brothers: "", brothers_married: "",
  sisters: "", sisters_married: "",
  family_type: "", family_values: "", family_location: "",
  about_family: "",
  diet: "", smoking: "", drinking: "",
  hobbies: [], languages: [], body_type: "",
  open_to_relocation: "",
  partner_age_min: "", partner_age_max: "", partner_education: "",
  partner_community: "", partner_location: "",
  partner_religion: "", partner_diet: "", partner_horoscope_required: "",
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

const ChipMultiSelect = ({ label, options, selected, onToggle }: { label: string; options: string[]; selected: string[]; onToggle: (v: string) => void }) => (
  <div className="space-y-1.5">
    <label className="text-sm font-medium text-foreground">{label}</label>
    <div className="flex flex-wrap gap-1.5">
      {options.map((opt) => (
        <button
          key={opt}
          type="button"
          onClick={() => onToggle(opt)}
          className={`px-2.5 py-1 rounded-full text-xs font-medium transition-all ${
            selected.includes(opt)
              ? "bg-primary text-primary-foreground shadow-sm"
              : "bg-muted text-muted-foreground hover:bg-muted/80"
          }`}
        >
          {opt}
        </button>
      ))}
    </div>
  </div>
);

const CreateProfile = () => {
  const [step, setStep] = useState(0);
  const [form, setForm] = useState<FormData>(emptyForm);
  const [submitting, setSubmitting] = useState(false);
  const [photoFiles, setPhotoFiles] = useState<File[]>([]);
  const [photoPreviews, setPhotoPreviews] = useState<string[]>([]);
  const [uploadingPhotos, setUploadingPhotos] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { isAuthenticated, isProfileComplete, profile, completeProfile, loading, user } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

  const handlePhotoSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    
    const newFiles = Array.from(files).slice(0, 5 - photoFiles.length);
    const validFiles = newFiles.filter(f => {
      if (f.size > 5 * 1024 * 1024) {
        toast({ title: "File too large", description: `${f.name} is over 5MB`, variant: "destructive" });
        return false;
      }
      return true;
    });

    if (validFiles.length > 0) {
      setPhotoFiles(prev => [...prev, ...validFiles]);
      setPhotoPreviews(prev => [...prev, ...validFiles.map(f => URL.createObjectURL(f))]);
    }
    
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const removePhoto = (index: number) => {
    setPhotoFiles(prev => prev.filter((_, i) => i !== index));
    setPhotoPreviews(prev => {
      URL.revokeObjectURL(prev[index]);
      return prev.filter((_, i) => i !== index);
    });
  };

  const uploadPhotos = async (): Promise<string[]> => {
    if (photoFiles.length === 0 || !user) return [];
    setUploadingPhotos(true);
    const urls: string[] = [];
    try {
      for (let i = 0; i < photoFiles.length; i++) {
        const file = photoFiles[i];
        const ext = file.name.split(".").pop();
        const path = `${user.id}/photo_${i}_${Date.now()}.${ext}`;
        const { error } = await supabase.storage.from("profile-photos").upload(path, file, { upsert: true });
        if (error) throw error;
        const { data: { publicUrl } } = supabase.storage.from("profile-photos").getPublicUrl(path);
        urls.push(publicUrl);
      }
      return urls;
    } catch (err: any) {
      toast({ title: "Upload failed", description: err.message, variant: "destructive" });
      return [];
    } finally {
      setUploadingPhotos(false);
    }
  };

  useEffect(() => {
    if (loading) return;
    if (!isAuthenticated) navigate("/auth");
    else if (isProfileComplete) navigate("/");
  }, [isAuthenticated, isProfileComplete, loading, navigate]);

  const update = (field: keyof FormData, value: any) => setForm((f) => ({ ...f, [field]: value }));

  const toggleArrayItem = (field: "hobbies" | "languages", val: string) => {
    setForm((f) => ({
      ...f,
      [field]: f[field].includes(val)
        ? f[field].filter((v: string) => v !== val)
        : [...f[field], val].slice(0, 8)
    }));
  };

  const canProceed = () => {
    switch (step) {
      case 0: return !!(form.first_name && form.gender && form.date_of_birth); // Basic Info
      case 1: return !!form.religion; // Religion & Horoscope — religion required
      case 2: return !!(form.education && form.profession); // Education
      case 3: return !!form.family_type; // Family
      case 4: return true; // Lifestyle optional
      case 5: return true; // Preferences optional
      case 6: return true; // Preview
      default: return true;
    }
  };

  // Calculate profile completeness
  const completenessFields = [
    form.first_name, form.gender, form.date_of_birth, form.religion,
    form.education, form.profession, form.family_type,
    form.nakshatra, form.diet, form.height, form.bio,
    photoPreviews.length > 0 ? "yes" : "",
    photoPreviews.length > 2 ? "extra" : "",
  ];
  const completeness = Math.round((completenessFields.filter(Boolean).length / completenessFields.length) * 100);

  const handleFinish = async () => {
    setSubmitting(true);
    try {
      const photoUrls = await uploadPhotos();
      const primaryPhoto = photoUrls.length > 0 ? photoUrls[0] : null;
      
      // Convert manglik string selection → boolean (null = unknown)
      const manglikBool =
        form.manglik === "Yes" || form.manglik === "Partial / Anshik Manglik"
          ? true
          : form.manglik === "No"
          ? false
          : null;

      await completeProfile({
        first_name: form.first_name, last_name: form.last_name,
        gender: form.gender, date_of_birth: form.date_of_birth,
        religion: form.religion, community: form.community,
        caste: form.community,          // form collects "Caste / Community" as one field
        location: form.location, state: form.state,
        education: form.education, profession: form.profession,
        income: form.income, height: form.height,
        marital_status: form.marital_status, bio: form.bio,
        // Horoscope fields (form uses "raasi"; ProfileData uses "rashi")
        nakshatra: form.nakshatra || null,
        rashi: form.raasi || null,
        manglik: manglikBool,
        father_occupation: form.father_occupation, mother_occupation: form.mother_occupation,
        siblings: `${form.brothers || 0} brothers, ${form.sisters || 0} sisters`,
        family_type: form.family_type, family_values: form.family_values,
        ...(primaryPhoto ? { photo_url: primaryPhoto } : {}),
      });
      toast({ title: "Profile Created! 🎉", description: "Your profile is under review — typically approved within 4 hours." });
      navigate("/");
    } catch (err: any) {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    } finally {
      setSubmitting(false);
    }
  };

  const stepContent = [
    // Step 1: Basic Info + Photos
    <div key="1" className="space-y-6">
      <div className="space-y-3 pb-4 border-b border-border">
        <label className="text-sm font-medium text-foreground">Upload Photos (1–5)</label>
        <div className="grid grid-cols-5 gap-3">
          {photoPreviews.map((preview, i) => (
            <div key={i} className={`relative rounded-xl overflow-hidden border-2 border-primary/10 shadow-sm transition-all hover:border-primary/30 ${i === 0 ? 'col-span-2 row-span-2 h-auto aspect-square' : 'aspect-square h-auto'}`}>
              <img src={preview} alt={`Preview ${i+1}`} className="w-full h-full object-cover" />
              <button onClick={() => removePhoto(i)} className="absolute top-1.5 right-1.5 w-6 h-6 rounded-full bg-destructive/90 text-destructive-foreground flex items-center justify-center shadow-md backdrop-blur-sm transition-transform hover:scale-110">
                <XIcon className="w-3.5 h-3.5" />
              </button>
              {i === 0 && (
                <div className="absolute bottom-0 left-0 right-0 bg-primary/80 backdrop-blur-sm text-primary-foreground text-[10px] font-bold py-1 text-center">
                  PRIMARY PHOTO
                </div>
              )}
            </div>
          ))}
          {photoFiles.length < 5 && (
            <button 
              onClick={() => fileInputRef.current?.click()} 
              className={`rounded-xl bg-muted/30 border-2 border-dashed border-border/60 hover:border-primary/50 hover:bg-muted/50 flex flex-col items-center justify-center gap-2 transition-all cursor-pointer group ${photoFiles.length === 0 ? 'col-span-2 row-span-2 h-auto aspect-square' : 'aspect-square h-auto'}`}
            >
              <Camera className="w-6 h-6 text-muted-foreground group-hover:text-primary transition-colors" />
              <div className="text-center">
                <span className="text-[10px] text-muted-foreground font-bold uppercase tracking-wider block">Add Photo</span>
                <span className="text-[9px] text-muted-foreground/60">{5 - photoFiles.length} slots left</span>
              </div>
            </button>
          )}
          <input ref={fileInputRef} type="file" multiple accept="image/jpeg,image/png,image/webp" onChange={handlePhotoSelect} className="hidden" />
        </div>
        <p className="text-[10px] text-muted-foreground italic">Add at least one clear photo for the best match results.</p>
      </div>
      <div className="grid sm:grid-cols-2 gap-4">
        <TextField label="Full Name *" value={form.first_name} onChange={(v) => update("first_name", v)} placeholder="First name" />
        <TextField label="Last Name" value={form.last_name} onChange={(v) => update("last_name", v)} placeholder="Last name" />
        <SelectField label="Gender *" value={form.gender} options={SELECT_OPTIONS.gender} onChange={(v) => update("gender", v)} />
        <TextField label="Date of Birth *" value={form.date_of_birth} onChange={(v) => update("date_of_birth", v)} type="date" />
        <SelectField label="Mother Tongue" value={form.mother_tongue} options={SELECT_OPTIONS.motherTongue} onChange={(v) => update("mother_tongue", v)} />
        <SelectField label="Marital Status" value={form.marital_status} options={SELECT_OPTIONS.maritalStatus} onChange={(v) => update("marital_status", v)} />
        <SelectField label="Height" value={form.height} options={SELECT_OPTIONS.height} onChange={(v) => update("height", v)} />
        <SelectField label="Complexion" value={form.complexion} options={SELECT_OPTIONS.complexion} onChange={(v) => update("complexion", v)} />
        <TextField label="City" value={form.location} onChange={(v) => update("location", v)} placeholder="Your city" />
        <SelectField label="State" value={form.state} options={SELECT_OPTIONS.state} onChange={(v) => update("state", v)} />
        <div className="sm:col-span-2 space-y-1.5">
          <label className="text-sm font-medium text-foreground">About Me</label>
          <textarea value={form.bio} onChange={(e) => update("bio", e.target.value)} placeholder="Describe your values, hobbies, what you're looking for… (min 50, max 500 chars)" maxLength={500}
            className="flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring resize-none" />
          <p className="text-xs text-muted-foreground text-right">{form.bio.length}/500</p>
        </div>
      </div>
    </div>,

    // Step 3: Religion & Horoscope
    <div key="2" className="grid sm:grid-cols-2 gap-4">
      <SelectField label="Religion *" value={form.religion} options={SELECT_OPTIONS.religion} onChange={(v) => update("religion", v)} />
      <SelectField label="Caste / Community" value={form.community} options={SELECT_OPTIONS.community} onChange={(v) => update("community", v)} />
      <SelectField label="Nakshatra (Birth Star)" value={form.nakshatra} options={SELECT_OPTIONS.nakshatra} onChange={(v) => update("nakshatra", v)} />
      <SelectField label="Raasi (Moon Sign)" value={form.raasi} options={SELECT_OPTIONS.raasi} onChange={(v) => update("raasi", v)} />
      <SelectField label="Manglik Status" value={form.manglik} options={SELECT_OPTIONS.manglik} onChange={(v) => update("manglik", v)} />
      <SelectField label="Dhosam / Doshas" value={form.dosham} options={SELECT_OPTIONS.dosham} onChange={(v) => update("dosham", v)} />
      <TextField label="Time of Birth" value={form.birth_time} onChange={(v) => update("birth_time", v)} type="time" />
      <TextField label="Place of Birth" value={form.birth_place} onChange={(v) => update("birth_place", v)} placeholder="City of birth" />
    </div>,

    // Step 4: Education & Career
    <div key="3" className="grid sm:grid-cols-2 gap-4">
      <SelectField label="Highest Education *" value={form.education} options={SELECT_OPTIONS.education} onChange={(v) => update("education", v)} />
      <TextField label="Field of Study" value={form.field_of_study} onChange={(v) => update("field_of_study", v)} placeholder="e.g., Computer Science" />
      <TextField label="College / University" value={form.college} onChange={(v) => update("college", v)} placeholder="University name" />
      <SelectField label="Employed In" value={form.employed_in} options={SELECT_OPTIONS.employedIn} onChange={(v) => update("employed_in", v)} />
      <TextField label="Occupation *" value={form.profession} onChange={(v) => update("profession", v)} placeholder="e.g., Software Engineer" />
      <TextField label="Employer Name" value={form.employer_name} onChange={(v) => update("employer_name", v)} placeholder="Company name" />
      <SelectField label="Annual Income" value={form.income} options={SELECT_OPTIONS.income} onChange={(v) => update("income", v)} />
      <TextField label="Work City" value={form.work_city} onChange={(v) => update("work_city", v)} placeholder="Work location city" />
    </div>,

    // Step 5: Family Information
    <div key="4" className="grid sm:grid-cols-2 gap-4">
      <SelectField label="Family Type *" value={form.family_type} options={SELECT_OPTIONS.familyType} onChange={(v) => update("family_type", v)} />
      <SelectField label="Family Values" value={form.family_values} options={SELECT_OPTIONS.familyValues} onChange={(v) => update("family_values", v)} />
      <TextField label="Father's Occupation" value={form.father_occupation} onChange={(v) => update("father_occupation", v)} placeholder="e.g., Business" />
      <TextField label="Mother's Occupation" value={form.mother_occupation} onChange={(v) => update("mother_occupation", v)} placeholder="e.g., Teacher" />
      <TextField label="No. of Brothers" value={form.brothers} onChange={(v) => update("brothers", v.replace(/\D/g, ""))} placeholder="0" />
      <TextField label="Brothers Married" value={form.brothers_married} onChange={(v) => update("brothers_married", v.replace(/\D/g, ""))} placeholder="0" />
      <TextField label="No. of Sisters" value={form.sisters} onChange={(v) => update("sisters", v.replace(/\D/g, ""))} placeholder="0" />
      <TextField label="Sisters Married" value={form.sisters_married} onChange={(v) => update("sisters_married", v.replace(/\D/g, ""))} placeholder="0" />
      <TextField label="Family Location" value={form.family_location} onChange={(v) => update("family_location", v)} placeholder="Family city" />
      <div className="sm:col-span-2 space-y-1.5">
        <label className="text-sm font-medium text-foreground">About Family</label>
        <textarea value={form.about_family} onChange={(e) => update("about_family", e.target.value)} placeholder="Describe your family background, traditions…" maxLength={300}
          className="flex min-h-[70px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring resize-none" />
      </div>
    </div>,

    // Step 6: Lifestyle & Interests
    <div key="5" className="space-y-5">
      <div className="grid sm:grid-cols-3 gap-4">
        <SelectField label="Diet" value={form.diet} options={SELECT_OPTIONS.diet} onChange={(v) => update("diet", v)} />
        <SelectField label="Smoking" value={form.smoking} options={SELECT_OPTIONS.smoking} onChange={(v) => update("smoking", v)} />
        <SelectField label="Drinking" value={form.drinking} options={SELECT_OPTIONS.drinking} onChange={(v) => update("drinking", v)} />
      </div>
      <ChipMultiSelect label="Hobbies & Interests (max 8)" options={SELECT_OPTIONS.hobbies} selected={form.hobbies} onToggle={(v) => toggleArrayItem("hobbies", v)} />
      <ChipMultiSelect label="Languages Known (max 8)" options={SELECT_OPTIONS.motherTongue} selected={form.languages} onToggle={(v) => toggleArrayItem("languages", v)} />
      <div className="grid sm:grid-cols-2 gap-4">
        <SelectField label="Body Type" value={form.body_type} options={SELECT_OPTIONS.bodyType} onChange={(v) => update("body_type", v)} />
        <SelectField label="Open to Relocation" value={form.open_to_relocation} options={SELECT_OPTIONS.relocation} onChange={(v) => update("open_to_relocation", v)} />
      </div>
    </div>,

    // Step 7: Partner Preferences
    <div key="6" className="grid sm:grid-cols-2 gap-4">
      <TextField label="Partner Min Age" value={form.partner_age_min} onChange={(v) => update("partner_age_min", v.replace(/\D/g, ""))} placeholder="e.g., 25" />
      <TextField label="Partner Max Age" value={form.partner_age_max} onChange={(v) => update("partner_age_max", v.replace(/\D/g, ""))} placeholder="e.g., 32" />
      <SelectField label="Preferred Religion" value={form.partner_religion} options={[...SELECT_OPTIONS.religion, "Any"]} onChange={(v) => update("partner_religion", v)} />
      <SelectField label="Preferred Community" value={form.partner_community} options={[...SELECT_OPTIONS.community, "Any"]} onChange={(v) => update("partner_community", v)} />
      <SelectField label="Min Education Level" value={form.partner_education} options={[...SELECT_OPTIONS.education, "Any"]} onChange={(v) => update("partner_education", v)} />
      <SelectField label="Preferred Location" value={form.partner_location} options={[...SELECT_OPTIONS.state, "Any"]} onChange={(v) => update("partner_location", v)} />
      <SelectField label="Diet Preference" value={form.partner_diet} options={[...SELECT_OPTIONS.diet, "Any"]} onChange={(v) => update("partner_diet", v)} />
      <SelectField label="Horoscope Matching" value={form.partner_horoscope_required} options={["Must match (Guna Milan ≥ 18)", "Preferred", "Not Required"]} onChange={(v) => update("partner_horoscope_required", v)} />
    </div>,

    // Step 8: Preview & Submit
    <div key="7" className="space-y-6">
      <div className="flex items-center gap-3 p-4 rounded-xl bg-muted/50">
        <div className="text-2xl font-bold text-foreground">{completeness}%</div>
        <div className="flex-1">
          <p className="text-sm font-medium text-foreground">Profile Completeness</p>
          <div className="h-2 bg-muted rounded-full mt-1 overflow-hidden">
            <div className={`h-full rounded-full transition-all duration-500 ${completeness >= 80 ? "bg-green-500" : completeness >= 50 ? "bg-amber-500" : "bg-red-500"}`} style={{ width: `${completeness}%` }} />
          </div>
          {completeness < 80 && <p className="text-xs text-amber-600 mt-1">⚠ Add more details for better matches</p>}
        </div>
      </div>

      <div className="space-y-4">
        {[
          { title: "Basic Info", fields: [`${form.first_name} ${form.last_name}`, form.gender, form.date_of_birth, form.height, form.location].filter(Boolean).join(" · ") },
          { title: "Religion & Horoscope", fields: [form.religion, form.community, form.nakshatra, form.raasi, form.manglik === "Yes" ? "Manglik" : ""].filter(Boolean).join(" · ") },
          { title: "Education & Career", fields: [form.education, form.profession, form.income, form.employer_name].filter(Boolean).join(" · ") },
          { title: "Family", fields: [form.family_type, form.family_values, form.father_occupation ? `Father: ${form.father_occupation}` : ""].filter(Boolean).join(" · ") },
          { title: "Lifestyle", fields: [form.diet, form.hobbies.join(", ")].filter(Boolean).join(" · ") },
          { title: "Partner Preferences", fields: [form.partner_age_min ? `Age ${form.partner_age_min}-${form.partner_age_max}` : "", form.partner_religion, form.partner_education].filter(Boolean).join(" · ") },
        ].map((section) => (
          <div key={section.title} className="p-3 rounded-lg border border-border/50">
            <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1">{section.title}</h4>
            <p className="text-sm text-foreground">{section.fields || "—"}</p>
          </div>
        ))}
      </div>

      {form.bio && (
        <div className="p-3 rounded-lg border border-border/50">
          <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1">About Me</h4>
          <p className="text-sm text-foreground">{form.bio}</p>
        </div>
      )}
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
    <div className="min-h-screen bg-background pb-20 md:pb-0">
      <div className="border-b border-border bg-card/80 backdrop-blur-xl sticky top-0 z-50">
        <div className="container mx-auto flex items-center gap-3 h-16 px-4">
          <div className="w-9 h-9 rounded-lg gradient-hero flex items-center justify-center">
            <Heart className="w-5 h-5 text-primary-foreground" />
          </div>
          <span className="font-display text-xl font-bold text-foreground">
            Chellam<span className="text-primary">.</span>
          </span>
          <span className="text-sm text-muted-foreground ml-2">Create Your Profile</span>
          <span className="ml-auto text-xs text-muted-foreground">~7 min</span>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8 max-w-3xl">
        {/* Step indicator (scrollable on mobile) */}
        <div className="flex items-center justify-between mb-10 overflow-x-auto pb-2 gap-1">
          {STEPS.map((s, i) => {
            const Icon = s.icon;
            const isActive = i === step;
            const isDone = i < step;
            return (
              <div key={i} className="flex items-center gap-1.5 shrink-0 flex-1">
                <button
                  onClick={() => i < step && setStep(i)}
                  className={`w-9 h-9 rounded-full flex items-center justify-center shrink-0 transition-all ${
                  isDone ? "gradient-hero cursor-pointer" : isActive ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"
                }`}>
                  {isDone ? <CheckCircle2 className="w-4 h-4 text-primary-foreground" /> : <Icon className="w-4 h-4" />}
                </button>
                <span className={`text-[10px] font-medium hidden lg:block ${isActive ? "text-foreground" : "text-muted-foreground"}`}>
                  {s.label}
                </span>
                {i < STEPS.length - 1 && <div className={`h-0.5 flex-1 mx-1 rounded ${isDone ? "bg-primary" : "bg-border"}`} />}
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
            <h2 className="font-display text-xl font-bold text-foreground mb-1">{STEPS[step].label}</h2>
            <p className="text-sm text-muted-foreground mb-6">
              {step === 0 && "Tell us about yourself — this helps find your best matches."}
              {step === 1 && "Horoscope details enable Guna Milan matching (optional but recommended)."}
              {step === 2 && "Your education and career details help find compatible matches."}
              {step === 3 && "Family background helps us find culturally aligned matches."}
              {step === 4 && "Your lifestyle preferences help finding compatible partners."}
              {step === 5 && "Describe your ideal partner — our engine will do the rest!"}
              {step === 6 && "Review your profile before publishing. You can edit any section."}
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
                  {submitting ? "Saving…" : "Publish My Profile"}
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
