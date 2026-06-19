import { useCallback, useEffect, useState } from "react";
import { AIConfig, Storage, UserSettings, StyleProfile, DEFAULT_SETTINGS } from "../services/storage";
import { OpenAIClient } from "../services/openaiClient";

export function useSettings() {
  const [aiConfig, setAIConfig] = useState<AIConfig | null>(null);
  const [userSettings, setUserSettings] = useState<UserSettings>(DEFAULT_SETTINGS);
  const [styleProfile, setStyleProfile] = useState<StyleProfile | null>(null);
  const [loaded, setLoaded] = useState(false);

  const load = useCallback(async () => {
    const [cfg, settings, profile] = await Promise.all([
      Storage.loadAIConfig(),
      Storage.loadUserSettings(),
      Storage.loadStyleProfile(),
    ]);
    if (cfg) setAIConfig(cfg);
    if (settings) setUserSettings(settings);
    if (profile) setStyleProfile(profile);
    setLoaded(true);
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const saveAIConfig = async (cfg: AIConfig) => {
    await Storage.saveAIConfig(cfg);
    setAIConfig(cfg);
  };

  const saveUserSettings = async (s: UserSettings) => {
    await Storage.saveUserSettings(s);
    setUserSettings(s);
  };

  const saveStyleProfile = async (p: StyleProfile) => {
    await Storage.saveStyleProfile(p);
    setStyleProfile(p);
  };

  const getClient = (): OpenAIClient | null => {
    if (!aiConfig) return null;
    return new OpenAIClient(aiConfig);
  };

  const isConfigured = !!aiConfig?.baseUrl && !!aiConfig?.apiKey && !!aiConfig?.model;

  return {
    aiConfig,
    userSettings,
    styleProfile,
    loaded,
    saveAIConfig,
    saveUserSettings,
    saveStyleProfile,
    reload: load,
    getClient,
    isConfigured,
  };
}
