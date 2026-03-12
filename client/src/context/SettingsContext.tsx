import { createContext, useContext, useEffect, useState, useCallback } from "react";

export interface ProfileSettings {
  name: string;
  email: string;
  phone: string;
  role: string;
  avatarUrl: string;
  bio: string;
}

export interface BusinessSettings {
  companyName: string;
  email: string;
  phone: string;
  website: string;
  address: string;
  city: string;
  state: string;
  country: string;
  timezone: string;
  currency: string;
  taxId: string;
  logoUrl: string;
}

export interface NotificationSettings {
  emailReminders: boolean;
  upcomingEvents: boolean;
  newClientAlert: boolean;
  quoteAccepted: boolean;
  quotePending: boolean;
  paymentReceived: boolean;
  vendorUpdates: boolean;
  weeklyReport: boolean;
  marketingTips: boolean;
}

export interface AppearanceSettings {
  theme: "light" | "system" | "dark";
  density: "compact" | "comfortable" | "spacious";
  accentColor: string;
  sidebarCollapsed: boolean;
  animationsEnabled: boolean;
}

export interface SecuritySettings {
  twofa: boolean;
  sessionAlerts: boolean;
}

const PROFILE_DEFAULTS: ProfileSettings = {
  name: "Alex Morgan",
  email: "alex@eventelite.com",
  phone: "+1 555 0100",
  role: "Administrator",
  avatarUrl: "https://github.com/shadcn.png",
  bio: "",
};

const APPEARANCE_DEFAULTS: AppearanceSettings = {
  theme: "light",
  density: "comfortable",
  accentColor: "indigo",
  sidebarCollapsed: false,
  animationsEnabled: true,
};

interface SettingsContextType {
  profile: ProfileSettings;
  business: BusinessSettings;
  notifications: NotificationSettings;
  appearance: AppearanceSettings;
  security: SecuritySettings;
  isLoaded: boolean;
  updateProfile: (data: ProfileSettings) => Promise<void>;
  updateBusiness: (data: BusinessSettings) => Promise<void>;
  updateNotifications: (data: NotificationSettings) => Promise<void>;
  updateAppearance: (data: AppearanceSettings) => Promise<void>;
  updateSecurity: (data: SecuritySettings) => Promise<void>;
}

const SettingsContext = createContext<SettingsContextType | null>(null);

const ACCENT_COLORS: Record<string, string> = {
  indigo:  "238 76% 58%",
  violet:  "263 70% 50%",
  blue:    "217 91% 60%",
  emerald: "160 84% 39%",
  rose:    "347 77% 50%",
  amber:   "38 92% 50%",
};

export function applyTheme(theme: "light" | "system" | "dark") {
  const root = document.documentElement;
  if (theme === "dark") {
    root.classList.add("dark");
  } else if (theme === "light") {
    root.classList.remove("dark");
  } else {
    const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
    if (prefersDark) root.classList.add("dark");
    else root.classList.remove("dark");
  }
}

export function applyAccentColor(color: string) {
  const value = ACCENT_COLORS[color];
  if (!value) return;
  const root = document.documentElement;
  root.style.setProperty("--primary", value);
  root.style.setProperty("--ring", value);
  root.style.setProperty("--accent-foreground", value);
}

export function SettingsProvider({ children }: { children: React.ReactNode }) {
  const [isLoaded, setIsLoaded] = useState(false);
  const [profile, setProfile] = useState<ProfileSettings>(PROFILE_DEFAULTS);
  const [business, setBusiness] = useState<BusinessSettings>({
    companyName: "EventElite Agency",
    email: "hello@eventelite.com",
    phone: "+1 555 0200",
    website: "https://eventelite.com",
    address: "123 Event Blvd, Suite 400",
    city: "New York",
    state: "NY",
    country: "United States",
    timezone: "America/New_York",
    currency: "USD",
    taxId: "",
    logoUrl: "",
  });
  const [notifications, setNotifications] = useState<NotificationSettings>({
    emailReminders: true,
    upcomingEvents: true,
    newClientAlert: true,
    quoteAccepted: true,
    quotePending: false,
    paymentReceived: true,
    vendorUpdates: false,
    weeklyReport: true,
    marketingTips: false,
  });
  const [appearance, setAppearance] = useState<AppearanceSettings>(APPEARANCE_DEFAULTS);
  const [security, setSecurity] = useState<SecuritySettings>({ twofa: false, sessionAlerts: true });

  useEffect(() => {
    fetch("/api/settings")
      .then((r) => r.json())
      .then((data) => {
        if (data.profile) setProfile(data.profile);
        if (data.business) setBusiness(data.business);
        if (data.notifications) setNotifications(data.notifications);
        if (data.appearance) {
          setAppearance(data.appearance);
          applyTheme(data.appearance.theme);
          applyAccentColor(data.appearance.accentColor);
        }
        if (data.security) setSecurity(data.security);
        setIsLoaded(true);
      })
      .catch(() => setIsLoaded(true));
  }, []);

  useEffect(() => {
    if (!isLoaded) return;
    applyTheme(appearance.theme);

    if (appearance.theme === "system") {
      const mq = window.matchMedia("(prefers-color-scheme: dark)");
      const handler = () => applyTheme("system");
      mq.addEventListener("change", handler);
      return () => mq.removeEventListener("change", handler);
    }
  }, [appearance.theme, isLoaded]);

  const save = useCallback(async (section: string, value: any) => {
    await fetch(`/api/settings/${section}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(value),
    });
  }, []);

  const updateProfile = useCallback(async (data: ProfileSettings) => {
    setProfile(data);
    await save("profile", data);
  }, [save]);

  const updateBusiness = useCallback(async (data: BusinessSettings) => {
    setBusiness(data);
    await save("business", data);
  }, [save]);

  const updateNotifications = useCallback(async (data: NotificationSettings) => {
    setNotifications(data);
    await save("notifications", data);
  }, [save]);

  const updateAppearance = useCallback(async (data: AppearanceSettings) => {
    setAppearance(data);
    applyTheme(data.theme);
    await save("appearance", data);
  }, [save]);

  const updateSecurity = useCallback(async (data: SecuritySettings) => {
    setSecurity(data);
    await save("security", data);
  }, [save]);

  return (
    <SettingsContext.Provider value={{
      profile, business, notifications, appearance, security, isLoaded,
      updateProfile, updateBusiness, updateNotifications, updateAppearance, updateSecurity,
    }}>
      {children}
    </SettingsContext.Provider>
  );
}

export function useSettings() {
  const ctx = useContext(SettingsContext);
  if (!ctx) throw new Error("useSettings must be used inside SettingsProvider");
  return ctx;
}
