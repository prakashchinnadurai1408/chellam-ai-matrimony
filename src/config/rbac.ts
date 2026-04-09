import {
  LayoutDashboard,
  Users,
  Shield,
  MessageCircle,
  Settings,
  IndianRupee,
  UserPlus,
  Star,
  UserCog,
  Mail,
  ClipboardCheck,
  CreditCard,
  BarChart2,
  HeadphonesIcon,
  Sliders,
  Bell,
} from "lucide-react";

export type AdminRole = "admin" | "moderator";

export interface SidebarLinkConfig {
  label: string;
  href: string;
  icon: any;
  allowedRoles: AdminRole[];
  group?: string;
}

// Map the navigation pages to specific roles using RBAC
export const getSidebarLinks = (role: AdminRole | null): SidebarLinkConfig[] => {
  if (!role) return [];

  const allLinks: SidebarLinkConfig[] = [
    // Core
    { label: "Dashboard", href: "/admin", icon: LayoutDashboard, allowedRoles: ["admin", "moderator"], group: "Overview" },

    // Members
    { label: "Members", href: "/admin/users", icon: Users, allowedRoles: ["admin"], group: "Members" },
    { label: "Verification / KYC", href: "/admin/verification", icon: ClipboardCheck, allowedRoles: ["admin", "moderator"], group: "Members" },
    { label: "Moderation", href: "/admin/moderation", icon: Shield, allowedRoles: ["admin", "moderator"], group: "Members" },

    // Revenue
    { label: "Subscriptions", href: "/admin/subscriptions", icon: CreditCard, allowedRoles: ["admin"], group: "Revenue" },
    { label: "Payments", href: "/admin/payments", icon: IndianRupee, allowedRoles: ["admin"], group: "Revenue" },

    // Communication
    { label: "Messages", href: "/admin/messages", icon: MessageCircle, allowedRoles: ["admin", "moderator"], group: "Communication" },
    { label: "Email Campaigns", href: "/admin/emails", icon: Mail, allowedRoles: ["admin"], group: "Communication" },
    { label: "Notifications", href: "/admin/notifications", icon: Bell, allowedRoles: ["admin"], group: "Communication" },

    // Intelligence
    { label: "Reports & Analytics", href: "/admin/reports", icon: BarChart2, allowedRoles: ["admin", "moderator"], group: "Intelligence" },
    { label: "Matchmaking Config", href: "/admin/matchmaking", icon: Sliders, allowedRoles: ["admin"], group: "Intelligence" },

    // Support
    { label: "Support & Help Desk", href: "/admin/support", icon: HeadphonesIcon, allowedRoles: ["admin", "moderator"], group: "Support" },
    { label: "Success Stories", href: "/admin/success-stories", icon: Star, allowedRoles: ["admin", "moderator"], group: "Support" },

    // Admin
    { label: "Role Management", href: "/admin/roles", icon: UserCog, allowedRoles: ["admin"], group: "Admin" },
    { label: "Create User", href: "/admin/create-user", icon: UserPlus, allowedRoles: ["admin"], group: "Admin" },
    { label: "Settings", href: "/admin/settings", icon: Settings, allowedRoles: ["admin"], group: "Admin" },
  ];

  return allLinks.filter((link) => link.allowedRoles.includes(role));
};

// Component level protection check
export const hasAccess = (requiredRoles: AdminRole[], currentRole: AdminRole | null) => {
  if (!currentRole) return false;
  return requiredRoles.includes(currentRole);
};
