import { Button } from "@/components/ui/button";
import { ChevronRight } from "lucide-react";
import { motion } from "framer-motion";

const communities = [
  { name: "Tamil Matrimony", members: "500K+", color: "bg-primary/10 text-primary" },
  { name: "Telugu Matrimony", members: "450K+", color: "bg-accent/10 text-accent" },
  { name: "Brahmin Matrimony", members: "300K+", color: "bg-secondary/20 text-secondary" },
  { name: "NRI Matrimony", members: "200K+", color: "bg-primary/10 text-primary" },
  { name: "Christian Matrimony", members: "180K+", color: "bg-accent/10 text-accent" },
  { name: "Muslim Matrimony", members: "250K+", color: "bg-secondary/20 text-secondary" },
];

const CommunityPortals = () => {
  return (
    <section className="py-20 bg-surface">
      <div className="container mx-auto px-4">
        <div className="text-center mb-12">
          <h2 className="font-display text-3xl sm:text-4xl font-bold text-foreground mb-4">
            Community Portals
          </h2>
          <p className="text-muted-foreground max-w-lg mx-auto">
            AI-powered matchmaking tailored to your community, culture, and traditions.
          </p>
        </div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4 max-w-4xl mx-auto">
          {communities.map((community, i) => (
            <motion.div
              key={community.name}
              initial={{ opacity: 0, y: 10 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.08, duration: 0.4 }}
              className="flex items-center justify-between bg-card rounded-xl p-4 border border-border/50 shadow-card hover:shadow-card-hover transition-all cursor-pointer group"
            >
              <div className="flex items-center gap-3">
                <div className={`w-10 h-10 rounded-lg ${community.color} flex items-center justify-center text-sm font-bold`}>
                  {community.name.charAt(0)}
                </div>
                <div>
                  <p className="font-semibold text-sm text-foreground">{community.name}</p>
                  <p className="text-xs text-muted-foreground">{community.members} profiles</p>
                </div>
              </div>
              <ChevronRight className="w-4 h-4 text-muted-foreground group-hover:text-primary transition-colors" />
            </motion.div>
          ))}
        </div>

        <div className="text-center mt-8">
          <Button variant="outline" className="gap-2">
            View All 300+ Communities
            <ChevronRight className="w-4 h-4" />
          </Button>
        </div>
      </div>
    </section>
  );
};

export default CommunityPortals;
