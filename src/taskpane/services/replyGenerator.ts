import { OpenAIClient } from "./openaiClient";
import { UserSettings, StyleProfile } from "./storage";
import { translateText } from "./translator";

export interface EmailContext {
  subject: string;
  body: string;
  from: string;
  threadMessages?: { from: string; body: string }[];
}

export interface ReplySuggestions {
  short: string;
  professional: string;
  detailed: string;
}

function buildStyleContext(
  settings: UserSettings,
  profile: StyleProfile | null
): string {
  const length = profile?.averageLength || settings.averageLength;
  const tone = profile?.preferredTone || settings.preferredTone;
  const mode =
    profile?.defaultMode ||
    (settings.defaultMode === "tutoiement" ? "tutoiement" : "vouvoiement");
  const greeting = profile?.greeting ?? settings.greeting;
  const closing = profile?.closing ?? settings.closing;

  return `Style:
- Longueur: ${length === "short" ? "courte" : length === "long" ? "longue" : "moyenne"}
- Ton: ${tone}
- Mode: ${mode}
- Salutation: ${greeting ? "oui" : "non"}
- Formule de politesse finale: ${closing ? "oui" : "non"}`;
}

function buildContextString(email: EmailContext): string {
  let ctx = `De: ${email.from}\nSujet: ${email.subject}\n\n${email.body}`;
  if (email.threadMessages && email.threadMessages.length > 1) {
    ctx = "Fil de discussion :\n\n";
    email.threadMessages.forEach((m, i) => {
      ctx += `--- Message ${i + 1} de ${m.from} ---\n${m.body}\n\n`;
    });
  }
  return ctx;
}

export async function generateReplies(
  client: OpenAIClient,
  email: EmailContext,
  settings: UserSettings,
  profile: StyleProfile | null
): Promise<ReplySuggestions> {
  const styleCtx = buildStyleContext(settings, profile);
  const ctxStr = buildContextString(email);

  const basePrompt = `Tu es un assistant qui rédige des réponses courriel en français.

${styleCtx}

Analyse le courriel ci-dessous et identifie :
- les questions posées
- les demandes d'action
- les informations importantes à reprendre

Courriel à traiter :
${ctxStr}

`;

  const shortPrompt = `${basePrompt}
Rédige une réponse COURTE (2-4 phrases), directe, qui va à l'essentiel. Pas de re-contextualisation inutile.`;

  const proPrompt = `${basePrompt}
Rédige une réponse PROFESSIONNELLE standard, structurée, qui couvre tous les points soulevés. Longueur moyenne.`;

  const detailedPrompt = `${basePrompt}
Rédige une réponse DÉTAILLÉE et complète, qui approfondit chaque point, propose des précisions ou des alternatives.`;

  const [short, professional, detailed] = await Promise.all([
    client.complete(
      "Tu rédiges en français. Réponds UNIQUEMENT avec le texte du courriel, sans méta-commentaire.",
      shortPrompt
    ),
    client.complete(
      "Tu rédiges en français. Réponds UNIQUEMENT avec le texte du courriel, sans méta-commentaire.",
      proPrompt
    ),
    client.complete(
      "Tu rédiges en français. Réponds UNIQUEMENT avec le texte du courriel, sans méta-commentaire.",
      detailedPrompt
    ),
  ]);

  return {
    short: short.trim(),
    professional: professional.trim(),
    detailed: detailed.trim(),
  };
}

export async function generateAndTranslate(
  client: OpenAIClient,
  email: EmailContext,
  settings: UserSettings,
  profile: StyleProfile | null,
  targetLanguage: string
): Promise<ReplySuggestions> {
  const replies = await generateReplies(client, email, settings, profile);
  if (!targetLanguage || targetLanguage === "fr") {
    return replies;
  }
  const [short, professional, detailed] = await Promise.all([
    translateText(client, replies.short, targetLanguage),
    translateText(client, replies.professional, targetLanguage),
    translateText(client, replies.detailed, targetLanguage),
  ]);
  return { short, professional, detailed };
}
