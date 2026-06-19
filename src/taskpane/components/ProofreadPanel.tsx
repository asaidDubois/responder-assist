import React, { useState } from "react";
import {
  PrimaryButton,
  DefaultButton,
  Spinner,
  SpinnerSize,
  MessageBar,
  MessageBarType,
  Text,
  IconButton,
} from "@fluentui/react";
import { useEmail } from "../hooks/useEmail";
import { useSettings } from "../hooks/useSettings";
import { proofread, Correction, ProofreadResult } from "../services/profreader";

const TYPE_LABELS: Record<Correction["type"], string> = {
  orthographe: "Orthographe",
  grammaire: "Grammaire",
  ponctuation: "Ponctuation",
  frappe: "Frappe",
  style: "Style",
};

const TYPE_COLORS: Record<Correction["type"], string> = {
  orthographe: "#a4262c",
  grammaire: "#ca5010",
  ponctuation: "#605e5c",
  frappe: "#b4009e",
  style: "#0078d4",
};

export const ProofreadPanel: React.FC = () => {
  const { email, setReplyBody } = useEmail();
  const { isConfigured, getClient } = useSettings();
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<ProofreadResult | null>(null);
  const [accepted, setAccepted] = useState<Set<number>>(new Set());
  const [rejected, setRejected] = useState<Set<number>>(new Set());
  const [err, setErr] = useState<string | null>(null);

  const handleCorrect = async () => {
    if (!email) return;
    const client = getClient();
    if (!client) return;
    if (email.itemType !== "compose" || !email.body) {
      setErr("Ouvre un brouillon ou une réponse pour pouvoir corriger.");
      return;
    }
    setLoading(true);
    setErr(null);
    setResult(null);
    setAccepted(new Set());
    setRejected(new Set());
    try {
      const r = await proofread(client, email.body);
      setResult(r);
    } catch (e: any) {
      setErr(e?.message || "Erreur de correction");
    } finally {
      setLoading(false);
    }
  };

  const acceptAll = async () => {
    if (!result) return;
    try {
      await setReplyBody(result.correctedText);
      setAccepted(new Set(result.corrections.map((_, i) => i)));
    } catch (e: any) {
      setErr(e?.message || "Impossible d'appliquer");
    }
  };

  const applyCorrected = async () => {
    if (!result) return;
    try {
      await setReplyBody(result.correctedText);
    } catch (e: any) {
      setErr(e?.message || "Impossible d'appliquer");
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
      <h3 style={{ marginTop: 0 }}>Vérification avant envoi</h3>
      <Text variant="small" style={{ color: "#605e5c" }}>
        Corrige l'orthographe, la grammaire, la ponctuation, les fautes de frappe et les phrases
        maladroites.
      </Text>
      <div style={{ marginTop: 8 }}>
        <PrimaryButton
          text={loading ? "Correction en cours..." : "Corriger avant envoi"}
          onClick={handleCorrect}
          disabled={loading || !email || email.itemType !== "compose"}
        />
      </div>

      {loading && (
        <div className="spinner-container">
          <Spinner size={SpinnerSize.small} />
          <Text>Analyse du texte...</Text>
        </div>
      )}

      {err && <div className="error-message">{err}</div>}

      {result && (
        <div style={{ marginTop: 12 }}>
          {result.corrections.length === 0 ? (
            <div className="success-message">Aucune correction nécessaire.</div>
          ) : (
            <>
              <div className="success-message">
                {result.corrections.length} correction
                {result.corrections.length > 1 ? "s" : ""} proposée
                {result.corrections.length > 1 ? "s" : ""}.
              </div>
              <div style={{ display: "flex", gap: 8, margin: "8px 0" }}>
                <PrimaryButton text="Accepter tout" onClick={acceptAll} />
                <DefaultButton text="Appliquer le texte corrigé" onClick={applyCorrected} />
              </div>

              {result.corrections.map((c, i) => {
                const isAccepted = accepted.has(i);
                const isRejected = rejected.has(i);
                return (
                  <div
                    key={i}
                    style={{
                      border: `1px solid ${TYPE_COLORS[c.type]}`,
                      borderRadius: 4,
                      padding: 8,
                      marginBottom: 8,
                      background: isAccepted ? "#dff6dd" : isRejected ? "#fde7e9" : "#fff",
                      opacity: isRejected ? 0.5 : 1,
                    }}
                  >
                    <div style={{ display: "flex", justifyContent: "space-between" }}>
                      <Text
                        variant="small"
                        style={{ color: TYPE_COLORS[c.type], fontWeight: 600 }}
                      >
                        {TYPE_LABELS[c.type] || c.type}
                      </Text>
                      <div>
                        <IconButton
                          iconProps={{ iconName: "CheckMark" }}
                          title="Accepter"
                          onClick={() =>
                            setAccepted((prev) => new Set(prev).add(i))
                          }
                          disabled={isAccepted}
                        />
                        <IconButton
                          iconProps={{ iconName: "Cancel" }}
                          title="Rejeter"
                          onClick={() =>
                            setRejected((prev) => new Set(prev).add(i))
                          }
                          disabled={isRejected}
                        />
                      </div>
                    </div>
                    <div style={{ marginTop: 4, fontSize: 13 }}>
                      <span style={{ textDecoration: "line-through", color: "#a4262c" }}>
                        {c.original}
                      </span>{" "}
                      →{" "}
                      <span style={{ color: "#107c10", fontWeight: 500 }}>
                        {c.suggestion}
                      </span>
                    </div>
                    {c.explanation && (
                      <Text
                        variant="small"
                        style={{ color: "#605e5c", display: "block", marginTop: 4 }}
                      >
                        {c.explanation}
                      </Text>
                    )}
                  </div>
                );
              })}

              <details style={{ marginTop: 12 }}>
                <summary style={{ cursor: "pointer" }}>
                  <Text variant="small">Voir le texte corrigé complet</Text>
                </summary>
                <div
                  style={{
                    whiteSpace: "pre-wrap",
                    padding: 8,
                    background: "#faf9f8",
                    border: "1px solid #edebe9",
                    borderRadius: 4,
                    marginTop: 6,
                    fontSize: 13,
                  }}
                >
                  {result.correctedText}
                </div>
              </details>
            </>
          )}
        </div>
      )}
    </div>
  );
};
