import React, { useState } from "react";
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
import {
  generateAndTranslate,
  generateReplies,
  ReplySuggestions,
} from "../services/replyGenerator";
import { detectLanguage } from "../services/translator";

export const ReplySuggestionsView: React.FC = () => {
  const { email, insertIntoCompose } = useEmail();
  const { isConfigured, getClient, userSettings, styleProfile } = useSettings();
  const [loading, setLoading] = useState(false);
  const [replies, setReplies] = useState<ReplySuggestions | null>(null);
  const [originalLang, setOriginalLang] = useState<string | null>(null);
  const [translatedReplies, setTranslatedReplies] = useState<ReplySuggestions | null>(null);
  const [showTranslated, setShowTranslated] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [active, setActive] = useState<"short" | "professional" | "detailed" | null>(null);

  const handleGenerate = async () => {
    if (!email) return;
    const client = getClient();
    if (!client) return;
    setLoading(true);
    setErr(null);
    setReplies(null);
    setTranslatedReplies(null);
    setOriginalLang(null);
    setShowTranslated(false);
    setActive(null);
    try {
      const lang = await detectLanguage(
        client,
        `${email.subject}\n${email.body}`.slice(0, 1000)
      );
      setOriginalLang(lang);

      const result = await generateReplies(
        client,
        {
          subject: email.subject,
          body: email.body,
          from: email.from,
        },
        userSettings,
        styleProfile
      );
      setReplies(result);

      if (userSettings.replyInOriginalLanguage && lang !== "fr") {
        const t = await generateAndTranslate(
          client,
          {
            subject: email.subject,
            body: email.body,
            from: email.from,
          },
          userSettings,
          styleProfile,
          lang
        );
        setTranslatedReplies(t);
      }
    } catch (e: any) {
      setErr(e?.message || "Erreur de génération");
    } finally {
      setLoading(false);
    }
  };

  const handleUse = async (kind: "short" | "professional" | "detailed") => {
    if (!replies) return;
    setActive(kind);
    try {
      const useTranslated =
        showTranslated && translatedReplies && userSettings.replyInOriginalLanguage;
      const text = useTranslated ? translatedReplies![kind] : replies[kind];
      await insertIntoCompose(text);
    } catch (e: any) {
      setErr(e?.message || "Insertion impossible");
    } finally {
      setActive(null);
    }
  };

  if (!isConfigured) {
    return (
      <MessageBar messageBarType={MessageBarType.warning}>
        Configurez d'abord votre fournisseur IA.
      </MessageBar>
    );
  }

  return (
    <div>
      <h3 style={{ marginTop: 0 }}>Générer des réponses</h3>
      <PrimaryButton
        text={loading ? "Génération en cours..." : "Générer les réponses"}
        onClick={handleGenerate}
        disabled={loading || !email}
        iconProps={loading ? undefined : undefined}
      />
      {loading && (
        <div className="spinner-container">
          <Spinner size={SpinnerSize.small} />
          <Text>Le modèle analyse le fil et rédige...</Text>
        </div>
      )}

      {err && <div className="error-message">{err}</div>}

      {replies && originalLang && (
        <div className="success-message" style={{ marginTop: 8 }}>
          Langue détectée : {originalLang}.
          {userSettings.replyInOriginalLanguage && originalLang !== "fr" && (
            <> Version traduite disponible.</>
          )}
        </div>
      )}

      {translatedReplies && userSettings.replyInOriginalLanguage && originalLang !== "fr" && (
        <div style={{ marginTop: 8 }}>
          <DefaultButton
            text={showTranslated ? "Voir version française" : `Voir version ${originalLang}`}
            onClick={() => setShowTranslated((s) => !s)}
          />
        </div>
      )}

      {replies && (
        <div style={{ marginTop: 12 }}>
          <ReplyCard
            title="Réponse courte"
            text={showTranslated && translatedReplies ? translatedReplies.short : replies.short}
            onUse={() => handleUse("short")}
            active={active === "short"}
          />
          <ReplyCard
            title="Réponse professionnelle"
            text={
              showTranslated && translatedReplies
                ? translatedReplies.professional
                : replies.professional
            }
            onUse={() => handleUse("professional")}
            active={active === "professional"}
          />
          <ReplyCard
            title="Réponse détaillée"
            text={showTranslated && translatedReplies ? translatedReplies.detailed : replies.detailed}
            onUse={() => handleUse("detailed")}
            active={active === "detailed"}
          />
        </div>
      )}
    </div>
  );
};

const ReplyCard: React.FC<{
  title: string;
  text: string;
  onUse: () => void;
  active: boolean;
}> = ({ title, text, onUse, active }) => (
  <div
    style={{
      border: "1px solid #edebe9",
      borderRadius: 4,
      padding: 12,
      marginBottom: 8,
      background: "#fff",
    }}
  >
    <Text variant="medium" style={{ fontWeight: 600 }}>
      {title}
    </Text>
    <div
      style={{
        whiteSpace: "pre-wrap",
        marginTop: 6,
        fontSize: 13,
        maxHeight: 180,
        overflowY: "auto",
      }}
    >
      {text}
    </div>
    <PrimaryButton
      text={active ? "Insertion..." : "Utiliser cette réponse"}
      onClick={onUse}
      disabled={active}
      styles={{ root: { marginTop: 8 } }}
    />
  </div>
);
