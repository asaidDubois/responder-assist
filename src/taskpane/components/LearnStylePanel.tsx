import React, { useState } from "react";
import {
  PrimaryButton,
  Spinner,
  SpinnerSize,
  MessageBar,
  MessageBarType,
  Text,
  Label,
} from "@fluentui/react";
import { useEmail } from "../hooks/useEmail";
import { useSettings } from "../hooks/useSettings";
import { analyzeStyle, EmailSample } from "../services/styleLearner";
import { StyleProfile } from "../services/storage";

export const LearnStylePanel: React.FC = () => {
  const { email } = useEmail();
  const { isConfigured, getClient, saveStyleProfile, styleProfile } = useSettings();
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [updated, setUpdated] = useState<StyleProfile | null>(null);

  const handleLearn = async () => {
    if (!email) {
      setErr("Aucun courriel ouvert à analyser.");
      return;
    }
    const client = getClient();
    if (!client) return;
    setLoading(true);
    setErr(null);
    setUpdated(null);
    try {
      const sample: EmailSample = {
        from: email.from,
        subject: email.subject,
        body: email.body,
      };
      const profile = await analyzeStyle(client, [sample]);
      await saveStyleProfile(profile);
      setUpdated(profile);
    } catch (e: any) {
      setErr(e?.message || "Erreur d'analyse du style");
    } finally {
      setLoading(false);
    }
  };

  const profile = updated || styleProfile;

  if (!isConfigured) {
    return (
      <MessageBar messageBarType={MessageBarType.warning}>
        Configurez d'abord votre fournisseur IA.
      </MessageBar>
    );
  }

  return (
    <div>
      <h3 style={{ marginTop: 0 }}>Apprendre mon style</h3>
      <Text variant="small" style={{ color: "#605e5c" }}>
        Analyse le courriel actuellement ouvert pour enrichir ton profil de style local. Cette
        fonction s'exécute uniquement à ta demande.
      </Text>

      <div style={{ marginTop: 12 }}>
        <PrimaryButton
          text={loading ? "Analyse en cours..." : "Apprendre mon style"}
          onClick={handleLearn}
          disabled={loading || !email}
        />
      </div>

      {loading && (
        <div className="spinner-container">
          <Spinner size={SpinnerSize.small} />
          <Text>Analyse du style d'écriture...</Text>
        </div>
      )}

      {err && <div className="error-message">{err}</div>}

      {updated && (
        <div className="success-message" style={{ marginTop: 8 }}>
          Profil de style mis à jour.
        </div>
      )}

      {profile && (
        <div style={{ marginTop: 12 }}>
          <Label>Profil de style actuel</Label>
          <div
            style={{
              padding: 12,
              background: "#faf9f8",
              border: "1px solid #edebe9",
              borderRadius: 4,
              fontSize: 13,
            }}
          >
            <ProfileRow label="Longueur moyenne" value={profile.averageLength} />
            <ProfileRow label="Salutation" value={profile.greeting ? "oui" : "non"} />
            <ProfileRow label="Formule finale" value={profile.closing ? "oui" : "non"} />
            <ProfileRow label="Ton" value={profile.preferredTone} />
            <ProfileRow label="Mode" value={profile.defaultMode} />
            {profile.frequentExpressions && profile.frequentExpressions.length > 0 && (
              <div style={{ marginTop: 6 }}>
                <strong>Expressions fréquentes :</strong>
                <ul style={{ margin: "4px 0 0 18px" }}>
                  {profile.frequentExpressions.map((e, i) => (
                    <li key={i}>{e}</li>
                  ))}
                </ul>
              </div>
            )}
            {profile.lastUpdated && (
              <div style={{ marginTop: 6, color: "#605e5c", fontSize: 11 }}>
                Dernière mise à jour : {new Date(profile.lastUpdated).toLocaleString("fr-FR")}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

const ProfileRow: React.FC<{ label: string; value?: string }> = ({ label, value }) => {
  if (!value) return null;
  return (
    <div>
      <strong>{label}:</strong> {value}
    </div>
  );
};
