import React, { useState } from "react";
import { PrimaryButton, DefaultButton, Spinner, MessageBar } from "./UI";
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
    return <MessageBar type="warning">Configure d'abord ton fournisseur IA.</MessageBar>;
  }

  return (
    <div>
      <h3 className="section-title">Vérification avant envoi</h3>
      <p className="section-description">
        Corrige l'orthographe, la grammaire, la ponctuation, les fautes de frappe et les phrases maladroites.
      </p>
      <PrimaryButton
        text={loading ? "Correction en cours..." : "Corriger avant envoi"}
        onClick={handleCorrect}
        disabled={loading || !email || email.itemType !== "compose"}
      />

      {loading && (
        <div className="spinner-row"><Spinner /> Analyse du texte...</div>
      )}

      {err && <div className="message message-error">{err}</div>}

      {result && (
        <div style={{ marginTop: 12 }}>
          {result.corrections.length === 0 ? (
            <div className="message message-success">Aucune correction nécessaire.</div>
          ) : (
            <>
              <div className="message message-success">
                {result.corrections.length} correction{result.corrections.length > 1 ? "s" : ""} proposée{result.corrections.length > 1 ? "s" : ""}.
              </div>
              <div className="btn-group" style={{ margin: "8px 0" }}>
                <PrimaryButton text="Accepter tout" onClick={acceptAll} />
                <DefaultButton text="Appliquer le texte corrigé" onClick={applyCorrected} />
              </div>

              {result.corrections.map((c, i) => {
                const isAccepted = accepted.has(i);
                const isRejected = rejected.has(i);
                return (
                  <div
                    key={i}
                    className="correction"
                    style={{
                      borderColor: TYPE_COLORS[c.type],
                      background: isAccepted ? "#dff6dd" : isRejected ? "#fde7e9" : "#ffffff",
                      opacity: isRejected ? 0.5 : 1,
                    }}
                  >
                    <div style={{ display: "flex", justifyContent: "space-between" }}>
                      <span className="correction-type" style={{ color: TYPE_COLORS[c.type] }}>
                        {TYPE_LABELS[c.type] || c.type}
                      </span>
                      <div className="correction-actions">
                        <button
                          className="icon-btn"
                          title="Accepter"
                          onClick={() => setAccepted((prev) => new Set(prev).add(i))}
                          disabled={isAccepted}
                        >
                          ✓
                        </button>
                        <button
                          className="icon-btn"
                          title="Rejeter"
                          onClick={() => setRejected((prev) => new Set(prev).add(i))}
                          disabled={isRejected}
                        >
                          ✗
                        </button>
                      </div>
                    </div>
                    <div className="correction-text">
                      <span className="correction-original">{c.original}</span> →{" "}
                      <span className="correction-suggestion">{c.suggestion}</span>
                    </div>
                    {c.explanation && (
                      <div className="correction-explanation">{c.explanation}</div>
                    )}
                  </div>
                );
              })}

              <details style={{ marginTop: 12 }}>
                <summary style={{ cursor: "pointer" }}>Voir le texte corrigé complet</summary>
                <div className="email-body" style={{ marginTop: 6 }}>{result.correctedText}</div>
              </details>
            </>
          )}
        </div>
      )}
    </div>
  );
};
