import { useState, useMemo, useEffect } from "react";
import { Link } from "react-router-dom";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  Search, SlidersHorizontal, Sparkles, Shield, MapPin, GraduationCap,
  Briefcase, Heart, X, ChevronDown, ChevronUp, RotateCcw, Star, Moon,
  Users, Filter
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

import profile1 from "@/assets/profile-1.jpg";
import profile2 from "@/assets/profile-2.jpg";
import profile3 from "@/assets/profile-3.jpg";
import profile4 from "@/assets/profile-4.jpg";
import profile5 from "@/assets/profile-5.jpg";
import profile6 from "@/assets/profile-6.jpg";

// ── Mock Data ──
const allProfiles = [
  {
    id: 1, name: "Ananya Sharma", age: 27, gender: "Female", location: "Mumbai",
    state: "Maharashtra", image: profile1, education: "MBA", educationDetail: "IIM Bangalore",
    profession: "Product Manager", income: "15-20 LPA", matchScore: 96, verified: true,
    community: "Hindu – Brahmin", religion: "Hindu", caste: "Brahmin",
    rashi: "Mesha", nakshatra: "Ashwini", manglik: false, gunaScore: 28,
    height: "5'5\"", maritalStatus: "Never Married",
  },
  {
    id: 2, name: "Arjun Menon", age: 29, gender: "Male", location: "Bangalore",
    state: "Karnataka", image: profile2, education: "B.Tech", educationDetail: "IIT Madras",
    profession: "Software Engineer", income: "25-30 LPA", matchScore: 91, verified: true,
    community: "Hindu – Nair", religion: "Hindu", caste: "Nair",
    rashi: "Vrishabha", nakshatra: "Rohini", manglik: false, gunaScore: 25,
    height: "5'10\"", maritalStatus: "Never Married",
  },
  {
    id: 3, name: "Priya Iyer", age: 25, gender: "Female", location: "Chennai",
    state: "Tamil Nadu", image: profile3, education: "MBBS", educationDetail: "AIIMS",
    profession: "Doctor", income: "12-15 LPA", matchScore: 89, verified: true,
    community: "Hindu – Iyengar", religion: "Hindu", caste: "Iyengar",
    rashi: "Kanya", nakshatra: "Hasta", manglik: true, gunaScore: 30,
    height: "5'3\"", maritalStatus: "Never Married",
  },
  {
    id: 4, name: "Vikram Reddy", age: 31, gender: "Male", location: "Hyderabad",
    state: "Telangana", image: profile4, education: "MS", educationDetail: "Stanford",
    profession: "Data Scientist", income: "40-50 LPA", matchScore: 87, verified: true,
    community: "Hindu – Reddy", religion: "Hindu", caste: "Reddy",
    rashi: "Simha", nakshatra: "Magha", manglik: false, gunaScore: 22,
    height: "5'11\"", maritalStatus: "Never Married",
  },
  {
    id: 5, name: "Meera Krishnan", age: 28, gender: "Female", location: "Coimbatore",
    state: "Tamil Nadu", image: profile5, education: "CA", educationDetail: "ICAI",
    profession: "Finance Manager", income: "18-22 LPA", matchScore: 93, verified: true,
    community: "Hindu – Mudaliar", religion: "Hindu", caste: "Mudaliar",
    rashi: "Thula", nakshatra: "Swati", manglik: false, gunaScore: 26,
    height: "5'4\"", maritalStatus: "Never Married",
  },
  {
    id: 6, name: "Rahul Nair", age: 30, gender: "Male", location: "Kochi",
    state: "Kerala", image: profile6, education: "MBA", educationDetail: "ISB Hyderabad",
    profession: "Entrepreneur", income: "30-40 LPA", matchScore: 85, verified: true,
    community: "Hindu – Nair", religion: "Hindu", caste: "Nair",
    rashi: "Dhanu", nakshatra: "Moola", manglik: true, gunaScore: 24,
    height: "6'0\"", maritalStatus: "Divorced",
  },
];

