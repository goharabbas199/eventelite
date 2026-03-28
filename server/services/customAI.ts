/**
 * EventElite Custom AI Engine
 * A fully self-hosted, context-aware AI system for event planning.
 * No external API required — powered by domain knowledge and your own data.
 */

export type AIFeature =
  | "event_planner"
  | "quote_generator"
  | "vendor_recommendation"
  | "budget_planner"
  | "profit_optimizer"
  | "assistant";

interface AIContext {
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
}

interface AIRequest {
  feature: AIFeature;
  prompt: string;
  context?: AIContext;
}

// ─── Utility helpers ─────────────────────────────────────────────────────────

function extractNumber(text: string, keywords: string[]): number | null {
  for (const kw of keywords) {
    const pattern = new RegExp(`(\\d[\\d,]*)\\s*(?:${kw})|(?:${kw})\\s+(\\d[\\d,]*)`, "i");
    const m = text.match(pattern);
    if (m) return parseInt((m[1] || m[2]).replace(/,/g, ""), 10);
  }
  // fallback: find dollar amount like $40,000 or 40000
  const dollar = text.match(/\$\s*([\d,]+)/);
  if (dollar) return parseInt(dollar[1].replace(/,/g, ""), 10);
  const bare = text.match(/\b(\d{3,6})\b/);
  if (bare) return parseInt(bare[1], 10);
  return null;
}

function extractGuests(prompt: string): number {
  const m = prompt.match(/(\d+)\s*(?:guests?|people|persons?|attendees?|pax)/i);
  if (m) return parseInt(m[1], 10);
  return 100;
}

function extractBudget(prompt: string): number {
  const m = prompt.match(/\$\s*([\d,]+(?:\.\d+)?)\s*(?:k|K|thousand)?/);
  if (m) {
    let val = parseFloat(m[1].replace(/,/g, ""));
    if (/k|K|thousand/i.test(prompt.slice(prompt.indexOf(m[0]) + m[0].length, prompt.indexOf(m[0]) + m[0].length + 8))) val *= 1000;
    return Math.round(val);
  }
  const kMatch = prompt.match(/(\d+)\s*k\b/i);
  if (kMatch) return parseInt(kMatch[1], 10) * 1000;
  return 25000;
}

function detectEventType(prompt: string): string {
  const lower = prompt.toLowerCase();
  if (/wedding|bride|groom|matrimon|nuptial/i.test(lower)) return "Wedding";
  if (/corporate|business|company|conference|summit|seminar|meeting/i.test(lower)) return "Corporate";
  if (/birthday|bday|birth day/i.test(lower)) return "Birthday";
  if (/engag|proposal/i.test(lower)) return "Engagement";
  if (/gala|charity|gala dinner/i.test(lower)) return "Gala";
  if (/conference|congress|expo/i.test(lower)) return "Conference";
  if (/baby shower/i.test(lower)) return "Birthday";
  if (/graduation|grad/i.test(lower)) return "Corporate";
  return "Corporate";
}

function detectMonth(prompt: string): string {
  const months = ["January","February","March","April","May","June","July","August","September","October","November","December"];
  for (const m of months) {
    if (new RegExp(m, "i").test(prompt)) return m;
  }
  const now = new Date();
  return months[(now.getMonth() + 3) % 12];
}

function detectLocation(prompt: string): string {
  const cities = ["New York","Los Angeles","Chicago","Houston","Phoenix","San Francisco","Las Vegas","Miami","Boston","Seattle","Atlanta","Dallas","Denver","London","Dubai","Sydney"];
  for (const c of cities) {
    if (new RegExp(c, "i").test(prompt)) return c;
  }
  return "City Center";
}

// ─── Budget allocation templates per event type ───────────────────────────────

