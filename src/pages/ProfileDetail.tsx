import { useParams, Link, useNavigate, NavigateFunction } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useInterestActions } from "@/hooks/useInterestActions";
import { useMembership } from "@/hooks/useMembership";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Heart, MessageCircle, Shield, MapPin, GraduationCap, Briefcase,
  Sparkles, ChevronRight, ArrowLeft, Star, Users, Home, Globe,
  Calendar, Ruler, Moon, Sun, Clock, CheckCircle2, TrendingUp,
  Eye, Phone
} from "lucide-react";
import { motion } from "framer-motion";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

import profile1 from "@/assets/profile-1.jpg";
import profile2 from "@/assets/profile-2.jpg";
import profile3 from "@/assets/profile-3.jpg";
import profile4 from "@/assets/profile-4.jpg";
import profile5 from "@/assets/profile-5.jpg";
import profile6 from "@/assets/profile-6.jpg";

const profilesData: Record<string, typeof sampleProfile> = {};

const sampleProfile = {
  id: "1",
  name: "Ananya Sharma",
  age: 27,
  location: "Mumbai, Maharashtra",
  images: [profile1, profile3, profile5],
  education: "MBA, IIM Bangalore",
  profession: "Product Manager at Google",
  matchScore: 96,
  verified: true,
  community: "Hindu – Brahmin",
  motherTongue: "Hindi",
  height: "5'5\"",
  maritalStatus: "Never Married",
  diet: "Vegetarian",
  smoking: "No",
  drinking: "Occasionally",
  aboutMe:
    "A passionate product manager who believes in building meaningful connections. I love exploring new cuisines, traveling to offbeat destinations, and curling up with a good book on rainy evenings. Family is everything to me, and I'm looking for someone who shares that value. I'm equally comfortable at a tech conference or a classical music concert.",
  interests: ["Travel", "Reading", "Cooking", "Yoga", "Photography", "Classical Music"],
  familyInfo: {
    fatherOccupation: "Retired IAS Officer",
    motherOccupation: "School Principal",
    siblings: "1 Elder Brother (Married, Software Engineer in USA)",
    familyType: "Nuclear",
    familyValues: "Traditional with modern outlook",
    familyStatus: "Upper Middle Class",
    nativePlace: "Lucknow, Uttar Pradesh",
    livingWith: "Parents",
  },
  horoscope: {
    rashi: "Mesha (Aries)",
    nakshatra: "Ashwini",
    manglik: "Non-Manglik",
    gothra: "Bharadwaj",
    dateOfBirth: "15 March 1999",
    timeOfBirth: "06:45 AM",
    placeOfBirth: "Lucknow",
  },
  partnerPreferences: {
    ageRange: "27 – 32 years",
    heightRange: "5'8\" – 6'2\"",
    education: "Post Graduate / Professional",
    profession: "Well settled professional",
    location: "Metro cities preferred",
    community: "Hindu – Brahmin / Open to all",
    diet: "Vegetarian preferred",
  },
  aiCompatibility: {
    overall: 96,
    categories: [
      { label: "Values & Beliefs", score: 98, icon: Star },
      { label: "Lifestyle Match", score: 94, icon: Home },
      { label: "Career Compatibility", score: 97, icon: Briefcase },
      { label: "Family Alignment", score: 92, icon: Users },
      { label: "Communication Style", score: 95, icon: MessageCircle },
      { label: "Cultural Fit", score: 93, icon: Globe },
    ],
    insights: [
      "Both highly value career growth while maintaining strong family bonds",
      "Compatible lifestyle preferences — vegetarian diet, similar social habits",
      "Shared interest in travel and cultural experiences creates strong bonding potential",
      "Similar educational backgrounds suggest intellectual compatibility",
      "Family values and expectations are closely aligned",
      "Horoscope compatibility is favorable for long-term harmony",
    ],
  },
};