const religions = ["Hindu", "Muslim", "Christian", "Sikh", "Jain", "Buddhist"];
const castes = ["Brahmin", "Nair", "Iyengar", "Reddy", "Mudaliar", "Gounder", "Naidu", "Iyer"];
const educations = ["MBA", "B.Tech", "MBBS", "MS", "CA", "B.Com", "PhD", "LLB"];
const professions = ["Software Engineer", "Doctor", "Product Manager", "Data Scientist", "Finance Manager", "Entrepreneur", "Lawyer", "Teacher"];
const states = ["Maharashtra", "Karnataka", "Tamil Nadu", "Telangana", "Kerala", "Delhi", "Gujarat", "Rajasthan"];
const rashis = ["Mesha", "Vrishabha", "Mithuna", "Karka", "Simha", "Kanya", "Thula", "Vrischika", "Dhanu", "Makara", "Kumbha", "Meena"];
const nakshatras = ["Ashwini", "Bharani", "Krittika", "Rohini", "Mrigashira", "Ardra", "Punarvasu", "Pushya", "Ashlesha", "Magha", "Purva Phalguni", "Uttara Phalguni", "Hasta", "Chitra", "Swati", "Vishakha", "Anuradha", "Jyeshtha", "Moola", "Purva Ashadha", "Uttara Ashadha", "Shravana", "Dhanishta", "Shatabhisha", "Purva Bhadrapada", "Uttara Bhadrapada", "Revati"];
const maritalStatuses = ["Never Married", "Divorced", "Widowed", "Awaiting Divorce"];
const sortOptions = [
  { value: "match", label: "Best Match" },
  { value: "newest", label: "Newest First" },
  { value: "age-asc", label: "Age: Low to High" },
  { value: "age-desc", label: "Age: High to Low" },
];

