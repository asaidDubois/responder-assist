import React, { useState } from "react";
import { PrimaryButton, Spinner, MessageBar } from "./UI";
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
    return <MessageBar type="warning">Configure d'abord ton fournisseur IA.</MessageBar>;
  }

  return (
    <div>
      <h3 className="section-title">Apprendre mon style</h3>
      <p className="section-description">
        Analyse le courriel actuellement ouvert pour enrichir ton profil de style local. Cette fonction s'exécute uniquement à ta demande.
      </p>

      <PrimaryButton
        text={loading ? "Analyse en cours..." : "Apprendre mon style"}
        onClick={handleLearn}
        disabled={loading || !email}
      />

      {loading && (
        <div className="spinner-row"><Spinner /> Analyse du style d'écriture...</div>
      )}

      {err && <div className="message message-error">{err}</div>}

      {updated && (
        <div className="message message-success" style={{ marginTop: 8 }}>
          Profil de style mis à jour.
        </div>
      )}

      {profile && (
        <div style={{ marginTop: 12 }}>
          <label className="form-label">Profil de style actuel</label>
          <div className="profile-box">
            <div className="profile-row"><strong>Longueur moyenne :</strong> {profile.averageLength || "—"}</div>
            <div className="profile-row"><strong>Salutation :</strong> {profile.greeting ? "oui" : "non"}</div>
            <div className="profile-row"><strong>Formule finale :</strong> {profile.closing ? "oui" : "non"}</div>
            <div className="profile-row"><strong>Ton :</strong> {profile.preferredTone || "—"}</div>
            <div className="profile-row"><strong>Mode :</strong> {profile.defaultMode || "—"}</div>
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
              <div className="profile-timestamp">
                Dernière mise à jour : {new Date(profile.lastUpdated).toLocaleString("fr-FR")}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
