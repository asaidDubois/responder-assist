import React, { useState } from "react";
import { PrimaryButton, ChoiceGroup, Toggle, Dropdown, MessageBar } from "./UI";
import { useSettings } from "../hooks/useSettings";
import { UserSettings } from "../services/storage";
import { getStoredPassphrase } from "../services/crypto";

const TONE_OPTIONS = [
  { value: "formal", label: "Formel" },
  { value: "casual", label: "Décontracté" },
  { value: "friendly-professional", label: "Amical-professionnel" },
  { value: "direct", label: "Direct" },
];

const LENGTH_OPTIONS = [
  { value: "short", label: "Courte" },
  { value: "medium", label: "Moyenne" },
  { value: "long", label: "Longue" },
];

export const SettingsPanel: React.FC = () => {
  const { userSettings, saveUserSettings } = useSettings();
  const [local, setLocal] = useState<UserSettings>(userSettings);
  const [status, setStatus] = useState<{ type: "success" | "error"; text: string } | null>(null);

  React.useEffect(() => {
    setLocal(userSettings);
  }, [userSettings]);

  const update = <K extends keyof UserSettings>(key: K, value: UserSettings[K]) => {
    setLocal((prev) => ({ ...prev, [key]: value }));
  };

  const handleSave = async () => {
    if (!getStoredPassphrase()) {
      setStatus({ type: "error", text: "Aucune phrase de passe de session active." });
      return;
    }
    try {
      await saveUserSettings(local);
      setStatus({ type: "success", text: "Paramètres enregistrés." });
    } catch (e: any) {
      setStatus({ type: "error", text: e?.message || "Erreur" });
    }
  };

  return (
    <div>
      <h3 className="section-title">Paramètres utilisateur</h3>

      <ChoiceGroup
        label="Mode de communication"
        selectedKey={local.defaultMode}
        options={[
          { key: "tutoiement", text: "Tutoiement" },
          { key: "vouvoiement", text: "Vouvoiement" },
        ]}
        onChange={(k) => update("defaultMode", k as any)}
      />

      <Dropdown
        label="Ton préféré"
        value={local.preferredTone}
        onChange={(v) => update("preferredTone", v)}
        options={TONE_OPTIONS}
      />

      <Dropdown
        label="Longueur moyenne des réponses"
        value={local.averageLength}
        onChange={(v) => update("averageLength", v as any)}
        options={LENGTH_OPTIONS}
      />

      <div className="section">
        <Toggle
          label="Inclure une salutation"
          checked={local.greeting}
          onChange={(v) => update("greeting", v)}
        />
        <Toggle
          label="Inclure une formule de politesse finale"
          checked={local.closing}
          onChange={(v) => update("closing", v)}
        />
      </div>

      <div className="section">
        <Toggle
          label="Traduire automatiquement les courriels reçus en français"
          checked={local.autoTranslate}
          onChange={(v) => update("autoTranslate", v)}
        />
        <Toggle
          label="Répondre dans la langue du courriel reçu"
          checked={local.replyInOriginalLanguage}
          onChange={(v) => update("replyInOriginalLanguage", v)}
        />
      </div>

      {status && <MessageBar type={status.type}>{status.text}</MessageBar>}

      <PrimaryButton text="Enregistrer les paramètres" onClick={handleSave} />
    </div>
  );
};
