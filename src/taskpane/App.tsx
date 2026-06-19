import React, { useEffect, useState } from "react";
import {
  Pivot,
  PivotItem,
  MessageBar,
  MessageBarType,
  TextField,
  PrimaryButton,
  Stack,
  Text,
} from "@fluentui/react";
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
  const { loaded, isConfigured } = useSettings();
  const [officeReady, setOfficeReady] = useState(false);
  const [passphrase, setPassphraseValue] = useState("");
  const [unlocked, setUnlocked] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);
  const [firstTime, setFirstTime] = useState(false);

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
        <Text>Chargement d'Office...</Text>
      </div>
    );
  }

  if (!unlocked) {
    return (
      <div className="app-container">
        <Stack tokens={{ childrenGap: 12 }}>
          <Text variant="large" style={{ fontWeight: 600 }}>
            Responder Assist
          </Text>
          {firstTime ? (
            <>
              <Text>
                Première utilisation : définis une phrase de passe qui servira à chiffrer ta clé API
                et tes paramètres localement.
              </Text>
              <TextField
                type="password"
                label="Phrase de passe"
                value={passphrase}
                onChange={(_, v) => setPassphraseValue(v || "")}
                canRevealPassword
                placeholder="4 caractères minimum"
              />
              <PrimaryButton
                text="Créer et déverrouiller"
                onClick={handleUnlock}
                disabled={passphrase.length < 4}
              />
            </>
          ) : (
            <>
              <Text>Saisis ta phrase de passe pour déverrouiller Responder Assist.</Text>
              <TextField
                type="password"
                label="Phrase de passe"
                value={passphrase}
                onChange={(_, v) => setPassphraseValue(v || "")}
                canRevealPassword
                onKeyDown={(e) => {
                  if (e.key === "Enter") handleUnlock();
                }}
              />
              <PrimaryButton
                text="Déverrouiller"
                onClick={handleUnlock}
                disabled={!passphrase}
              />
            </>
          )}
          {authError && <MessageBar messageBarType={MessageBarType.error}>{authError}</MessageBar>}
        </Stack>
      </div>
    );
  }

  return (
    <div className="app-container">
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
        }}
      >
        <Text variant="mediumPlus" style={{ fontWeight: 600 }}>
          Responder Assist
        </Text>
        <Text
          variant="small"
          style={{ color: "#605e5c", cursor: "pointer" }}
          onClick={handleLock}
        >
          Verrouiller
        </Text>
      </div>

      {!isConfigured && (
        <MessageBar messageBarType={MessageBarType.info}>
          Configure ton fournisseur IA pour commencer.
        </MessageBar>
      )}

      <Pivot>
        <PivotItem headerText="Courriel">
          <div className="tab-content">
            <EmailView />
          </div>
        </PivotItem>
        <PivotItem headerText="Réponses">
          <div className="tab-content">
            <ReplySuggestionsView />
          </div>
        </PivotItem>
        <PivotItem headerText="Correction">
          <div className="tab-content">
            <ProofreadPanel />
          </div>
        </PivotItem>
        <PivotItem headerText="Style">
          <div className="tab-content">
            <LearnStylePanel />
          </div>
        </PivotItem>
        <PivotItem headerText="Paramètres">
          <div className="tab-content">
            <SettingsPanel />
          </div>
        </PivotItem>
        <PivotItem headerText="Configuration IA">
          <div className="tab-content">
            <AIConfigPanel />
          </div>
        </PivotItem>
      </Pivot>
    </div>
  );
};
