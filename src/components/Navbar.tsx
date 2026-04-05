import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import {
  Heart, Menu, X, Sparkles, LogOut, User, MessageCircle, Shield,
  Bell, Compass, Settings, Eye, Bookmark,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useAuth } from "@/contexts/AuthContext";
import { useAdminRole } from "@/hooks/useAdminRole";

const navLinks = [
  { label: "Dashboard", href: "/dashboard", authOnly: true },
  { label: "Discover", href: "/discover", authOnly: true, icon: Compass },
  { label: "Search", href: "/search" },
  { label: "Interests", href: "/interests", authOnly: true },
  { label: "Messages", href: "/messages", authOnly: true },
  { label: "Membership", href: "/membership", authOnly: true },
  { label: "Success Stories", href: "/success-stories" },
];

const Navbar = () => {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const [notifCount, setNotifCount] = useState(0);
  const [profileMenuOpen, setProfileMenuOpen] = useState(false);
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

  // Notification count (pending interests received)
  useEffect(() => {
    if (!user) { setNotifCount(0); return; }
    const fetchNotifs = async () => {
      const { count } = await supabase
        .from("interests")
        .select("*", { count: "exact", head: true })
        .eq("receiver_id", user.id)
        .eq("status", "pending");
      setNotifCount(count || 0);
    };
    fetchNotifs();

    const channel = supabase
      .channel("navbar-notifs")
      .on("postgres_changes", { event: "*", schema: "public", table: "interests" }, () => {
        fetchNotifs();
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [user]);

  const handleLogout = async () => {
    await logout();
    navigate("/");
  };

  const profileMenuItems = [
    { label: "My Profile", href: "/my-profile", icon: User },
    { label: "Preferences", href: "/preferences", icon: Heart },
    { label: "Who Viewed Me", href: "/profile-views", icon: Eye },
    { label: "Settings", href: "/settings", icon: Settings },
  ];

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
              <Link
                to="/notifications"
                className="relative p-2 rounded-lg hover:bg-muted transition-colors"
              >
                <Bell className="w-5 h-5 text-muted-foreground" />
                {notifCount > 0 && (
                  <span className="absolute top-0.5 right-0.5 w-4 h-4 rounded-full bg-destructive text-destructive-foreground text-[9px] font-bold flex items-center justify-center animate-pulse">
                    {notifCount > 9 ? "9+" : notifCount}
                  </span>
                )}
              </Link>

              {isAdmin && (
                <Button variant="outline" size="sm" className="gap-1.5" asChild>
                  <Link to="/admin">
                    <Shield className="w-3.5 h-3.5" /> Admin
                  </Link>
                </Button>
              )}

              {/* Profile Dropdown */}
              <div className="relative">
                <button
                  onClick={() => setProfileMenuOpen(!profileMenuOpen)}
                  className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-muted hover:bg-muted/80 transition-colors text-sm"
                >
                  <div className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center overflow-hidden">
                    {profile?.photo_url ? (
                      <img src={profile.photo_url} alt="" className="w-full h-full object-cover" />
                    ) : (
                      <User className="w-3.5 h-3.5 text-primary" />
                    )}
                  </div>
                  <span className="text-foreground font-medium max-w-[100px] truncate">
                    {profile?.first_name || "User"}
                  </span>
                </button>

                <AnimatePresence>
                  {profileMenuOpen && (
                    <>
                      <div className="fixed inset-0 z-40" onClick={() => setProfileMenuOpen(false)} />
                      <motion.div
                        initial={{ opacity: 0, y: 8, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 8, scale: 0.95 }}
                        transition={{ duration: 0.15 }}
                        className="absolute right-0 top-full mt-2 w-52 bg-card rounded-xl border border-border shadow-lg z-50 py-1 overflow-hidden"
                      >
                        {profileMenuItems.map((item) => (
                          <Link
                            key={item.label}
                            to={item.href}
                            className="flex items-center gap-3 px-4 py-2.5 text-sm text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
                            onClick={() => setProfileMenuOpen(false)}
                          >
                            <item.icon className="w-4 h-4" />
                            {item.label}
                          </Link>
                        ))}
                        <div className="border-t border-border my-1" />
                        <button
                          onClick={() => { handleLogout(); setProfileMenuOpen(false); }}
                          className="flex items-center gap-3 px-4 py-2.5 text-sm text-destructive hover:bg-destructive/5 transition-colors w-full text-left"
                        >
                          <LogOut className="w-4 h-4" />
                          Logout
                        </button>
                      </motion.div>
                    </>
                  )}
                </AnimatePresence>
              </div>
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
            <div className="px-4 py-4 flex flex-col gap-1">
              {navLinks
                .filter((link) => !link.authOnly || isAuthenticated)
                .map((link) =>
                link.href.startsWith("/") ? (
                  <Link
                    key={link.label}
                    to={link.href}
                    className="text-sm font-medium text-muted-foreground hover:text-foreground py-2.5 flex items-center gap-2"
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
                    className="text-sm font-medium text-muted-foreground hover:text-foreground py-2.5"
                    onClick={() => setMobileOpen(false)}
                  >
                    {link.label}
                  </a>
                )
              )}

              {isAuthenticated && (
                <>
                  <div className="border-t border-border my-2" />
                  <Link to="/notifications" className="text-sm font-medium text-muted-foreground hover:text-foreground py-2.5 flex items-center gap-2" onClick={() => setMobileOpen(false)}>
                    <Bell className="w-4 h-4" /> Notifications
                    {notifCount > 0 && <span className="w-5 h-5 rounded-full bg-destructive text-destructive-foreground text-[10px] font-bold flex items-center justify-center">{notifCount}</span>}
                  </Link>
                  {profileMenuItems.map((item) => (
                    <Link
                      key={item.label}
                      to={item.href}
                      className="text-sm font-medium text-muted-foreground hover:text-foreground py-2.5 flex items-center gap-2"
                      onClick={() => setMobileOpen(false)}
                    >
                      <item.icon className="w-4 h-4" /> {item.label}
                    </Link>
                  ))}
                </>
              )}

              <div className="flex flex-col gap-2 pt-2 border-t border-border">
                {isAuthenticated ? (
                  <>
                    <div className="flex items-center gap-2 py-2 text-sm text-foreground">
                      <div className="w-7 h-7 rounded-full bg-primary/10 flex items-center justify-center overflow-hidden">
                        {profile?.photo_url ? (
                          <img src={profile.photo_url} alt="" className="w-full h-full object-cover" />
                        ) : (
                          <User className="w-4 h-4 text-primary" />
                        )}
                      </div>
                      {profile?.first_name || "User"}
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
