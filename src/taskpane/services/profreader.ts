import { OpenAIClient } from "./openaiClient";

export interface Correction {
  type: "orthographe" | "grammaire" | "ponctuation" | "frappe" | "style";
  original: string;
  suggestion: string;
  explanation?: string;
}

export interface ProofreadResult {
  correctedText: string;
  corrections: Correction[];
}

const SYSTEM_PROMPT = `Tu es un correcteur orthographique et grammatical français expert.

Tu analyses un texte et tu retournes UNIQUEMENT un objet JSON valide (sans markdown) avec cette structure:

{
  "correctedText": "le texte intégral corrigé",
  "corrections": [
    {
      "type": "orthographe" | "grammaire" | "ponctuation" | "frappe" | "style",
      "original": "le fragment original",
      "suggestion": "le fragment corrigé",
      "explanation": "courte explication"
    }
  ]
}

Si aucune correction n'est nécessaire, retourne correctedText identique et corrections vide [].
Ne corrige que ce qui est réellement faux ou maladroit. Préserve le ton et le style de l'auteur.`;

export async function proofread(
  client: OpenAIClient,
  text: string
): Promise<ProofreadResult> {
  if (!text || text.trim().length === 0) {
    return { correctedText: text, corrections: [] };
  }

  const prompt = `Corrige le texte suivant en français:\n\n---\n${text}\n---`;

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
      correctedText: parsed.correctedText || text,
      corrections: Array.isArray(parsed.corrections) ? parsed.corrections : [],
    };
  } catch (e) {
    console.error("Erreur parsing correction", e, result);
    return { correctedText: text, corrections: [] };
  }
}
