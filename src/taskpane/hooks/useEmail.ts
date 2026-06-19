import { useEffect, useState } from "react";

declare const Office: any;

export interface EmailItem {
  subject: string;
  body: string;
  from: string;
  itemId: string;
  itemType: "read" | "compose";
  conversationId?: string;
}

export function useEmail() {
  const [email, setEmail] = useState<EmailItem | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadEmail = () => {
    setLoading(true);
    setError(null);
    try {
      const item = Office.context?.mailbox?.item;
      if (!item) {
        setError("Aucun courriel sélectionné");
        setLoading(false);
        return;
      }

      const itemType: "read" | "compose" =
        item.itemType === Office.ItemType.MessageRead ? "read" : "compose";

      const subject = item.subject || "";
      const from =
        item.from?.emailAddress || item.sender?.emailAddress || "expéditeur inconnu";

      if (itemType === "read" && item.body) {
        item.body.getAsync(Office.CoercionType.Text, (result: any) => {
          if (result.status === Office.AsyncResultStatus.Succeeded) {
            setEmail({
              subject,
              body: result.value || "",
              from,
              itemId: item.itemId || "",
              itemType,
              conversationId: item.conversationId,
            });
          } else {
            setError("Impossible de lire le corps du courriel");
          }
          setLoading(false);
        });
      } else if (itemType === "compose" && item.body) {
        item.body.getAsync(Office.CoercionType.Text, (result: any) => {
          if (result.status === Office.AsyncResultStatus.Succeeded) {
            setEmail({
              subject,
              body: result.value || "",
              from,
              itemId: item.itemId || "",
              itemType,
            });
          } else {
            setError("Impossible de lire le brouillon");
          }
          setLoading(false);
        });
      } else {
        setEmail({
          subject,
          body: "",
          from,
          itemId: item.itemId || "",
          itemType,
        });
        setLoading(false);
      }
    } catch (e: any) {
      setError(e?.message || "Erreur Outlook");
      setLoading(false);
    }
  };

  useEffect(() => {
    loadEmail();
  }, []);

  const insertIntoCompose = (text: string): Promise<void> => {
    return new Promise((resolve, reject) => {
      const item = Office.context?.mailbox?.item;
      if (!item) {
        reject(new Error("Aucun courriel actif"));
        return;
      }
      if (item.itemType === Office.ItemType.MessageCompose) {
        item.body.setSelectedDataAsync(
          text,
          { coercionType: Office.CoercionType.Text },
          (result: any) => {
            if (result.status === Office.AsyncResultStatus.Succeeded) resolve();
            else reject(new Error(result.error?.message || "Insertion échouée"));
          }
        );
      } else {
        item.displayReplyForm(item.body);
        reject(
          new Error("Pour insérer une réponse, ouvrez d'abord une fenêtre de réponse")
        );
      }
    });
  };

  const setReplyBody = (text: string): Promise<void> => {
    return new Promise((resolve, reject) => {
      const item = Office.context?.mailbox?.item;
      if (!item) {
        reject(new Error("Aucun courriel actif"));
        return;
      }
      if (item.itemType === Office.ItemType.MessageCompose && item.body) {
        item.body.setAsync(
          text,
          { coercionType: Office.CoercionType.Text },
          (result: any) => {
            if (result.status === Office.AsyncResultStatus.Succeeded) resolve();
            else reject(new Error(result.error?.message || "Écriture échouée"));
          }
        );
      } else {
        reject(new Error("Action disponible uniquement en mode composition"));
      }
    });
  };

  return { email, loading, error, reload: loadEmail, insertIntoCompose, setReplyBody };
}
