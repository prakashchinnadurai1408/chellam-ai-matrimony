import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { FileCheck, ShieldAlert, Users, Scale } from "lucide-react";
import { motion } from "framer-motion";

const Terms = () => {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <Navbar />
      <div className="container max-w-4xl pt-28 pb-16 px-6">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-8">
          <div className="text-center space-y-4">
            <h1 className="text-4xl font-display font-bold">Terms of Service</h1>
            <p className="text-muted-foreground">Effective Date: April 5, 2026</p>
          </div>

          <div className="grid md:grid-cols-2 gap-6 pb-8">
            {[
              { icon: FileCheck, title: "Eligibility", text: "You must be of legal marriageable age as per Indian law (currently 18 for women, 21 for men)." },
              { icon: ShieldAlert, title: "Code of Conduct", text: "Respectful behavior is mandatory. Harassment or spam behavior will result in a permanent ban." },
              { icon: Users, title: "Verified Use", text: "Using fake profiles or another person's identity is strictly prohibited and leads to account deletion." },
              { icon: Scale, title: "Dispute Resolution", text: "Terms are governed by the laws of India. Any disputes will be settled in Chennai jurisdiction." },
            ].map((item, i) => (
              <div key={i} className="p-5 rounded-2xl bg-muted/50 border border-border flex gap-4">
                <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                  <item.icon className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <h3 className="font-bold text-sm mb-1">{item.title}</h3>
                  <p className="text-xs text-muted-foreground leading-relaxed">{item.text}</p>
                </div>
              </div>
            ))}
          </div>

          <div className="prose prose-sm prose-neutral dark:prose-invert max-w-none space-y-6">
            <section>
              <h2 className="text-xl font-bold">1. Acceptance of Terms</h2>
              <p className="text-sm text-muted-foreground leading-relaxed">
                By accessing or using the Chellam Matrimony platform, you agree to comply with and be bound by these Terms of Service. If you do not agree to these terms, please do not use our services.
              </p>
            </section>
            
            <section>
              <h2 className="text-xl font-bold">2. Registration & Security</h2>
              <p className="text-sm text-muted-foreground leading-relaxed">
                You are responsible for maintaining the confidentiality of your account credentials and for all activities that occur under your account. We reserve the right to suspend accounts with suspicious activity.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-bold">3. Service Limitations</h2>
              <p className="text-sm text-muted-foreground leading-relaxed">
                While we strive for 100% accuracy in matchmaking and verification, Chellam Matrimony does not guarantee that our matchmaking will always results in a life partner, as human choice and fate are variables beyond algorithm control.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-bold">4. Termination</h2>
              <p className="text-sm text-muted-foreground leading-relaxed">
                We reserve the right to terminate your access to our services if you violate any of these terms or if we believe your actions are detrimental to our community.
              </p>
            </section>

            <div className="p-6 rounded-2xl bg-amber-500/5 border border-amber-500/10 border-l-4 border-l-amber-500">
               <h4 className="text-sm font-bold text-amber-600 mb-2">Important Disclaimer</h4>
               <p className="text-xs italic text-muted-foreground">
                Chellam Matrimony is a technology platform and not a law enforcement agency. While we verify profiles, users are advised to perform their own due diligence before making significant life decisions.
               </p>
            </div>
          </div>
        </motion.div>
      </div>
      <Footer />
    </div>
  );
};

export default Terms;
