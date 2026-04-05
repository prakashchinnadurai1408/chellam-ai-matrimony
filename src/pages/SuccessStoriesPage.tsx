import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Heart, MapPin, Quote, Calendar, Camera, ArrowRight, Sparkles, Loader2 } from "lucide-react";
import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";

import successStory1 from "@/assets/success-story-1.jpg";
import successStory2 from "@/assets/success-story-2.jpg";
import profile1 from "@/assets/profile-1.jpg";
import profile2 from "@/assets/profile-2.jpg";
import profile3 from "@/assets/profile-3.jpg";
import profile4 from "@/assets/profile-4.jpg";

const stories = [
  {
    id: 1,
    coupleName: "Arjun & Priya",
    image: successStory1,
    location: "Chennai, Tamil Nadu",
    marriedDate: "December 2025",
    matchScore: 94,
    story: "We were both skeptical about online matrimony, but Chellam's AI matching was incredibly accurate. Our compatibility score was 94%, and from our very first conversation, we knew this was special. The platform understood not just our preferences, but our values, goals, and personalities. Today, we're happily married and grateful for this amazing platform.",
    highlights: ["Same community", "Career compatible", "Family values aligned"],
    duration: "3 months from match to marriage",
  },
  {
    id: 2,
    coupleName: "Vikram & Meera",
    image: successStory2,
    location: "Bangalore, Karnataka",
    marriedDate: "November 2025",
    matchScore: 91,
    story: "As an NRI working in the US, finding a compatible partner in India felt impossible. Chellam Matrimony's intelligent filters and verified profiles made the process seamless. Meera's profile stood out because of the detailed compatibility insights. We connected over video calls for months, and when we finally met, it felt like we'd known each other forever.",
    highlights: ["NRI match", "Horoscope compatible", "Similar lifestyle"],
    duration: "5 months from match to marriage",
  },
  {
    id: 3,
    coupleName: "Rahul & Ananya",
    image: profile1,
    location: "Mumbai, Maharashtra",
    marriedDate: "October 2025",
    matchScore: 96,
    story: "My parents created my profile on Chellam Matrimony, and I wasn't very hopeful. But when they showed me Ananya's profile with a 96% compatibility score, I was intrigued. The AI insights highlighted our shared love for travel, similar career paths, and aligned family values. One meeting was all it took — we knew we were meant for each other.",
    highlights: ["Parent-managed profile", "96% AI match", "Shared interests"],
    duration: "4 months from match to marriage",
  },
  {
    id: 4,
    coupleName: "Karthik & Deepa",
    image: profile3,
    location: "Coimbatore, Tamil Nadu",
    marriedDate: "September 2025",
    matchScore: 89,
    story: "What impressed us most about Chellam was the verification system. Every profile we interacted with was genuine and verified. Deepa's horoscope compatibility with mine was exceptionally favorable, which mattered a lot to our families. The platform bridged the gap between traditional matchmaking values and modern technology perfectly.",
    highlights: ["Verified profiles", "Horoscope match", "Family approved"],
    duration: "6 months from match to marriage",
  },
  {
    id: 5,
    coupleName: "Suresh & Lakshmi",
    image: profile4,
    location: "Hyderabad, Telangana",
    marriedDate: "August 2025",
    matchScore: 92,
    story: "Being a divorcee, I was worried about finding acceptance on matrimony platforms. Chellam's inclusive approach and intelligent matching gave me hope. Lakshmi and I were matched based on our life experiences, emotional maturity, and shared values rather than just surface-level criteria. We're proof that second chances at love are possible.",
    highlights: ["Second marriage", "Value-based matching", "Inclusive platform"],
    duration: "7 months from match to marriage",
  },
  {
    id: 6,
    coupleName: "Arun & Kavitha",
    image: profile2,
    location: "Kochi, Kerala",
    marriedDate: "July 2025",
    matchScore: 88,
    story: "We come from different sub-communities within the Hindu tradition, and our families were initially hesitant. But Chellam's detailed compatibility analysis convinced both families that we were truly compatible in every way that matters — values, lifestyle, career aspirations, and life goals. Thank you, Chellam, for bringing us together!",
    highlights: ["Inter-community", "Family convinced", "AI insights helped"],
    duration: "8 months from match to marriage",
  },
];

const stats = [
  { label: "Successful Marriages", value: "50,000+" },
  { label: "Happy Couples", value: "1,00,000+" },
  { label: "Average Match Time", value: "4.5 months" },
  { label: "AI Match Accuracy", value: "96%" },
];

