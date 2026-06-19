import { encrypt, decrypt, getStoredPassphrase } from "./crypto";

export interface AIConfig {
  provider: string;
  baseUrl: string;
  apiKey: string;
  model: string;
}

export interface UserSettings {
  defaultMode: "tutoiement" | "vouvoiement";
  autoTranslate: boolean;
  replyInOriginalLanguage: boolean;
  preferredTone: string;
  averageLength: "short" | "medium" | "long";
  greeting: boolean;
  closing: boolean;
}

export interface StyleProfile {
  averageLength?: "short" | "medium" | "long";
  greeting?: boolean;
  closing?: boolean;
  preferredTone?: string;
  defaultMode?: "tutoiement" | "vouvoiement";
  frequentExpressions?: string[];
  lastUpdated?: number;
}

const KEYS = {
  AI_CONFIG: "ai_config",
  USER_SETTINGS: "user_settings",
  STYLE_PROFILE: "style_profile",
};

async function setItemEncrypted(key: string, value: any): Promise<void> {
  const pass = getStoredPassphrase();
  if (!pass) throw new Error("Phrase de passe de session manquante");
  const json = JSON.stringify(value);
  const encrypted = await encrypt(json, pass);
  localStorage.setItem(key, encrypted);
}

async function getItemDecrypted<T>(key: string): Promise<T | null> {
  const pass = getStoredPassphrase();
  if (!pass) return null;
  const encrypted = localStorage.getItem(key);
  if (!encrypted) return null;
  try {
    const json = await decrypt(encrypted, pass);
    return JSON.parse(json) as T;
  } catch (e) {
    console.error("Erreur de déchiffrement", e);
    return null;
  }
}

export const Storage = {
  async saveAIConfig(config: AIConfig): Promise<void> {
    await setItemEncrypted(KEYS.AI_CONFIG, config);
  },

  async loadAIConfig(): Promise<AIConfig | null> {
    return getItemDecrypted<AIConfig>(KEYS.AI_CONFIG);
  },

  async saveUserSettings(settings: UserSettings): Promise<void> {
    await setItemEncrypted(KEYS.USER_SETTINGS, settings);
  },

  async loadUserSettings(): Promise<UserSettings | null> {
    return getItemDecrypted<UserSettings>(KEYS.USER_SETTINGS);
  },

  async saveStyleProfile(profile: StyleProfile): Promise<void> {
    await setItemEncrypted(KEYS.STYLE_PROFILE, profile);
  },

  async loadStyleProfile(): Promise<StyleProfile | null> {
    return getItemDecrypted<StyleProfile>(KEYS.STYLE_PROFILE);
  },

  clearAll(): void {
    Object.values(KEYS).forEach((k) => localStorage.removeItem(k));
  },
};

export const DEFAULT_SETTINGS: UserSettings = {
  defaultMode: "tutoiement",
  autoTranslate: true,
  replyInOriginalLanguage: true,
  preferredTone: "friendly-professional",
  averageLength: "medium",
  greeting: true,
  closing: true,
};