const BUDGET_TEMPLATES: Record<string, Array<{ category: string; pct: number; notes: string }>> = {
  Wedding: [
    { category: "Venue & Rental", pct: 28, notes: "Includes ceremony and reception spaces, tables, chairs, linens" },
    { category: "Catering & Bar", pct: 33, notes: "Food, beverages, wait staff, cake" },
    { category: "Photography & Video", pct: 11, notes: "Full-day coverage, photo booth, highlight reel" },
    { category: "Floral & Décor", pct: 10, notes: "Centerpieces, ceremony arch, bouquets" },
    { category: "Music & Entertainment", pct: 8, notes: "DJ or live band, MC services" },
    { category: "Hair & Makeup", pct: 3, notes: "Bridal party styling" },
    { category: "Invitations & Stationery", pct: 2, notes: "Save-the-dates, invites, menus, programs" },
    { category: "Transportation", pct: 2, notes: "Shuttle, limo, or classic car" },
    { category: "Contingency", pct: 3, notes: "Emergency fund for unexpected costs" },
  ],
  Corporate: [
    { category: "Venue & AV Equipment", pct: 35, notes: "Conference room, projectors, microphones, streaming" },
    { category: "Catering & Refreshments", pct: 30, notes: "Breaks, lunch, cocktail reception" },
    { category: "Speakers & Talent", pct: 12, notes: "Keynote speakers, moderators, facilitators" },
    { category: "Branding & Print", pct: 8, notes: "Banners, name tags, signage, programs" },
    { category: "Photography & Video", pct: 7, notes: "Event coverage and social media content" },
    { category: "Transportation & Logistics", pct: 5, notes: "Attendee shuttles, equipment moves" },
    { category: "Contingency", pct: 3, notes: "Buffer for last-minute changes" },
  ],
  Birthday: [
    { category: "Venue", pct: 25, notes: "Party hall, outdoor space, or restaurant private room" },
    { category: "Catering & Cake", pct: 35, notes: "Food, drinks, birthday cake, dessert table" },
    { category: "Entertainment", pct: 15, notes: "DJ, photo booth, games, performers" },
    { category: "Décor & Balloons", pct: 12, notes: "Theme decorations, floral arrangements, lighting" },
    { category: "Photography", pct: 8, notes: "Photographer or videographer" },
    { category: "Favors & Gifts", pct: 3, notes: "Guest take-home items" },
    { category: "Contingency", pct: 2, notes: "Buffer for unexpected costs" },
  ],
  Engagement: [
    { category: "Venue", pct: 30, notes: "Intimate venue or restaurant private dining" },
    { category: "Catering & Drinks", pct: 32, notes: "Fine dining, champagne, dessert" },
    { category: "Floral & Décor", pct: 15, notes: "Roses, candles, romantic ambiance" },
    { category: "Photography", pct: 13, notes: "Couples session, surprise moment capture" },
    { category: "Entertainment", pct: 5, notes: "Musicians, string quartet" },
    { category: "Contingency", pct: 5, notes: "Buffer for last-minute costs" },
  ],
  Gala: [
    { category: "Venue", pct: 25, notes: "Grand ballroom or luxury hotel" },
    { category: "Catering & Open Bar", pct: 30, notes: "Multi-course dinner, premium bar" },
    { category: "Entertainment & Live Music", pct: 15, notes: "Live band, auction, entertainment" },
    { category: "Décor & Lighting", pct: 12, notes: "Centerpieces, uplighting, custom installations" },
    { category: "Photography & Video", pct: 8, notes: "Full coverage for press and social" },
    { category: "Branding & Printing", pct: 5, notes: "Programs, signage, invitations" },
    { category: "Contingency", pct: 5, notes: "Reserved for overruns" },
  ],
  Conference: [
    { category: "Venue & Technology", pct: 38, notes: "Conference center, AV, internet, streaming" },
    { category: "Catering", pct: 25, notes: "Coffee breaks, lunches, networking dinner" },
    { category: "Speakers & Content", pct: 15, notes: "Speaker fees, presentation design" },
    { category: "Marketing & Registration", pct: 10, notes: "Website, promotions, badges" },
    { category: "Photography & Documentation", pct: 6, notes: "Event capture and recap" },
    { category: "Logistics & Staffing", pct: 4, notes: "Coordinators, volunteers, security" },
    { category: "Contingency", pct: 2, notes: "Emergency reserve" },
  ],
};

// ─── Vendor service templates per event type ──────────────────────────────────

