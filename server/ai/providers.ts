import Anthropic from '@anthropic-ai/sdk';
import { betaZodOutputFormat } from '@anthropic-ai/sdk/helpers/beta/zod';
import { ApiError as GeminiApiError, GoogleGenAI } from '@google/genai';
import OpenAI from 'openai';
import { z } from 'zod/v4';

export type AiProvider = 'claude' | 'gemini' | 'openai';
export const AI_PROVIDERS: AiProvider[] = ['claude', 'gemini', 'openai'];

export const DEFAULT_MODELS: Record<AiProvider, string> = {
  claude: 'claude-opus-5-5',
  // Alias that tracks Google's newest Pro model
  gemini: 'gemini-pro-latest',
  // Resolved from the account's model list when the key is saved (see resolveOpenAiModel)
  openai: '',
};

// Errors whose message is safe and useful to show the admin as-is
export class AiProviderError extends Error {}

export interface ImageInput {
  data: string; // base64
  mediaType: 'image/png' | 'image/jpeg' | 'image/webp' | 'image/gif';
}

export interface AnalyzeRequest<T extends z.ZodType> {
  apiKey: string;
  model: string;
  system: string;
  image: ImageInput;
  text: string;
  schema: T;
}

// ------------------------------------------------------------------
// Claude
// ------------------------------------------------------------------

async function analyzeWithClaude<T extends z.ZodType>(req: AnalyzeRequest<T>): Promise<unknown> {
  const client = new Anthropic({ apiKey: req.apiKey });
  const response = await client.beta.messages
    .parse({
      model: req.model,
      max_tokens: 16000,
      betas: ['server-side-fallback-2026-07-01'],
      fallbacks: 'default',
      thinking: { type: 'adaptive' },
      output_config: { effort: 'high', format: betaZodOutputFormat(req.schema) },
      system: req.system,
      messages: [
        {
          role: 'user',
          content: [
            { type: 'image', source: { type: 'base64', media_type: req.image.mediaType, data: req.image.data } },
            { type: 'text', text: req.text },
          ],
        },
      ],
    })
    .catch((err) => {
      if (err instanceof Anthropic.RateLimitError) {
        throw new AiProviderError('تجاوزت حد استخدام Claude. انتظر قليلاً ثم أعد المحاولة.');
      }
      if (err instanceof Anthropic.BadRequestError && /credit balance/i.test(err.message)) {
        throw new AiProviderError('رصيد حساب Anthropic منتهٍ. أضف رصيداً من صفحة Billing في console.anthropic.com ثم أعد المحاولة.');
      }
      throw err;
    });
  if (response.stop_reason === 'refusal') throw new AiProviderError('اعتذر النموذج عن تحليل هذه الصورة.');
  return response.parsed_output;
}

async function verifyClaude(apiKey: string, model: string): Promise<string> {
  try {
    await new Anthropic({ apiKey, maxRetries: 0, timeout: 15_000 }).models.retrieve(model);
    return model;
  } catch (err) {
    if (err instanceof Anthropic.AuthenticationError) throw new AiProviderError('المفتاح غير صحيح أو تم إلغاؤه.');
    if (err instanceof Anthropic.NotFoundError || err instanceof Anthropic.PermissionDeniedError) {
      throw new AiProviderError(`المفتاح صحيح لكنه لا يملك صلاحية النموذج ${model}.`);
    }
    if (err instanceof Anthropic.APIConnectionError) throw new AiProviderError('تعذر الاتصال بخدمة Anthropic.');
    throw err;
  }
}

// ------------------------------------------------------------------
// Gemini
// ------------------------------------------------------------------

// JSON Schema for providers that take one directly; drop the draft marker they don't need
function toJsonSchema(schema: z.ZodType): Record<string, unknown> {
  const { $schema, ...jsonSchema } = z.toJSONSchema(schema) as Record<string, unknown>;
  return jsonSchema;
}

async function analyzeWithGemini<T extends z.ZodType>(req: AnalyzeRequest<T>): Promise<unknown> {
  const ai = new GoogleGenAI({ apiKey: req.apiKey });
  const response = await ai.models
    .generateContent({
      model: req.model,
      contents: [
        {
          role: 'user',
          parts: [{ inlineData: { mimeType: req.image.mediaType, data: req.image.data } }, { text: req.text }],
        },
      ],
      config: {
        systemInstruction: req.system,
        responseMimeType: 'application/json',
        responseJsonSchema: toJsonSchema(req.schema),
      },
    })
    .catch((err) => {
      if (err instanceof GeminiApiError && (err.status === 402 || err.status === 429)) {
        throw new AiProviderError(
          'رصيد حساب Gemini منتهٍ أو تجاوزت حد الاستخدام. أضف رصيداً من صفحة Billing في AI Studio ثم أعد المحاولة.'
        );
      }
      throw err;
    });
  if (!response.text) throw new AiProviderError('لم يُرجع Gemini أي نتيجة لهذه الصورة.');
  return JSON.parse(response.text);
}

