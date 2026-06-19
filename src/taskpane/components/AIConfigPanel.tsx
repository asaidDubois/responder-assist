import React, { useState } from "react";
import {
  PrimaryButton,
  DefaultButton,
  TextField,
  ComboBox,
  IComboBoxOption,
  MessageBar,
  MessageBarType,
  Spinner,
  SpinnerSize,
} from "@fluentui/react";
import { AIConfig } from "../services/storage";
import { OpenAIClient } from "../services/openaiClient";
import { useSettings } from "../hooks/useSettings";
import { getStoredPassphrase } from "../services/crypto";

const URL_PRESETS: IComboBoxOption[] = [
  { key: "https://api.openai.com/v1", text: "OpenAI" },
  { key: "http://localhost:11434/v1", text: "Ollama (local)" },
  { key: "https://openrouter.ai/api/v1", text: "OpenRouter" },
  { key: "https://api.deepseek.com/v1", text: "DeepSeek" },
  { key: "https://api.mistral.ai/v1", text: "Mistral AI" },
  { key: "https://generativelanguage.googleapis.com/v1beta/openai", text: "Google Gemini (compat. OpenAI)" },
];

const MODEL_SUGGESTIONS: IComboBoxOption[] = [
  { key: "gpt-5", text: "gpt-5" },
  { key: "gpt-5-mini", text: "gpt-5-mini" },
  { key: "gpt-4.1", text: "gpt-4.1" },
  { key: "gpt-4.1-mini", text: "gpt-4.1-mini" },
  { key: "o4-mini", text: "o4-mini" },
  { key: "o3", text: "o3" },
  { key: "llama-3.3-70b", text: "llama-3.3-70b" },
  { key: "llama-3.1-8b", text: "llama-3.1-8b" },
  { key: "qwen3", text: "qwen3" },
  { key: "qwen2.5-72b", text: "qwen2.5-72b" },
  { key: "deepseek-r1", text: "deepseek-r1" },
  { key: "deepseek-chat", text: "deepseek-chat" },
  { key: "mistral-large", text: "mistral-large" },
  { key: "@cf/meta/llama-3.3-70b-instruct-fp8-fast", text: "@cf/meta/llama-3.3-70b-instruct-fp8-fast" },
];

export const AIConfigPanel: React.FC = () => {
  const { aiConfig, saveAIConfig } = useSettings();
  const [baseUrl, setBaseUrl] = useState<string>(aiConfig?.baseUrl || "https://api.openai.com/v1");
  const [apiKey, setApiKey] = useState<string>(aiConfig?.apiKey || "");
  const [model, setModel] = useState<string>(aiConfig?.model || "gpt-5-mini");
  const [saving, setSaving] = useState(false);
  const [testing, setTesting] = useState(false);
  const [status, setStatus] = useState<{ type: "success" | "error"; text: string } | null>(null);

  React.useEffect(() => {
    if (aiConfig) {
      setBaseUrl(aiConfig.baseUrl);
      setApiKey(aiConfig.apiKey);
      setModel(aiConfig.model);
    }
  }, [aiConfig]);

  const handleSave = async () => {
    if (!getStoredPassphrase()) {
      setStatus({ type: "error", text: "Aucune phrase de passe de session active." });
      return;
    }
    if (!baseUrl.trim()) {
      setStatus({ type: "error", text: "L'URL de l'API est requise." });
      return;
    }
    if (!model.trim()) {
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
        model: model.trim(),
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
    if (!baseUrl.trim() || !model.trim()) {
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
        model: model.trim(),
      };
      const client = new OpenAIClient(cfg);
      const endpoint = (client as any).getEndpoint
        ? (client as any).getEndpoint()
        : `${cfg.baseUrl}/chat/completions`;
      const reply = await client.complete(
        "Tu réponds en français de manière très concise.",
        "Dis simplement 'Connexion réussie' en une phrase."
      );
      setStatus({
        type: "success",
        text: `Connexion OK (${endpoint}). Réponse: ${reply.slice(0, 80)}`,
      });
    } catch (e: any) {
      setStatus({ type: "error", text: e?.message || "Échec du test" });
    } finally {
      setTesting(false);
    }
  };

  return (
    <div>
      <h3 style={{ marginTop: 0 }}>Configuration IA</h3>
      <p style={{ fontSize: 12, color: "#605e5c" }}>
        Saisis l'URL complète de ton fournisseur compatible OpenAI, ta clé API et le modèle.
        Les données sont chiffrées localement.
      </p>

      <ComboBox
        label="URL de l'API"
        allowFreeform
        autoComplete="on"
        text={baseUrl}
        onChange={(_: any, option?: IComboBoxOption, index?: number, value?: string) => {
          if (value !== undefined) {
            setBaseUrl(value);
          } else if (option) {
            setBaseUrl(String(option.key));
          }
        }}
        options={URL_PRESETS}
        placeholder="https://api.openai.com/v1"
        styles={{ root: { marginBottom: 12 } }}
      />

      <TextField
        label="Clé API"
        type="password"
        value={apiKey}
        onChange={(_, v) => setApiKey(v || "")}
        placeholder="sk-..."
        canRevealPassword
        styles={{ root: { marginBottom: 12 } }}
      />

      <ComboBox
        label="Modèle"
        allowFreeform
        autoComplete="on"
        text={model}
        onChange={(_: any, option?: IComboBoxOption, index?: number, value?: string) => {
          if (value !== undefined) {
            setModel(value);
          } else if (option) {
            setModel(String(option.key));
          }
        }}
        options={MODEL_SUGGESTIONS}
        placeholder="Saisis ou choisis un modèle (ex: gpt-5-mini)"
        styles={{ root: { marginBottom: 12 } }}
      />

      {status && (
        <MessageBar
          messageBarType={status.type === "success" ? MessageBarType.success : MessageBarType.error}
          styles={{ root: { marginBottom: 12 } }}
        >
          {status.text}
        </MessageBar>
      )}

      <div style={{ display: "flex", gap: 8 }}>
        <PrimaryButton
          text="Enregistrer"
          onClick={handleSave}
          disabled={saving || !baseUrl.trim() || !apiKey.trim() || !model.trim()}
        />
        <DefaultButton
          text={testing ? "Test en cours..." : "Tester la connexion"}
          onClick={handleTest}
          disabled={testing || !baseUrl.trim() || !apiKey.trim() || !model.trim()}
        />
        {testing && <Spinner size={SpinnerSize.small} />}
      </div>
    </div>
  );
};