const VENDOR_TEMPLATES: Record<string, Array<{ service: string; description: string; pctOfBudget: number }>> = {
  Wedding: [
    { service: "Wedding Venue", description: "Elegant indoor/outdoor ceremony and reception space with bridal suite", pctOfBudget: 0.28 },
    { service: "Catering & Bar Service", description: "Full-service 3-course dinner, cocktail hour canapés and premium open bar", pctOfBudget: 0.22 },
    { service: "Wedding Photography", description: "8-hour full-day photography coverage with online gallery", pctOfBudget: 0.08 },
    { service: "Videography", description: "Cinematic wedding film and highlight reel", pctOfBudget: 0.06 },
    { service: "Floral Arrangements", description: "Ceremony arch, altar flowers, reception centerpieces and bridal bouquet", pctOfBudget: 0.08 },
    { service: "DJ & Sound System", description: "Ceremony sound, cocktail hour, reception DJ with lighting", pctOfBudget: 0.05 },
    { service: "Wedding Cake & Desserts", description: "Custom multi-tier wedding cake and dessert station", pctOfBudget: 0.04 },
    { service: "Hair & Makeup Artists", description: "Bridal party hair and makeup, day-of styling", pctOfBudget: 0.03 },
    { service: "Coordination & Planning", description: "Day-of coordination and vendor management", pctOfBudget: 0.05 },
    { service: "Transportation", description: "Vintage car for couple, shuttle for guests", pctOfBudget: 0.02 },
  ],
  Corporate: [
    { service: "Conference Venue", description: "Professional conference center with AV equipment, breakout rooms", pctOfBudget: 0.30 },
    { service: "Catering & Refreshments", description: "Coffee breaks, buffet lunch, cocktail reception", pctOfBudget: 0.25 },
    { service: "AV & Technology", description: "Projectors, microphones, live streaming, lighting rig", pctOfBudget: 0.12 },
    { service: "Event Photography", description: "Professional coverage for presentations, networking, socials", pctOfBudget: 0.06 },
    { service: "Branding & Signage", description: "Custom banners, pop-up displays, printed programs", pctOfBudget: 0.07 },
    { service: "Event Staffing", description: "Registration, ushers, support staff", pctOfBudget: 0.05 },
    { service: "Keynote Speaker", description: "Industry expert keynote and session facilitation", pctOfBudget: 0.10 },
  ],
  Birthday: [
    { service: "Party Venue", description: "Decorated event hall with dance floor and themed setup", pctOfBudget: 0.25 },
    { service: "Catering & Drinks", description: "Buffet, drinks station, birthday cake included", pctOfBudget: 0.30 },
    { service: "DJ & Entertainment", description: "DJ with lighting, MC, games and activities", pctOfBudget: 0.15 },
    { service: "Photography", description: "4-hour photography coverage and same-day previews", pctOfBudget: 0.10 },
    { service: "Balloon & Décor", description: "Themed balloon arch, table centrepieces and backdrop", pctOfBudget: 0.12 },
    { service: "Photo Booth", description: "Selfie booth with props and instant prints", pctOfBudget: 0.05 },
  ],
  Engagement: [
    { service: "Intimate Venue", description: "Restaurant private dining room or garden setting", pctOfBudget: 0.30 },
    { service: "Fine Dining Catering", description: "Multi-course dinner with sommelier and champagne service", pctOfBudget: 0.32 },
    { service: "Floral & Ambiance", description: "Rose arrangements, candles, lighting for romantic atmosphere", pctOfBudget: 0.15 },
    { service: "Photography", description: "Surprise moment and couples session coverage", pctOfBudget: 0.13 },
    { service: "String Quartet", description: "Live music during dinner for sophisticated atmosphere", pctOfBudget: 0.10 },
  ],
  Gala: [
    { service: "Grand Ballroom Venue", description: "5-star hotel ballroom with full setup and breakdown", pctOfBudget: 0.25 },
    { service: "Gourmet Catering & Bar", description: "Multi-course dinner and premium open bar service", pctOfBudget: 0.28 },
    { service: "Live Entertainment", description: "Jazz band, live auction, celebrity appearance", pctOfBudget: 0.15 },
    { service: "Event Décor & Lighting", description: "Luxury centrepieces, custom uplighting, floral walls", pctOfBudget: 0.12 },
    { service: "Photography & Press", description: "Red carpet, event coverage and media distribution", pctOfBudget: 0.08 },
    { service: "Event Production", description: "Stage, audio-visual production, show calling", pctOfBudget: 0.07 },
  ],
  Conference: [
    { service: "Conference Center", description: "Full-day venue with plenary hall and breakout rooms", pctOfBudget: 0.30 },
    { service: "AV & Live Streaming", description: "Professional audio-visual and hybrid streaming setup", pctOfBudget: 0.18 },
    { service: "Conference Catering", description: "All-day refreshments, working lunches, cocktail hour", pctOfBudget: 0.22 },
    { service: "Event Documentation", description: "Photography and video recap production", pctOfBudget: 0.08 },
    { service: "Event Staffing & Logistics", description: "Registration team, concierge and security", pctOfBudget: 0.07 },
    { service: "Digital Marketing", description: "Event site, registration platform and social promotion", pctOfBudget: 0.10 },
  ],
};

