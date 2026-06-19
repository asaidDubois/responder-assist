import React, { useState } from "react";
import { PrimaryButton, DefaultButton, TextField, Dropdown, MessageBar, Spinner } from "./UI";
import { AIConfig } from "../services/storage";
import { OpenAIClient } from "../services/openaiClient";
import { useSettings } from "../hooks/useSettings";
import { getStoredPassphrase } from "../services/crypto";

const URL_PRESETS = [
  { value: "https://api.openai.com/v1", label: "OpenAI (https://api.openai.com/v1)" },
  { value: "http://localhost:11434/v1", label: "Ollama local (http://localhost:11434/v1)" },
  { value: "https://openrouter.ai/api/v1", label: "OpenRouter (https://openrouter.ai/api/v1)" },
  { value: "https://api.deepseek.com/v1", label: "DeepSeek (https://api.deepseek.com/v1)" },
  { value: "https://api.mistral.ai/v1", label: "Mistral AI (https://api.mistral.ai/v1)" },
  { value: "https://generativelanguage.googleapis.com/v1beta/openai", label: "Google Gemini (compat. OpenAI)" },
];

const MODEL_PRESETS = [
  "gpt-5",
  "gpt-5-mini",
  "gpt-4.1",
  "gpt-4.1-mini",
  "o4-mini",
  "o3",
  "llama-3.3-70b",
  "llama-3.1-8b",
  "qwen3",
  "qwen2.5-72b",
  "deepseek-r1",
  "deepseek-chat",
  "mistral-large",
  "@cf/meta/llama-3.3-70b-instruct-fp8-fast",
];

export const AIConfigPanel: React.FC = () => {
  const { aiConfig, saveAIConfig } = useSettings();
  const [baseUrl, setBaseUrl] = useState<string>(aiConfig?.baseUrl || "https://api.openai.com/v1");
  const [apiKey, setApiKey] = useState<string>(aiConfig?.apiKey || "");
  const [model, setModel] = useState<string>(aiConfig?.model || "gpt-5-mini");
  const [modelInput, setModelInput] = useState<string>("");
  const [saving, setSaving] = useState(false);
  const [testing, setTesting] = useState(false);
  const [status, setStatus] = useState<{ type: "success" | "error"; text: string } | null>(null);

  React.useEffect(() => {
    if (aiConfig) {
      setBaseUrl(aiConfig.baseUrl);
      setApiKey(aiConfig.apiKey);
      setModel(aiConfig.model);
      if (!MODEL_PRESETS.includes(aiConfig.model)) {
        setModelInput(aiConfig.model);
      }
    }
  }, [aiConfig]);

  const finalModel = modelInput.trim() || model;

  const handleSave = async () => {
    if (!getStoredPassphrase()) {
      setStatus({ type: "error", text: "Aucune phrase de passe de session active." });
      return;
    }
    if (!baseUrl.trim()) {
      setStatus({ type: "error", text: "L'URL de l'API est requise." });
      return;
    }
    if (!finalModel.trim()) {
      setStatus({ type: "error", text: "Le nom du modèle est requis." });
      return;
    }
    setSaving(true);
    setStatus(null);
    try {
      const cfg: AIConfig = {
        provider: "custom",
        baseUrl: baseUrl.trim().replace(/\/+$/, ""),
        apiKey: apiKey.trim(),
        model: finalModel.trim(),
      };
      await saveAIConfig(cfg);
      setStatus({ type: "success", text: "Configuration enregistrée." });
    } catch (e: any) {
      setStatus({ type: "error", text: e?.message || "Erreur d'enregistrement" });
    } finally {
      setSaving(false);
    }
  };

  const handleTest = async () => {
    if (!baseUrl.trim() || !finalModel.trim()) {
      setStatus({ type: "error", text: "URL et modèle requis pour tester." });
      return;
    }
    setTesting(true);
    setStatus(null);
    try {
      const cfg: AIConfig = {
        provider: "custom",
        baseUrl: baseUrl.trim().replace(/\/+$/, ""),
        apiKey: apiKey.trim(),
        model: finalModel.trim(),
      };
      const client = new OpenAIClient(cfg);
      const reply = await client.complete(
        "Tu réponds en français de manière très concise.",
        "Dis simplement 'Connexion réussie' en une phrase."
      );
      setStatus({ type: "success", text: `Connexion OK. ${reply.slice(0, 80)}` });
    } catch (e: any) {
      setStatus({ type: "error", text: e?.message || "Échec du test" });
    } finally {
      setTesting(false);
    }
  };

  return (
    <div>
      <h3 className="section-title">Configuration IA</h3>
      <p className="section-description">
        Saisis l'URL complète de ton fournisseur compatible OpenAI, ta clé API et le modèle.
      </p>

      <TextField
        label="URL de l'API"
        value={baseUrl}
        onChange={setBaseUrl}
        placeholder="https://api.openai.com/v1"
      />

      <div className="form-helper" style={{ marginTop: -8, marginBottom: 12 }}>
        OU choisis un preset :
      </div>
      <Dropdown
        value=""
        onChange={(v) => v && setBaseUrl(v)}
        options={[{ value: "", label: "— Selectionner un preset —" }, ...URL_PRESETS]}
      />

      <TextField
        label="Clé API"
        type="password"
        value={apiKey}
        onChange={setApiKey}
        placeholder="sk-..."
        canRevealPassword
      />

      <TextField
        label="Modèle (saisie libre)"
        value={modelInput || model}
        onChange={(v) => {
          setModelInput(v);
          if (MODEL_PRESETS.includes(v)) setModel(v);
        }}
        placeholder="gpt-5-mini, llama-3.3-70b, ..."
      />

      <div className="form-helper" style={{ marginTop: -8, marginBottom: 12 }}>
        OU choisis : {MODEL_PRESETS.join(", ")}
      </div>

      {status && (
        <MessageBar type={status.type}>{status.text}</MessageBar>
      )}

      <div className="btn-group">
        <PrimaryButton
          text="Enregistrer"
          onClick={handleSave}
          disabled={saving || !baseUrl.trim() || !apiKey.trim() || !finalModel.trim()}
        />
        <DefaultButton
          text={testing ? "Test en cours..." : "Tester la connexion"}
          onClick={handleTest}
          disabled={testing || !baseUrl.trim() || !apiKey.trim() || !finalModel.trim()}
        />
        {testing && <Spinner />}
      </div>
    </div>
  );
};
