import React, { useState, useEffect } from "react";
import {
  PrimaryButton,
  DefaultButton,
  Spinner,
  SpinnerSize,
  MessageBar,
  MessageBarType,
  Text,
} from "@fluentui/react";
import { useEmail } from "../hooks/useEmail";
import { useSettings } from "../hooks/useSettings";
import { translateEmail, TranslationResult } from "../services/translator";

export const EmailView: React.FC = () => {
  const { email, loading, error } = useEmail();
  const { isConfigured, getClient, userSettings } = useSettings();
  const [translating, setTranslating] = useState(false);
  const [translation, setTranslation] = useState<TranslationResult | null>(null);
  const [showOriginal, setShowOriginal] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    setTranslation(null);
    setShowOriginal(false);
    setErr(null);
  }, [email?.itemId]);

  useEffect(() => {
    if (!email || !isConfigured || !userSettings.autoTranslate) return;
    if (translation || translating) return;
    if (email.itemType !== "read") return;
    doTranslate();
  }, [email, isConfigured, userSettings.autoTranslate]);

  const doTranslate = async () => {
    if (!email) return;
    const client = getClient();
    if (!client) return;
    setTranslating(true);
    setErr(null);
    try {
      const result = await translateEmail(client, email.subject, email.body);
      setTranslation(result);
    } catch (e: any) {
      setErr(e?.message || "Erreur de traduction");
    } finally {
      setTranslating(false);
    }
  };

  if (loading) {
    return (
      <div className="spinner-container">
        <Spinner size={SpinnerSize.small} />
        <Text>Chargement du courriel...</Text>
      </div>
    );
  }

  if (error) {
    return <MessageBar messageBarType={MessageBarType.error}>{error}</MessageBar>;
  }

  if (!email) {
    return <Text>Sélectionnez un courriel pour commencer.</Text>;
  }

  if (!isConfigured) {
    return (
      <MessageBar messageBarType={MessageBarType.warning}>
        Configurez d'abord votre fournisseur IA dans l'onglet "Configuration IA".
      </MessageBar>
    );
  }

  const needsTranslation =
    translation && translation.originalLanguage !== "fr";
  const displayedSubject = showOriginal
    ? email.subject
    : translation?.translatedSubject || email.subject;
  const displayedBody = showOriginal
    ? email.body
    : translation?.translatedBody || email.body;

  return (
    <div>
      <h3 style={{ marginTop: 0 }}>Courriel</h3>
      <Text variant="small" style={{ color: "#605e5c" }}>
        De : {email.from}
      </Text>
      <div style={{ margin: "8px 0" }}>
        <Text variant="mediumPlus" style={{ fontWeight: 600 }}>
          {displayedSubject}
        </Text>
      </div>

      {translating && (
        <div className="spinner-container">
          <Spinner size={SpinnerSize.small} />
          <Text>Traduction en cours...</Text>
        </div>
      )}

      {err && <div className="error-message">{err}</div>}

      {translation && !translating && (
        <div style={{ marginBottom: 8 }}>
          {needsTranslation && (
            <DefaultButton
              text={showOriginal ? "Voir la traduction" : "Voir l'original"}
              onClick={() => setShowOriginal((s) => !s)}
              styles={{ root: { marginBottom: 8 } }}
            />
          )}
          {needsTranslation && (
            <div className="success-message">
              Langue détectée : {translation.originalLanguage} → français
            </div>
          )}
        </div>
      )}

      <div
        style={{
          whiteSpace: "pre-wrap",
          padding: 12,
          background: "#faf9f8",
          border: "1px solid #edebe9",
          borderRadius: 4,
          maxHeight: 280,
          overflowY: "auto",
          fontSize: 13,
        }}
      >
        {displayedBody || <em>(Corps vide)</em>}
      </div>

      {needsTranslation && !translating && (
        <PrimaryButton
          text="Retraduire"
          onClick={doTranslate}
          styles={{ root: { marginTop: 8 } }}
        />
      )}
    </div>
  );
};
