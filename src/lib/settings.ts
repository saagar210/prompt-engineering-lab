export interface AppSettings {
  ollamaUrl: string;
  defaultModel: string;
  themeMode: "dark" | "light" | "system";
}

const SETTINGS_KEY = "promptlab-settings";

const defaults: AppSettings = {
  ollamaUrl: "http://localhost:11434",
  defaultModel: "",
  themeMode: "dark",
};

export function getSettings(): AppSettings {
  if (typeof window === "undefined") return defaults;
  try {
    const stored = localStorage.getItem(SETTINGS_KEY);
    if (!stored) return defaults;
    return { ...defaults, ...JSON.parse(stored) };
  } catch {
    return defaults;
  }
}

export function saveSettings(settings: Partial<AppSettings>): AppSettings {
  const current = getSettings();
  const merged = { ...current, ...settings };
  localStorage.setItem(SETTINGS_KEY, JSON.stringify(merged));
  return merged;
}
