import { Shield, Camera, Fingerprint, Brain, Lock, Eye } from "lucide-react";
import { motion } from "framer-motion";

const trustFeatures = [
  { icon: Camera, title: "Photo Verified", description: "AI-powered selfie verification ensures every profile photo is authentic." },
  { icon: Fingerprint, title: "ID Verified", description: "Government ID verification for complete identity assurance." },
  { icon: Brain, title: "AI Fraud Detection", description: "ML algorithms detect fake profiles, scams, and suspicious behavior." },
  { icon: Lock, title: "End-to-End Privacy", description: "Your data is encrypted and never shared without your consent." },
  { icon: Eye, title: "Profile Screening", description: "Every profile is manually reviewed by our trust & safety team." },
  { icon: Shield, title: "Safe Messaging", description: "Report and block features with 24/7 moderation support." },
];

const TrustSection = () => {
  return (
    <section className="py-20 bg-background">
      <div className="container mx-auto px-4">
        <div className="text-center mb-16">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-secondary/20 text-secondary text-xs font-semibold mb-4">
            <Shield className="w-3.5 h-3.5" />
            Trust & Safety First
          </div>
          <h2 className="font-display text-3xl sm:text-4xl font-bold text-foreground mb-4">
            Your Safety, Our Priority
          </h2>
          <p className="text-muted-foreground max-w-lg mx-auto">
            Multi-layered verification and AI-powered fraud detection keep our platform trustworthy.
          </p>
        </div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6 max-w-5xl mx-auto">
          {trustFeatures.map((feature, i) => (
            <motion.div
              key={feature.title}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1, duration: 0.5 }}
              className="bg-card rounded-2xl p-6 border border-border/50 shadow-card hover:shadow-card-hover transition-shadow"
            >
              <div className="w-12 h-12 rounded-xl bg-muted flex items-center justify-center mb-4">
                <feature.icon className="w-6 h-6 text-primary" />
              </div>
              <h3 className="font-display text-lg font-bold text-foreground mb-2">{feature.title}</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">{feature.description}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default TrustSection;
