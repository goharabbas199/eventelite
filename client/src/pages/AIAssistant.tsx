import { useState, useRef, useEffect } from "react";
import { Layout } from "@/components/Layout";
import { useAI, type AIFeature } from "@/hooks/use-ai";
import { useClients } from "@/hooks/use-clients";
import { useVendors } from "@/hooks/use-vendors";
import { useVenues } from "@/hooks/use-venues";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Sparkles, Send, Bot, User, Wand2, DollarSign,
  Store, Calendar, TrendingUp, RotateCcw, Copy, Check,
  Lightbulb, Zap, Cpu, ExternalLink,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  raw?: any;
  feature?: AIFeature;
  timestamp: Date;
}

interface QuickAction {
  label: string;
  icon: any;
  feature: AIFeature;
  prompt: string;
  color: string;
}

const QUICK_ACTIONS: QuickAction[] = [
  {
    label: "Plan an Event",
    icon: Calendar,
    feature: "event_planner",
    prompt: "Plan a wedding for 150 guests with a $40,000 budget.",
    color: "text-violet-600 bg-violet-50 dark:bg-violet-950/40 border-violet-200 dark:border-violet-800",
  },
  {
    label: "Generate Quote",
    icon: DollarSign,
    feature: "quote_generator",
    prompt: "Generate a professional quote for a corporate event with 100 guests and a $20,000 budget.",
    color: "text-emerald-600 bg-emerald-50 dark:bg-emerald-950/40 border-emerald-200 dark:border-emerald-800",
  },
  {
    label: "Recommend Vendors",
    icon: Store,
    feature: "vendor_recommendation",
    prompt: "Recommend the best vendors for a wedding event with 200 guests.",
    color: "text-amber-600 bg-amber-50 dark:bg-amber-950/40 border-amber-200 dark:border-amber-800",
  },
  {
    label: "Allocate Budget",
    icon: Wand2,
    feature: "budget_planner",
    prompt: "Allocate a $30,000 budget for a birthday gala with 80 guests.",
    color: "text-blue-600 bg-blue-50 dark:bg-blue-950/40 border-blue-200 dark:border-blue-800",
  },
  {
    label: "Optimize Profit",
    icon: TrendingUp,
    feature: "profit_optimizer",
    prompt: "Analyze my current costs and suggest how to improve my profit margin.",
    color: "text-rose-600 bg-rose-50 dark:bg-rose-950/40 border-rose-200 dark:border-rose-800",
  },
  {
    label: "Event Checklist",
    icon: Lightbulb,
    feature: "assistant",
    prompt: "Create a detailed event planning checklist for a wedding.",
    color: "text-indigo-600 bg-indigo-50 dark:bg-indigo-950/40 border-indigo-200 dark:border-indigo-800",
  },
];

function uid() {
  return Math.random().toString(36).slice(2, 9);
}

function formatJSON(data: any): string {
  return JSON.stringify(data, null, 2);
}