// Build lookup
const allProfiles = [
  { ...sampleProfile },
  {
    ...sampleProfile, id: "2", name: "Arjun Menon", age: 29, location: "Bangalore, Karnataka",
    images: [profile2, profile4, profile6], education: "B.Tech, IIT Madras",
    profession: "Software Engineer at Microsoft", matchScore: 91, community: "Hindu – Nair",
    aboutMe: "A technology enthusiast who loves solving complex problems. When not coding, you'll find me trekking in the Western Ghats or experimenting with South Indian recipes.",
  },
  {
    ...sampleProfile, id: "3", name: "Priya Iyer", age: 25, location: "Chennai, Tamil Nadu",
    images: [profile3, profile1, profile5], education: "MBBS, AIIMS",
    profession: "Doctor at Apollo Hospitals", matchScore: 89, community: "Hindu – Iyengar",
    aboutMe: "A dedicated doctor with a passion for making a difference. I enjoy Bharatanatyam, reading Tamil literature, and weekend temple visits.",
  },
  {
    ...sampleProfile, id: "4", name: "Vikram Reddy", age: 31, location: "Hyderabad, Telangana",
    images: [profile4, profile2, profile6], education: "MS, Stanford",
    profession: "Data Scientist at Amazon", matchScore: 87, community: "Hindu – Reddy",
    aboutMe: "An NRI who recently moved back to India. Passionate about AI, cricket, and Telugu cinema. Looking for someone who appreciates both Indian traditions and global perspectives.",
  },
  {
    ...sampleProfile, id: "5", name: "Meera Krishnan", age: 28, location: "Coimbatore, Tamil Nadu",
    images: [profile5, profile3, profile1], education: "CA, ICAI",
    profession: "Finance Manager at Deloitte", matchScore: 93, community: "Hindu – Mudaliar",
    aboutMe: "A numbers person with a creative soul. I balance spreadsheets with Carnatic music practice and enjoy long drives through Tamil Nadu's countryside.",
  },
  {
    ...sampleProfile, id: "6", name: "Rahul Nair", age: 30, location: "Kochi, Kerala",
    images: [profile6, profile2, profile4], education: "MBA, ISB Hyderabad",
    profession: "Entrepreneur – Food-tech Startup", matchScore: 85, community: "Hindu – Nair",
    aboutMe: "A startup founder building the future of food delivery in Kerala. I love cooking Malabar cuisine, watching monsoon rains, and exploring Kerala's backwaters.",
  },
];

allProfiles.forEach((p) => { profilesData[p.id] = p; });

const CompatibilityBar = ({ score, label, icon: Icon }: { score: number; label: string; icon: React.ElementType }) => (
  <div className="flex items-center gap-3">
    <div className="w-8 h-8 rounded-lg bg-accent/10 flex items-center justify-center shrink-0">
      <Icon className="w-4 h-4 text-accent" />
    </div>
    <div className="flex-1 min-w-0">
      <div className="flex items-center justify-between mb-1">
        <span className="text-sm font-medium text-foreground">{label}</span>
        <span className="text-sm font-bold text-accent">{score}%</span>
      </div>
      <div className="h-2 rounded-full bg-muted overflow-hidden">
        <motion.div
          className="h-full rounded-full gradient-ai"
          initial={{ width: 0 }}
          whileInView={{ width: `${score}%` }}
          viewport={{ once: true }}
          transition={{ duration: 0.8, ease: "easeOut" }}
        />
      </div>
    </div>
  </div>
);

const InfoRow = ({ icon: Icon, label, value }: { icon: React.ElementType; label: string; value: string }) => (
  <div className="flex items-start gap-3 py-2">
    <Icon className="w-4 h-4 text-primary mt-0.5 shrink-0" />
    <div>
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="text-sm font-medium text-foreground">{value}</p>
    </div>
  </div>
);

const ProfileActions = ({ profileId, navigate }: { profileId: string; navigate: NavigateFunction }) => {
  const { user } = useAuth();
  const { interest, isShortlisted, loading, sendInterest, toggleShortlist } = useInterestActions(user?.id, profileId);
  const { isPremiumOrAbove } = useMembership(user?.id);

  if (!user) return (
    <div className="flex gap-3">
      <Button variant="hero" className="flex-1 gap-2" onClick={() => navigate("/auth")}>
        <Heart className="w-4 h-4" /> Sign in to Connect
      </Button>
    </div>
  );

  const canMessage = isPremiumOrAbove && interest?.status === "accepted";

  return (
    <div className="space-y-3">
      <div className="flex gap-3">
        {!interest ? (
          <Button variant="hero" className="flex-1 gap-2" onClick={sendInterest} disabled={loading}>
            <Heart className="w-4 h-4" /> Send Interest
          </Button>
        ) : interest.status === "pending" ? (
          <Button variant="outline" className="flex-1 gap-2" disabled>
            <Clock className="w-4 h-4" /> Interest Pending
          </Button>
        ) : interest.status === "accepted" ? (
          <Button variant="outline" className="flex-1 gap-2 border-green-500 text-green-600" disabled>
            <CheckCircle2 className="w-4 h-4" /> Interest Accepted
          </Button>
        ) : (
          <Button variant="outline" className="flex-1 gap-2" disabled>
            Interest Declined
          </Button>
        )}
        <Button variant={isShortlisted ? "default" : "outline"} size="icon" onClick={toggleShortlist}>
          <Heart className={`w-4 h-4 ${isShortlisted ? "fill-current" : ""}`} />
        </Button>
      </div>
      {canMessage && (
        <Button variant="warm" className="w-full gap-2" onClick={() => navigate(`/messages?with=${profileId}`)}>
          <MessageCircle className="w-4 h-4" /> Send Message
        </Button>
      )}
      {interest?.status === "accepted" && !isPremiumOrAbove && (
        <p className="text-xs text-center text-muted-foreground">Upgrade to <span className="text-primary font-medium cursor-pointer" onClick={() => navigate("/membership")}>Premium</span> to message</p>
      )}
    </div>
  );
};

const ProfileDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const profile = profilesData[id || "1"] || profilesData["1"];
  const mainImage = profile.images[0];

  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      <div className="pt-20 pb-12">
        <div className="container mx-auto px-4">
          {/* Back */}
          <Link to="/" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors mb-6">
            <ArrowLeft className="w-4 h-4" /> Back to Matches
          </Link>

          <div className="grid lg:grid-cols-3 gap-8">
            {/* Left Column — Gallery & Quick Info */}
            <div className="lg:col-span-1 space-y-6">
              {/* Main Image */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="rounded-2xl overflow-hidden shadow-card"
              >
                <div className="relative aspect-[3/4]">
                  <img src={mainImage} alt={profile.name} className="w-full h-full object-cover" />
                  <div className="absolute inset-0 bg-gradient-to-t from-foreground/50 via-transparent to-transparent" />
                  {profile.verified && (
                    <div className="absolute top-3 right-3 flex items-center gap-1 px-2.5 py-1 rounded-full bg-secondary/90 backdrop-blur-sm">
                      <Shield className="w-3.5 h-3.5 text-secondary-foreground" />
                      <span className="text-xs font-bold text-secondary-foreground">Verified</span>
                    </div>
                  )}
                  <div className="absolute bottom-4 left-4 right-4">
                    <h1 className="font-display text-2xl font-bold text-card">{profile.name}, {profile.age}</h1>
                    <div className="flex items-center gap-1 text-card/80 text-sm mt-1">
                      <MapPin className="w-3.5 h-3.5" /> {profile.location}
                    </div>
                  </div>
                </div>
              </motion.div>

              {/* Gallery Thumbnails */}
              <div className="grid grid-cols-3 gap-3">
                {profile.images.map((img, i) => (
                  <div key={i} className="aspect-square rounded-xl overflow-hidden border-2 border-border hover:border-primary transition-colors cursor-pointer">
                    <img src={img} alt={`${profile.name} photo ${i + 1}`} className="w-full h-full object-cover" />
                  </div>
                ))}
              </div>

              {/* Quick Actions — Interest, Shortlist, Message */}
              <ProfileActions profileId={profile.id} navigate={navigate} />

              {/* Quick Stats */}
              <div className="bg-card rounded-2xl border border-border/50 p-5 shadow-card space-y-1">
                <InfoRow icon={GraduationCap} label="Education" value={profile.education} />
                <InfoRow icon={Briefcase} label="Profession" value={profile.profession} />
                <InfoRow icon={Ruler} label="Height" value={profile.height} />
                <InfoRow icon={Calendar} label="Marital Status" value={profile.maritalStatus} />
                <InfoRow icon={Globe} label="Mother Tongue" value={profile.motherTongue} />
                <InfoRow icon={Users} label="Community" value={profile.community} />
              </div>
            </div>

            {/* Right Column — Details */}
            <div className="lg:col-span-2 space-y-6">
              {/* AI Compatibility Score Card */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
                className="bg-card rounded-2xl border border-border/50 p-6 shadow-card"
              >
                <div className="flex items-center gap-4 mb-6">
                  <div className="w-16 h-16 rounded-2xl gradient-ai flex items-center justify-center">
                    <Sparkles className="w-7 h-7 text-accent-foreground" />
                  </div>
                  <div>
                    <h2 className="font-display text-2xl font-bold text-foreground">
                      {profile.aiCompatibility.overall}% AI Match
                    </h2>
                    <p className="text-sm text-muted-foreground">Based on 50+ compatibility factors</p>
                  </div>
                  <Badge className="ml-auto bg-accent/10 text-accent border-0 gap-1">
                    <TrendingUp className="w-3 h-3" /> Top Match
                  </Badge>
                </div>

                <div className="grid sm:grid-cols-2 gap-4">
                  {profile.aiCompatibility.categories.map((cat, i) => (
                    <CompatibilityBar key={i} score={cat.score} label={cat.label} icon={cat.icon} />
                  ))}
                </div>
              </motion.div>

              {/* Tabs */}
              <Tabs defaultValue="about" className="w-full">
                <TabsList className="w-full justify-start bg-muted/50 p-1 rounded-xl h-auto flex-wrap">
                  <TabsTrigger value="about" className="rounded-lg">About</TabsTrigger>
                  <TabsTrigger value="family" className="rounded-lg">Family</TabsTrigger>
                  <TabsTrigger value="horoscope" className="rounded-lg">Horoscope</TabsTrigger>
                  <TabsTrigger value="preferences" className="rounded-lg">Partner Preferences</TabsTrigger>
                  <TabsTrigger value="insights" className="rounded-lg">AI Insights</TabsTrigger>
                </TabsList>

                {/* About */}
                <TabsContent value="about">
                  <div className="bg-card rounded-2xl border border-border/50 p-6 shadow-card space-y-6">
                    <div>
                      <h3 className="font-display text-lg font-semibold text-foreground mb-3">About Me</h3>
                      <p className="text-muted-foreground leading-relaxed">{profile.aboutMe}</p>
                    </div>
                    <div>
                      <h3 className="font-display text-lg font-semibold text-foreground mb-3">Interests & Hobbies</h3>
                      <div className="flex flex-wrap gap-2">
                        {profile.interests.map((interest) => (
                          <Badge key={interest} variant="secondary" className="bg-muted text-muted-foreground px-3 py-1">
                            {interest}
                          </Badge>
                        ))}
                      </div>
                    </div>
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 pt-2">
                      <div className="bg-muted/50 rounded-xl p-3 text-center">
                        <p className="text-xs text-muted-foreground">Diet</p>
                        <p className="text-sm font-semibold text-foreground">{profile.diet}</p>
                      </div>
                      <div className="bg-muted/50 rounded-xl p-3 text-center">
                        <p className="text-xs text-muted-foreground">Smoking</p>
                        <p className="text-sm font-semibold text-foreground">{profile.smoking}</p>
                      </div>
                      <div className="bg-muted/50 rounded-xl p-3 text-center">
                        <p className="text-xs text-muted-foreground">Drinking</p>
                        <p className="text-sm font-semibold text-foreground">{profile.drinking}</p>
                      </div>
                    </div>
                  </div>
                </TabsContent>

                {/* Family */}
                <TabsContent value="family">
                  <div className="bg-card rounded-2xl border border-border/50 p-6 shadow-card">
                    <h3 className="font-display text-lg font-semibold text-foreground mb-4 flex items-center gap-2">
                      <Users className="w-5 h-5 text-primary" /> Family Details
                    </h3>
                    <div className="grid sm:grid-cols-2 gap-x-8 gap-y-1">
                      <InfoRow icon={Briefcase} label="Father's Occupation" value={profile.familyInfo.fatherOccupation} />
                      <InfoRow icon={Briefcase} label="Mother's Occupation" value={profile.familyInfo.motherOccupation} />
                      <InfoRow icon={Users} label="Siblings" value={profile.familyInfo.siblings} />
                      <InfoRow icon={Home} label="Family Type" value={profile.familyInfo.familyType} />
                      <InfoRow icon={Star} label="Family Values" value={profile.familyInfo.familyValues} />
                      <InfoRow icon={TrendingUp} label="Family Status" value={profile.familyInfo.familyStatus} />
                      <InfoRow icon={MapPin} label="Native Place" value={profile.familyInfo.nativePlace} />
                      <InfoRow icon={Home} label="Living With" value={profile.familyInfo.livingWith} />
                    </div>
                  </div>
                </TabsContent>

                {/* Horoscope */}
                <TabsContent value="horoscope">
                  <div className="bg-card rounded-2xl border border-border/50 p-6 shadow-card">
                    <h3 className="font-display text-lg font-semibold text-foreground mb-4 flex items-center gap-2">
                      <Moon className="w-5 h-5 text-accent" /> Horoscope Details
                    </h3>
                    <div className="grid sm:grid-cols-2 gap-x-8 gap-y-1">
                      <InfoRow icon={Star} label="Rashi (Moon Sign)" value={profile.horoscope.rashi} />
                      <InfoRow icon={Sparkles} label="Nakshatra (Star)" value={profile.horoscope.nakshatra} />
                      <InfoRow icon={Sun} label="Manglik Status" value={profile.horoscope.manglik} />
                      <InfoRow icon={Shield} label="Gothra" value={profile.horoscope.gothra} />
                      <InfoRow icon={Calendar} label="Date of Birth" value={profile.horoscope.dateOfBirth} />
                      <InfoRow icon={Clock} label="Time of Birth" value={profile.horoscope.timeOfBirth} />
                      <InfoRow icon={MapPin} label="Place of Birth" value={profile.horoscope.placeOfBirth} />
                    </div>
                    <div className="mt-6 p-4 rounded-xl bg-accent/5 border border-accent/20">
                      <div className="flex items-center gap-2 mb-2">
                        <CheckCircle2 className="w-4 h-4 text-accent" />
                        <span className="text-sm font-semibold text-accent">Horoscope Compatibility: Favorable</span>
                      </div>
                      <p className="text-xs text-muted-foreground">
                        AI analysis of horoscope charts indicates strong compatibility across key parameters including Guna Milan (28/36 points).
                      </p>
                    </div>
                  </div>
                </TabsContent>

                {/* Partner Preferences */}
                <TabsContent value="preferences">
                  <div className="bg-card rounded-2xl border border-border/50 p-6 shadow-card">
                    <h3 className="font-display text-lg font-semibold text-foreground mb-4 flex items-center gap-2">
                      <Eye className="w-5 h-5 text-primary" /> Partner Preferences
                    </h3>
                    <div className="grid sm:grid-cols-2 gap-x-8 gap-y-1">
                      <InfoRow icon={Calendar} label="Preferred Age" value={profile.partnerPreferences.ageRange} />
                      <InfoRow icon={Ruler} label="Preferred Height" value={profile.partnerPreferences.heightRange} />
                      <InfoRow icon={GraduationCap} label="Education" value={profile.partnerPreferences.education} />
                      <InfoRow icon={Briefcase} label="Profession" value={profile.partnerPreferences.profession} />
                      <InfoRow icon={MapPin} label="Location" value={profile.partnerPreferences.location} />
                      <InfoRow icon={Users} label="Community" value={profile.partnerPreferences.community} />
                      <InfoRow icon={Star} label="Diet Preference" value={profile.partnerPreferences.diet} />
                    </div>
                  </div>
                </TabsContent>

                {/* AI Insights */}
                <TabsContent value="insights">
                  <div className="bg-card rounded-2xl border border-border/50 p-6 shadow-card">
                    <h3 className="font-display text-lg font-semibold text-foreground mb-4 flex items-center gap-2">
                      <Sparkles className="w-5 h-5 text-accent" /> AI Compatibility Insights
                    </h3>
                    <div className="space-y-3">
                      {profile.aiCompatibility.insights.map((insight, i) => (
                        <motion.div
                          key={i}
                          initial={{ opacity: 0, x: -10 }}
                          whileInView={{ opacity: 1, x: 0 }}
                          viewport={{ once: true }}
                          transition={{ delay: i * 0.1 }}
                          className="flex items-start gap-3 p-3 rounded-xl bg-accent/5 border border-accent/10"
                        >
                          <CheckCircle2 className="w-4 h-4 text-accent mt-0.5 shrink-0" />
                          <p className="text-sm text-foreground">{insight}</p>
                        </motion.div>
                      ))}
                    </div>
                    <div className="mt-6 p-4 rounded-xl gradient-ai text-accent-foreground text-center">
                      <p className="font-display text-lg font-bold">AI Recommendation</p>
                      <p className="text-sm opacity-90 mt-1">
                        This is one of your strongest matches. We highly recommend expressing interest!
                      </p>
                    </div>
                  </div>
                </TabsContent>
              </Tabs>
            </div>
          </div>
        </div>
      </div>

      <Footer />
    </div>
  );
};

export default ProfileDetail;
