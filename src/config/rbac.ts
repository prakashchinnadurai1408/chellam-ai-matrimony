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
} from "lucide-react";

export type AdminRole = "admin" | "moderator";

export interface SidebarLinkConfig {
  label: string;
  href: string;
  icon: any;
  allowedRoles: AdminRole[];
}

// Map the navigation pages to specific roles using RBAC
export const getSidebarLinks = (role: AdminRole | null): SidebarLinkConfig[] => {
  if (!role) return [];

  const allLinks: SidebarLinkConfig[] = [
    { label: "Dashboard", href: "/admin", icon: LayoutDashboard, allowedRoles: ["admin", "moderator"] },
    { label: "Users", href: "/admin/users", icon: Users, allowedRoles: ["admin"] },
    { label: "Role Management", href: "/admin/roles", icon: UserCog, allowedRoles: ["admin"] },
    { label: "Create User", href: "/admin/create-user", icon: UserPlus, allowedRoles: ["admin"] },
    { label: "Moderation", href: "/admin/moderation", icon: Shield, allowedRoles: ["admin", "moderator"] },
    { label: "Messages", href: "/admin/messages", icon: MessageCircle, allowedRoles: ["admin", "moderator"] },
    { label: "Payments", href: "/admin/payments", icon: IndianRupee, allowedRoles: ["admin"] },
    { label: "Email Campaigns", href: "/admin/emails", icon: Mail, allowedRoles: ["admin"] },
    { label: "Success Stories", href: "/admin/success-stories", icon: Star, allowedRoles: ["admin", "moderator"] },
    { label: "Settings", href: "/admin/settings", icon: Settings, allowedRoles: ["admin"] },
  ];

  return allLinks.filter((link) => link.allowedRoles.includes(role));
};

// Component level protection check
export const hasAccess = (requiredRoles: AdminRole[], currentRole: AdminRole | null) => {
  if (!currentRole) return false;
  return requiredRoles.includes(currentRole);
};
