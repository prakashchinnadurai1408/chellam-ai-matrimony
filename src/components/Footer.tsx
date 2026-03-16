import { Heart, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";

const Footer = () => {
  return (
    <footer className="bg-foreground text-card">
      {/* CTA Section */}
      <div className="container mx-auto px-4 py-16">
        <div className="text-center max-w-2xl mx-auto">
          <h2 className="font-display text-3xl sm:text-4xl font-bold mb-4">
            Ready to Find Your Soulmate?
          </h2>
          <p className="text-card/70 mb-8">
            Join 2M+ members who trust Chellam's AI to find their perfect life partner.
          </p>
          <Button variant="hero" size="lg" className="gap-2 text-base">
            <Sparkles className="w-4 h-4" />
            Create Free Profile
          </Button>
        </div>
      </div>

      {/* Footer Links */}
      <div className="border-t border-card/10">
        <div className="container mx-auto px-4 py-8">
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-8 mb-8">
            <div>
              <div className="flex items-center gap-2 mb-4">
                <div className="w-8 h-8 rounded-lg gradient-hero flex items-center justify-center">
                  <Heart className="w-4 h-4 text-primary-foreground" />
                </div>
                <span className="font-display text-lg font-bold">Chellam</span>
              </div>
              <p className="text-card/60 text-sm leading-relaxed">
                India's most advanced AI-powered matrimonial platform for meaningful connections.
              </p>
            </div>

            {[
              {
                title: "Platform",
                links: ["AI Matching", "Community Portals", "Verified Profiles", "Success Stories"],
              },
              {
                title: "Company",
                links: ["About Us", "Careers", "Blog", "Press"],
              },
              {
                title: "Support",
                links: ["Help Center", "Safety Tips", "Privacy Policy", "Terms of Service"],
              },
            ].map((col) => (
              <div key={col.title}>
                <h4 className="font-semibold text-sm mb-4">{col.title}</h4>
                <ul className="flex flex-col gap-2">
                  {col.links.map((link) => (
                    <li key={link}>
                      <a href="#" className="text-sm text-card/60 hover:text-card transition-colors">
                        {link}
                      </a>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>

          <div className="border-t border-card/10 pt-6 flex flex-col sm:flex-row justify-between items-center gap-4">
            <p className="text-xs text-card/40">
              © 2026 Chellam Matrimony. All rights reserved.
            </p>
            <p className="text-xs text-card/40 flex items-center gap-1">
              Made with <Heart className="w-3 h-3 text-primary" /> and AI
            </p>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
