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

  // SaaS-level fields
  googleMapsLink: text("google_maps_link"),
  mainImage: text("main_image"), // Cover image (Cloudinary URL later)
  bookingPhone: text("booking_phone"),
  bookingEmail: text("booking_email"),
  venueType: text("venue_type"), // Indoor / Outdoor / Both

  createdAt: timestamp("created_at").defaultNow(),
});

// Multiple gallery images per venue
export const venueImages = pgTable("venue_images", {
  id: serial("id").primaryKey(),
  venueId: integer("venue_id").notNull(),
  imageUrl: text("image_url").notNull(),
});

// Booking options
export const bookingOptions = pgTable("booking_options", {
  id: serial("id").primaryKey(),
  venueId: integer("venue_id").notNull(),
  name: text("name").notNull(),
  price: numeric("price").notNull(),
  description: text("description"),
});

export const venuesRelations = relations(venues, ({ many }) => ({
  options: many(bookingOptions),
  images: many(venueImages),
}));

export const venueImagesRelations = relations(venueImages, ({ one }) => ({
  venue: one(venues, {
    fields: [venueImages.venueId],
    references: [venues.id],
  }),
}));

export const bookingOptionsRelations = relations(bookingOptions, ({ one }) => ({
  venue: one(venues, {
    fields: [bookingOptions.venueId],
    references: [venues.id],
  }),
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
  budget: numeric("budget").notNull(),
  status: text("status").notNull(),
  notes: text("notes"),
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

export const insertClientSchema = createInsertSchema(clients).omit({
  id: true,
  createdAt: true,
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

export type Vendor = typeof vendors.$inferSelect;
export type InsertVendor = z.infer<typeof insertVendorSchema>;

export type VendorProduct = typeof vendorProducts.$inferSelect;

export type Venue = typeof venues.$inferSelect;
export type InsertVenue = z.infer<typeof insertVenueSchema>;

export type VenueImage = typeof venueImages.$inferSelect;
export type InsertVenueImage = z.infer<typeof insertVenueImageSchema>;

export type BookingOption = typeof bookingOptions.$inferSelect;

export type Client = typeof clients.$inferSelect;
export type InsertClient = z.infer<typeof insertClientSchema>;

export type PlannedService = typeof plannedServices.$inferSelect;

export type Expense = typeof expenses.$inferSelect;
export type InsertExpense = z.infer<typeof insertExpenseSchema>;
