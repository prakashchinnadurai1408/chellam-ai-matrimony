import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ChevronRight } from "lucide-react";
import { motion } from "framer-motion";

const communities = [
  { name: "Tamil Matrimony", slug: "tamil", members: "500K+", color: "bg-orange-100 text-orange-600 dark:bg-orange-900/30 dark:text-orange-400" },
  { name: "Telugu Matrimony", slug: "telugu", members: "450K+", color: "bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400" },
  { name: "Brahmin Matrimony", slug: "brahmin", members: "300K+", color: "bg-amber-100 text-amber-600 dark:bg-amber-900/30 dark:text-amber-400" },
  { name: "NRI Matrimony", slug: "nri", members: "200K+", color: "bg-emerald-100 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-400" },
  { name: "Christian Matrimony", slug: "christian", members: "180K+", color: "bg-purple-100 text-purple-600 dark:bg-purple-900/30 dark:text-purple-400" },
  { name: "Muslim Matrimony", slug: "muslim", members: "250K+", color: "bg-green-100 text-green-600 dark:bg-green-900/30 dark:text-green-400" },
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
            <Link to={`/community/${community.slug}`} key={community.name}>
              <motion.div
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
            </Link>
          ))}
        </div>

        <div className="text-center mt-8">
          <Button variant="outline" className="gap-2" asChild>
            <Link to="/search">
              View All 300+ Communities
              <ChevronRight className="w-4 h-4" />
            </Link>
          </Button>
        </div>
      </div>
    </section>
  );
};

export default CommunityPortals;