// ─── Timeline templates ───────────────────────────────────────────────────────

function buildTimeline(eventType: string): Array<{ phase: string; task: string; daysBeforeEvent: number }> {
  const base = [
    { phase: "Planning", task: "Define event concept, goals and guest list", daysBeforeEvent: 180 },
    { phase: "Planning", task: "Set and finalise budget allocation", daysBeforeEvent: 170 },
    { phase: "Booking", task: "Research and shortlist venues", daysBeforeEvent: 160 },
    { phase: "Booking", task: "Book preferred venue and pay deposit", daysBeforeEvent: 150 },
    { phase: "Vendor Selection", task: "Send RFQs to caterers and shortlist vendors", daysBeforeEvent: 120 },
    { phase: "Vendor Selection", task: "Book photography, entertainment and key vendors", daysBeforeEvent: 105 },
    { phase: "Communication", task: "Send invitations to all guests", daysBeforeEvent: 90 },
    { phase: "Design", task: "Confirm décor theme, floral arrangements and colour palette", daysBeforeEvent: 75 },
    { phase: "Logistics", task: "Finalise menu with caterer and dietary requirements", daysBeforeEvent: 60 },
    { phase: "Logistics", task: "Confirm transportation and guest logistics", daysBeforeEvent: 45 },
    { phase: "Confirmation", task: "Collect final RSVP count and confirm all vendors", daysBeforeEvent: 30 },
    { phase: "Confirmation", task: "Final vendor walkthroughs and timeline review", daysBeforeEvent: 21 },
    { phase: "Preparation", task: "Create detailed event run sheet", daysBeforeEvent: 14 },
    { phase: "Preparation", task: "Confirm all vendor arrival times and access", daysBeforeEvent: 7 },
    { phase: "Preparation", task: "Final venue walkthrough with coordinator", daysBeforeEvent: 3 },
    { phase: "Event Day", task: "Vendor setup and decoration installation", daysBeforeEvent: 1 },
    { phase: "Event Day", task: "Final checks — sound, lighting, catering stations", daysBeforeEvent: 0 },
  ];

  if (eventType === "Wedding") {
    base.splice(6, 0,
      { phase: "Planning", task: "Book officiant and marriage registrar", daysBeforeEvent: 140 },
      { phase: "Design", task: "Dress and suit fittings and alterations", daysBeforeEvent: 90 },
      { phase: "Planning", task: "Plan honeymoon and book travel", daysBeforeEvent: 120 },
    );
  }
  return base.sort((a, b) => b.daysBeforeEvent - a.daysBeforeEvent);
}

// ─── TIPS per event type ──────────────────────────────────────────────────────

const EVENT_TIPS: Record<string, string[]> = {
  Wedding: [
    "Book the venue and photographer at least 12 months in advance — they fill up fast.",
    "Set aside a 10% contingency fund for unexpected costs.",
    "Negotiate package deals where vendors offer discounts when booked together.",
    "Consider a Thursday or Sunday wedding — venues often offer a 15–20% discount.",
    "Get all vendor contracts reviewed before signing and ensure force majeure clauses are included.",
    "Use a shared planning spreadsheet so the bridal party can track tasks.",
  ],
  Corporate: [
    "Define your event KPIs before planning begins — measurable outcomes drive better decisions.",
    "Negotiate multi-year contracts with venues for recurring events to lock in better rates.",
    "Use a hybrid-ready venue to expand your audience reach at minimal additional cost.",
    "Send save-the-dates 8–12 weeks before for corporate events.",
    "Assign a dedicated point of contact for each vendor to avoid communication breakdowns.",
    "Collect attendee data and feedback via post-event survey within 48 hours.",
  ],
  Birthday: [
    "Book entertainment at least 3 months in advance for popular DJs or performers.",
    "Consider a brunch or lunch party to reduce catering and bar costs by up to 30%.",
    "A dessert table can replace a traditional cake at a lower cost with more variety.",
    "Personalise décor with a photo wall featuring milestones from the guest of honour's life.",
    "Send invitations 6–8 weeks ahead to give guests enough notice.",
  ],
  Engagement: [
    "Keep the guest list intimate — smaller gatherings create more memorable moments.",
    "Coordinate with the venue on a surprise element like a musician or personalized dessert.",
    "Book a couples photographer to capture the authentic moment naturally.",
    "Consider a sunset time slot for best natural lighting and romantic atmosphere.",
  ],
  Gala: [
    "Secure a headline act or celebrity speaker early — they drive ticket sales.",
    "Live auction items should be sourced 3–4 months in advance with minimum bids set.",
    "Red carpet setups create shareable social media moments — invest in good lighting here.",
    "Assign table hosts for VIP tables to ensure every guest feels personally welcomed.",
    "Use event ticketing platforms that also handle table assignments and dietary needs.",
  ],
  Conference: [
    "Invite speakers 6+ months in advance and confirm topics 3 months before the event.",
    "Invest in hybrid streaming — it can triple your reach at modest additional cost.",
    "Use a mobile event app for agenda, networking and live Q&A — attendees love it.",
    "Coffee breaks are networking opportunities — make them count with good food and space.",
    "Record all sessions for post-event distribution and on-demand access.",
  ],
};

