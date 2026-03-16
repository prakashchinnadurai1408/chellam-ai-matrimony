import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Heart, ArrowLeft, ArrowRight, User, GraduationCap, Users, Sparkles,
  CheckCircle2, MapPin, Briefcase
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useAuth, UserProfile } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";

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
  motherTongue: ["Hindi", "Tamil", "Telugu", "Kannada", "Malayalam", "Marathi", "Bengali", "Gujarati", "Punjabi", "Urdu", "Other"],
  education: ["High School", "Diploma", "Bachelor's", "Master's", "Doctorate", "CA/CS/ICWA", "MBBS/MD", "B.Tech/M.Tech", "MBA", "Other"],
  maritalStatus: ["Never Married", "Divorced", "Widowed", "Awaiting Divorce"],
  diet: ["Vegetarian", "Non-Vegetarian", "Eggetarian", "Vegan", "Jain"],
  height: ["4'10\"", "5'0\"", "5'2\"", "5'4\"", "5'5\"", "5'6\"", "5'8\"", "5'10\"", "6'0\"", "6'2\"", "6'4\""],
  income: ["Below 3 LPA", "3-5 LPA", "5-10 LPA", "10-20 LPA", "20-50 LPA", "50+ LPA", "Not Disclosed"],
  familyType: ["Nuclear", "Joint", "Extended"],
  familyValues: ["Traditional", "Moderate", "Liberal"],
  state: ["Maharashtra", "Karnataka", "Tamil Nadu", "Kerala", "Telangana", "Delhi", "Uttar Pradesh", "Gujarat", "West Bengal", "Rajasthan", "Other"],
};

