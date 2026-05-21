import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Navigate, Route, Routes, useLocation } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider, useAuth } from "@/contexts/AuthContext";
import { useAdminRole } from "@/hooks/useAdminRole";
import AIChatbot from "@/components/AIChatbot";
import Index from "./pages/Index.tsx";
import Auth from "./pages/Auth.tsx";
import AdminLogin from "./pages/AdminLogin.tsx";
import CreateProfile from "./pages/CreateProfile.tsx";
import ProfileDetail from "./pages/ProfileDetail.tsx";
import Search from "./pages/Search.tsx";
import Messages from "./pages/Messages.tsx";
import Preferences from "./pages/Preferences.tsx";
import NotFound from "./pages/NotFound.tsx";
import AdminDashboard from "./pages/admin/AdminDashboard.tsx";
import AdminUsers from "./pages/admin/AdminUsers.tsx";
import AdminModeration from "./pages/admin/AdminModeration.tsx";
import AdminMessages from "./pages/admin/AdminMessages.tsx";
import AdminSettings from "./pages/admin/AdminSettings.tsx";
import AdminPayments from "./pages/admin/AdminPayments.tsx";
import AdminCreateUser from "./pages/admin/AdminCreateUser.tsx";
import AdminResetPassword from "./pages/admin/AdminResetPassword.tsx";
import Membership from "./pages/Membership.tsx";
import Interests from "./pages/Interests.tsx";
import Dashboard from "./pages/Dashboard.tsx";
import WhoViewedMe from "./pages/WhoViewedMe.tsx";
import Notifications from "./pages/Notifications.tsx";
import Settings from "./pages/Settings.tsx";
import SuccessStories from "./pages/SuccessStories.tsx";

const queryClient = new QueryClient();

const LoadingFallback = () => (
  <div className="min-h-screen flex items-center justify-center bg-background text-sm text-muted-foreground">
    Loading…
  </div>
);

const AuthGuard = ({ children }: { children: JSX.Element }) => {
  const { isAuthenticated, loading } = useAuth();
  const location = useLocation();

  if (loading) return <LoadingFallback />;
  if (!isAuthenticated) return <Navigate to="/auth" state={{ from: location }} replace />;
  return children;
};

const ProfileGuard = ({ children }: { children: JSX.Element }) => {
  const { isAuthenticated, isProfileComplete, loading } = useAuth();
  const location = useLocation();

  if (loading) return <LoadingFallback />;
  if (!isAuthenticated) return <Navigate to="/auth" state={{ from: location }} replace />;
  if (!isProfileComplete) return <Navigate to="/create-profile" state={{ from: location }} replace />;
  return children;
};

const AdminGuard = ({ children }: { children: JSX.Element }) => {
  const { isAuthenticated, user, loading } = useAuth();
  const { isAdmin, loading: adminLoading } = useAdminRole(user?.id);
  const location = useLocation();

  if (loading || adminLoading) return <LoadingFallback />;
  if (!isAuthenticated) return <Navigate to="/auth" state={{ from: location }} replace />;
  if (!isAdmin) return <Navigate to="/" replace />;
  return children;
};

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <AuthProvider>
          <Routes>
            <Route path="/" element={<Index />} />
            <Route path="/auth" element={<Auth />} />
            <Route path="/admin-login" element={<AdminLogin />} />
            <Route path="/create-profile" element={<AuthGuard><CreateProfile /></AuthGuard>} />
            <Route path="/dashboard" element={<ProfileGuard><Dashboard /></ProfileGuard>} />
            <Route path="/search" element={<Search />} />
            <Route path="/profile/:id" element={<ProfileDetail />} />
            <Route path="/messages" element={<ProfileGuard><Messages /></ProfileGuard>} />
            <Route path="/preferences" element={<ProfileGuard><Preferences /></ProfileGuard>} />
            <Route path="/membership" element={<ProfileGuard><Membership /></ProfileGuard>} />
            <Route path="/interests" element={<ProfileGuard><Interests /></ProfileGuard>} />
            <Route path="/who-viewed-me" element={<ProfileGuard><WhoViewedMe /></ProfileGuard>} />
            <Route path="/notifications" element={<ProfileGuard><Notifications /></ProfileGuard>} />
            <Route path="/settings" element={<ProfileGuard><Settings /></ProfileGuard>} />
            <Route path="/success-stories" element={<ProfileGuard><SuccessStories /></ProfileGuard>} />
            <Route path="/admin" element={<AdminGuard><AdminDashboard /></AdminGuard>} />
            <Route path="/admin/users" element={<AdminGuard><AdminUsers /></AdminGuard>} />
            <Route path="/admin/moderation" element={<AdminGuard><AdminModeration /></AdminGuard>} />
            <Route path="/admin/messages" element={<AdminGuard><AdminMessages /></AdminGuard>} />
            <Route path="/admin/settings" element={<AdminGuard><AdminSettings /></AdminGuard>} />
            <Route path="/admin/payments" element={<AdminGuard><AdminPayments /></AdminGuard>} />
            <Route path="/admin/create-user" element={<AdminGuard><AdminCreateUser /></AdminGuard>} />
            <Route path="/admin/reset-password" element={<AdminGuard><AdminResetPassword /></AdminGuard>} />
            {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
            <Route path="*" element={<NotFound />} />
          </Routes>
          <AIChatbot />
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
