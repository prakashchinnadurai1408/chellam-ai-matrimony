import { Button } from "@/components/ui/button";
import { Check, Sparkles, Crown, Star } from "lucide-react";
import { motion } from "framer-motion";

const plans = [
  {
    name: "Free",
    price: "₹0",
    period: "forever",
    description: "Get started and explore matches",
    icon: Star,
    features: [
      "Create detailed profile",
      "View 10 AI matches daily",
      "Basic compatibility scores",
      "Photo verification",
      "Community search filters",
    ],
    cta: "Start Free",
    variant: "hero-outline" as const,
    highlight: false,
  },
  {
    name: "Premium",
    price: "₹2,999",
    period: "3 months",
    description: "Unlock full AI matchmaking power",
    icon: Sparkles,
    features: [
      "Unlimited AI matches",
      "Advanced compatibility insights",
      "Direct messaging",
      "See who viewed your profile",
      "Priority profile visibility",
      "Horoscope matching",
      "Video call feature",
    ],
    cta: "Get Premium",
    variant: "hero" as const,
    highlight: true,
  },
  {
    name: "Concierge",
    price: "₹14,999",
    period: "6 months",
    description: "Personal matchmaker + AI",
    icon: Crown,
    features: [
      "Everything in Premium",
      "Dedicated relationship manager",
      "Hand-curated matches",
      "Background verification",
      "Priority customer support",
      "Profile boosting",
      "Wedding planning assistance",
    ],
    cta: "Contact Us",
    variant: "warm" as const,
    highlight: false,
  },
];

const PricingSection = () => {
  return (
    <section id="pricing" className="py-20 bg-background">
      <div className="container mx-auto px-4">
        <div className="text-center mb-16">
          <h2 className="font-display text-3xl sm:text-4xl font-bold text-foreground mb-4">
            Choose Your Plan
          </h2>
          <p className="text-muted-foreground max-w-lg mx-auto">
            Start free and upgrade when you're ready. Every plan includes AI-powered matching.
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-6 max-w-5xl mx-auto">
          {plans.map((plan, i) => (
            <motion.div
              key={plan.name}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.15, duration: 0.5 }}
              className={`relative bg-card rounded-2xl p-6 border ${
                plan.highlight
                  ? "border-primary shadow-card-hover scale-105"
                  : "border-border/50 shadow-card"
              } flex flex-col`}
            >
              {plan.highlight && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                  <span className="gradient-hero text-primary-foreground text-xs font-bold px-4 py-1 rounded-full">
                    Most Popular
                  </span>
                </div>
              )}

              <div className="flex items-center gap-3 mb-4">
                <div className={`w-10 h-10 rounded-xl ${plan.highlight ? "gradient-hero" : "bg-muted"} flex items-center justify-center`}>
                  <plan.icon className={`w-5 h-5 ${plan.highlight ? "text-primary-foreground" : "text-muted-foreground"}`} />
                </div>
                <div>
                  <h3 className="font-display text-lg font-bold text-foreground">{plan.name}</h3>
                </div>
              </div>

              <div className="mb-2">
                <span className="font-display text-3xl font-bold text-foreground">{plan.price}</span>
                <span className="text-sm text-muted-foreground ml-1">/ {plan.period}</span>
              </div>
              <p className="text-sm text-muted-foreground mb-6">{plan.description}</p>

              <ul className="flex flex-col gap-2.5 mb-8 flex-1">
                {plan.features.map((feature) => (
                  <li key={feature} className="flex items-start gap-2 text-sm text-foreground">
                    <Check className="w-4 h-4 text-primary shrink-0 mt-0.5" />
                    {feature}
                  </li>
                ))}
              </ul>

              <Button variant={plan.variant} size="lg" className="w-full">
                {plan.cta}
              </Button>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default PricingSection;
