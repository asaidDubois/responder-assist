import { AIConfig } from "./storage";

export interface ChatMessage {
  role: "system" | "user" | "assistant";
  content: string;
}

export interface ChatCompletionRequest {
  messages: ChatMessage[];
  temperature?: number;
  max_tokens?: number;
}

export interface ChatCompletionResponse {
  content: string;
  usage?: {
    prompt_tokens: number;
    completion_tokens: number;
    total_tokens: number;
  };
}

export class OpenAIClient {
  private config: AIConfig;

  constructor(config: AIConfig) {
    this.config = config;
  }

  private getEndpoint(): string {
    let base = this.config.baseUrl.trim().replace(/\/+$/, "");

    const suffixes = [
      "/chat/completions",
      "/completions",
      "/v1/chat/completions",
      "/v1/completions",
    ];
    for (const s of suffixes) {
      if (base.toLowerCase().endsWith(s)) {
        base = base.slice(0, -s.length).replace(/\/+$/, "");
        break;
      }
    }

    return `${base}/chat/completions`;
  }

  async chat(request: ChatCompletionRequest): Promise<ChatCompletionResponse> {
    const body = {
      model: this.config.model,
      messages: request.messages,
      temperature: request.temperature ?? 0.7,
      max_tokens: request.max_tokens ?? 2000,
      stream: false,
    };

    const response = await fetch(this.getEndpoint(), {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${this.config.apiKey}`,
      },
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      const errText = await response.text();
      throw new Error(`Erreur API (${response.status}): ${errText}`);
    }

    const data = await response.json();
    return {
      content: data.choices?.[0]?.message?.content ?? "",
      usage: data.usage,
    };
  }

  async complete(systemPrompt: string, userPrompt: string): Promise<string> {
    const res = await this.chat({
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt },
      ],
    });
    return res.content;
  }
}
