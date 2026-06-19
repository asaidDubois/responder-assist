import { OpenAIClient } from "./openaiClient";
import { AIConfig } from "./storage";

export interface TranslationResult {
  originalLanguage: string;
  originalSubject: string;
  originalBody: string;
  translatedSubject: string;
  translatedBody: string;
}

const DETECTION_SYSTEM = `Tu es un détecteur de langue. Réponds UNIQUEMENT avec le code langue ISO 639-1 (ex: "fr", "en", "es", "de"). Pas de ponctuation, pas d'explication.`;

const TRANSLATION_SYSTEM = `Tu es un traducteur professionnel. Tu traduis fidèlement le contenu vers la langue cible demandée. Tu conserves la mise en forme (sauts de ligne, paragraphes, listes). Tu ne commentes pas, tu traduis uniquement. Réponds UNIQUEMENT avec la traduction.`;

export async function detectLanguage(
  client: OpenAIClient,
  text: string
): Promise<string> {
  if (!text || text.trim().length === 0) return "fr";
  const sample = text.slice(0, 500);
  const result = await client.complete(DETECTION_SYSTEM, sample);
  return result.trim().toLowerCase().replace(/[^a-z]/g, "").slice(0, 2) || "fr";
}

export async function translateText(
  client: OpenAIClient,
  text: string,
  targetLang: string = "français"
): Promise<string> {
  if (!text || text.trim().length === 0) return text;
  const prompt = `Traduis le texte suivant vers ${targetLang}. Conserve la mise en forme (sauts de ligne, paragraphes, listes à puces). Réponds UNIQUEMENT avec la traduction, rien d'autre.\n\n---\n${text}\n---`;
  return client.complete(TRANSLATION_SYSTEM, prompt);
}

export async function translateEmail(
  client: OpenAIClient,
  subject: string,
  body: string
): Promise<TranslationResult> {
  const sample = `${subject}\n${body}`.slice(0, 1000);
  const originalLanguage = await detectLanguage(client, sample);

  if (originalLanguage === "fr") {
    return {
      originalLanguage,
      originalSubject: subject,
      originalBody: body,
      translatedSubject: subject,
      translatedBody: body,
    };
  }

  const [translatedSubject, translatedBody] = await Promise.all([
    subject ? translateText(client, subject) : Promise.resolve(""),
    body ? translateText(client, body) : Promise.resolve(""),
  ]);

  return {
    originalLanguage,
    originalSubject: subject,
    originalBody: body,
    translatedSubject,
    translatedBody,
  };
}
