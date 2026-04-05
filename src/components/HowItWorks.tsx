import { UserPlus, Sparkles, Heart, MessageCircle } from "lucide-react";
import { motion } from "framer-motion";

const steps = [
  {
    icon: UserPlus,
    title: "Create Your Profile",
    description: "Sign up with OTP, add your details, education, family background, and partner preferences.",
    gradient: "gradient-hero",
  },
  {
    icon: Sparkles,
    title: "AI Finds Your Matches",
    description: "Our engine analyzes 50+ factors including personality, values, horoscope, and lifestyle compatibility.",
    gradient: "gradient-ai",
  },
  {
    icon: Heart,
    title: "Express Interest",
    description: "Browse AI-curated daily matches, see compatibility insights, and send interest to profiles you like.",
    gradient: "gradient-warm",
  },
  {
    icon: MessageCircle,
    title: "Connect & Meet",
    description: "Chat securely with mutual matches, schedule video calls, and take the relationship forward.",
    gradient: "gradient-hero",
  },
];

const HowItWorks = () => {
  return (
    <section id="how-it-works" className="py-20 bg-surface">
      <div className="container mx-auto px-4">
        <div className="text-center mb-16">
          <h2 className="font-display text-3xl sm:text-4xl font-bold text-foreground mb-4">
            How Chellam Works
          </h2>
          <p className="text-muted-foreground max-w-lg mx-auto">
            Four simple steps to finding your life partner through AI-powered compatibility matching.
          </p>
        </div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-8">
          {steps.map((step, i) => (
            <motion.div
              key={step.title}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.15, duration: 0.5 }}
              className="relative text-center"
            >
              {i < steps.length - 1 && (
                <div className="hidden lg:block absolute top-10 left-[60%] w-[80%] h-px bg-border" />
              )}
              <div className={`w-20 h-20 rounded-2xl ${step.gradient} flex items-center justify-center mx-auto mb-5 shadow-lg`}>
                <step.icon className="w-8 h-8 text-primary-foreground" />
              </div>
              <div className="text-xs font-bold text-primary mb-2">Step {i + 1}</div>
              <h3 className="font-display text-xl font-bold text-foreground mb-2">{step.title}</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">{step.description}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default HowItWorks;
