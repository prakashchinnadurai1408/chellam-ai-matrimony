import { Button } from "@/components/ui/button";
import { Sparkles, Shield, Heart, Users } from "lucide-react";
import { motion } from "framer-motion";
import heroCoupleImg from "@/assets/hero-couple.jpg";

const stats = [
  { icon: Users, value: "2M+", label: "Active Profiles" },
  { icon: Heart, value: "50K+", label: "Successful Matches" },
  { icon: Shield, value: "100%", label: "Verified Profiles" },
];

const HeroSection = () => {
  return (
    <section className="relative min-h-screen flex items-center pt-16 overflow-hidden">
      {/* Background pattern */}
      <div className="absolute inset-0 bg-surface" />
      <div className="absolute top-20 right-0 w-[600px] h-[600px] rounded-full bg-primary/5 blur-3xl" />
      <div className="absolute bottom-0 left-0 w-[400px] h-[400px] rounded-full bg-accent/5 blur-3xl" />

      <div className="container mx-auto px-4 relative z-10">
        <div className="grid lg:grid-cols-2 gap-12 lg:gap-16 items-center">
          {/* Text */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, ease: "easeOut" }}
            className="max-w-xl"
          >
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-accent/10 text-accent text-xs font-semibold mb-6">
              <Sparkles className="w-3.5 h-3.5" />
              AI-Powered Matchmaking
            </div>

            <h1 className="font-display text-4xl sm:text-5xl lg:text-6xl font-bold leading-[1.1] text-foreground mb-6">
              Find Your{" "}
              <span className="text-gradient-hero">Perfect Match</span>
              <br />
              With AI Intelligence
            </h1>

            <p className="text-lg text-muted-foreground leading-relaxed mb-8 max-w-md">
              Our AI compatibility engine analyzes personality, values, and preferences to find matches that lead to lasting relationships.
            </p>

            <div className="flex flex-wrap gap-3 mb-12">
              <Button variant="hero" size="lg" className="gap-2 text-base">
                <Sparkles className="w-4 h-4" />
                Start Your Journey
              </Button>
              <Button variant="hero-outline" size="lg" className="text-base">
                Explore Matches
              </Button>
            </div>

            {/* Stats */}
            <div className="flex gap-8">
              {stats.map((stat) => (
                <div key={stat.label} className="text-center">
                  <div className="flex items-center justify-center gap-1.5 mb-1">
                    <stat.icon className="w-4 h-4 text-primary" />
                    <span className="font-display text-2xl font-bold text-foreground">
                      {stat.value}
                    </span>
                  </div>
                  <span className="text-xs text-muted-foreground">{stat.label}</span>
                </div>
              ))}
            </div>
          </motion.div>

          {/* Hero Image */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.8, delay: 0.2, ease: "easeOut" }}
            className="relative hidden lg:block"
          >
            <div className="relative rounded-3xl overflow-hidden shadow-elevated">
              <img
                src={heroCoupleImg}
                alt="Happy couple matched through Chellam Matrimony"
                className="w-full h-[560px] object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-foreground/30 to-transparent" />
            </div>

            {/* Floating AI Card */}
            <motion.div
              animate={{ y: [0, -8, 0] }}
              transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
              className="absolute -left-8 top-1/3 bg-card rounded-2xl shadow-elevated p-4 border border-border/50"
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl gradient-ai flex items-center justify-center">
                  <Sparkles className="w-5 h-5 text-accent-foreground" />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">AI Match Score</p>
                  <p className="font-display text-lg font-bold text-foreground">94%</p>
                </div>
              </div>
            </motion.div>

            {/* Floating Verified Card */}
            <motion.div
              animate={{ y: [0, 8, 0] }}
              transition={{ duration: 3.5, repeat: Infinity, ease: "easeInOut" }}
              className="absolute -right-4 bottom-1/4 bg-card rounded-2xl shadow-elevated p-4 border border-border/50"
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-secondary flex items-center justify-center">
                  <Shield className="w-5 h-5 text-secondary-foreground" />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Profile Verified</p>
                  <p className="text-sm font-semibold text-foreground">ID + Photo ✓</p>
                </div>
              </div>
            </motion.div>
          </motion.div>
        </div>
      </div>
    </section>
  );
};

export default HeroSection;
