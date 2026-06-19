import { OpenAIClient } from "./openaiClient";
import { StyleProfile } from "./storage";

export interface EmailSample {
  from: string;
  subject: string;
  body: string;
}

const SYSTEM_PROMPT = `Tu es un analyste de style de rédaction. Tu analyses des courriels envoyés par un utilisateur pour déterminer son style d'écriture.

Tu dois retourner UNIQUEMENT un objet JSON valide (sans markdown, sans commentaires) avec cette structure exacte:
{
  "averageLength": "short" | "medium" | "long",
  "greeting": boolean,
  "closing": boolean,
  "preferredTone": "formal" | "casual" | "friendly-professional" | "direct",
  "defaultMode": "tutoiement" | "vouvoiement",
  "frequentExpressions": string[]
}

- averageLength: "short" si les messages font en moyenne 1-3 phrases, "medium" 4-8 phrases, "long" >8 phrases
- greeting: true si l'utilisateur commence ses messages par une salutation (Bonjour, Salut, Hello, etc.)
- closing: true si l'utilisateur termine par une formule (Cordialement, À bientôt, Merci, etc.)
- preferredTone: le ton dominant
- defaultMode: tutoiement ou vouvoiement
- frequentExpressions: liste de 3 à 5 expressions ou formules récurrentes`;

export async function analyzeStyle(
  client: OpenAIClient,
  emails: EmailSample[]
): Promise<StyleProfile> {
  if (emails.length === 0) {
    return {
      lastUpdated: Date.now(),
    };
  }

  const samplesText = emails
    .slice(0, 10)
    .map(
      (e, i) =>
        `--- Courriel ${i + 1} ---\nSujet: ${e.subject}\nDe: ${e.from}\n\n${e.body}\n`
    )
    .join("\n");

  const prompt = `Analyse le style d'écriture de cet utilisateur à partir des ${emails.length} courriels envoyés ci-dessous. Détermine ses habitudes de rédaction.

${samplesText}

Retourne UNIQUEMENT le JSON.`;

  const result = await client.complete(SYSTEM_PROMPT, prompt);

  try {
    const cleaned = result
      .trim()
      .replace(/^```json\s*/i, "")
      .replace(/^```\s*/, "")
      .replace(/```\s*$/, "")
      .trim();
    const parsed = JSON.parse(cleaned);
    return {
      averageLength: parsed.averageLength,
      greeting: parsed.greeting,
      closing: parsed.closing,
      preferredTone: parsed.preferredTone,
      defaultMode: parsed.defaultMode,
      frequentExpressions: parsed.frequentExpressions || [],
      lastUpdated: Date.now(),
    };
  } catch (e) {
    console.error("Erreur parsing style", e, result);
    throw new Error("Impossible d'analyser le style. Réponse IA invalide.");
  }
}
