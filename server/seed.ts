import { storage } from "./storage";

export async function seedDatabase() {
  const existingVendors = await storage.getVendors();
  if (existingVendors.length > 0) return;

  // ── VENDORS ────────────────────────────────────────────────────────────────

  const v1 = await storage.createVendor({
    name: "Gourmet Catering Co.",
    category: "Catering",
    contact: "Phone: +1 555 0201 | Email: chef@gourmetcatering.com",
    notes: "High-end catering, specializes in French cuisine. Minimum 50 guests.",
  });
  await storage.createVendorProduct({ vendorId: v1.id, name: "Gold Wedding Package", price: "150.00", description: "3-course meal with wine pairing — per person" });
  await storage.createVendorProduct({ vendorId: v1.id, name: "Silver Buffet", price: "80.00", description: "Buffet-style dinner with 8 hot dishes — per person" });
  await storage.createVendorProduct({ vendorId: v1.id, name: "Corporate Lunch Box", price: "35.00", description: "Individual packed lunch — per person" });

  const v2 = await storage.createVendor({
    name: "Sound & Vision AV",
    category: "AV / Tech",
    contact: "Phone: +1 555 0302 | Email: tech@soundvision.com",
    notes: "Reliable AV setup for corporate events and concerts.",
  });
  await storage.createVendorProduct({ vendorId: v2.id, name: "Full Concert Setup", price: "5000.00", description: "Stage, lights, and premium sound system" });
  await storage.createVendorProduct({ vendorId: v2.id, name: "Corporate AV Package", price: "1500.00", description: "Projector, mics, PA system" });

  const v3 = await storage.createVendor({
    name: "FlashFrame Photography",
    category: "Photography",
    contact: "Phone: +1 555 0403 | Email: hello@flashframe.co",
    notes: "Award-winning wedding and event photography studio.",
  });
  await storage.createVendorProduct({ vendorId: v3.id, name: "Full Day Wedding Coverage", price: "3500.00", description: "10-hour coverage, 2 photographers, edited gallery" });
  await storage.createVendorProduct({ vendorId: v3.id, name: "Corporate Half-Day", price: "1200.00", description: "4-hour coverage, 1 photographer" });

  const v4 = await storage.createVendor({
    name: "Bloom Florals & Décor",
    category: "Decoration",
    contact: "Phone: +1 555 0504 | Email: orders@bloomflorals.com",
    notes: "Bespoke floral arrangements and full venue decoration.",
  });
  await storage.createVendorProduct({ vendorId: v4.id, name: "Bridal Bouquet & Centerpieces", price: "2000.00", description: "Full floral package for 10 tables" });
  await storage.createVendorProduct({ vendorId: v4.id, name: "Venue Styling Package", price: "3500.00", description: "Full venue transformation — draping, lighting & florals" });

  const v5 = await storage.createVendor({
    name: "BeatMasters DJ",
    category: "Entertainment",
    contact: "Phone: +1 555 0605 | Email: bookings@beatmasters.dj",
    notes: "Top-rated DJ and entertainment for weddings and corporate events.",
  });
  await storage.createVendorProduct({ vendorId: v5.id, name: "Wedding Evening DJ", price: "1800.00", description: "6-hour DJ set with MC and lighting" });
  await storage.createVendorProduct({ vendorId: v5.id, name: "Corporate Party DJ", price: "1200.00", description: "4-hour DJ set" });

  // ── VENUES ─────────────────────────────────────────────────────────────────

  const venue1 = await storage.createVenue({
    name: "The Grand Ballroom",
    location: "Downtown Hotel, 100 Main St, New York",
    capacity: 500,
    basePrice: "2000.00",
    extraCharges: "Cleaning fee: $300 | Security deposit: $1,000",
    notes: "Stunning chandelier-lit ballroom with a large dance floor and full A/V system.",
    venueType: "Indoor",
    bookingPhone: "+1 555 0701",
    bookingEmail: "events@grandballroom.com",
    contactName: "Sandra Lee",
    contactPhone: "+1 555 0702",
    contactEmail: "sandra@grandballroom.com",
  });
  await storage.createBookingOption({ venueId: venue1.id, name: "Whole Day Rental", price: "2500.00", description: "8 AM – 12 AM access (16 hours)" });
  await storage.createBookingOption({ venueId: venue1.id, name: "Evening Package", price: "1500.00", description: "6 PM – 12 AM access (6 hours)" });

  const venue2 = await storage.createVenue({
    name: "Sunset Garden",
    location: "City Park, 45 Park Ave, New York",
    capacity: 150,
    basePrice: "1000.00",
    extraCharges: "Security deposit: $500 | Generator rental: $200",
    notes: "Beautiful outdoor garden venue. Weather dependent — tent available for $500.",
    venueType: "Outdoor",
    bookingPhone: "+1 555 0801",
    bookingEmail: "reserve@sunsetgarden.com",
    contactName: "Marcus Chen",
    contactPhone: "+1 555 0802",
    contactEmail: "marcus@sunsetgarden.com",
  });
  await storage.createBookingOption({ venueId: venue2.id, name: "Garden Half-Day", price: "700.00", description: "9 AM – 3 PM or 4 PM – 10 PM" });
  await storage.createBookingOption({ venueId: venue2.id, name: "Full Day Garden", price: "1200.00", description: "9 AM – 10 PM access" });

  const venue3 = await storage.createVenue({
    name: "Skyline Rooftop",
    location: "33rd Floor, 888 Park Tower, Manhattan",
    capacity: 120,
    basePrice: "3000.00",
    extraCharges: "Bar minimum: $2,000 | Cleaning fee: $400",
    notes: "Breathtaking panoramic city views. Perfect for corporate cocktail parties and intimate weddings.",
    venueType: "Rooftop",
    bookingPhone: "+1 555 0901",
    bookingEmail: "events@skylinerooftop.com",
    contactName: "Priya Patel",
    contactPhone: "+1 555 0902",
    contactEmail: "priya@skylinerooftop.com",
  });
  await storage.createBookingOption({ venueId: venue3.id, name: "Cocktail Package", price: "3500.00", description: "4-hour cocktail event, up to 80 guests" });

  // ── CLIENTS ────────────────────────────────────────────────────────────────

  // Client 1 — upcoming wedding (high priority, 18 days away)
  const d1 = new Date(); d1.setDate(d1.getDate() + 18);
  const c1 = await storage.createClient({
    name: "Emily & James Carter",
    email: "emily.carter@gmail.com",
    phone: "+1 555 1001",
    eventDate: d1,
    eventType: "Wedding",
    guestCount: 180,
    venueId: venue1.id,
    budget: "45000.00",
    status: "Confirmed",
    clientNotes: "Elegant garden-to-ballroom wedding. Bride prefers pastel color palette.",
    internalNotes: "Deposit received. Final balance due 2 weeks before event.",
  });
  await storage.createPlannedService({ clientId: c1.id, vendorId: v1.id, serviceName: "Catering – Gold Wedding Package", cost: "18000.00", vendorCost: "15000.00", clientPrice: "18000.00", status: "Confirmed", notes: "120 guests × $150/person" });
  await storage.createPlannedService({ clientId: c1.id, vendorId: v3.id, serviceName: "Photography – Full Day Coverage", cost: "3500.00", vendorCost: "2800.00", clientPrice: "3500.00", status: "Confirmed", notes: "10-hour, 2 photographers" });
  await storage.createPlannedService({ clientId: c1.id, vendorId: v4.id, serviceName: "Floral & Decoration Package", cost: "5500.00", vendorCost: "4500.00", clientPrice: "5500.00", status: "Planned", notes: "Bridal bouquet + 15 centrepieces + arch" });
  await storage.createPlannedService({ clientId: c1.id, vendorId: v5.id, serviceName: "DJ – Wedding Evening", cost: "1800.00", vendorCost: "1400.00", clientPrice: "1800.00", status: "Confirmed", notes: "6-hour evening set" });
  await storage.createExpense({ clientId: c1.id, category: "Venue", item: "Grand Ballroom Deposit", cost: "2000", isPaid: true });
  await storage.createExpense({ clientId: c1.id, category: "Misc", item: "Wedding stationery & invitations", cost: "350", isPaid: true });
  await storage.createPayment({ clientId: c1.id, amount: "10000", paymentMethod: "Bank Transfer", paymentDate: new Date(Date.now() - 30 * 86400000), notes: "Initial deposit" } as any);
  await storage.createPayment({ clientId: c1.id, amount: "15000", paymentMethod: "Bank Transfer", paymentDate: new Date(Date.now() - 7 * 86400000), notes: "Second installment" } as any);
  await storage.createVendorPayment({ clientId: c1.id, vendorId: v1.id, amount: "7500", status: "Paid", paymentDate: new Date(Date.now() - 10 * 86400000), notes: "Catering 50% advance" } as any);

  // Client 2 — upcoming conference (12 days away, high priority)
  const d2 = new Date(); d2.setDate(d2.getDate() + 12);
  const c2 = await storage.createClient({
    name: "TechSummit Conference 2026",
    email: "organizer@techsummit.io",
    phone: "+1 555 5001",
    eventDate: d2,
    eventType: "Conference",
    guestCount: 300,
    venueId: venue1.id,
    budget: "50000.00",
    status: "Confirmed",
    clientNotes: "Annual tech conference. 3 keynote speakers, 10 breakout rooms.",
    internalNotes: "Largest client this quarter. All vendors confirmed.",
  });
  await storage.createPlannedService({ clientId: c2.id, vendorId: v2.id, serviceName: "Full AV & Streaming Setup", cost: "8000.00", vendorCost: "6000.00", clientPrice: "8000.00", status: "Confirmed", notes: "Main stage + 10 breakout rooms" });
  await storage.createPlannedService({ clientId: c2.id, vendorId: v1.id, serviceName: "Conference Catering", cost: "15000.00", vendorCost: "11000.00", clientPrice: "15000.00", status: "Confirmed", notes: "Breakfast, lunch & coffee for 300" });
  await storage.createPlannedService({ clientId: c2.id, vendorId: v3.id, serviceName: "Event Photography & Video", cost: "4500.00", vendorCost: "3500.00", clientPrice: "4500.00", status: "Confirmed", notes: "Full day photo + highlight reel" });
  await storage.createExpense({ clientId: c2.id, category: "Venue", item: "Grand Ballroom full-day deposit", cost: "5000", isPaid: true });
  await storage.createExpense({ clientId: c2.id, category: "Printing", item: "Banners, lanyards, badges", cost: "1200", isPaid: true });
  await storage.createExpense({ clientId: c2.id, category: "Security", item: "Event security team (3 staff)", cost: "900", isPaid: false });
  await storage.createPayment({ clientId: c2.id, amount: "25000", paymentMethod: "Bank Transfer", paymentDate: new Date(Date.now() - 14 * 86400000), notes: "50% advance" } as any);

  // Client 3 — upcoming corporate gala (35 days away, medium priority)
  const d3 = new Date(); d3.setDate(d3.getDate() + 35);
  const c3 = await storage.createClient({
    name: "Acme Corp — Annual Gala",
    email: "events@acmecorp.com",
    phone: "+1 555 2001",
    eventDate: d3,
    eventType: "Corporate",
    guestCount: 250,
    venueId: venue1.id,
    budget: "30000.00",
    status: "Confirmed",
    clientNotes: "Annual employee recognition gala. CEO speech. Formal dress code.",
    internalNotes: "Client pays in 3 installments. Second installment pending.",
  });
  await storage.createPlannedService({ clientId: c3.id, vendorId: v1.id, serviceName: "Catering – Corporate Dinner", cost: "12000.00", vendorCost: "9500.00", clientPrice: "12000.00", status: "Confirmed", notes: "250 guests buffet" });
  await storage.createPlannedService({ clientId: c3.id, vendorId: v2.id, serviceName: "AV & Tech Setup", cost: "3000.00", vendorCost: "2200.00", clientPrice: "3000.00", status: "Confirmed" });
  await storage.createPlannedService({ clientId: c3.id, vendorId: v3.id, serviceName: "Event Photography", cost: "2000.00", vendorCost: "1500.00", clientPrice: "2000.00", status: "Planned" });
  await storage.createExpense({ clientId: c3.id, category: "Venue", item: "Grand Ballroom Deposit", cost: "3000", isPaid: true });
  await storage.createExpense({ clientId: c3.id, category: "Printing", item: "Event programs & name tags", cost: "450", isPaid: false });
  await storage.createPayment({ clientId: c3.id, amount: "10000", paymentMethod: "Bank Transfer", paymentDate: new Date(Date.now() - 20 * 86400000), notes: "First installment" } as any);

  // Client 4 — upcoming birthday (62 days away, low priority)
  const d4 = new Date(); d4.setDate(d4.getDate() + 62);
  const c4 = await storage.createClient({
    name: "Sophia & Marcus Williams",
    email: "sophia.williams@email.com",
    phone: "+1 555 3001",
    eventDate: d4,
    eventType: "Birthday",
    guestCount: 80,
    budget: "12000.00",
    status: "Lead",
    clientNotes: "50th birthday celebration. Garden party feel. Live music preferred.",
    internalNotes: "Waiting on venue confirmation before moving forward.",
  });
  await storage.createPlannedService({ clientId: c4.id, vendorId: v1.id, serviceName: "Catering – Silver Buffet", cost: "4800.00", vendorCost: "3800.00", clientPrice: "4800.00", status: "Planned", notes: "60 guests" });
  await storage.createPlannedService({ clientId: c4.id, vendorId: v4.id, serviceName: "Decoration & Balloons", cost: "1500.00", vendorCost: "1200.00", clientPrice: "1500.00", status: "Planned" });

  // Client 5 — completed engagement (past)
  const d5 = new Date(); d5.setDate(d5.getDate() - 45);
  const c5 = await storage.createClient({
    name: "Aisha & Derek Thompson",
    email: "aisha.thompson@email.com",
    phone: "+1 555 4001",
    eventDate: d5,
    eventType: "Engagement",
    guestCount: 60,
    venueId: venue2.id,
    budget: "8000.00",
    status: "Completed",
    clientNotes: "Intimate garden engagement party.",
    internalNotes: "Fully paid. Great client — will refer others.",
  });
  await storage.createPlannedService({ clientId: c5.id, vendorId: v1.id, serviceName: "Catering – Corporate Lunch Box", cost: "2100.00", vendorCost: "1700.00", clientPrice: "2100.00", status: "Confirmed" });
  await storage.createPlannedService({ clientId: c5.id, vendorId: v3.id, serviceName: "Photography – Half Day", cost: "1200.00", vendorCost: "900.00", clientPrice: "1200.00", status: "Confirmed" });
  await storage.createPlannedService({ clientId: c5.id, vendorId: v4.id, serviceName: "Floral Arrangements", cost: "900.00", vendorCost: "650.00", clientPrice: "900.00", status: "Confirmed" });
  await storage.createExpense({ clientId: c5.id, category: "Venue", item: "Sunset Garden full-day rental", cost: "1200", isPaid: true });
  await storage.createExpense({ clientId: c5.id, category: "Misc", item: "Custom invitations", cost: "180", isPaid: true });
  await storage.createPayment({ clientId: c5.id, amount: "4000", paymentMethod: "Credit Card", paymentDate: new Date(Date.now() - 75 * 86400000), notes: "Deposit" } as any);
  await storage.createPayment({ clientId: c5.id, amount: "4000", paymentMethod: "Bank Transfer", paymentDate: new Date(Date.now() - 50 * 86400000), notes: "Final payment" } as any);
  await storage.createVendorPayment({ clientId: c5.id, vendorId: v1.id, amount: "1700", status: "Paid", paymentDate: new Date(Date.now() - 44 * 86400000), notes: "Full catering payment" } as any);
  await storage.createVendorPayment({ clientId: c5.id, vendorId: v3.id, amount: "900", status: "Paid", paymentDate: new Date(Date.now() - 44 * 86400000), notes: "Photography payment" } as any);

  // ── TASKS ──────────────────────────────────────────────────────────────────

  await storage.createTask({ clientId: c1.id, title: "Confirm final guest list with client", status: "pending" } as any);
  await storage.createTask({ clientId: c1.id, title: "Send menu selections to caterer", status: "done" } as any);
  await storage.createTask({ clientId: c1.id, title: "Arrange shuttle bus for out-of-town guests", status: "pending" } as any);
  await storage.createTask({ clientId: c1.id, title: "Collect final balance payment", status: "pending" } as any);

  await storage.createTask({ clientId: c2.id, title: "Confirm keynote speaker AV requirements", status: "done" } as any);
  await storage.createTask({ clientId: c2.id, title: "Distribute Wi-Fi credentials on-site", status: "pending" } as any);
  await storage.createTask({ clientId: c2.id, title: "Brief security team on entry protocol", status: "pending" } as any);
  await storage.createTask({ clientId: c2.id, title: "Final walk-through with venue manager", status: "pending" } as any);

  await storage.createTask({ clientId: c3.id, title: "Send final guest list to venue", status: "done" } as any);
  await storage.createTask({ clientId: c3.id, title: "Confirm AV setup time with Sound & Vision", status: "pending" } as any);
  await storage.createTask({ clientId: c3.id, title: "Prepare run-of-show document", status: "pending" } as any);
}
