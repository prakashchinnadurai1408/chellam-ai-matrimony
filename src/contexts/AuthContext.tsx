import { createContext, useContext, useState, ReactNode } from "react";

export interface UserProfile {
  phone: string;
  firstName: string;
  lastName: string;
  gender: string;
  dateOfBirth: string;
  religion: string;
  community: string;
  motherTongue: string;
  city: string;
  state: string;
  education: string;
  profession: string;
  income: string;
  height: string;
  maritalStatus: string;
  diet: string;
  aboutMe: string;
  fatherOccupation: string;
  motherOccupation: string;
  siblings: string;
  familyType: string;
  familyValues: string;
  partnerAgeMin: string;
  partnerAgeMax: string;
  partnerEducation: string;
  partnerCommunity: string;
  partnerLocation: string;
}

const emptyProfile: UserProfile = {
  phone: "", firstName: "", lastName: "", gender: "", dateOfBirth: "",
  religion: "", community: "", motherTongue: "", city: "", state: "",
  education: "", profession: "", income: "", height: "", maritalStatus: "",
  diet: "", aboutMe: "", fatherOccupation: "", motherOccupation: "",
  siblings: "", familyType: "", familyValues: "", partnerAgeMin: "",
  partnerAgeMax: "", partnerEducation: "", partnerCommunity: "", partnerLocation: "",
};

interface AuthContextType {
  isAuthenticated: boolean;
  isProfileComplete: boolean;
  user: UserProfile | null;
  login: (phone: string) => void;
  logout: () => void;
  completeProfile: (profile: UserProfile) => void;
}

const AuthContext = createContext<AuthContextType | null>(null);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [isAuthenticated, setIsAuthenticated] = useState(() => localStorage.getItem("chellam_auth") === "true");
  const [isProfileComplete, setIsProfileComplete] = useState(() => localStorage.getItem("chellam_profile_complete") === "true");
  const [user, setUser] = useState<UserProfile | null>(() => {
    const saved = localStorage.getItem("chellam_user");
    return saved ? JSON.parse(saved) : null;
  });

  const login = (phone: string) => {
    setIsAuthenticated(true);
    localStorage.setItem("chellam_auth", "true");
    const profile = { ...emptyProfile, phone };
    setUser(profile);
    localStorage.setItem("chellam_user", JSON.stringify(profile));
  };

  const logout = () => {
    setIsAuthenticated(false);
    setIsProfileComplete(false);
    setUser(null);
    localStorage.removeItem("chellam_auth");
    localStorage.removeItem("chellam_profile_complete");
    localStorage.removeItem("chellam_user");
  };

  const completeProfile = (profile: UserProfile) => {
    setUser(profile);
    setIsProfileComplete(true);
    localStorage.setItem("chellam_user", JSON.stringify(profile));
    localStorage.setItem("chellam_profile_complete", "true");
  };

  return (
    <AuthContext.Provider value={{ isAuthenticated, isProfileComplete, user, login, logout, completeProfile }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
};
