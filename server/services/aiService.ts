import OpenAI from "openai";

const openai = new OpenAI({
  apiKey: process.env.AI_INTEGRATIONS_OPENAI_API_KEY,
  baseURL: process.env.AI_INTEGRATIONS_OPENAI_BASE_URL,
});

export type AIFeature =
  | "event_planner"
  | "quote_generator"
  | "vendor_recommendation"
  | "budget_planner"
  | "profit_optimizer"
  | "assistant";

interface AIRequest {
  feature: AIFeature;
  prompt: string;
  context?: {
    clients?: any[];
    vendors?: any[];
    venues?: any[];
    client?: any;
    services?: any[];
    expenses?: any[];
    quotationItems?: any[];
    budget?: number;
    guestCount?: number;
    eventType?: string;
  };
}

const SYSTEM_PROMPTS: Record<AIFeature, string> = {
  event_planner: `You are an expert event planning AI for EventElite agency. When given a natural language event description, generate a complete structured event plan. Always respond with valid JSON only — no markdown, no explanation. Use this exact structure:
{
  "eventName": "string",
  "eventType": "string (Wedding/Corporate/Birthday/Engagement/Conference/Gala/Other)",
  "estimatedGuestCount": number,
  "location": "string",
  "suggestedVenue": { "name": "string", "reason": "string", "estimatedCost": number },
  "vendorServices": [{ "service": "string", "description": "string", "estimatedCost": number }],
  "totalEstimatedCost": number,
  "suggestedMarkup": number,
  "suggestedClientPrice": number,
  "timeline": [{ "phase": "string", "task": "string", "daysBeforeEvent": number }],
  "tips": ["string"]
}`,

  quote_generator: `You are a professional event quotation AI for EventElite agency. Generate a complete quotation based on vendor catalog, venue, guest count and budget. Always respond with valid JSON only — no markdown, no explanation. Use this exact structure:
{
  "title": "string",
  "lineItems": [{ "name": "string", "description": "string", "vendorCost": number, "clientPrice": number, "markup": number }],
  "subtotal": number,
  "suggestedMarkup": number,
  "totalClientPrice": number,
  "estimatedProfit": number,
  "profitMargin": number,
  "notes": "string"
}`,

  vendor_recommendation: `You are a vendor recommendation AI for EventElite agency. Analyze the available vendors and recommend the best ones for the given event. Always respond with valid JSON only — no markdown, no explanation. Use this exact structure:
{
  "recommendations": [
    {
      "vendorId": number,
      "vendorName": "string",
      "category": "string",
      "reason": "string",
      "estimatedCost": number,
      "compatibilityScore": number
    }
  ],
  "summary": "string"
}`,

  budget_planner: `You are a budget allocation AI for EventElite agency. Given an event budget, distribute it intelligently across categories. Always respond with valid JSON only — no markdown, no explanation. Use this exact structure:
{
  "totalBudget": number,
  "allocations": [
    { "category": "string", "amount": number, "percentage": number, "notes": "string" }
  ],
  "summary": "string",
  "savingsTips": ["string"]
}`,

  profit_optimizer: `You are a profit optimization AI for EventElite agency. Analyze event costs and suggest how to maximize profit. Always respond with valid JSON only — no markdown, no explanation. Use this exact structure:
{
  "currentCost": number,
  "currentMarkup": number,
  "optimizedMarkup": number,
  "optimizedPrice": number,
  "potentialProfit": number,
  "suggestions": [
    { "type": "string", "description": "string", "potentialSaving": number }
  ],
  "alternativePackages": [
    { "name": "string", "cost": number, "clientPrice": number, "profit": number }
  ]
}`,

  assistant: `You are an intelligent AI assistant for EventElite, a professional event management agency. You help users with event planning, budget analysis, vendor recommendations, and quote generation. When responding to structured requests (generate quote, plan event, budget allocation, etc.), respond with JSON. For general chat, respond naturally but concisely. Always be helpful and professional.

If the user asks you to generate structured data, use JSON format. For open-ended questions, respond in plain text.`,
};

export async function runAI(request: AIRequest): Promise<any> {
  const { feature, prompt, context } = request;

  const contextStr = context
    ? `\n\nAvailable data context:\n${JSON.stringify(context, null, 2)}`
    : "";

  const userMessage = `${prompt}${contextStr}`;

  const response = await openai.chat.completions.create({
    model: "gpt-5.1",
    messages: [
      { role: "system", content: SYSTEM_PROMPTS[feature] },
      { role: "user", content: userMessage },
    ],
    max_completion_tokens: 8192,
  });

  const content = response.choices[0]?.message?.content || "";

  if (
    feature !== "assistant" ||
    content.trim().startsWith("{") ||
    content.trim().startsWith("[")
  ) {
    try {
      const jsonMatch = content.match(/\{[\s\S]*\}|\[[\s\S]*\]/);
      if (jsonMatch) return JSON.parse(jsonMatch[0]);
    } catch {
      // fall through to return raw
    }
  }

  return { message: content };
}
