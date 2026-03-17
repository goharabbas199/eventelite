import { useMutation } from "@tanstack/react-query";

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

async function callAI(request: AIRequest): Promise<any> {
  const res = await fetch("/api/ai", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(request),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ message: "AI request failed" }));
    throw new Error(err.message || "AI request failed");
  }
  return res.json();
}

export function useAI() {
  return useMutation({
    mutationFn: callAI,
  });
}