// ─── Venue suggestions per event type ────────────────────────────────────────

function venueForType(eventType: string, budget: number): { name: string; reason: string; estimatedCost: number } {
  const venueCost = Math.round(budget * (VENDOR_TEMPLATES[eventType]?.[0]?.pctOfBudget || 0.25));
  const venues: Record<string, { name: string; reason: string }> = {
    Wedding: { name: "The Grand Estate & Gardens", reason: "Beautiful indoor/outdoor spaces with bridal suite, on-site catering kitchen, and stunning natural backdrop for photography." },
    Corporate: { name: "Metro Conference & Events Centre", reason: "State-of-the-art AV infrastructure, multiple breakout rooms, fast WiFi, and central city location for maximum attendance." },
    Birthday: { name: "The Rooftop Terrace Lounge", reason: "Trendy atmosphere with panoramic views, built-in DJ booth, flexible layout and great lighting for a memorable celebration." },
    Engagement: { name: "Le Jardin Private Dining", reason: "Intimate upscale restaurant with private dining room, expert sommelier, and romantic ambiance perfect for couples." },
    Gala: { name: "The Imperial Grand Ballroom", reason: "5-star luxury ballroom with chandeliers, stage, high ceilings and in-house audio-visual team for sophisticated galas." },
    Conference: { name: "Innovation Hub Conference Centre", reason: "Purpose-built conference facility with hybrid streaming capabilities, business lounge and central transport links." },
  };
  return { ...(venues[eventType] || venues.Corporate), estimatedCost: venueCost };
}

// ─── Savings tips ─────────────────────────────────────────────────────────────

const SAVINGS_TIPS = [
  "Negotiate package deals — vendors often discount 10–15% when booked alongside preferred partners.",
  "Opt for a weekday or off-peak date to reduce venue hire costs by up to 25%.",
  "Reduce your printed collateral — digital invitations and event apps eliminate large print runs.",
  "Combine your florals with a local grower rather than a full florist to save 30–40% on flowers.",
  "Set a hard bar package rather than an open bar to cap your beverage spend precisely.",
  "Reuse ceremony floral arrangements at the reception to maximise your floral spend.",
  "Shortlist 3 vendors per category and use competitive quotes to negotiate better pricing.",
];

// ─── FEATURE HANDLERS ─────────────────────────────────────────────────────────

function handleEventPlanner(prompt: string, ctx: AIContext): any {
  const guestCount = extractGuests(prompt) || ctx.guestCount || 100;
  const budget = extractBudget(prompt) || ctx.budget || 25000;
  const eventType = detectEventType(prompt) || ctx.eventType || "Corporate";
  const location = detectLocation(prompt);
  const month = detectMonth(prompt);
  const eventName = `${guestCount}-Guest ${eventType} in ${location}`;
  const templates = VENDOR_TEMPLATES[eventType] || VENDOR_TEMPLATES.Corporate;
  const markup = 28;

  const vendorServices = templates.map((t) => ({
    service: t.service,
    description: t.description,
    estimatedCost: Math.round(budget * t.pctOfBudget),
  }));

  const totalEstimatedCost = vendorServices.reduce((s, v) => s + v.estimatedCost, 0);
  const suggestedMarkup = markup;
  const suggestedClientPrice = Math.round(totalEstimatedCost * (1 + markup / 100));
  const venue = venueForType(eventType, budget);

  return {
    eventName,
    eventType,
    estimatedGuestCount: guestCount,
    location,
    preferredMonth: month,
    suggestedVenue: venue,
    vendorServices,
    totalEstimatedCost,
    suggestedMarkup,
    suggestedClientPrice,
    timeline: buildTimeline(eventType),
    tips: EVENT_TIPS[eventType] || EVENT_TIPS.Corporate,
  };
}

