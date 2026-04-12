import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider } from "@/contexts/AuthContext";
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
            <Route path="/create-profile" element={<CreateProfile />} />
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/search" element={<Search />} />
            <Route path="/profile/:id" element={<ProfileDetail />} />
            <Route path="/messages" element={<Messages />} />
            <Route path="/preferences" element={<Preferences />} />
            <Route path="/membership" element={<Membership />} />
            <Route path="/interests" element={<Interests />} />
            <Route path="/who-viewed-me" element={<WhoViewedMe />} />
            <Route path="/notifications" element={<Notifications />} />
            <Route path="/settings" element={<Settings />} />
            <Route path="/success-stories" element={<SuccessStories />} />
            <Route path="/admin" element={<AdminDashboard />} />
            <Route path="/admin/users" element={<AdminUsers />} />
            <Route path="/admin/moderation" element={<AdminModeration />} />
            <Route path="/admin/messages" element={<AdminMessages />} />
            <Route path="/admin/settings" element={<AdminSettings />} />
            <Route path="/admin/payments" element={<AdminPayments />} />
            <Route path="/admin/create-user" element={<AdminCreateUser />} />
            <Route path="/admin/reset-password" element={<AdminResetPassword />} />
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
