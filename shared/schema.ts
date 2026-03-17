import {
  pgTable,
  text,
  serial,
  integer,
  boolean,
  timestamp,
  numeric,
} from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";
import { relations } from "drizzle-orm";

// ======================================================
// ===================== VENDORS ========================
// ======================================================

export const vendors = pgTable("vendors", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  category: text("category").notNull(),
  contact: text("contact").notNull(),
  notes: text("notes"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const vendorProducts = pgTable("vendor_products", {
  id: serial("id").primaryKey(),
  vendorId: integer("vendor_id").notNull(),
  name: text("name").notNull(),
  price: text("price").notNull(),
  description: text("description"),
});

export const vendorsRelations = relations(vendors, ({ many }) => ({
  products: many(vendorProducts),
}));

export const vendorProductsRelations = relations(vendorProducts, ({ one }) => ({
  vendor: one(vendors, {
    fields: [vendorProducts.vendorId],
    references: [vendors.id],
  }),
}));

// ======================================================
// ====================== VENUES ========================
// ======================================================

export const venues = pgTable("venues", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  location: text("location").notNull(),
  capacity: integer("capacity").notNull(),
  basePrice: numeric("base_price").notNull(),
  extraCharges: text("extra_charges"),
  notes: text("notes"),
  googleMapsLink: text("google_maps_link"),
  mainImage: text("main_image"),
  bookingPhone: text("booking_phone"),
  bookingEmail: text("booking_email"),
  venueType: text("venue_type"),
  contactName: text("contact_name"),
  contactPhone: text("contact_phone"),
  contactEmail: text("contact_email"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const venueImages = pgTable("venue_images", {
  id: serial("id").primaryKey(),
  venueId: integer("venue_id").notNull(),
  imageUrl: text("image_url").notNull(),
});

export const bookingOptions = pgTable("booking_options", {
  id: serial("id").primaryKey(),
  venueId: integer("venue_id").notNull(),
  name: text("name").notNull(),
  price: numeric("price").notNull(),
  currency: text("currency").default("USD"),
  description: text("description"),
});

export const venuesRelations = relations(venues, ({ many }) => ({
  options: many(bookingOptions),
  images: many(venueImages),
}));

// ======================================================
// ====================== CLIENTS =======================
// ======================================================

export const clients = pgTable("clients", {
  id: serial("id").primaryKey(),

  name: text("name").notNull(),
  email: text("email").notNull(),
  phone: text("phone").notNull(),

  eventDate: timestamp("event_date").notNull(),
  eventType: text("event_type").notNull(),

  // NEW
  guestCount: integer("guest_count"),

  venueId: integer("venue_id"), // ✅ ADD THIS

  // Optional
  budget: numeric("budget"),

  status: text("status").notNull(),

  // NEW
  clientNotes: text("client_notes"),
  internalNotes: text("internal_notes"),

  createdAt: timestamp("created_at").defaultNow(),
});

export const plannedServices = pgTable("planned_services", {
  id: serial("id").primaryKey(),
  clientId: integer("client_id").notNull(),
  vendorId: integer("vendor_id"),

  serviceName: text("service_name").notNull(),

  // 🔴 Legacy cost (keep for backward compatibility)
  cost: numeric("cost").notNull(),

  // 🟢 NEW – Expense Tracking
  vendorCost: numeric("vendor_cost"),

  // 🟢 NEW – Revenue Tracking
  clientPrice: numeric("client_price"),

  // 🟢 NEW – Service Status
  status: text("status").default("Planned"),

  notes: text("notes"),
});

export const clientsRelations = relations(clients, ({ many }) => ({
  services: many(plannedServices),
}));

export const plannedServicesRelations = relations(
  plannedServices,
  ({ one }) => ({
    client: one(clients, {
      fields: [plannedServices.clientId],
      references: [clients.id],
    }),
  }),
);

// ======================================================
// ====================== EXPENSES ======================
// ======================================================

export const expenses = pgTable("expenses", {
  id: serial("id").primaryKey(),
  clientId: integer("client_id").notNull(),
  category: text("category").notNull(),
  item: text("item").notNull(),
  cost: numeric("cost").notNull(),
  isPaid: boolean("is_paid").default(false),
  createdAt: timestamp("created_at").defaultNow(),
});

export const expensesRelations = relations(expenses, ({ one }) => ({
  client: one(clients, {
    fields: [expenses.clientId],
    references: [clients.id],
  }),
}));

// ======================================================
// ==================== PAYMENTS ========================
// ======================================================

export const payments = pgTable("payments", {
  id: serial("id").primaryKey(),
  clientId: integer("client_id").notNull(),
  amount: numeric("amount").notNull(),
  paymentDate: timestamp("payment_date").notNull(),
  paymentMethod: text("payment_method").notNull().default("Cash"),
  notes: text("notes"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const paymentsRelations = relations(payments, ({ one }) => ({
  client: one(clients, {
    fields: [payments.clientId],
    references: [clients.id],
  }),
}));

// ======================================================
// ================= VENDOR PAYMENTS ====================
// ======================================================

export const vendorPayments = pgTable("vendor_payments", {
  id: serial("id").primaryKey(),
  vendorId: integer("vendor_id").notNull(),
  clientId: integer("client_id").notNull(),
  serviceId: integer("service_id"),
  amount: numeric("amount").notNull(),
  status: text("status").notNull().default("Unpaid"),
  paymentDate: timestamp("payment_date"),
  notes: text("notes"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const vendorPaymentsRelations = relations(vendorPayments, ({ one }) => ({
  vendor: one(vendors, {
    fields: [vendorPayments.vendorId],
    references: [vendors.id],
  }),
  client: one(clients, {
    fields: [vendorPayments.clientId],
    references: [clients.id],
  }),
}));

// ======================================================
// ======================= TASKS ========================
// ======================================================

export const tasks = pgTable("tasks", {
  id: serial("id").primaryKey(),
  clientId: integer("client_id").notNull(),
  title: text("title").notNull(),
  status: text("status").notNull().default("Pending"),
  dueDate: timestamp("due_date"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const tasksRelations = relations(tasks, ({ one }) => ({
  client: one(clients, {
    fields: [tasks.clientId],
    references: [clients.id],
  }),
}));

// ======================================================
// ==================== QUOTATIONS ======================
// ======================================================

export const quotations = pgTable("quotations", {
  id: serial("id").primaryKey(),
  clientId: integer("client_id"),
  eventType: text("event_type").notNull().default(""),
  guestCount: integer("guest_count"),
  venueId: integer("venue_id"),
  totalCost: numeric("total_cost").default("0"),
  markupPercentage: numeric("markup_percentage").default("0"),
  discount: numeric("discount").default("0"),
  tax: numeric("tax").default("0"),
  finalPrice: numeric("final_price").default("0"),
  status: text("status").notNull().default("Draft"),
  notes: text("notes"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const quotationItems = pgTable("quotation_items", {
  id: serial("id").primaryKey(),
  quotationId: integer("quotation_id").notNull(),
  serviceName: text("service_name").notNull(),
  cost: numeric("cost").notNull(),
});

export const quotationsRelations = relations(quotations, ({ many, one }) => ({
  items: many(quotationItems),
}));

export const quotationItemsRelations = relations(quotationItems, ({ one }) => ({
  quotation: one(quotations, {
    fields: [quotationItems.quotationId],
    references: [quotations.id],
  }),
}));

export const insertQuotationSchema = createInsertSchema(quotations).omit({
  id: true,
  createdAt: true,
});
export const insertQuotationItemSchema = createInsertSchema(quotationItems).omit({ id: true });
export type Quotation = typeof quotations.$inferSelect;
export type InsertQuotation = z.infer<typeof insertQuotationSchema>;
export type QuotationItem = typeof quotationItems.$inferSelect;
export type InsertQuotationItem = z.infer<typeof insertQuotationItemSchema>;

// ======================================================
// ======================= SCHEMAS ======================
// ======================================================

export const insertClientSchema = createInsertSchema(clients)
  .omit({
    id: true,
    createdAt: true,
  })
  .extend({
    budget: z
      .union([z.string(), z.number()])
      .optional()
      .transform((val) => {
        if (val === "" || val === undefined) return null;
        return String(val);
      }),

    guestCount: z
      .union([z.string(), z.number()])
      .optional()
      .transform((val) => {
        if (val === "" || val === undefined) return null;
        return Number(val);
      }),
  });
export const insertPlannedServiceSchema = createInsertSchema(
  plannedServices,
).omit({ id: true });

export const insertExpenseSchema = createInsertSchema(expenses).omit({
  id: true,
  createdAt: true,
  clientId: true, // 👈 REMOVE clientId from body validation
});

// ======================================================
// ======================== TYPES =======================
// ======================================================

export type Client = typeof clients.$inferSelect;
export type InsertClient = z.infer<typeof insertClientSchema>;

export type PlannedService = typeof plannedServices.$inferSelect;
export type InsertPlannedService = z.infer<typeof insertPlannedServiceSchema>;
export type Expense = typeof expenses.$inferSelect;
export type InsertExpense = z.infer<typeof insertExpenseSchema>;

export const insertPaymentSchema = createInsertSchema(payments).omit({
  id: true,
  createdAt: true,
  clientId: true,
});
export type Payment = typeof payments.$inferSelect;
export type InsertPayment = z.infer<typeof insertPaymentSchema>;

export const insertVendorPaymentSchema = createInsertSchema(vendorPayments).omit({
  id: true,
  createdAt: true,
});
export type VendorPayment = typeof vendorPayments.$inferSelect;
export type InsertVendorPayment = z.infer<typeof insertVendorPaymentSchema>;

export const insertVendorSchema = createInsertSchema(vendors).omit({
  id: true,
  createdAt: true,
});

export const insertVendorProductSchema = createInsertSchema(
  vendorProducts,
).omit({ id: true });

export const insertVenueSchema = createInsertSchema(venues).omit({
  id: true,
  createdAt: true,
});

export const insertVenueImageSchema = createInsertSchema(venueImages).omit({
  id: true,
});

export const insertBookingOptionSchema = createInsertSchema(
  bookingOptions,
).omit({ id: true });

export const insertTaskSchema = createInsertSchema(tasks).omit({
  id: true,
  createdAt: true,
  clientId: true,
});
export type Task = typeof tasks.$inferSelect;
export type InsertTask = z.infer<typeof insertTaskSchema>;

// ======================================================
// ====================== EVENTS ========================
// ======================================================

export const events = pgTable("events", {
  id: serial("id").primaryKey(),
  clientId: integer("client_id").notNull(),
  eventName: text("event_name").notNull(),
  eventType: text("event_type").notNull(),
  eventDate: timestamp("event_date").notNull(),
  venueId: integer("venue_id"),
  guestCount: integer("guest_count"),
  budget: numeric("budget"),
  status: text("status").notNull().default("lead"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const eventsRelations = relations(events, ({ one }) => ({
  client: one(clients, {
    fields: [events.clientId],
    references: [clients.id],
  }),
  venue: one(venues, {
    fields: [events.venueId],
    references: [venues.id],
  }),
}));

export const insertEventSchema = createInsertSchema(events).omit({
  id: true,
  createdAt: true,
}).extend({
  budget: z.union([z.string(), z.number()]).optional().transform((val) => {
    if (val === "" || val === undefined) return null;
    return String(val);
  }),
  guestCount: z.union([z.string(), z.number()]).optional().transform((val) => {
    if (val === "" || val === undefined) return null;
    return Number(val);
  }),
});
export type Event = typeof events.$inferSelect;
export type InsertEvent = z.infer<typeof insertEventSchema>;

// ======================================================
// ==================== INVOICES ========================
// ======================================================

export const invoices = pgTable("invoices", {
  id: serial("id").primaryKey(),
  clientId: integer("client_id").notNull(),
  quotationId: integer("quotation_id"),
  invoiceNumber: text("invoice_number").notNull(),
  amount: numeric("amount").notNull(),
  status: text("status").notNull().default("unpaid"),
  dueDate: timestamp("due_date"),
  notes: text("notes"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const invoicesRelations = relations(invoices, ({ one }) => ({
  client: one(clients, {
    fields: [invoices.clientId],
    references: [clients.id],
  }),
}));

export const insertInvoiceSchema = createInsertSchema(invoices).omit({
  id: true,
  createdAt: true,
}).extend({
  amount: z.union([z.string(), z.number()]).transform((val) => String(val)),
});
export type Invoice = typeof invoices.$inferSelect;
export type InsertInvoice = z.infer<typeof insertInvoiceSchema>;

// ======================================================
// ================== APP SETTINGS =====================
// ======================================================

export const appSettings = pgTable("app_settings", {
  key: text("key").primaryKey(),
  value: text("value").notNull(),
});