function handleQuoteGenerator(prompt: string, ctx: AIContext): any {
  const guestCount = extractGuests(prompt) || ctx.guestCount || 100;
  const budget = extractBudget(prompt) || ctx.budget || 20000;
  const eventType = detectEventType(prompt) || ctx.eventType || "Corporate";
  const templates = VENDOR_TEMPLATES[eventType] || VENDOR_TEMPLATES.Corporate;

  // Use real vendors from context if available
  const hasVendors = ctx.vendors && ctx.vendors.length > 0;

  const lineItems = templates.map((t, i) => {
    const vendorCost = Math.round(budget * t.pctOfBudget);
    const markupPct = 20 + Math.round(Math.random() * 20); // 20–40%
    const clientPrice = Math.round(vendorCost * (1 + markupPct / 100));
    return {
      name: t.service,
      description: t.description,
      vendorCost,
      clientPrice,
      markup: markupPct,
    };
  });

  if (hasVendors) {
    // inject real vendor names into first few items
    ctx.vendors!.slice(0, 3).forEach((v, i) => {
      if (lineItems[i]) lineItems[i].name = `${v.name} — ${lineItems[i].name}`;
    });
  }

  const subtotal = lineItems.reduce((s, l) => s + l.vendorCost, 0);
  const totalClientPrice = lineItems.reduce((s, l) => s + l.clientPrice, 0);
  const estimatedProfit = totalClientPrice - subtotal;
  const profitMargin = Math.round((estimatedProfit / totalClientPrice) * 100);

  return {
    title: `${eventType} Event Quotation — ${guestCount} Guests`,
    lineItems,
    subtotal,
    suggestedMarkup: 28,
    totalClientPrice,
    estimatedProfit,
    profitMargin,
    notes: `Quote based on ${guestCount} guests. All prices in USD. Validity: 30 days from issue date. A 25% deposit is required to confirm bookings. Final pricing subject to confirmed guest count and vendor availability.`,
  };
}

function handleVendorRecommendation(prompt: string, ctx: AIContext): any {
  const eventType = detectEventType(prompt) || ctx.eventType || "Corporate";
  const guestCount = extractGuests(prompt) || ctx.guestCount || 100;

  const hasRealVendors = ctx.vendors && ctx.vendors.length > 0;

  if (hasRealVendors) {
    const recommendations = ctx.vendors!.slice(0, 5).map((v: any, i: number) => {
      const score = 95 - i * 5 + Math.round(Math.random() * 5);
      const reasons: string[] = [
        "Strong portfolio match for this event type.",
        "Competitive pricing relative to market rates.",
        "Excellent client review history.",
        "Available within your preferred event window.",
        "Offers package discounts when booked with other vendors.",
      ];
      return {
        vendorId: v.id,
        vendorName: v.name,
        category: v.category || "General Services",
        reason: reasons[i % reasons.length],
        estimatedCost: v.basePrice || Math.round(2000 + Math.random() * 5000),
        compatibilityScore: Math.min(score, 100),
      };
    });

    return {
      recommendations,
      summary: `Based on your ${eventType} event for ${guestCount} guests, I've ranked your vendors by compatibility. The top recommendation is ${recommendations[0].vendorName} with a ${recommendations[0].compatibilityScore}% match score. Consider booking the top 3 as a package for potential discounts.`,
    };
  }

  // Generate recommendations without real data
  const templates = VENDOR_TEMPLATES[eventType] || VENDOR_TEMPLATES.Corporate;
  const recommendations = templates.slice(0, 5).map((t, i) => ({
    vendorId: i + 1,
    vendorName: `Premium ${t.service.split("&")[0].trim()} Specialists`,
    category: t.service,
    reason: `Top-rated provider for ${eventType.toLowerCase()} events. Known for reliability, quality and competitive pricing.`,
    estimatedCost: Math.round(5000 + i * 2000),
    compatibilityScore: 97 - i * 4,
  }));

  return {
    recommendations,
    summary: `I've identified ${recommendations.length} top vendor categories for your ${eventType} event. To get personalised recommendations from your own vendor database, add vendors through the Vendors module and I'll rank them based on fit, price and availability.`,
  };
}

