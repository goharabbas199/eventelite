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
  cost: numeric("cost").notNull(),
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
});

// ======================================================
// ======================== TYPES =======================
// ======================================================

export type Client = typeof clients.$inferSelect;
export type InsertClient = z.infer<typeof insertClientSchema>;

export type PlannedService = typeof plannedServices.$inferSelect;
export type Expense = typeof expenses.$inferSelect;
export type InsertExpense = z.infer<typeof insertExpenseSchema>;

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