async function verifyGemini(apiKey: string, model: string): Promise<string> {
  try {
    await new GoogleGenAI({ apiKey }).models.get({ model });
    return model;
  } catch (err) {
    if (err instanceof GeminiApiError) {
      if (err.status === 400 || err.status === 401 || err.status === 403) {
        throw new AiProviderError('مفتاح Gemini غير صحيح أو لا يملك صلاحية الوصول.');
      }
      if (err.status === 404) throw new AiProviderError(`النموذج ${model} غير متاح في Gemini. اكتب اسم نموذج آخر.`);
    }
    throw err;
  }
}

// ------------------------------------------------------------------
// OpenAI (ChatGPT)
// ------------------------------------------------------------------

async function analyzeWithOpenAi<T extends z.ZodType>(req: AnalyzeRequest<T>): Promise<unknown> {
  const client = new OpenAI({ apiKey: req.apiKey });
  const completion = await client.chat.completions
    .create({
      model: req.model,
      max_completion_tokens: 16000,
      response_format: {
        type: 'json_schema',
        json_schema: { name: 'poster_style', strict: true, schema: toJsonSchema(req.schema) },
      },
      messages: [
        { role: 'system', content: req.system },
        {
          role: 'user',
          content: [
            { type: 'image_url', image_url: { url: `data:${req.image.mediaType};base64,${req.image.data}` } },
            { type: 'text', text: req.text },
          ],
        },
      ],
    })
    .catch((err) => {
      if (err instanceof OpenAI.RateLimitError) {
        throw new AiProviderError('رصيد حساب OpenAI منتهٍ أو تجاوزت حد الاستخدام. أضف رصيداً من صفحة Billing ثم أعد المحاولة.');
      }
      throw err;
    });
  const message = completion.choices[0]?.message;
  if (message?.refusal) throw new AiProviderError('اعتذر النموذج عن تحليل هذه الصورة.');
  if (!message?.content) throw new AiProviderError('لم يُرجع ChatGPT أي نتيجة لهذه الصورة.');
  return JSON.parse(message.content);
}

// Newest general GPT model on the account (e.g. "gpt-5.6"), skipping mini/nano/audio/codex variants
async function resolveOpenAiModel(client: OpenAI): Promise<string> {
  let best: { id: string; created: number } | null = null;
  for await (const model of client.models.list()) {
    if (/^gpt-\d+(\.\d+)?$/.test(model.id) && (!best || model.created > best.created)) {
      best = { id: model.id, created: model.created };
    }
  }
  if (!best) throw new AiProviderError('لم أجد نموذج GPT متاحاً في حسابك. اكتب اسم النموذج يدوياً.');
  return best.id;
}

async function verifyOpenAi(apiKey: string, model: string): Promise<string> {
  const client = new OpenAI({ apiKey, maxRetries: 0, timeout: 15_000 });
  try {
    if (!model) return await resolveOpenAiModel(client);
    await client.models.retrieve(model);
    return model;
  } catch (err) {
    if (err instanceof OpenAI.AuthenticationError) throw new AiProviderError('مفتاح OpenAI غير صحيح أو تم إلغاؤه.');
    if (err instanceof OpenAI.NotFoundError || err instanceof OpenAI.PermissionDeniedError) {
      throw new AiProviderError(`النموذج ${model} غير متاح في حسابك على OpenAI.`);
    }
    if (err instanceof OpenAI.APIConnectionError) throw new AiProviderError('تعذر الاتصال بخدمة OpenAI.');
    throw err;
  }
}

// ------------------------------------------------------------------

export const PROVIDERS: Record<
  AiProvider,
  {
    label: string;
    analyze: <T extends z.ZodType>(req: AnalyzeRequest<T>) => Promise<unknown>;
    // Checks the key (and model) and returns the model to use
    verify: (apiKey: string, model: string) => Promise<string>;
  }
> = {
  claude: { label: 'Claude', analyze: analyzeWithClaude, verify: verifyClaude },
  gemini: { label: 'Gemini', analyze: analyzeWithGemini, verify: verifyGemini },
  openai: { label: 'ChatGPT', analyze: analyzeWithOpenAi, verify: verifyOpenAi },
};
