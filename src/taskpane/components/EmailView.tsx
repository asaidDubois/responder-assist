import React, { useState, useEffect } from "react";
import { DefaultButton, Spinner, MessageBar } from "./UI";
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
      <div className="spinner-row">
        <Spinner /> Chargement du courriel...
      </div>
    );
  }

  if (error) {
    return <MessageBar type="error">{error}</MessageBar>;
  }

  if (!email) {
    return <span className="muted">Sélectionnez un courriel pour commencer.</span>;
  }

  if (!isConfigured) {
    return (
      <MessageBar type="warning">
        Configure d'abord ton fournisseur IA dans l'onglet "Config IA".
      </MessageBar>
    );
  }

  const needsTranslation = translation && translation.originalLanguage !== "fr";
  const displayedSubject = showOriginal ? email.subject : translation?.translatedSubject || email.subject;
  const displayedBody = showOriginal ? email.body : translation?.translatedBody || email.body;

  return (
    <div>
      <h3 className="section-title">Courriel</h3>
      <div className="email-meta">De : {email.from}</div>
      <div className="email-subject">{displayedSubject}</div>

      {translating && (
        <div className="spinner-row">
          <Spinner /> Traduction en cours...
        </div>
      )}

      {err && <div className="message message-error">{err}</div>}

      {translation && !translating && needsTranslation && (
        <div>
          <DefaultButton
            text={showOriginal ? "Voir la traduction" : "Voir l'original"}
            onClick={() => setShowOriginal((s) => !s)}
          />
          <div className="message message-success" style={{ marginTop: 8 }}>
            Langue détectée : {translation.originalLanguage} → français
          </div>
        </div>
      )}

      <div className="email-body">
        {displayedBody || <em>(Corps vide)</em>}
      </div>

      {needsTranslation && !translating && (
        <div style={{ marginTop: 8 }}>
          <DefaultButton text="Retraduire" onClick={doTranslate} />
        </div>
      )}
    </div>
  );
};