const SelectField = ({ label, value, options, onChange }: { label: string; value: string; options: string[]; onChange: (v: string) => void }) => (
  <div className="space-y-1.5">
    <label className="text-sm font-medium text-foreground">{label}</label>
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
    >
      <option value="">Select {label}</option>
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
  const [form, setForm] = useState<UserProfile>({
    phone: "", firstName: "", lastName: "", gender: "", dateOfBirth: "",
    religion: "", community: "", motherTongue: "", city: "", state: "",
    education: "", profession: "", income: "", height: "", maritalStatus: "",
    diet: "", aboutMe: "", fatherOccupation: "", motherOccupation: "",
    siblings: "", familyType: "", familyValues: "", partnerAgeMin: "",
    partnerAgeMax: "", partnerEducation: "", partnerCommunity: "", partnerLocation: "",
  });
  const { isAuthenticated, isProfileComplete, user, completeProfile } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    if (!isAuthenticated) navigate("/auth");
    else if (isProfileComplete) navigate("/");
    else if (user) setForm((f) => ({ ...f, phone: user.phone }));
  }, [isAuthenticated, isProfileComplete, user, navigate]);

  const update = (field: keyof UserProfile, value: string) => setForm((f) => ({ ...f, [field]: value }));

  const canProceed = () => {
    if (step === 0) return form.firstName && form.gender && form.dateOfBirth && form.religion && form.community;
    if (step === 1) return form.education && form.profession;
    if (step === 2) return form.familyType;
    return true;
  };

  const handleFinish = () => {
    completeProfile(form);
    toast({ title: "Profile Created! 🎉", description: "Welcome to Chellam Matrimony" });
    navigate("/");
  };

  const stepContent = [
    // Step 0: Personal
    <div key="0" className="grid sm:grid-cols-2 gap-4">
      <TextField label="First Name *" value={form.firstName} onChange={(v) => update("firstName", v)} placeholder="Enter first name" />
      <TextField label="Last Name" value={form.lastName} onChange={(v) => update("lastName", v)} placeholder="Enter last name" />
      <SelectField label="Gender *" value={form.gender} options={SELECT_OPTIONS.gender} onChange={(v) => update("gender", v)} />
      <TextField label="Date of Birth *" value={form.dateOfBirth} onChange={(v) => update("dateOfBirth", v)} type="date" />
      <SelectField label="Religion *" value={form.religion} options={SELECT_OPTIONS.religion} onChange={(v) => update("religion", v)} />
      <SelectField label="Community *" value={form.community} options={SELECT_OPTIONS.community} onChange={(v) => update("community", v)} />
      <SelectField label="Mother Tongue" value={form.motherTongue} options={SELECT_OPTIONS.motherTongue} onChange={(v) => update("motherTongue", v)} />
      <SelectField label="Height" value={form.height} options={SELECT_OPTIONS.height} onChange={(v) => update("height", v)} />
      <SelectField label="Marital Status" value={form.maritalStatus} options={SELECT_OPTIONS.maritalStatus} onChange={(v) => update("maritalStatus", v)} />
      <SelectField label="Diet" value={form.diet} options={SELECT_OPTIONS.diet} onChange={(v) => update("diet", v)} />
      <TextField label="City" value={form.city} onChange={(v) => update("city", v)} placeholder="Enter city" />
      <SelectField label="State" value={form.state} options={SELECT_OPTIONS.state} onChange={(v) => update("state", v)} />
      <div className="sm:col-span-2 space-y-1.5">
        <label className="text-sm font-medium text-foreground">About Me</label>
        <textarea
          value={form.aboutMe}
          onChange={(e) => update("aboutMe", e.target.value)}
          placeholder="Write a short bio about yourself..."
          maxLength={500}
          className="flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring resize-none"
        />
      </div>
    </div>,

    // Step 1: Education & Career
    <div key="1" className="grid sm:grid-cols-2 gap-4">
      <SelectField label="Highest Education *" value={form.education} options={SELECT_OPTIONS.education} onChange={(v) => update("education", v)} />
      <TextField label="Profession *" value={form.profession} onChange={(v) => update("profession", v)} placeholder="e.g., Software Engineer" />
      <SelectField label="Annual Income" value={form.income} options={SELECT_OPTIONS.income} onChange={(v) => update("income", v)} />
    </div>,

    // Step 2: Family
    <div key="2" className="grid sm:grid-cols-2 gap-4">
      <TextField label="Father's Occupation" value={form.fatherOccupation} onChange={(v) => update("fatherOccupation", v)} placeholder="e.g., Business" />
      <TextField label="Mother's Occupation" value={form.motherOccupation} onChange={(v) => update("motherOccupation", v)} placeholder="e.g., Teacher" />
      <TextField label="Siblings" value={form.siblings} onChange={(v) => update("siblings", v)} placeholder="e.g., 1 Brother, 1 Sister" />
      <SelectField label="Family Type *" value={form.familyType} options={SELECT_OPTIONS.familyType} onChange={(v) => update("familyType", v)} />
      <SelectField label="Family Values" value={form.familyValues} options={SELECT_OPTIONS.familyValues} onChange={(v) => update("familyValues", v)} />
    </div>,

    // Step 3: Partner Preferences
    <div key="3" className="grid sm:grid-cols-2 gap-4">
      <TextField label="Min Age" value={form.partnerAgeMin} onChange={(v) => update("partnerAgeMin", v.replace(/\D/g, ""))} placeholder="e.g., 25" />
      <TextField label="Max Age" value={form.partnerAgeMax} onChange={(v) => update("partnerAgeMax", v.replace(/\D/g, ""))} placeholder="e.g., 32" />
      <SelectField label="Education" value={form.partnerEducation} options={SELECT_OPTIONS.education} onChange={(v) => update("partnerEducation", v)} />
      <SelectField label="Community" value={form.partnerCommunity} options={[...SELECT_OPTIONS.community, "Open to all"]} onChange={(v) => update("partnerCommunity", v)} />
      <SelectField label="Preferred Location" value={form.partnerLocation} options={SELECT_OPTIONS.state} onChange={(v) => update("partnerLocation", v)} />
    </div>,
  ];

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
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
        {/* Step Indicator */}
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

        {/* Form Card */}
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

            {/* Navigation */}
            <div className="flex justify-between mt-8 pt-6 border-t border-border">
              <Button variant="outline" onClick={() => setStep(step - 1)} disabled={step === 0} className="gap-2">
                <ArrowLeft className="w-4 h-4" /> Back
              </Button>
              {step < STEPS.length - 1 ? (
                <Button variant="hero" onClick={() => setStep(step + 1)} disabled={!canProceed()} className="gap-2">
                  Next <ArrowRight className="w-4 h-4" />
                </Button>
              ) : (
                <Button variant="hero" onClick={handleFinish} className="gap-2">
                  <Sparkles className="w-4 h-4" /> Complete Profile
                </Button>
              )}
            </div>
          </motion.div>
        </AnimatePresence>

        {/* Progress */}
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
