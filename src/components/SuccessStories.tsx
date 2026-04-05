import { Link } from "react-router-dom";
import { Star, Quote, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";
import successStory1 from "@/assets/success-story-1.jpg";
import successStory2 from "@/assets/success-story-2.jpg";

const stories = [
  {
    names: "Priya & Arjun",
    location: "Chennai",
    image: successStory1,
    quote: "Chellam's AI matched us with a 95% compatibility score. Within 3 months, we knew we were meant to be. The AI insights about our shared values were spot on!",
    matchScore: 95,
    married: "March 2026",
  },
  {
    names: "Sneha & Vikram",
    location: "Bangalore",
    image: successStory2,
    quote: "As NRIs, finding someone who understands both cultures was important. Chellam's community-aware AI found us the perfect match across continents.",
    matchScore: 92,
    married: "January 2026",
  },
];

const SuccessStories = () => {
  return (
    <section id="success-stories" className="py-20 bg-surface">
      <div className="container mx-auto px-4">
        <div className="text-center mb-16">
          <h2 className="font-display text-3xl sm:text-4xl font-bold text-foreground mb-4">
            Love Stories Written by AI
          </h2>
          <p className="text-muted-foreground max-w-lg mx-auto">
            Real couples who found their soulmate through our AI-powered matching engine.
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
          {stories.map((story, i) => (
            <motion.div
              key={story.names}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.2, duration: 0.5 }}
              className="bg-card rounded-2xl overflow-hidden shadow-card border border-border/50"
            >
              <div className="relative h-64">
                <img
                  src={story.image}
                  alt={story.names}
                  className="w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-foreground/40 to-transparent" />
                <div className="absolute bottom-4 left-4">
                  <h3 className="font-display text-xl font-bold text-card">{story.names}</h3>
                  <p className="text-card/80 text-sm">{story.location} · Married {story.married}</p>
                </div>
              </div>

              <div className="p-6">
                <div className="flex items-center gap-1 mb-3">
                  {[...Array(5)].map((_, idx) => (
                    <Star key={idx} className="w-4 h-4 text-secondary fill-secondary" />
                  ))}
                  <span className="ml-2 text-xs font-bold text-accent">{story.matchScore}% AI Match</span>
                </div>

                <div className="relative">
                  <Quote className="w-6 h-6 text-primary/20 absolute -top-1 -left-1" />
                  <p className="text-sm text-muted-foreground leading-relaxed pl-4 italic">
                    {story.quote}
                  </p>
                </div>
              </div>
            </motion.div>
          ))}
        </div>

        <div className="text-center mt-10">
          <Button variant="outline" className="gap-2" asChild>
            <Link to="/success-stories">
              View All Success Stories <ArrowRight className="w-4 h-4" />
            </Link>
          </Button>
        </div>
      </div>
    </section>
  );
};

export default SuccessStories;
