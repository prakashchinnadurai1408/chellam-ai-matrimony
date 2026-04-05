import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { Shield, Lock, Eye, FileText } from "lucide-react";
import { motion } from "framer-motion";

const Privacy = () => {
  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="container max-w-4xl pt-28 pb-16 px-6">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-8">
          <div className="text-center space-y-4">
            <h1 className="text-4xl font-display font-bold text-foreground">Privacy Policy</h1>
            <p className="text-muted-foreground">Last updated: April 5, 2026</p>
          </div>

          <div className="grid md:grid-cols-2 gap-6 pb-8">
            {[
              { icon: Shield, title: "Data Protection", text: "Your personal data is encrypted and stored in secure industry-standard data centers." },
              { icon: Lock, title: "Access Control", text: "Only verified members with premium access can view sensitive contact details." },
              { icon: Eye, title: "Privacy First", text: "We never sell your data to third-party marketing companies. Period." },
              { icon: FileText, title: "Transparency", text: "You have the right to request a copy of your data or deletion at any time." },
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

          <div className="prose prose-sm prose-neutral dark:prose-invert max-w-none space-y-6 text-foreground">
            <section>
              <h2 className="text-xl font-bold">1. Information We Collect</h2>
              <p className="text-sm text-muted-foreground leading-relaxed">
                Chellam Matrimony collects information to provide better services to our members. This includes personal identification (Name, DOB, Gender), contact details, community background, and professional/educational history.
              </p>
            </section>
            
            <section>
              <h2 className="text-xl font-bold">2. How We Use Information</h2>
              <p className="text-sm text-muted-foreground leading-relaxed">
                We use your information to match you with compatible profiles, verify identity (to reduce fraud), and facilitate communication between interested parties.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-bold">3. Profile Visibility</h2>
              <p className="text-sm text-muted-foreground leading-relaxed">
                Members can control their profile visibility in settings. By default, your basic profile is visible to all registered members. Photos and contact details are restricted based on your privacy settings.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-bold">4. Security Measures</h2>
              <p className="text-sm text-muted-foreground leading-relaxed">
                We implement technical, administrative, and physical security measures that are designed to protect member information from unauthorized access, loss, misuse, or alteration.
              </p>
            </section>

            <div className="p-6 rounded-2xl bg-primary/5 border border-primary/10">
              <p className="text-sm italic text-muted-foreground">
                If you have any questions about this privacy policy, please contact our data protection officer at <span className="text-primary font-medium">privacy@chellam.me</span>
              </p>
            </div>
          </div>
        </motion.div>
      </div>
      <Footer />
    </div>
  );
};

export default Privacy;
