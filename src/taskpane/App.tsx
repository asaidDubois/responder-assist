import React, { useEffect, useState } from "react";
import { Tabs, TextField, PrimaryButton, MessageBar } from "./components/UI";
import { AIConfigPanel } from "./components/AIConfigPanel";
import { SettingsPanel } from "./components/SettingsPanel";
import { EmailView } from "./components/EmailView";
import { ReplySuggestionsView } from "./components/ReplySuggestions";
import { ProofreadPanel } from "./components/ProofreadPanel";
import { LearnStylePanel } from "./components/LearnStylePanel";
import { useSettings } from "./hooks/useSettings";
import {
  hasPassphrase,
  setPassphrase,
  verifyPassphrase,
  storeSessionPassphrase,
  clearSessionPassphrase,
  getStoredPassphrase,
} from "./services/crypto";

declare const Office: any;

export const App: React.FC = () => {
  const { isConfigured } = useSettings();
  const [officeReady, setOfficeReady] = useState(false);
  const [passphrase, setPassphraseValue] = useState("");
  const [unlocked, setUnlocked] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);
  const [firstTime, setFirstTime] = useState(false);
  const [tab, setTab] = useState("email");

  useEffect(() => {
    if (typeof Office === "undefined") {
      setOfficeReady(true);
      return;
    }
    Office.onReady(() => {
      setOfficeReady(true);
    });
  }, []);

  useEffect(() => {
    if (!officeReady) return;
    setFirstTime(!hasPassphrase());
    if (getStoredPassphrase()) {
      setUnlocked(true);
    }
  }, [officeReady]);

  const handleUnlock = async () => {
    setAuthError(null);
    try {
      if (firstTime) {
        await setPassphrase(passphrase);
      } else {
        const ok = await verifyPassphrase(passphrase);
        if (!ok) {
          setAuthError("Phrase de passe incorrecte.");
          return;
        }
      }
      storeSessionPassphrase(passphrase);
      setPassphraseValue("");
      setUnlocked(true);
      setFirstTime(false);
    } catch (e: any) {
      setAuthError(e?.message || "Erreur");
    }
  };

  const handleLock = () => {
    clearSessionPassphrase();
    setUnlocked(false);
  };

  if (!officeReady) {
    return (
      <div className="app-container">
        <div>Chargement d'Office...</div>
      </div>
    );
  }

  if (!unlocked) {
    return (
      <div className="app-container">
        <h1 className="app-title">Responder Assist</h1>
        {firstTime ? (
          <p>
            Première utilisation : définis une phrase de passe qui servira à chiffrer ta clé API et tes paramètres localement.
          </p>
        ) : (
          <p>Saisis ta phrase de passe pour déverrouiller Responder Assist.</p>
        )}
        <TextField
          label="Phrase de passe"
          type="password"
          value={passphrase}
          onChange={setPassphraseValue}
          canRevealPassword
          placeholder="4 caractères minimum"
          onEnter={handleUnlock}
        />
        <PrimaryButton
          text={firstTime ? "Créer et déverrouiller" : "Déverrouiller"}
          onClick={handleUnlock}
          disabled={passphrase.length < 4}
        />
        {authError && <MessageBar type="error">{authError}</MessageBar>}
      </div>
    );
  }

  return (
    <div className="app-container">
      <div className="app-header">
        <h1 className="app-title">Responder Assist</h1>
        <span className="app-link" onClick={handleLock}>Verrouiller</span>
      </div>

      {!isConfigured && (
        <MessageBar type="info">
          Configure ton fournisseur IA dans l'onglet "Configuration IA".
        </MessageBar>
      )}

      <Tabs
        selectedKey={tab}
        onChange={setTab}
        items={[
          { key: "email", header: "Courriel", content: <div className="tab-content"><EmailView /></div> },
          { key: "replies", header: "Réponses", content: <div className="tab-content"><ReplySuggestionsView /></div> },
          { key: "proof", header: "Correction", content: <div className="tab-content"><ProofreadPanel /></div> },
          { key: "style", header: "Style", content: <div className="tab-content"><LearnStylePanel /></div> },
          { key: "settings", header: "Paramètres", content: <div className="tab-content"><SettingsPanel /></div> },
          { key: "config", header: "Config IA", content: <div className="tab-content"><AIConfigPanel /></div> },
        ]}
      />
    </div>
  );
};