const SearchPage = () => {
  const [dbProfiles, setDbProfiles] = useState<any[]>([]);
  const [loadingDb, setLoadingDb] = useState(true);
  const [aiInsights, setAiInsights] = useState<Record<string, string[]>>({});
  const [matchingInProgress, setMatchingInProgress] = useState(false);
  const [showFilters, setShowFilters] = useState(true);
  const [showHoroscope, setShowHoroscope] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [sortBy, setSortBy] = useState("match");

  // Fetch real profiles from DB
  useEffect(() => {
    const fetchProfiles = async () => {
      const { data } = await supabase
        .from("profiles")
        .select("*")
        .eq("profile_complete", true);
      if (data) {
        const mapped = data.map((p) => {
          const age = p.date_of_birth
            ? Math.floor((Date.now() - new Date(p.date_of_birth).getTime()) / (365.25 * 24 * 60 * 60 * 1000))
            : 25;
          return {
            id: p.id,
            name: [p.first_name, p.last_name].filter(Boolean).join(" ") || "User",
            age,
            gender: p.gender || "",
            location: p.location || "",
            state: p.state || "",
            image: p.photo_url || profile1,
            education: p.education || "",
            educationDetail: p.education_detail || p.education || "",
            profession: p.profession || "",
            income: p.income || "",
            matchScore: p.match_score || Math.floor(Math.random() * 15 + 80),
            verified: p.verified || false,
            community: p.community || "",
            religion: p.religion || "",
            caste: p.caste || "",
            rashi: p.rashi || "",
            nakshatra: p.nakshatra || "",
            manglik: p.manglik || false,
            gunaScore: p.guna_score || 0,
            height: p.height || "",
            maritalStatus: p.marital_status || "Never Married",
            isDbProfile: true,
          };
        });
        setDbProfiles(mapped);
      }
      setLoadingDb(false);
    };
    fetchProfiles();
  }, []);

  // Run AI matching
  const runAiMatching = async () => {
    setMatchingInProgress(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        console.warn("Not logged in, skipping AI matching");
        return;
      }
      const { data, error } = await supabase.functions.invoke("ai-match", {});
      if (error) {
        console.error("AI matching error:", error);
        return;
      }
      const matches = data?.matches || [];
      const insightsMap: Record<string, string[]> = {};
      const updatedDbProfiles = dbProfiles.map((p) => {
        const match = matches.find((m: any) => m.profile_id === p.id);
        if (match) {
          insightsMap[p.id] = match.insights || [];
          return { ...p, matchScore: Math.round(match.score) };
        }
        return p;
      });
      setDbProfiles(updatedDbProfiles);
      setAiInsights(insightsMap);
    } catch (e) {
      console.error("AI matching failed:", e);
    } finally {
      setMatchingInProgress(false);
    }
  };

  // Combine DB profiles with mock data
  const combinedProfiles = useMemo(() => [...dbProfiles, ...allProfiles], [dbProfiles]);

  // Filters
  const [ageRange, setAgeRange] = useState([21, 35]);
  const [selectedReligion, setSelectedReligion] = useState("");
  const [selectedCastes, setSelectedCastes] = useState<string[]>([]);
  const [selectedEducations, setSelectedEducations] = useState<string[]>([]);
  const [selectedProfessions, setSelectedProfessions] = useState<string[]>([]);
  const [selectedStates, setSelectedStates] = useState<string[]>([]);
  const [selectedMarital, setSelectedMarital] = useState("");
  const [verifiedOnly, setVerifiedOnly] = useState(false);
  const [minMatchScore, setMinMatchScore] = useState([0]);
  // Horoscope
  const [selectedRashi, setSelectedRashi] = useState("");
  const [selectedNakshatra, setSelectedNakshatra] = useState("");
  const [manglikFilter, setManglikFilter] = useState("");
  const [minGuna, setMinGuna] = useState([18]);

  const toggleArray = (arr: string[], val: string) =>
    arr.includes(val) ? arr.filter((v) => v !== val) : [...arr, val];

  const resetFilters = () => {
    setAgeRange([21, 35]);
    setSelectedReligion("");
    setSelectedCastes([]);
    setSelectedEducations([]);
    setSelectedProfessions([]);
    setSelectedStates([]);
    setSelectedMarital("");
    setVerifiedOnly(false);
    setMinMatchScore([0]);
    setSelectedRashi("");
    setSelectedNakshatra("");
    setManglikFilter("");
    setMinGuna([18]);
    setSearchQuery("");
  };

  const activeFilterCount = [
    ageRange[0] !== 21 || ageRange[1] !== 35,
    selectedReligion, selectedCastes.length, selectedEducations.length,
    selectedProfessions.length, selectedStates.length, selectedMarital,
    verifiedOnly, minMatchScore[0] > 0, selectedRashi, selectedNakshatra,
    manglikFilter, minGuna[0] > 18,
  ].filter(Boolean).length;

  const filtered = useMemo(() => {
    let results = combinedProfiles.filter((p) => {
      if (p.age < ageRange[0] || p.age > ageRange[1]) return false;
      if (selectedReligion && p.religion !== selectedReligion) return false;
      if (selectedCastes.length && !selectedCastes.includes(p.caste)) return false;
      if (selectedEducations.length && !selectedEducations.includes(p.education)) return false;
      if (selectedProfessions.length && !selectedProfessions.includes(p.profession)) return false;
      if (selectedStates.length && !selectedStates.includes(p.state)) return false;
      if (selectedMarital && p.maritalStatus !== selectedMarital) return false;
      if (verifiedOnly && !p.verified) return false;
      if (p.matchScore < minMatchScore[0]) return false;
      if (selectedRashi && p.rashi !== selectedRashi) return false;
      if (selectedNakshatra && p.nakshatra !== selectedNakshatra) return false;
      if (manglikFilter === "yes" && !p.manglik) return false;
      if (manglikFilter === "no" && p.manglik) return false;
      if (p.gunaScore < minGuna[0]) return false;
      if (searchQuery) {
        const q = searchQuery.toLowerCase();
        if (!p.name.toLowerCase().includes(q) && !p.location.toLowerCase().includes(q) && !p.profession.toLowerCase().includes(q)) return false;
      }
      return true;
    });

    if (sortBy === "match") results.sort((a, b) => b.matchScore - a.matchScore);
    else if (sortBy === "age-asc") results.sort((a, b) => a.age - b.age);
    else if (sortBy === "age-desc") results.sort((a, b) => b.age - a.age);

    return results;
  }, [combinedProfiles, ageRange, selectedReligion, selectedCastes, selectedEducations, selectedProfessions, selectedStates, selectedMarital, verifiedOnly, minMatchScore, selectedRashi, selectedNakshatra, manglikFilter, minGuna, searchQuery, sortBy]);

  const FilterSection = ({ title, icon: Icon, children, collapsible, open, onToggle }: {
    title: string; icon: any; children: React.ReactNode;
    collapsible?: boolean; open?: boolean; onToggle?: () => void;
  }) => (
    <div className="border-b border-border pb-4 mb-4 last:border-0 last:pb-0 last:mb-0">
      <button
        className="flex items-center justify-between w-full text-left"
        onClick={collapsible ? onToggle : undefined}
      >
        <span className="flex items-center gap-2 text-sm font-semibold text-foreground">
          <Icon className="w-4 h-4 text-primary" />
          {title}
        </span>
        {collapsible && (open ? <ChevronUp className="w-4 h-4 text-muted-foreground" /> : <ChevronDown className="w-4 h-4 text-muted-foreground" />)}
      </button>
      <AnimatePresence>
        {(!collapsible || open) && (
          <motion.div
            initial={collapsible ? { height: 0, opacity: 0 } : false}
            animate={{ height: "auto", opacity: 1 }}
            exit={collapsible ? { height: 0, opacity: 0 } : undefined}
            className="overflow-hidden mt-3"
          >
            {children}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );

  const ChipSelect = ({ options, selected, onToggle }: {
    options: string[]; selected: string[]; onToggle: (v: string) => void;
  }) => (
    <div className="flex flex-wrap gap-1.5">
      {options.map((opt) => (
        <button
          key={opt}
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
  );

  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      <main className="pt-20 pb-16">
        <div className="container mx-auto px-4">
          {/* Header */}
          <div className="mb-8">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-accent/10 text-accent text-xs font-semibold mb-3">
              <Sparkles className="w-3.5 h-3.5" />
              AI-Powered Search
            </div>
            <h1 className="font-display text-3xl sm:text-4xl font-bold text-foreground mb-2">
              Find Your Perfect Match
            </h1>
            <p className="text-muted-foreground max-w-lg">
              Use our intelligent filters to discover compatible profiles. AI scores update in real-time as you refine your preferences.
            </p>
          </div>

          {/* Search Bar */}
          <div className="flex flex-col sm:flex-row gap-3 mb-6">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Search by name, location, or profession…"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
            <div className="flex gap-2">
              <Select value={sortBy} onValueChange={setSortBy}>
                <SelectTrigger className="w-[180px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {sortOptions.map((o) => (
                    <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Button
                variant="outline"
                className="gap-2 lg:hidden"
                onClick={() => setShowFilters(!showFilters)}
              >
                <Filter className="w-4 h-4" />
                Filters
                {activeFilterCount > 0 && (
                  <Badge className="bg-primary text-primary-foreground text-[10px] px-1.5 py-0">{activeFilterCount}</Badge>
                )}
              </Button>
            </div>
          </div>

          <div className="flex gap-6">
            {/* Sidebar Filters */}
            <AnimatePresence>
              {showFilters && (
                <motion.aside
                  initial={{ width: 0, opacity: 0 }}
                  animate={{ width: "auto", opacity: 1 }}
                  exit={{ width: 0, opacity: 0 }}
                  className="w-full lg:w-[300px] shrink-0 overflow-hidden"
                >
                  <div className="bg-card rounded-2xl border border-border/50 shadow-card p-5 sticky top-24">
                    <div className="flex items-center justify-between mb-5">
                      <h3 className="text-sm font-bold text-foreground flex items-center gap-2">
                        <SlidersHorizontal className="w-4 h-4" />
                        Filters
                        {activeFilterCount > 0 && (
                          <Badge variant="secondary" className="text-[10px]">{activeFilterCount} active</Badge>
                        )}
                      </h3>
                      <button onClick={resetFilters} className="text-xs text-primary hover:underline flex items-center gap-1">
                        <RotateCcw className="w-3 h-3" /> Reset
                      </button>
                    </div>

                    <div className="max-h-[calc(100vh-200px)] overflow-y-auto pr-1 space-y-0">
                      {/* Age */}
                      <FilterSection title="Age Range" icon={Users}>
                        <div className="px-1">
                          <Slider
                            value={ageRange}
                            onValueChange={setAgeRange}
                            min={18} max={60} step={1}
                          />
                          <div className="flex justify-between text-xs text-muted-foreground mt-2">
                            <span>{ageRange[0]} yrs</span>
                            <span>{ageRange[1]} yrs</span>
                          </div>
                        </div>
                      </FilterSection>

                      {/* Religion */}
                      <FilterSection title="Religion" icon={Star}>
                        <Select value={selectedReligion} onValueChange={setSelectedReligion}>
                          <SelectTrigger><SelectValue placeholder="Any Religion" /></SelectTrigger>
                          <SelectContent>
                            <SelectItem value="any">Any</SelectItem>
                            {religions.map((r) => <SelectItem key={r} value={r}>{r}</SelectItem>)}
                          </SelectContent>
                        </Select>
                      </FilterSection>

                      {/* Community / Caste */}
                      <FilterSection title="Community" icon={Users}>
                        <ChipSelect options={castes} selected={selectedCastes} onToggle={(v) => setSelectedCastes(toggleArray(selectedCastes, v))} />
                      </FilterSection>

                      {/* Education */}
                      <FilterSection title="Education" icon={GraduationCap}>
                        <ChipSelect options={educations} selected={selectedEducations} onToggle={(v) => setSelectedEducations(toggleArray(selectedEducations, v))} />
                      </FilterSection>

                      {/* Profession */}
                      <FilterSection title="Profession" icon={Briefcase}>
                        <ChipSelect options={professions} selected={selectedProfessions} onToggle={(v) => setSelectedProfessions(toggleArray(selectedProfessions, v))} />
                      </FilterSection>

                      {/* Location */}
                      <FilterSection title="Location" icon={MapPin}>
                        <ChipSelect options={states} selected={selectedStates} onToggle={(v) => setSelectedStates(toggleArray(selectedStates, v))} />
                      </FilterSection>

                      {/* Marital Status */}
                      <FilterSection title="Marital Status" icon={Heart}>
                        <Select value={selectedMarital} onValueChange={setSelectedMarital}>
                          <SelectTrigger><SelectValue placeholder="Any" /></SelectTrigger>
                          <SelectContent>
                            <SelectItem value="any">Any</SelectItem>
                            {maritalStatuses.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                          </SelectContent>
                        </Select>
                      </FilterSection>

                      {/* AI Match Score */}
                      <FilterSection title="Min AI Match Score" icon={Sparkles}>
                        <div className="px-1">
                          <Slider value={minMatchScore} onValueChange={setMinMatchScore} min={0} max={100} step={5} />
                          <div className="text-xs text-muted-foreground mt-2 text-center">{minMatchScore[0]}%+</div>
                        </div>
                      </FilterSection>

                      {/* Verified */}
                      <FilterSection title="Verification" icon={Shield}>
                        <label className="flex items-center gap-2 cursor-pointer">
                          <Checkbox checked={verifiedOnly} onCheckedChange={(c) => setVerifiedOnly(c === true)} />
                          <span className="text-sm text-foreground">Verified profiles only</span>
                        </label>
                      </FilterSection>

                      {/* Horoscope */}
                      <FilterSection title="Horoscope Matching" icon={Moon} collapsible open={showHoroscope} onToggle={() => setShowHoroscope(!showHoroscope)}>
                        <div className="space-y-3">
                          <div>
                            <Label className="text-xs text-muted-foreground mb-1 block">Rashi</Label>
                            <Select value={selectedRashi} onValueChange={setSelectedRashi}>
                              <SelectTrigger><SelectValue placeholder="Any Rashi" /></SelectTrigger>
                              <SelectContent>
                                <SelectItem value="any">Any</SelectItem>
                                {rashis.map((r) => <SelectItem key={r} value={r}>{r}</SelectItem>)}
                              </SelectContent>
                            </Select>
                          </div>
                          <div>
                            <Label className="text-xs text-muted-foreground mb-1 block">Nakshatra</Label>
                            <Select value={selectedNakshatra} onValueChange={setSelectedNakshatra}>
                              <SelectTrigger><SelectValue placeholder="Any Nakshatra" /></SelectTrigger>
                              <SelectContent>
                                <SelectItem value="any">Any</SelectItem>
                                {nakshatras.map((n) => <SelectItem key={n} value={n}>{n}</SelectItem>)}
                              </SelectContent>
                            </Select>
                          </div>
                          <div>
                            <Label className="text-xs text-muted-foreground mb-1 block">Manglik</Label>
                            <Select value={manglikFilter} onValueChange={setManglikFilter}>
                              <SelectTrigger><SelectValue placeholder="Doesn't Matter" /></SelectTrigger>
                              <SelectContent>
                                <SelectItem value="any">Doesn't Matter</SelectItem>
                                <SelectItem value="yes">Manglik</SelectItem>
                                <SelectItem value="no">Non-Manglik</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                          <div>
                            <Label className="text-xs text-muted-foreground mb-1 block">Min Guna Score (out of 36)</Label>
                            <Slider value={minGuna} onValueChange={setMinGuna} min={0} max={36} step={1} />
                            <div className="text-xs text-muted-foreground mt-1 text-center">{minGuna[0]}+ points</div>
                          </div>
                        </div>
                      </FilterSection>
                    </div>
                  </div>
                </motion.aside>
              )}
            </AnimatePresence>

            {/* Results */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between mb-4">
                <p className="text-sm text-muted-foreground">
                  <span className="font-semibold text-foreground">{filtered.length}</span> profiles found
                </p>
                <Button
                  variant="ghost"
                  size="sm"
                  className="hidden lg:flex gap-2"
                  onClick={() => setShowFilters(!showFilters)}
                >
                  {showFilters ? <X className="w-4 h-4" /> : <SlidersHorizontal className="w-4 h-4" />}
                  {showFilters ? "Hide Filters" : "Show Filters"}
                </Button>
              </div>

              {filtered.length === 0 ? (
                <div className="text-center py-20 bg-card rounded-2xl border border-border/50">
                  <Search className="w-12 h-12 text-muted-foreground/40 mx-auto mb-4" />
                  <h3 className="font-display text-xl font-semibold text-foreground mb-2">No matches found</h3>
                  <p className="text-muted-foreground text-sm mb-4">Try adjusting your filters to see more profiles.</p>
                  <Button variant="outline" onClick={resetFilters} className="gap-2">
                    <RotateCcw className="w-4 h-4" /> Reset Filters
                  </Button>
                </div>
              ) : (
                <div className="grid sm:grid-cols-2 xl:grid-cols-3 gap-5">
                  {filtered.map((profile, i) => (
                    <motion.div
                      key={profile.id}
                      initial={{ opacity: 0, y: 16 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: i * 0.05, duration: 0.4 }}
                      className="group bg-card rounded-2xl shadow-card hover:shadow-card-hover transition-all duration-300 overflow-hidden border border-border/50"
                    >
                      <Link to={`/profile/${profile.id}`}>
                        <div className="relative aspect-[4/5] overflow-hidden">
                          <img src={profile.image} alt={profile.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                          <div className="absolute inset-0 bg-gradient-to-t from-foreground/60 via-transparent to-transparent" />

                          <div className="absolute top-3 left-3">
                            <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-card/90 backdrop-blur-sm">
                              <Sparkles className="w-3.5 h-3.5 text-accent" />
                              <span className="text-xs font-bold text-foreground">{profile.matchScore}%</span>
                            </div>
                          </div>

                          {profile.verified && (
                            <div className="absolute top-3 right-3">
                              <div className="flex items-center gap-1 px-2 py-1 rounded-full bg-secondary/90 backdrop-blur-sm">
                                <Shield className="w-3 h-3 text-secondary-foreground" />
                                <span className="text-[10px] font-bold text-secondary-foreground">Verified</span>
                              </div>
                            </div>
                          )}

                          <div className="absolute bottom-3 left-3 right-3">
                            <h3 className="font-display text-lg font-bold text-card">{profile.name}, {profile.age}</h3>
                            <div className="flex items-center gap-1 text-card/80 text-sm">
                              <MapPin className="w-3.5 h-3.5" /> {profile.location}
                            </div>
                          </div>
                        </div>
                      </Link>

                      <div className="p-4">
                        <div className="flex flex-col gap-1.5 mb-3">
                          <div className="flex items-center gap-2 text-sm text-muted-foreground">
                            <GraduationCap className="w-3.5 h-3.5 shrink-0" />
                            <span className="truncate">{profile.educationDetail}</span>
                          </div>
                          <div className="flex items-center gap-2 text-sm text-muted-foreground">
                            <Briefcase className="w-3.5 h-3.5 shrink-0" />
                            <span className="truncate">{profile.profession}</span>
                          </div>
                        </div>

                        <div className="flex flex-wrap gap-1.5 mb-3">
                          <Badge variant="secondary" className="text-[10px] bg-muted text-muted-foreground">{profile.community}</Badge>
                          <Badge variant="secondary" className="text-[10px] bg-muted text-muted-foreground">{profile.rashi}</Badge>
                          {profile.manglik && (
                            <Badge variant="secondary" className="text-[10px] bg-destructive/10 text-destructive">Manglik</Badge>
                          )}
                        </div>

                        {/* Guna bar */}
                        <div className="mb-3">
                          <div className="flex justify-between text-[10px] text-muted-foreground mb-1">
                            <span>Guna Milan</span>
                            <span>{profile.gunaScore}/36</span>
                          </div>
                          <div className="h-1.5 rounded-full bg-muted overflow-hidden">
                            <motion.div
                              className="h-full rounded-full gradient-hero"
                              initial={{ width: 0 }}
                              animate={{ width: `${(profile.gunaScore / 36) * 100}%` }}
                              transition={{ delay: i * 0.05 + 0.3, duration: 0.6 }}
                            />
                          </div>
                        </div>

                        <div className="flex gap-2">
                          <Button variant="outline" size="sm" className="flex-1 gap-1 text-xs">
                            <X className="w-3 h-3" /> Skip
                          </Button>
                          <Button variant="hero" size="sm" className="flex-1 gap-1 text-xs" asChild>
                            <Link to={`/profile/${profile.id}`}>
                              <Heart className="w-3 h-3" /> Connect
                            </Link>
                          </Button>
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default SearchPage;