const SuccessStoriesPage = () => {
  const [dbStories, setDbStories] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStories = async () => {
      const { data } = await supabase
        .from("success_stories")
        .select("*")
        .order("created_at", { ascending: false });
      
      if (data) {
        // Map database records to the same shape as hardcoded stories
        const mapped = data.map((s) => ({
          id: s.id,
          coupleName: s.couple_name,
          image: s.image_url || successStory1, // Fallback image if null
          location: s.location || "India",
          marriedDate: s.married_date || "Recently",
          matchScore: s.match_score || null,
          story: s.story,
          highlights: s.highlights || [],
          duration: s.duration || "A wonderful journey",
        }));
        setDbStories(mapped);
      }
      setLoading(false);
    };

    fetchStories();
  }, []);

  const allStories = [...dbStories, ...stories];

  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      {/* Hero */}
      <section className="pt-24 pb-16 gradient-hero relative overflow-hidden">
        <div className="absolute inset-0 bg-foreground/10" />
        <div className="container mx-auto px-4 relative z-10 text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <Badge className="bg-white/20 text-white border-0 mb-4 backdrop-blur-sm">
              <Heart className="w-3.5 h-3.5 mr-1.5 fill-current" /> Real Love Stories
            </Badge>
            <h1 className="font-display text-4xl md:text-5xl font-bold text-white mb-4">
              They Found Love.<br />So Can You.
            </h1>
            <p className="text-white/80 text-lg max-w-2xl mx-auto mb-8">
              Thousands of couples have found their perfect match through Chellam Matrimony's AI-powered matchmaking. Here are their stories.
            </p>
            <Button size="lg" className="bg-white text-primary hover:bg-white/90 gap-2" asChild>
              <Link to="/auth">
                <Sparkles className="w-4 h-4" /> Start Your Story
              </Link>
            </Button>
          </motion.div>
        </div>
      </section>

      {/* Stats */}
      <section className="py-12 border-b border-border">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            {stats.map((stat, i) => (
              <motion.div
                key={stat.label}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                className="text-center"
              >
                <p className="text-3xl font-bold text-primary font-display">{stat.value}</p>
                <p className="text-sm text-muted-foreground mt-1">{stat.label}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Stories Grid */}
      <section className="py-16">
        <div className="container mx-auto px-4">
          {loading ? (
            <div className="flex justify-center py-20">
              <Loader2 className="w-8 h-8 animate-spin text-primary" />
            </div>
          ) : (
            <div className="grid md:grid-cols-2 gap-8">
              {allStories.map((story, i) => (
                <motion.div
                key={story.id}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
              >
                <Card className="overflow-hidden hover:shadow-lg transition-all h-full">
                  <div className="relative h-64 overflow-hidden">
                    <img
                      src={story.image}
                      alt={story.coupleName}
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
                    <div className="absolute bottom-4 left-4 right-4">
                      <h3 className="font-display text-xl font-bold text-white">{story.coupleName}</h3>
                      <div className="flex items-center gap-3 mt-1">
                        <span className="text-white/80 text-sm flex items-center gap-1">
                          <MapPin className="w-3.5 h-3.5" /> {story.location}
                        </span>
                        <span className="text-white/80 text-sm flex items-center gap-1">
                          <Calendar className="w-3.5 h-3.5" /> {story.marriedDate}
                        </span>
                      </div>
                    </div>
                    {story.matchScore && (
                      <div className="absolute top-4 right-4">
                        <div className="flex items-center gap-1 px-2.5 py-1 rounded-full bg-white/90 backdrop-blur-sm">
                          <Sparkles className="w-3.5 h-3.5 text-accent" />
                          <span className="text-xs font-bold text-foreground">{story.matchScore}% Match</span>
                        </div>
                      </div>
                    )}
                  </div>
                  <CardContent className="p-6">
                    <div className="flex items-start gap-3 mb-4">
                      <Quote className="w-8 h-8 text-primary/20 shrink-0 mt-1" />
                      <p className="text-sm text-muted-foreground leading-relaxed line-clamp-4">{story.story}</p>
                    </div>
                    <div className="flex flex-wrap gap-1.5 mb-4">
                      {story.highlights.map((h) => (
                        <Badge key={h} variant="secondary" className="text-[10px]">{h}</Badge>
                      ))}
                    </div>
                    <div className="flex items-center justify-between pt-3 border-t border-border">
                      <span className="text-xs text-muted-foreground">{story.duration}</span>
                      <Heart className="w-4 h-4 text-primary fill-primary" />
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
            </div>
          )}
        </div>
      </section>

      {/* CTA */}
      <section className="py-16 gradient-hero relative">
        <div className="absolute inset-0 bg-foreground/10" />
        <div className="container mx-auto px-4 relative z-10 text-center">
          <h2 className="font-display text-3xl md:text-4xl font-bold text-white mb-4">
            Ready to Write Your Love Story?
          </h2>
          <p className="text-white/80 max-w-xl mx-auto mb-8">
            Join millions of verified profiles and let our AI find your perfect match today.
          </p>
          <Button size="lg" className="bg-white text-primary hover:bg-white/90 gap-2" asChild>
            <Link to="/auth">
              <Heart className="w-4 h-4" /> Create Free Profile <ArrowRight className="w-4 h-4" />
            </Link>
          </Button>
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default SuccessStoriesPage;
