import React, { useState } from "react";
import {
  PrimaryButton,
  ChoiceGroup,
  IChoiceGroupOption,
  Toggle,
  MessageBar,
  MessageBarType,
  Dropdown,
  IDropdownOption,
} from "@fluentui/react";
import { useSettings } from "../hooks/useSettings";
import { UserSettings } from "../services/storage";
import { getStoredPassphrase } from "../services/crypto";

const MODE_OPTIONS: IChoiceGroupOption[] = [
  { key: "tutoiement", text: "Tutoiement" },
  { key: "vouvoiement", text: "Vouvoiement" },
];

const TONE_OPTIONS: IDropdownOption[] = [
  { key: "formal", text: "Formel" },
  { key: "casual", text: "Décontracté" },
  { key: "friendly-professional", text: "Amical-professionnel" },
  { key: "direct", text: "Direct" },
];

const LENGTH_OPTIONS: IDropdownOption[] = [
  { key: "short", text: "Courte" },
  { key: "medium", text: "Moyenne" },
  { key: "long", text: "Longue" },
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
      <h3 style={{ marginTop: 0 }}>Paramètres utilisateur</h3>

      <div className="section">
        <ChoiceGroup
          label="Mode de communication"
          selectedKey={local.defaultMode}
          options={MODE_OPTIONS}
          onChange={(_, v) => v && update("defaultMode", v.key as any)}
        />
      </div>

      <div className="section">
        <Dropdown
          label="Ton préféré"
          selectedKey={local.preferredTone}
          options={TONE_OPTIONS}
          onChange={(_, v) => v && update("preferredTone", String(v.key))}
        />
      </div>

      <div className="section">
        <Dropdown
          label="Longueur moyenne des réponses"
          selectedKey={local.averageLength}
          options={LENGTH_OPTIONS}
          onChange={(_, v) => v && update("averageLength", v.key as any)}
        />
      </div>

      <div className="section">
        <Toggle
          label="Inclure une salutation"
          checked={local.greeting}
          onChange={(_, v) => update("greeting", !!v)}
        />
        <Toggle
          label="Inclure une formule de politesse finale"
          checked={local.closing}
          onChange={(_, v) => update("closing", !!v)}
        />
      </div>

      <div className="section">
        <Toggle
          label="Traduire automatiquement les courriels reçus en français"
          checked={local.autoTranslate}
          onChange={(_, v) => update("autoTranslate", !!v)}
        />
        <Toggle
          label="Répondre dans la langue du courriel reçu"
          checked={local.replyInOriginalLanguage}
          onChange={(_, v) => update("replyInOriginalLanguage", !!v)}
        />
      </div>

      {status && (
        <MessageBar
          messageBarType={status.type === "success" ? MessageBarType.success : MessageBarType.error}
          styles={{ root: { marginBottom: 12 } }}
        >
          {status.text}
        </MessageBar>
      )}

      <PrimaryButton text="Enregistrer les paramètres" onClick={handleSave} />
    </div>
  );
};
