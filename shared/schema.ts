import { pgTable, text, serial, integer, boolean, timestamp, numeric, date } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";
import { relations } from "drizzle-orm";

// === Vendors ===
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
  vendorId: integer("vendor_id").notNull(), // FK handled in app logic or assumed
  name: text("name").notNull(),
  price: numeric("price").notNull(),
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

// === Venues ===
export const venues = pgTable("venues", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  location: text("location").notNull(),
  capacity: integer("capacity").notNull(),
  basePrice: numeric("base_price").notNull(),
  extraCharges: text("extra_charges"), // Description of extras
  notes: text("notes"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const bookingOptions = pgTable("booking_options", {
  id: serial("id").primaryKey(),
  venueId: integer("venue_id").notNull(),
  name: text("name").notNull(),
  price: numeric("price").notNull(),
  description: text("description"),
});

export const venuesRelations = relations(venues, ({ many }) => ({
  options: many(bookingOptions),
}));

export const bookingOptionsRelations = relations(bookingOptions, ({ one }) => ({
  venue: one(venues, {
    fields: [bookingOptions.venueId],
    references: [venues.id],
  }),
}));

// === Clients ===
export const clients = pgTable("clients", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  email: text("email").notNull(),
  phone: text("phone").notNull(),
  eventDate: timestamp("event_date").notNull(),
  eventType: text("event_type").notNull(),
  budget: numeric("budget").notNull(),
  status: text("status").notNull(), // 'Lead', 'Confirmed', 'Completed', 'Pending'
  notes: text("notes"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const plannedServices = pgTable("planned_services", {
  id: serial("id").primaryKey(),
  clientId: integer("client_id").notNull(),
  vendorId: integer("vendor_id"), // Optional link to vendor
  serviceName: text("service_name").notNull(),
  cost: numeric("cost").notNull(),
  notes: text("notes"),
});

export const clientsRelations = relations(clients, ({ many }) => ({
  services: many(plannedServices),
}));

export const plannedServicesRelations = relations(plannedServices, ({ one }) => ({
  client: one(clients, {
    fields: [plannedServices.clientId],
    references: [clients.id],
  }),
}));


// === Budget/Expenses ===
// Often linked to a specific client/event, but can be general for the agency too.
// Based on "Budget Planner Page - Client dropdown selector", expenses belong to clients.
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

// === Schemas ===
export const insertVendorSchema = createInsertSchema(vendors).omit({ id: true, createdAt: true });
export const insertVendorProductSchema = createInsertSchema(vendorProducts).omit({ id: true });
export const insertVenueSchema = createInsertSchema(venues).omit({ id: true, createdAt: true });
export const insertBookingOptionSchema = createInsertSchema(bookingOptions).omit({ id: true });
export const insertClientSchema = createInsertSchema(clients).omit({ id: true, createdAt: true });
export const insertPlannedServiceSchema = createInsertSchema(plannedServices).omit({ id: true });
export const insertExpenseSchema = createInsertSchema(expenses).omit({ id: true, createdAt: true });

// === Types ===
export type Vendor = typeof vendors.$inferSelect;
export type InsertVendor = z.infer<typeof insertVendorSchema>;
export type VendorProduct = typeof vendorProducts.$inferSelect;
export type Venue = typeof venues.$inferSelect;
export type InsertVenue = z.infer<typeof insertVenueSchema>;
export type BookingOption = typeof bookingOptions.$inferSelect;
export type Client = typeof clients.$inferSelect;
export type InsertClient = z.infer<typeof insertClientSchema>;
export type PlannedService = typeof plannedServices.$inferSelect;
export type Expense = typeof expenses.$inferSelect;
export type InsertExpense = z.infer<typeof insertExpenseSchema>;