function MessageBubble({ msg }: { msg: Message }) {
  const [copied, setCopied] = useState(false);
  const isRaw = msg.raw && typeof msg.raw === "object" && !msg.raw.message;

  const handleCopy = () => {
    const text = isRaw ? formatJSON(msg.raw) : msg.content;
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (msg.role === "user") {
    return (
      <div className="flex items-start justify-end gap-3">
        <div className="max-w-[75%] bg-indigo-600 text-white rounded-2xl rounded-tr-sm px-4 py-3 text-[13px] leading-relaxed shadow-sm">
          {msg.content}
        </div>
        <div className="w-8 h-8 rounded-xl bg-indigo-100 dark:bg-indigo-900/60 flex items-center justify-center shrink-0">
          <User className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
        </div>
      </div>
    );
  }

  return (
    <div className="flex items-start gap-3">
      <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-violet-500 to-indigo-600 flex items-center justify-center shrink-0 shadow-sm">
        <Bot className="w-4 h-4 text-white" />
      </div>
      <div className="flex-1 max-w-[85%]">
        {isRaw ? (
          <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl rounded-tl-sm shadow-sm overflow-hidden">
            <div className="flex items-center justify-between px-4 py-2.5 border-b border-slate-100 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/80">
              <div className="flex items-center gap-2">
                <Sparkles className="w-3.5 h-3.5 text-indigo-500" />
                <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">AI Response</span>
              </div>
              <button
                onClick={handleCopy}
                className="flex items-center gap-1.5 text-[11px] text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 transition-colors"
                data-testid="button-copy-ai-response"
              >
                {copied ? <Check className="w-3 h-3 text-emerald-500" /> : <Copy className="w-3 h-3" />}
                {copied ? "Copied" : "Copy"}
              </button>
            </div>
            <div className="px-4 py-3">
              <AIResponseRenderer data={msg.raw} />
            </div>
          </div>
        ) : (
          <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl rounded-tl-sm px-4 py-3 text-[13px] leading-relaxed text-slate-700 dark:text-slate-200 shadow-sm">
            {msg.content}
          </div>
        )}
        <p className="text-[10px] text-slate-400 mt-1 ml-1">
          {msg.timestamp.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
        </p>
      </div>
    </div>
  );
}

function TipsList({ tips, label = "Tips" }: { tips: string[]; label?: string }) {
  if (!tips?.length) return null;
  return (
    <div className="space-y-1">
      <p className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">{label}</p>
      {tips.map((tip: string, i: number) => (
        <div key={i} className="flex items-start gap-1.5 text-[12px] text-slate-600 dark:text-slate-300">
          <Lightbulb className="w-3 h-3 text-amber-500 mt-0.5 shrink-0" />
          {tip}
        </div>
      ))}
    </div>
  );
}

function AIResponseRenderer({ data }: { data: any }) {
  if (!data || typeof data !== "object") return <p className="text-sm text-slate-600 dark:text-slate-300">{String(data)}</p>;

  // ── General message with optional extras ──────────────────────────────────
  if (data.message && !data.allocations && !data.lineItems && !data.vendorServices && !data.recommendations && !data.suggestions) {
    return (
      <div className="space-y-3">
        <p className="text-[13px] text-slate-700 dark:text-slate-200 leading-relaxed whitespace-pre-wrap">{data.message}</p>

        {/* Capabilities list (help response) */}
        {data.capabilities?.length > 0 && (
          <div className="space-y-1.5 mt-2">
            {data.capabilities.map((cap: string, i: number) => (
              <div key={i} className="flex items-start gap-2 p-2 bg-indigo-50 dark:bg-indigo-950/30 rounded-xl text-[12px] text-slate-700 dark:text-slate-300">
                {cap}
              </div>
            ))}
          </div>
        )}

        {/* Checklist */}
        {data.checklist?.length > 0 && (
          <div className="space-y-1 mt-1">
            <p className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">Planning Checklist</p>
            <div className="space-y-1 max-h-60 overflow-y-auto">
              {data.checklist.map((item: string, i: number) => (
                <div key={i} className="flex items-start gap-2 text-[12px] text-slate-600 dark:text-slate-300 py-1 border-b border-slate-100 dark:border-slate-700/50 last:border-0">
                  <span className="w-4 h-4 rounded bg-indigo-100 dark:bg-indigo-900/40 flex items-center justify-center shrink-0 mt-0.5">
                    <span className="text-[8px] font-bold text-indigo-600">{i + 1}</span>
                  </span>
                  {item}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Upcoming events from context */}
        {data.upcomingEvents?.length > 0 && (
          <div className="space-y-1.5">
            <p className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">Your Upcoming Events</p>
            {data.upcomingEvents.map((ev: any, i: number) => (
              <div key={i} className="flex items-start justify-between p-2.5 bg-slate-50 dark:bg-slate-700/40 rounded-xl">
                <div>
                  <p className="text-[12px] font-bold text-slate-800 dark:text-slate-200">{ev.client}</p>
                  <p className="text-[11px] text-slate-500">{ev.type} · {ev.date ? new Date(ev.date).toLocaleDateString() : "TBD"}</p>
                </div>
                <div className="text-right">
                  <p className="text-[11px] font-semibold text-indigo-600">{ev.status}</p>
                  {ev.guests && <p className="text-[10px] text-slate-400">{ev.guests} guests</p>}
                </div>
              </div>
            ))}
          </div>
        )}

        <TipsList tips={data.tips} />

        {data.tip && (
          <div className="flex items-start gap-2 p-2.5 bg-amber-50 dark:bg-amber-950/30 rounded-xl border border-amber-100 dark:border-amber-900/40">
            <Lightbulb className="w-3.5 h-3.5 text-amber-500 mt-0.5 shrink-0" />
            <p className="text-[12px] text-amber-800 dark:text-amber-200">{data.tip}</p>
          </div>
        )}
      </div>
    );
  }

  // ── Budget Allocation ─────────────────────────────────────────────────────
  if (data.allocations) {
    return (
      <div className="space-y-3">
        <div className="flex items-center gap-2 mb-2">
          <DollarSign className="w-4 h-4 text-emerald-500" />
          <span className="text-sm font-bold text-slate-800 dark:text-slate-200">Budget Allocation — {data.eventType}</span>
          <span className="ml-auto text-sm font-bold text-emerald-600">${data.totalBudget?.toLocaleString()}</span>
        </div>
        {data.perHeadTotal && (
          <div className="bg-indigo-50 dark:bg-indigo-950/30 rounded-xl p-2 text-center mb-2">
            <p className="text-[10px] text-indigo-600 font-medium">Per Head Cost</p>
            <p className="text-[16px] font-bold text-indigo-700 dark:text-indigo-300">${data.perHeadTotal?.toLocaleString()}</p>
            <p className="text-[10px] text-indigo-500">{data.guestCount} guests</p>
          </div>
        )}
        <div className="space-y-2">
          {data.allocations?.map((a: any, i: number) => (
            <div key={i} className="flex-1">
              <div className="flex justify-between mb-0.5">
                <span className="text-[12px] font-semibold text-slate-700 dark:text-slate-300">{a.category}</span>
                <div className="flex items-center gap-2">
                  {a.perHead > 0 && <span className="text-[10px] text-slate-400">${a.perHead}/head</span>}
                  <span className="text-[12px] font-bold text-indigo-600">${a.amount?.toLocaleString()} <span className="text-slate-400 font-normal">({a.percentage}%)</span></span>
                </div>
              </div>
              <div className="w-full bg-slate-100 dark:bg-slate-700 rounded-full h-1.5">
                <div className="h-full bg-gradient-to-r from-indigo-500 to-violet-500 rounded-full transition-all" style={{ width: `${a.percentage}%` }} />
              </div>
              {a.notes && <p className="text-[10px] text-slate-400 mt-0.5">{a.notes}</p>}
            </div>
          ))}
        </div>
        {data.summary && <p className="text-[12px] text-slate-500 border-t border-slate-100 dark:border-slate-700 pt-2 mt-2">{data.summary}</p>}
        {data.savingsTips?.length > 0 && (
          <div className="space-y-1">
            <p className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">Savings Tips</p>
            {data.savingsTips.map((tip: string, i: number) => (
              <div key={i} className="flex items-start gap-1.5 text-[12px] text-slate-600 dark:text-slate-300">
                <Zap className="w-3 h-3 text-amber-500 mt-0.5 shrink-0" />
                {tip}
              </div>
            ))}
          </div>
        )}
      </div>
    );
  }

  // ── Quote / Line Items ────────────────────────────────────────────────────
  if (data.lineItems) {
    return (
      <div className="space-y-3">
        <div className="flex items-center gap-2 mb-2">
          <DollarSign className="w-4 h-4 text-emerald-500" />
          <span className="text-sm font-bold text-slate-800 dark:text-slate-200">{data.title || "Generated Quote"}</span>
        </div>
        <div className="space-y-1.5">
          {data.lineItems?.map((item: any, i: number) => (
            <div key={i} className="flex items-start justify-between py-1.5 border-b border-slate-100 dark:border-slate-700/50 last:border-0">
              <div className="flex-1">
                <p className="text-[12px] font-semibold text-slate-800 dark:text-slate-200">{item.name}</p>
                {item.description && <p className="text-[11px] text-slate-400">{item.description}</p>}
                {item.markup && <p className="text-[10px] text-indigo-500">{item.markup}% markup</p>}
              </div>
              <div className="text-right ml-3 shrink-0">
                <p className="text-[12px] font-bold text-slate-800 dark:text-slate-200">${item.clientPrice?.toLocaleString()}</p>
                <p className="text-[10px] text-slate-400">Cost: ${item.vendorCost?.toLocaleString()}</p>
              </div>
            </div>
          ))}
        </div>
        <div className="grid grid-cols-3 gap-2 pt-2">
          <div className="bg-slate-50 dark:bg-slate-700/40 rounded-xl p-2 text-center">
            <p className="text-[10px] text-slate-400">Subtotal</p>
            <p className="text-[13px] font-bold text-slate-700 dark:text-slate-200">${data.subtotal?.toLocaleString()}</p>
          </div>
          <div className="bg-emerald-50 dark:bg-emerald-950/40 rounded-xl p-2 text-center">
            <p className="text-[10px] text-emerald-600">Client Price</p>
            <p className="text-[13px] font-bold text-emerald-600">${data.totalClientPrice?.toLocaleString()}</p>
          </div>
          <div className="bg-indigo-50 dark:bg-indigo-950/40 rounded-xl p-2 text-center">
            <p className="text-[10px] text-indigo-600">Profit ({data.profitMargin}%)</p>
            <p className="text-[13px] font-bold text-indigo-600">${data.estimatedProfit?.toLocaleString()}</p>
          </div>
        </div>
        {data.notes && <p className="text-[11px] text-slate-400 italic border-t border-slate-100 dark:border-slate-700 pt-2 mt-1">{data.notes}</p>}
      </div>
    );
  }

  // ── Event Plan ────────────────────────────────────────────────────────────
  if (data.vendorServices || data.suggestedVenue) {
    return (
      <div className="space-y-3">
        <div className="flex items-center gap-2 mb-2">
          <Calendar className="w-4 h-4 text-violet-500" />
          <span className="text-sm font-bold text-slate-800 dark:text-slate-200">{data.eventName || "Event Plan"}</span>
          <Badge variant="outline" className="text-[10px] ml-auto">{data.eventType}</Badge>
        </div>
        <div className="grid grid-cols-3 gap-2">
          <div className="bg-slate-50 dark:bg-slate-700/40 rounded-xl p-2 text-center">
            <p className="text-[10px] text-slate-400">Guests</p>
            <p className="text-[14px] font-bold text-slate-700 dark:text-slate-200">{data.estimatedGuestCount}</p>
          </div>
          <div className="bg-slate-50 dark:bg-slate-700/40 rounded-xl p-2 text-center">
            <p className="text-[10px] text-slate-400">Location</p>
            <p className="text-[11px] font-bold text-slate-700 dark:text-slate-200 truncate">{data.location}</p>
          </div>
          {data.preferredMonth && (
            <div className="bg-slate-50 dark:bg-slate-700/40 rounded-xl p-2 text-center">
              <p className="text-[10px] text-slate-400">Month</p>
              <p className="text-[11px] font-bold text-slate-700 dark:text-slate-200">{data.preferredMonth}</p>
            </div>
          )}
        </div>
        {data.suggestedVenue && (
          <div className="bg-violet-50 dark:bg-violet-950/30 rounded-xl p-3 border border-violet-100 dark:border-violet-900/40">
            <p className="text-[11px] font-semibold text-violet-600 uppercase tracking-wider mb-1">Suggested Venue</p>
            <p className="text-[13px] font-bold text-slate-800 dark:text-slate-200">{data.suggestedVenue.name}</p>
            <p className="text-[11px] text-slate-500 mt-0.5">{data.suggestedVenue.reason}</p>
            <p className="text-[12px] font-semibold text-indigo-600 mt-1">${data.suggestedVenue.estimatedCost?.toLocaleString()}</p>
          </div>
        )}
        {data.vendorServices?.length > 0 && (
          <div className="space-y-1.5">
            <p className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">Vendor Services</p>
            {data.vendorServices.map((s: any, i: number) => (
              <div key={i} className="flex justify-between items-start py-1.5 border-b border-slate-100 dark:border-slate-700/50 last:border-0">
                <div className="flex-1">
                  <p className="text-[12px] font-semibold text-slate-700 dark:text-slate-300">{s.service}</p>
                  {s.description && <p className="text-[10px] text-slate-400">{s.description}</p>}
                </div>
                <p className="text-[12px] font-bold text-slate-700 dark:text-slate-300 shrink-0 ml-2">${s.estimatedCost?.toLocaleString()}</p>
              </div>
            ))}
          </div>
        )}
        <div className="grid grid-cols-2 gap-2 pt-1">
          <div className="bg-slate-50 dark:bg-slate-700/40 rounded-xl p-2 text-center">
            <p className="text-[10px] text-slate-400">Estimated Cost</p>
            <p className="text-[13px] font-bold text-slate-700 dark:text-slate-200">${data.totalEstimatedCost?.toLocaleString()}</p>
          </div>
          <div className="bg-emerald-50 dark:bg-emerald-950/40 rounded-xl p-2 text-center">
            <p className="text-[10px] text-emerald-600">Client Price (+{data.suggestedMarkup}%)</p>
            <p className="text-[13px] font-bold text-emerald-600">${data.suggestedClientPrice?.toLocaleString()}</p>
          </div>
        </div>
        {data.timeline?.length > 0 && (
          <div>
            <p className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider mb-1.5">Key Timeline Milestones</p>
            <div className="space-y-1 max-h-48 overflow-y-auto">
              {data.timeline.slice(0, 8).map((t: any, i: number) => (
                <div key={i} className="flex items-start gap-2 text-[11px] py-1 border-b border-slate-100 dark:border-slate-700/50 last:border-0">
                  <span className="text-[10px] text-indigo-500 font-semibold shrink-0 w-14">{t.daysBeforeEvent === 0 ? "Event day" : `${t.daysBeforeEvent}d`}</span>
                  <span className="text-slate-600 dark:text-slate-400">{t.task}</span>
                </div>
              ))}
            </div>
          </div>
        )}
        <TipsList tips={data.tips} />
      </div>
    );
  }

  // ── Vendor Recommendations ────────────────────────────────────────────────
  if (data.recommendations) {
    return (
      <div className="space-y-3">
        <div className="flex items-center gap-2 mb-2">
          <Store className="w-4 h-4 text-amber-500" />
          <span className="text-sm font-bold text-slate-800 dark:text-slate-200">Vendor Recommendations</span>
        </div>
        <div className="space-y-2">
          {data.recommendations?.map((r: any, i: number) => (
            <div key={i} className="flex items-start gap-3 p-2.5 bg-slate-50 dark:bg-slate-700/40 rounded-xl">
              <div className="w-8 h-8 rounded-lg bg-amber-100 dark:bg-amber-900/40 flex items-center justify-center shrink-0">
                <Store className="w-4 h-4 text-amber-600" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between gap-2">
                  <p className="text-[12px] font-bold text-slate-800 dark:text-slate-200 truncate">{r.vendorName}</p>
                  <div className="flex items-center gap-1 shrink-0">
                    <div className="h-1.5 w-10 bg-slate-200 dark:bg-slate-600 rounded-full overflow-hidden">
                      <div className="h-full bg-indigo-500 rounded-full" style={{ width: `${r.compatibilityScore}%` }} />
                    </div>
                    <span className="text-[10px] text-indigo-600 font-semibold">{r.compatibilityScore}%</span>
                  </div>
                </div>
                <p className="text-[10px] text-slate-400">{r.category}</p>
                <p className="text-[11px] text-slate-500 mt-0.5">{r.reason}</p>
                <p className="text-[12px] font-semibold text-emerald-600 mt-0.5">${r.estimatedCost?.toLocaleString()}</p>
              </div>
            </div>
          ))}
        </div>
        {data.summary && <p className="text-[12px] text-slate-500 border-t border-slate-100 dark:border-slate-700 pt-2 mt-2">{data.summary}</p>}
      </div>
    );
  }

  // ── Profit Optimizer ──────────────────────────────────────────────────────
  if (data.suggestions || data.alternativePackages) {
    return (
      <div className="space-y-3">
        <div className="flex items-center gap-2 mb-2">
          <TrendingUp className="w-4 h-4 text-rose-500" />
          <span className="text-sm font-bold text-slate-800 dark:text-slate-200">Profit Optimization</span>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
          <div className="bg-slate-50 dark:bg-slate-700/40 rounded-xl p-2 text-center">
            <p className="text-[10px] text-slate-400">Current Cost</p>
            <p className="text-[13px] font-bold text-slate-700 dark:text-slate-200">${data.currentCost?.toLocaleString()}</p>
          </div>
          <div className="bg-slate-50 dark:bg-slate-700/40 rounded-xl p-2 text-center">
            <p className="text-[10px] text-slate-400">Current Markup</p>
            <p className="text-[13px] font-bold text-slate-700 dark:text-slate-200">{data.currentMarkup}%</p>
          </div>
          <div className="bg-rose-50 dark:bg-rose-950/40 rounded-xl p-2 text-center">
            <p className="text-[10px] text-rose-600">Optimized</p>
            <p className="text-[13px] font-bold text-rose-600">{data.optimizedMarkup}%</p>
          </div>
          <div className="bg-emerald-50 dark:bg-emerald-950/40 rounded-xl p-2 text-center">
            <p className="text-[10px] text-emerald-600">Potential Profit</p>
            <p className="text-[13px] font-bold text-emerald-600">${data.potentialProfit?.toLocaleString()}</p>
          </div>
        </div>
        {data.suggestions?.length > 0 && (
          <div className="space-y-1.5">
            <p className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">Optimization Suggestions</p>
            {data.suggestions.map((s: any, i: number) => (
              <div key={i} className="flex items-start gap-2 p-2 bg-slate-50 dark:bg-slate-700/40 rounded-xl">
                <Zap className="w-3.5 h-3.5 text-amber-500 mt-0.5 shrink-0" />
                <div>
                  <p className="text-[12px] font-semibold text-slate-700 dark:text-slate-300">{s.type}</p>
                  <p className="text-[11px] text-slate-500">{s.description}</p>
                  {s.potentialSaving > 0 && <p className="text-[11px] font-semibold text-emerald-600">Save ${s.potentialSaving?.toLocaleString()}</p>}
                </div>
              </div>
            ))}
          </div>
        )}
        {data.alternativePackages?.length > 0 && (
          <div>
            <p className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider mb-1.5">Package Options</p>
            <div className="grid grid-cols-3 gap-2">
              {data.alternativePackages.map((pkg: any, i: number) => (
                <div key={i} className={`rounded-xl p-2 text-center border ${i === 1 ? "bg-indigo-50 dark:bg-indigo-950/30 border-indigo-200 dark:border-indigo-800" : "bg-slate-50 dark:bg-slate-700/40 border-slate-100 dark:border-slate-700"}`}>
                  <p className="text-[10px] font-semibold text-slate-500">{pkg.name}</p>
                  <p className="text-[12px] font-bold text-slate-800 dark:text-slate-200 mt-0.5">${pkg.clientPrice?.toLocaleString()}</p>
                  <p className="text-[10px] text-emerald-600">+${pkg.profit?.toLocaleString()}</p>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    );
  }

  return (
    <pre className="text-[11px] text-slate-600 dark:text-slate-300 overflow-auto whitespace-pre-wrap">{formatJSON(data)}</pre>
  );
}

export default function AIAssistant() {
  const { data: aiStatus } = useQuery<{ engine: string; model: string; available: boolean }>({
    queryKey: ["/api/ai/status"],
  });

  const isBuiltIn = !aiStatus || aiStatus.engine === "built-in";

  const [messages, setMessages] = useState<Message[]>([
    {
      id: uid(),
      role: "assistant",
      content: isBuiltIn
        ? "Hello! I'm EventElite's built-in AI assistant — no external API required. I'm powered by event planning expertise built right into your platform. Try a quick action below or type a request like 'Plan a wedding for 150 guests with a $40,000 budget'."
        : "Hello! I'm your EventElite AI assistant. I can help you plan events, generate quotes, recommend vendors, allocate budgets, and optimize your profits. Try a quick action below or type your own request.",
      timestamp: new Date(),
    },
  ]);
  const [input, setInput] = useState("");
  const [activeFeature, setActiveFeature] = useState<AIFeature>("assistant");
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const ai = useAI();
  const { data: clients = [] } = useClients();
  const { data: vendors = [] } = useVendors();
  const { data: venues = [] } = useVenues();
  const { toast } = useToast();

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const sendMessage = async (promptText?: string, feature?: AIFeature) => {
    const text = promptText ?? input.trim();
    if (!text) return;

    const feat = feature ?? activeFeature;

    setMessages((prev) => [
      ...prev,
      { id: uid(), role: "user", content: text, timestamp: new Date() },
    ]);
    setInput("");

    try {
      const result = await ai.mutateAsync({
        feature: feat,
        prompt: text,
        context: {
          clients: (clients as any[]).slice(0, 5),
          vendors: (vendors as any[]).slice(0, 10),
          venues: (venues as any[]).slice(0, 5),
        },
      });

      const isStructured = typeof result === "object" && !result.message;

      setMessages((prev) => [
        ...prev,
        {
          id: uid(),
          role: "assistant",
          content: result.message || "Here's what I generated for you:",
          raw: result,
          feature: feat,
          timestamp: new Date(),
        },
      ]);
    } catch (err: any) {
      toast({ title: "AI Error", description: err.message, variant: "destructive" });
      setMessages((prev) => [
        ...prev,
        {
          id: uid(),
          role: "assistant",
          content: "Sorry, I encountered an error. Please try again.",
          timestamp: new Date(),
        },
      ]);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const clearChat = () => {
    setMessages([
      {
        id: uid(),
        role: "assistant",
        content: "Chat cleared. How can I help you plan your next event?",
        timestamp: new Date(),
      },
    ]);
  };

  const FEATURE_LABELS: Record<AIFeature, string> = {
    event_planner: "Event Planner",
    quote_generator: "Quote Generator",
    vendor_recommendation: "Vendor Advisor",
    budget_planner: "Budget Planner",
    profit_optimizer: "Profit Optimizer",
    assistant: "General Assistant",
  };

  return (
    <Layout title="AI Assistant">
      <div className="flex flex-col gap-0" style={{ height: "clamp(400px, calc(100dvh - 340px), calc(100vh - 120px))" }}>
        {/* Header */}
        <div className="flex items-center justify-between mb-3">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-widest text-slate-400 mb-0.5">AI Automation</p>
            <h2 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <span className="w-7 h-7 rounded-lg bg-gradient-to-br from-violet-500 to-indigo-600 flex items-center justify-center shadow-sm">
                <Sparkles className="w-3.5 h-3.5 text-white" />
              </span>
              AI Assistant
            </h2>
          </div>
          <div className="flex items-center gap-2">
            {/* Engine status badge */}
            {isBuiltIn ? (
              <Badge className="hidden sm:flex items-center gap-1.5 text-[11px] bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800 px-2 py-1">
                <Cpu className="w-3 h-3" />
                Built-in AI · Free
              </Badge>
            ) : (
              <Badge className="hidden sm:flex items-center gap-1.5 text-[11px] bg-violet-50 dark:bg-violet-950/40 text-violet-700 dark:text-violet-400 border border-violet-200 dark:border-violet-800 px-2 py-1">
                <Sparkles className="w-3 h-3" />
                {aiStatus?.model || "GPT-4o"}
              </Badge>
            )}
            <Badge variant="outline" className="hidden sm:flex text-[11px] border-indigo-200 text-indigo-600 dark:border-indigo-800 dark:text-indigo-400">
              {FEATURE_LABELS[activeFeature]}
            </Badge>
            <Button
              variant="ghost"
              size="sm"
              onClick={clearChat}
              className="h-8 rounded-xl text-xs text-slate-500"
              data-testid="button-clear-chat"
            >
              <RotateCcw className="w-3.5 h-3.5 mr-1.5" /> Clear
            </Button>
          </div>
        </div>

        {/* Quick Actions — horizontal scroll on mobile, grid on desktop */}
        <div className="flex sm:grid sm:grid-cols-3 lg:grid-cols-6 gap-2 mb-2 overflow-x-auto pb-1 sm:overflow-x-visible sm:pb-0 -mx-1 px-1 sm:mx-0 sm:px-0 scrollbar-hide flex-shrink-0">
          {QUICK_ACTIONS.map((action) => {
            const Icon = action.icon;
            return (
              <button
                key={action.feature}
                data-testid={`button-quick-${action.feature}`}
                onClick={() => {
                  setActiveFeature(action.feature);
                  sendMessage(action.prompt, action.feature);
                }}
                disabled={ai.isPending}
                className={`flex flex-col items-center justify-center gap-1.5 px-3 sm:px-2 py-2.5 rounded-xl border text-center transition-all hover:shadow-sm disabled:opacity-50 shrink-0 min-w-[80px] sm:min-w-0 ${action.color}`}
              >
                <Icon className="w-4 h-4" />
                <span className="text-[11px] font-semibold leading-tight whitespace-nowrap sm:whitespace-normal">{action.label}</span>
              </button>
            );
          })}
        </div>

        {/* Mode selector — hidden on mobile, shown on desktop */}
        <div className="hidden sm:flex items-center gap-2 mb-2 flex-wrap flex-shrink-0">
          <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Mode:</span>
          {(Object.keys(FEATURE_LABELS) as AIFeature[]).map((feat) => (
            <button
              key={feat}
              data-testid={`button-mode-${feat}`}
              onClick={() => setActiveFeature(feat)}
              className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold transition-all border ${
                activeFeature === feat
                  ? "bg-indigo-600 text-white border-indigo-600"
                  : "text-slate-500 border-slate-200 dark:border-slate-700 hover:border-indigo-300 dark:hover:border-indigo-700"
              }`}
            >
              {FEATURE_LABELS[feat]}
            </button>
          ))}
        </div>
        {/* Mobile mode selector — compact select */}
        <div className="sm:hidden mb-2 flex-shrink-0">
          <select
            value={activeFeature}
            onChange={(e) => setActiveFeature(e.target.value as AIFeature)}
            className="w-full h-8 border border-slate-200 dark:border-slate-700 rounded-xl px-3 text-[12px] bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
            data-testid="select-ai-mode-mobile"
          >
            {(Object.entries(FEATURE_LABELS) as [AIFeature, string][]).map(([feat, label]) => (
              <option key={feat} value={feat}>{label}</option>
            ))}
          </select>
        </div>

        {/* Messages */}
        <Card className="flex-1 flex flex-col border border-slate-200 dark:border-slate-700 rounded-2xl overflow-hidden bg-white dark:bg-slate-800/80 shadow-sm min-h-0">
          <CardContent className="flex-1 overflow-y-auto p-4 space-y-4 min-h-0">
            {messages.map((msg) => (
              <MessageBubble key={msg.id} msg={msg} />
            ))}
            {ai.isPending && (
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-violet-500 to-indigo-600 flex items-center justify-center shrink-0 shadow-sm">
                  <Bot className="w-4 h-4 text-white" />
                </div>
                <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl rounded-tl-sm px-4 py-3 shadow-sm">
                  <div className="flex items-center gap-1.5">
                    <div className="w-1.5 h-1.5 rounded-full bg-indigo-400 animate-bounce" style={{ animationDelay: "0ms" }} />
                    <div className="w-1.5 h-1.5 rounded-full bg-indigo-400 animate-bounce" style={{ animationDelay: "150ms" }} />
                    <div className="w-1.5 h-1.5 rounded-full bg-indigo-400 animate-bounce" style={{ animationDelay: "300ms" }} />
                  </div>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </CardContent>

          {/* Input */}
          <div className="border-t border-slate-100 dark:border-slate-700 p-3 flex items-end gap-2">
            <Textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder={`Ask AI: "Plan a wedding", "Generate quote", "Optimize my budget"…`}
              className="flex-1 min-h-[44px] max-h-[120px] rounded-xl resize-none text-[13px] border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900/50 focus-visible:ring-1 focus-visible:ring-indigo-500"
              data-testid="input-ai-prompt"
              disabled={ai.isPending}
            />
            <Button
              onClick={() => sendMessage()}
              disabled={!input.trim() || ai.isPending}
              className="h-[44px] w-[44px] rounded-xl p-0 bg-indigo-600 hover:bg-indigo-700 shrink-0"
              data-testid="button-send-ai"
            >
              <Send className="w-4 h-4" />
            </Button>
          </div>
        </Card>
      </div>
    </Layout>
  );
}
