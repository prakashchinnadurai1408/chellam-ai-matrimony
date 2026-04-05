import { Link, useLocation } from "react-router-dom";
import { Home, Search, Heart, User, MessageCircle } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { motion } from "framer-motion";

const tabs = [
  { label: "Home", href: "/dashboard", icon: Home },
  { label: "Browse", href: "/search", icon: Search },
  { label: "Interests", href: "/interests", icon: Heart },
  { label: "Messages", href: "/messages", icon: MessageCircle },
  { label: "Profile", href: "/my-profile", icon: User },
];

const MobileBottomNav = () => {
  const { isAuthenticated } = useAuth();
  const location = useLocation();

  if (!isAuthenticated) return null;

  // Hide on admin pages
  if (location.pathname.startsWith("/admin")) return null;

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 md:hidden bg-card/95 backdrop-blur-xl border-t border-border/50 safe-area-bottom">
      <div className="flex items-center justify-around h-16 px-1">
        {tabs.map((tab) => {
          const isActive = location.pathname === tab.href || 
            (tab.href === "/dashboard" && location.pathname === "/");
          const Icon = tab.icon;
          return (
            <Link
              key={tab.label}
              to={tab.href}
              className="flex flex-col items-center justify-center gap-0.5 flex-1 py-1 relative"
            >
              {isActive && (
                <motion.div
                  layoutId="bottomNavIndicator"
                  className="absolute -top-0.5 w-8 h-0.5 rounded-full bg-primary"
                  transition={{ type: "spring", stiffness: 500, damping: 30 }}
                />
              )}
              <Icon
                className={`w-5 h-5 transition-colors ${
                  isActive ? "text-primary" : "text-muted-foreground"
                }`}
              />
              <span
                className={`text-[10px] font-medium transition-colors ${
                  isActive ? "text-primary" : "text-muted-foreground"
                }`}
              >
                {tab.label}
              </span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
};

export default MobileBottomNav;