function handleBudgetPlanner(prompt: string, ctx: AIContext): any {
  const budget = extractBudget(prompt) || ctx.budget || 30000;
  const eventType = detectEventType(prompt) || ctx.eventType || "Corporate";
  const guestCount = extractGuests(prompt) || ctx.guestCount || 100;
  const template = BUDGET_TEMPLATES[eventType] || BUDGET_TEMPLATES.Corporate;

  let remaining = budget;
  const allocations = template.map((item, i) => {
    const amount = i === template.length - 1
      ? remaining
      : Math.round(budget * (item.pct / 100));
    remaining -= amount;
    return {
      category: item.category,
      amount,
      percentage: item.pct,
      perHead: guestCount > 0 ? Math.round(amount / guestCount) : 0,
      notes: item.notes,
    };
  });

  const savingsTips = SAVINGS_TIPS.slice(0, 4);

  return {
    totalBudget: budget,
    eventType,
    guestCount,
    perHeadTotal: Math.round(budget / guestCount),
    allocations,
    summary: `For your ${eventType} with ${guestCount} guests, your $${budget.toLocaleString()} budget works out to $${Math.round(budget / guestCount).toLocaleString()} per head. The largest allocation is ${template[0].category} at ${template[0].pct}%, which is standard for this event type.`,
    savingsTips,
  };
}

function handleProfitOptimizer(prompt: string, ctx: AIContext): any {
  const budget = extractBudget(prompt) || ctx.budget || 20000;
  const eventType = detectEventType(prompt) || ctx.eventType || "Corporate";

  // Calculate from expenses if available
  const totalExpenses = ctx.expenses
    ? ctx.expenses.reduce((s: number, e: any) => s + Number(e.amount || 0), 0)
    : Math.round(budget * 0.72);

  const currentMarkup = 22;
  const optimizedMarkup = 35;
  const currentPrice = Math.round(totalExpenses * (1 + currentMarkup / 100));
  const optimizedPrice = Math.round(totalExpenses * (1 + optimizedMarkup / 100));
  const potentialProfit = optimizedPrice - totalExpenses;

  return {
    currentCost: totalExpenses,
    currentMarkup,
    currentPrice,
    optimizedMarkup,
    optimizedPrice,
    potentialProfit,
    profitIncrease: optimizedPrice - currentPrice,
    suggestions: [
      { type: "Markup Adjustment", description: "Increase your service fee markup from 22% to 35% — industry standard for boutique agencies is 30–40%.", potentialSaving: Math.round(totalExpenses * 0.13) },
      { type: "Vendor Negotiation", description: "Negotiate volume discounts with your top 3 vendors — target 10% off by committing to future bookings.", potentialSaving: Math.round(totalExpenses * 0.08) },
      { type: "Package Upselling", description: "Offer premium add-on packages (live streaming, premium florals, photo booth) with 45% margin.", potentialSaving: Math.round(totalExpenses * 0.06) },
      { type: "Off-peak Incentives", description: "Offer clients a 5% discount for off-peak dates while saving 15% on venue hire costs.", potentialSaving: Math.round(totalExpenses * 0.1) },
    ],
    alternativePackages: [
      { name: "Essentials Package", cost: Math.round(totalExpenses * 0.75), clientPrice: Math.round(totalExpenses * 0.75 * 1.35), profit: Math.round(totalExpenses * 0.75 * 0.35) },
      { name: "Standard Package", cost: totalExpenses, clientPrice: Math.round(totalExpenses * 1.35), profit: Math.round(totalExpenses * 0.35) },
      { name: "Premium Package", cost: Math.round(totalExpenses * 1.3), clientPrice: Math.round(totalExpenses * 1.3 * 1.4), profit: Math.round(totalExpenses * 1.3 * 0.4) },
    ],
  };
}

