import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Heart, Menu, X, Sparkles, LogOut, User, MessageCircle, Shield, Bell, Eye, Settings } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useAuth } from "@/contexts/AuthContext";
import { useAdminRole } from "@/hooks/useAdminRole";

const navLinks = [
  { label: "Dashboard", href: "/dashboard", authOnly: true },
  { label: "Search", href: "/search" },
  { label: "Interests", href: "/interests", authOnly: true },
  { label: "Messages", href: "/messages", authOnly: true },
  { label: "Success Stories", href: "/success-stories" },
  { label: "How It Works", href: "#how-it-works" },
  { label: "Pricing", href: "#pricing" },
];

const Navbar = () => {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const [notifCount, setNotifCount] = useState(0);
  const { isAuthenticated, user, profile, logout } = useAuth();
  const { isAdmin } = useAdminRole(user?.id);
  const navigate = useNavigate();

  // Unread message count
  useEffect(() => {
    if (!user) { setUnreadCount(0); return; }
    const fetchUnread = async () => {
      const { data: convos } = await supabase
        .from("conversations")
        .select("id")
        .or(`user1_id.eq.${user.id},user2_id.eq.${user.id}`);
      if (!convos || convos.length === 0) return;
      const ids = convos.map((c: any) => c.id);
      const { count } = await supabase
        .from("messages")
        .select("*", { count: "exact", head: true })
        .in("conversation_id", ids)
        .eq("read", false)
        .neq("sender_id", user.id);
      setUnreadCount(count || 0);
    };
    fetchUnread();

    const channel = supabase
      .channel("navbar-unread")
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "messages" }, () => {
        fetchUnread();
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [user]);

  // Unread notification count
  useEffect(() => {
    if (!user) { setNotifCount(0); return; }
    const fetchNotifCount = async () => {
      const { count } = await supabase
        .from("notifications")
        .select("*", { count: "exact", head: true })
        .eq("user_id", user.id)
        .eq("read", false);
      setNotifCount(count || 0);
    };
    fetchNotifCount();

    const channel = supabase
      .channel("navbar-notifs")
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "notifications", filter: `user_id=eq.${user.id}` }, () => {
        fetchNotifCount();
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [user]);

  const handleLogout = async () => {
    await logout();
    navigate("/");
  };

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-card/80 backdrop-blur-xl border-b border-border/50">
      <div className="container mx-auto flex items-center justify-between h-16 px-4">
        <Link to="/" className="flex items-center gap-2">
          <div className="w-9 h-9 rounded-lg gradient-hero flex items-center justify-center">
            <Heart className="w-5 h-5 text-primary-foreground" />
          </div>
          <span className="font-display text-xl font-bold text-foreground">
            Chellam<span className="text-primary">.</span>
          </span>
        </Link>

        <div className="hidden md:flex items-center gap-6">
          {navLinks
            .filter((link) => !link.authOnly || isAuthenticated)
            .map((link) =>
            link.href.startsWith("/") ? (
              <Link
                key={link.label}
                to={link.href}
                className="relative text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
              >
                {link.label}
                {link.label === "Messages" && unreadCount > 0 && (
                  <span className="absolute -top-1.5 -right-4 w-4 h-4 rounded-full bg-primary text-primary-foreground text-[9px] font-bold flex items-center justify-center">
                    {unreadCount > 9 ? "9+" : unreadCount}
                  </span>
                )}
              </Link>
            ) : (
              <a
                key={link.label}
                href={link.href}
                className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
              >
                {link.label}
              </a>
            )
          )}
        </div>

        <div className="hidden md:flex items-center gap-2">
          {isAuthenticated ? (
            <>
              {/* Notification Bell */}
              <Button variant="ghost" size="icon" className="relative" asChild>
                <Link to="/notifications">
                  <Bell className="w-4 h-4" />
                  {notifCount > 0 && (
                    <span className="absolute top-1 right-1 w-4 h-4 rounded-full bg-primary text-primary-foreground text-[9px] font-bold flex items-center justify-center">
                      {notifCount > 9 ? "9+" : notifCount}
                    </span>
                  )}
                </Link>
              </Button>
              {/* Who Viewed Me */}
              <Button variant="ghost" size="icon" asChild>
                <Link to="/who-viewed-me">
                  <Eye className="w-4 h-4" />
                </Link>
              </Button>
              {/* Settings */}
              <Button variant="ghost" size="icon" asChild>
                <Link to="/settings">
                  <Settings className="w-4 h-4" />
                </Link>
              </Button>
              {isAdmin && (
                <Button variant="outline" size="sm" className="gap-1.5" asChild>
                  <Link to="/admin">
                    <Shield className="w-3.5 h-3.5" /> Admin
                  </Link>
                </Button>
              )}
              <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-muted text-sm">
                <User className="w-3.5 h-3.5 text-primary" />
                <span className="text-foreground font-medium">{profile?.first_name || profile?.phone || "User"}</span>
              </div>
              <Button variant="ghost" size="sm" onClick={handleLogout} className="gap-1.5">
                <LogOut className="w-3.5 h-3.5" /> Logout
              </Button>
            </>
          ) : (
            <>
              <Button variant="ghost" size="sm" asChild>
                <Link to="/auth">Sign In</Link>
              </Button>
              <Button variant="hero" size="sm" className="gap-1.5" asChild>
                <Link to="/auth">
                  <Sparkles className="w-3.5 h-3.5" /> Get Started Free
                </Link>
              </Button>
            </>
          )}
        </div>

        <button
          className="md:hidden p-2 text-foreground"
          onClick={() => setMobileOpen(!mobileOpen)}
        >
          {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
        </button>
      </div>

      <AnimatePresence>
        {mobileOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="md:hidden bg-card border-b border-border overflow-hidden"
          >
            <div className="px-4 py-4 flex flex-col gap-3">
              {navLinks
                .filter((link) => !link.authOnly || isAuthenticated)
                .map((link) =>
                link.href.startsWith("/") ? (
                  <Link
                    key={link.label}
                    to={link.href}
                    className="text-sm font-medium text-muted-foreground hover:text-foreground py-2 flex items-center gap-2"
                    onClick={() => setMobileOpen(false)}
                  >
                    {link.label}
                    {link.label === "Messages" && unreadCount > 0 && (
                      <span className="w-5 h-5 rounded-full bg-primary text-primary-foreground text-[10px] font-bold flex items-center justify-center">
                        {unreadCount > 9 ? "9+" : unreadCount}
                      </span>
                    )}
                  </Link>
                ) : (
                  <a
                    key={link.label}
                    href={link.href}
                    className="text-sm font-medium text-muted-foreground hover:text-foreground py-2"
                    onClick={() => setMobileOpen(false)}
                  >
                    {link.label}
                  </a>
                )
              )}
              {isAuthenticated && (
                <>
                  <Link to="/notifications" className="text-sm font-medium text-muted-foreground hover:text-foreground py-2 flex items-center gap-2" onClick={() => setMobileOpen(false)}>
                    Notifications
                    {notifCount > 0 && (
                      <span className="w-5 h-5 rounded-full bg-primary text-primary-foreground text-[10px] font-bold flex items-center justify-center">
                        {notifCount > 9 ? "9+" : notifCount}
                      </span>
                    )}
                  </Link>
                  <Link to="/who-viewed-me" className="text-sm font-medium text-muted-foreground hover:text-foreground py-2" onClick={() => setMobileOpen(false)}>
                    Who Viewed Me
                  </Link>
                  <Link to="/settings" className="text-sm font-medium text-muted-foreground hover:text-foreground py-2" onClick={() => setMobileOpen(false)}>
                    Settings
                  </Link>
                </>
              )}
              <div className="flex flex-col gap-2 pt-2 border-t border-border">
                {isAuthenticated ? (
                  <>
                    <div className="flex items-center gap-2 py-2 text-sm text-foreground">
                      <User className="w-4 h-4 text-primary" />
                      {profile?.first_name || profile?.phone || "User"}
                    </div>
                    <Button variant="ghost" size="sm" onClick={() => { handleLogout(); setMobileOpen(false); }}>
                      Logout
                    </Button>
                  </>
                ) : (
                  <>
                    <Button variant="ghost" size="sm" asChild>
                      <Link to="/auth" onClick={() => setMobileOpen(false)}>Sign In</Link>
                    </Button>
                    <Button variant="hero" size="sm" className="gap-1.5" asChild>
                      <Link to="/auth" onClick={() => setMobileOpen(false)}>
                        <Sparkles className="w-3.5 h-3.5" /> Get Started Free
                      </Link>
                    </Button>
                  </>
                )}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </nav>
  );
};

export default Navbar;
