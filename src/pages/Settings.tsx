import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import {
  Settings as SettingsIcon, Shield, Eye, Bell, Lock, LogOut, Trash2,
  Globe, UserX, AlertTriangle, Loader2, Moon, Sun,
} from "lucide-react";
import { motion } from "framer-motion";
import { toast } from "sonner";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

const Settings = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [saving, setSaving] = useState(false);

  // Theme settings
  const [isDarkMode, setIsDarkMode] = useState(() => {
    if (typeof window !== 'undefined') {
      return document.documentElement.classList.contains('dark');
    }
    return false;
  });

  const toggleDarkMode = (checked: boolean) => {
    setIsDarkMode(checked);
    if (checked) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('theme', 'light');
    }
  };

  // Privacy settings (local state — in production these would be DB-backed)
  const [showProfile, setShowProfile] = useState(true);
  const [showPhoto, setShowPhoto] = useState(true);
  const [showContact, setShowContact] = useState(false);
  const [showLastSeen, setShowLastSeen] = useState(true);

  // Notification settings
  const [notifInterests, setNotifInterests] = useState(true);
  const [notifMessages, setNotifMessages] = useState(true);
  const [notifViews, setNotifViews] = useState(true);
  const [notifMatches, setNotifMatches] = useState(true);
  const [notifEmail, setNotifEmail] = useState(false);

  const handleSaveSettings = () => {
    setSaving(true);
    // Simulated save
    setTimeout(() => {
      setSaving(false);
      toast.success("Settings saved successfully!");
    }, 800);
  };

  const handleLogout = async () => {
    await logout();
    navigate("/");
  };

  const handleDeleteAccount = async () => {
    if (!user) return;
    // In production, this would be a soft-delete with a grace period
    toast.success("Account deletion requested. You'll receive a confirmation email.");
  };

  if (!user) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="pt-24 text-center">
          <SettingsIcon className="w-16 h-16 text-muted-foreground/30 mx-auto mb-4" />
          <h2 className="font-display text-2xl font-bold mb-2">Sign in to access settings</h2>
          <Button className="mt-4" onClick={() => navigate("/auth")}>Sign In</Button>
        </div>
      </div>
    );
  }

  const SettingRow = ({ label, description, checked, onChange }: {
    label: string; description: string; checked: boolean; onChange: (v: boolean) => void;
  }) => (
    <div className="flex items-center justify-between py-4 border-b border-border/30 last:border-0">
      <div className="space-y-0.5 flex-1 mr-4">
        <Label className="text-sm font-medium text-foreground">{label}</Label>
        <p className="text-xs text-muted-foreground">{description}</p>
      </div>
      <Switch checked={checked} onCheckedChange={onChange} />
    </div>
  );

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main className="pt-24 pb-16">
        <div className="container mx-auto max-w-2xl px-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <h1 className="font-display text-2xl font-bold text-foreground flex items-center gap-2 mb-1">
              <SettingsIcon className="w-6 h-6 text-primary" /> Settings
            </h1>
            <p className="text-sm text-muted-foreground mb-8">Manage your privacy, notifications, and account</p>
          </motion.div>

          <div className="space-y-6">
            {/* Theme */}
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }}>
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Moon className="w-5 h-5 text-primary" /> Appearance
                  </CardTitle>
                  <CardDescription>Customize how the platform looks for you</CardDescription>
                </CardHeader>
                <CardContent>
                  <SettingRow
                    label="Dark Mode"
                    description="Switch between light and dark themes"
                    checked={isDarkMode}
                    onChange={toggleDarkMode}
                  />
                </CardContent>
              </Card>
            </motion.div>

            {/* Privacy */}
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Eye className="w-5 h-5 text-primary" /> Privacy Settings
                  </CardTitle>
                  <CardDescription>Control who can see your information</CardDescription>
                </CardHeader>
                <CardContent>
                  <SettingRow
                    label="Profile Visibility"
                    description="Allow other users to see your profile in search results"
                    checked={showProfile}
                    onChange={setShowProfile}
                  />
                  <SettingRow
                    label="Photo Visibility"
                    description="Show your photos to all members (otherwise only accepted interests)"
                    checked={showPhoto}
                    onChange={setShowPhoto}
                  />
                  <SettingRow
                    label="Contact Details"
                    description="Show phone/email to accepted interests (premium members)"
                    checked={showContact}
                    onChange={setShowContact}
                  />
                  <SettingRow
                    label="Last Seen"
                    description="Show when you were last active on the platform"
                    checked={showLastSeen}
                    onChange={setShowLastSeen}
                  />
                </CardContent>
              </Card>
            </motion.div>

            {/* Notifications */}
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}>
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Bell className="w-5 h-5 text-primary" /> Notification Preferences
                  </CardTitle>
                  <CardDescription>Choose what notifications you receive</CardDescription>
                </CardHeader>
                <CardContent>
                  <SettingRow
                    label="Interest Notifications"
                    description="Get notified when someone sends or accepts your interests"
                    checked={notifInterests}
                    onChange={setNotifInterests}
                  />
                  <SettingRow
                    label="Message Notifications"
                    description="Get notified when you receive new messages"
                    checked={notifMessages}
                    onChange={setNotifMessages}
                  />
                  <SettingRow
                    label="Profile View Notifications"
                    description="Get notified when someone views your profile"
                    checked={notifViews}
                    onChange={setNotifViews}
                  />
                  <SettingRow
                    label="Daily Matches"
                    description="Get notified when your daily AI matches are ready"
                    checked={notifMatches}
                    onChange={setNotifMatches}
                  />
                  <SettingRow
                    label="Email Notifications"
                    description="Receive important updates via email"
                    checked={notifEmail}
                    onChange={setNotifEmail}
                  />
                </CardContent>
              </Card>
            </motion.div>

            {/* Security */}
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Shield className="w-5 h-5 text-primary" /> Security & Account
                  </CardTitle>
                  <CardDescription>Manage your account security</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between py-3 border-b border-border/30">
                    <div>
                      <p className="text-sm font-medium text-foreground">Blocked Users</p>
                      <p className="text-xs text-muted-foreground">Manage users you've blocked</p>
                    </div>
                    <Button variant="outline" size="sm" className="gap-1.5">
                      <UserX className="w-3.5 h-3.5" /> Manage
                    </Button>
                  </div>

                  <div className="flex items-center justify-between py-3 border-b border-border/30">
                    <div>
                      <p className="text-sm font-medium text-foreground">ID Verification</p>
                      <p className="text-xs text-muted-foreground">Verify your identity for a trusted badge</p>
                    </div>
                    <Button variant="outline" size="sm" className="gap-1.5">
                      <Shield className="w-3.5 h-3.5" /> Verify
                    </Button>
                  </div>

                  <div className="flex items-center justify-between py-3">
                    <div>
                      <p className="text-sm font-medium text-foreground">Sign Out</p>
                      <p className="text-xs text-muted-foreground">Sign out from this device</p>
                    </div>
                    <Button variant="outline" size="sm" className="gap-1.5" onClick={handleLogout}>
                      <LogOut className="w-3.5 h-3.5" /> Sign Out
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </motion.div>

            {/* Danger Zone */}
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.25 }}>
              <Card className="border-destructive/20">
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2 text-destructive">
                    <AlertTriangle className="w-5 h-5" /> Danger Zone
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center justify-between py-3">
                    <div>
                      <p className="text-sm font-medium text-foreground">Delete Account</p>
                      <p className="text-xs text-muted-foreground">Permanently delete your account and all data</p>
                    </div>
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button variant="destructive" size="sm" className="gap-1.5">
                          <Trash2 className="w-3.5 h-3.5" /> Delete
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                          <AlertDialogDescription>
                            This action cannot be undone. Your profile, messages, interests, and all associated data will be permanently deleted.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancel</AlertDialogCancel>
                          <AlertDialogAction onClick={handleDeleteAccount} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
                            Yes, Delete My Account
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </div>
                </CardContent>
              </Card>
            </motion.div>

            {/* Save Button */}
            <div className="flex justify-end pt-2">
              <Button variant="hero" onClick={handleSaveSettings} disabled={saving} className="gap-2 px-8">
                {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Shield className="w-4 h-4" />}
                Save All Settings
              </Button>
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default Settings;