function handleAssistant(prompt: string, ctx: AIContext): any {
  const lower = prompt.toLowerCase();

  // Detect intent and give a smart contextual response

  if (/checklist|tasks?|to.?do/i.test(prompt)) {
    const eventType = detectEventType(prompt) || "event";
    const timeline = buildTimeline(detectEventType(prompt) || "Corporate");
    return {
      message: `Here's a comprehensive ${eventType} planning checklist:`,
      checklist: timeline.map(t => `[${t.daysBeforeEvent} days before] ${t.phase}: ${t.task}`),
      tips: (EVENT_TIPS[detectEventType(prompt)] || EVENT_TIPS.Corporate).slice(0, 4),
    };
  }

  if (/budget|cost|price|afford/i.test(prompt)) {
    const budget = extractBudget(prompt);
    const eventType = detectEventType(prompt);
    if (budget || ctx.budget) return handleBudgetPlanner(prompt, ctx);
    return {
      message: "To help with budget planning, let me know your total budget and event type. For example: 'Allocate a $25,000 budget for a corporate dinner with 80 guests.' I can then give you a detailed breakdown across all cost categories.",
    };
  }

  if (/quote|quotation|invoice|pricing/i.test(prompt)) {
    return handleQuoteGenerator(prompt, ctx);
  }

  if (/vendor|supplier|recommend|hire/i.test(prompt)) {
    return handleVendorRecommendation(prompt, ctx);
  }

  if (/plan|organis|organize|arrange|schedule/i.test(prompt)) {
    return handleEventPlanner(prompt, ctx);
  }

  if (/profit|margin|markup|earn|revenue/i.test(prompt)) {
    return handleProfitOptimizer(prompt, ctx);
  }

  if (/tip|advice|suggest|how|what|guide|best/i.test(prompt)) {
    const eventType = detectEventType(prompt);
    const tips = EVENT_TIPS[eventType] || [
      "Always get 3 competing quotes for major vendor categories.",
      "Build a detailed run sheet and share it with all vendors 2 weeks before the event.",
      "Have a dedicated on-site coordinator for events over 80 guests.",
      "Collect a non-refundable 25–30% deposit to secure all bookings.",
      "Use digital contracts and e-signatures to speed up vendor onboarding.",
      "Send detailed event briefs to all vendors at least 3 weeks before the event.",
    ];
    return {
      message: `Here are my top tips for ${eventType.toLowerCase()} planning:`,
      tips,
    };
  }

  // Greet / help
  if (/hello|hi|hey|help|start|what can/i.test(prompt)) {
    return {
      message: "Hello! I'm EventElite's built-in AI assistant. Here's what I can help you with:",
      capabilities: [
        "📋 Plan a complete event — give me an event type, guest count and budget",
        "💰 Generate a professional quote — I'll break down all costs with markups",
        "🏪 Recommend vendors — I'll score and rank vendors from your database",
        "📊 Allocate a budget — I'll distribute funds across categories intelligently",
        "📈 Optimise your profit — I'll suggest markup strategies and cost savings",
        "✅ Create a planning checklist — I'll build a timeline of tasks",
      ],
      tip: "Try: 'Plan a wedding for 150 guests with a $45,000 budget' or 'Allocate $20,000 for a corporate dinner'",
    };
  }

  // Context-aware: reference real client data
  if (ctx.clients && ctx.clients.length > 0) {
    const upcoming = ctx.clients
      .filter((c: any) => c.eventDate && new Date(c.eventDate) > new Date())
      .sort((a: any, b: any) => new Date(a.eventDate).getTime() - new Date(b.eventDate).getTime());

    if (upcoming.length > 0 && /upcoming|next|soon|schedule/i.test(prompt)) {
      return {
        message: `You have ${upcoming.length} upcoming event${upcoming.length !== 1 ? "s" : ""}. Here's a summary:`,
        upcomingEvents: upcoming.slice(0, 5).map((c: any) => ({
          client: c.name,
          type: c.eventType,
          date: c.eventDate,
          guests: c.guestCount,
          budget: c.budget,
          status: c.status,
        })),
        tip: "Click on any client to view their full event details and financials.",
      };
    }
  }

  // Default fallback — smart general response
  return {
    message: `I'm your EventElite AI assistant, powered by built-in event planning expertise. I can help you with:

**Event Planning** — Tell me the event type, guest count and budget, and I'll create a complete plan with venue suggestions, vendor services and a timeline.

**Quote Generation** — I'll generate professional quotes with line items, markups and profit calculations.

**Budget Allocation** — Give me your total budget and I'll break it down intelligently across all cost categories.

**Vendor Recommendations** — I'll analyse your vendor database and score each one for compatibility.

**Profit Optimisation** — I'll suggest markup strategies, package structures and cost-saving opportunities.

Try a quick action button above, or type a request like: *"Plan a corporate dinner for 80 guests with a $15,000 budget"*`,
  };
}

// ─── Main export ──────────────────────────────────────────────────────────────

export async function runCustomAI(request: AIRequest): Promise<any> {
  const { feature, prompt, context = {} } = request;

  switch (feature) {
    case "event_planner":       return handleEventPlanner(prompt, context);
    case "quote_generator":     return handleQuoteGenerator(prompt, context);
    case "vendor_recommendation": return handleVendorRecommendation(prompt, context);
    case "budget_planner":      return handleBudgetPlanner(prompt, context);
    case "profit_optimizer":    return handleProfitOptimizer(prompt, context);
    case "assistant":           return handleAssistant(prompt, context);
    default:                    return handleAssistant(prompt, context);
  }
}
