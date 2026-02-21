import { db } from "./db";
import {
  vendors,
  vendorProducts,
  venues,
  bookingOptions,
  venueImages,
  clients,
  plannedServices,
  expenses,
  type InsertVendor,
  type InsertVendorProduct,
  type InsertVenue,
  type InsertBookingOption,
  type InsertClient,
  type InsertPlannedService,
  type InsertExpense,
} from "@shared/schema";
import { eq, desc } from "drizzle-orm";

export interface IStorage {
  getVendors(): Promise<any[]>;
  getVendor(id: number): Promise<any | undefined>;
  createVendor(vendor: InsertVendor): Promise<any>;
  deleteVendor(id: number): Promise<void>;
  createVendorProduct(product: InsertVendorProduct): Promise<any>;
  deleteVendorProduct(id: number): Promise<void>;

  getVenues(): Promise<any[]>;
  getVenue(id: number): Promise<any | undefined>;
  createVenue(venue: InsertVenue): Promise<any>;
  deleteVenue(id: number): Promise<void>;
  updateVenueMainImage(id: number, mainImage: string): Promise<any>;
  createBookingOption(option: InsertBookingOption): Promise<any>;
  deleteBookingOption(id: number): Promise<void>;
  addVenueImages(venueId: number, images: string[]): Promise<void>;
  deleteVenueImage(id: number): Promise<void>;

  getClients(): Promise<any[]>;
  getClient(id: number): Promise<any | undefined>;
  createClient(client: InsertClient): Promise<any>;
  updateClient(id: number, updates: Partial<InsertClient>): Promise<any>;
  deleteClient(id: number): Promise<void>;
  createPlannedService(service: InsertPlannedService): Promise<any>;
  deletePlannedService(id: number): Promise<void>;

  getExpenses(clientId: number): Promise<any[]>;
  createExpense(expense: InsertExpense): Promise<any>;
  updateExpense(id: number, updates: Partial<InsertExpense>): Promise<any>;
  deleteExpense(id: number): Promise<void>;
}

export class DatabaseStorage implements IStorage {
  async getVendors() {
    return db.select().from(vendors).orderBy(desc(vendors.createdAt));
  }

  async getVendor(id: number) {
    const vendor = await db.select().from(vendors).where(eq(vendors.id, id));
    if (!vendor.length) return undefined;

    const products = await db
      .select()
      .from(vendorProducts)
      .where(eq(vendorProducts.vendorId, id));

    return {
      ...vendor[0],
      products: products ?? [],
    };
  }

  async createVendor(insertVendor: InsertVendor) {
    const [vendor] = await db.insert(vendors).values(insertVendor).returning();
    return vendor;
  }

  async deleteVendor(id: number) {
    await db.delete(vendorProducts).where(eq(vendorProducts.vendorId, id));
    await db.delete(vendors).where(eq(vendors.id, id));
  }

  async createVendorProduct(product: InsertVendorProduct) {
    const [newProduct] = await db
      .insert(vendorProducts)
      .values(product)
      .returning();
    return newProduct;
  }

  async deleteVendorProduct(id: number) {
    await db.delete(vendorProducts).where(eq(vendorProducts.id, id));
  }

  async getVenues() {
    return db.select().from(venues).orderBy(desc(venues.createdAt));
  }

  async getVenue(id: number) {
    const venue = await db.select().from(venues).where(eq(venues.id, id));
    if (!venue.length) return undefined;

    const options = await db
      .select()
      .from(bookingOptions)
      .where(eq(bookingOptions.venueId, id))
      .orderBy(desc(bookingOptions.id));

    const images = await db
      .select()
      .from(venueImages)
      .where(eq(venueImages.venueId, id))
      .orderBy(desc(venueImages.id));

    return {
      ...venue[0],
      options: options ?? [],
      images: images ?? [],
    };
  }

  async createVenue(insertVenue: InsertVenue) {
    const [venue] = await db.insert(venues).values(insertVenue).returning();
    return venue;
  }

  async deleteVenue(id: number) {
    await db.delete(venueImages).where(eq(venueImages.venueId, id));
    await db.delete(bookingOptions).where(eq(bookingOptions.venueId, id));
    await db.delete(venues).where(eq(venues.id, id));
  }

  async updateVenueMainImage(id: number, mainImage: string) {
    const [updated] = await db
      .update(venues)
      .set({ mainImage })
      .where(eq(venues.id, id))
      .returning();
    return updated;
  }

  async createBookingOption(option: InsertBookingOption) {
    const [newOption] = await db
      .insert(bookingOptions)
      .values({
        venueId: option.venueId,
        name: option.name,
        description: option.description || "",
        price: String(option.price),
        currency: option.currency || "USD",
      })
      .returning();

    return newOption;
  }

  async deleteBookingOption(id: number) {
    await db.delete(bookingOptions).where(eq(bookingOptions.id, id));
  }

  async addVenueImages(venueId: number, images: string[]) {
    if (!images?.length) return;

    await db.insert(venueImages).values(
      images.map((url) => ({
        venueId,
        imageUrl: url,
      })),
    );
  }

  async deleteVenueImage(id: number) {
    await db.delete(venueImages).where(eq(venueImages.id, id));
  }

  async getClients() {
    return db.select().from(clients).orderBy(desc(clients.createdAt));
  }

  async getClient(id: number) {
    const client = await db.select().from(clients).where(eq(clients.id, id));
    if (!client.length) return undefined;

    const services = await db
      .select()
      .from(plannedServices)
      .where(eq(plannedServices.clientId, id));

    const clientExpenses = await db
      .select()
      .from(expenses)
      .where(eq(expenses.clientId, id));

    return {
      ...client[0],
      services: services ?? [],
      expenses: clientExpenses ?? [],
    };
  }

  async createClient(insertClient: InsertClient) {
    const [client] = await db.insert(clients).values(insertClient).returning();
    return client;
  }

  async updateClient(id: number, updates: Partial<InsertClient>) {
    const [updated] = await db
      .update(clients)
      .set(updates)
      .where(eq(clients.id, id))
      .returning();
    return updated;
  }

  async deleteClient(id: number) {
    await db.delete(plannedServices).where(eq(plannedServices.clientId, id));
    await db.delete(expenses).where(eq(expenses.clientId, id));
    await db.delete(clients).where(eq(clients.id, id));
  }

  async createPlannedService(service: InsertPlannedService) {
    const clientId = Number(service.clientId);

    if (isNaN(clientId)) {
      throw new Error("Invalid clientId received in createPlannedService");
    }

    const vendorId =
      service.vendorId !== undefined && service.vendorId !== null
        ? Number(service.vendorId)
        : null;

    const costValue =
      service.cost !== undefined && service.cost !== null
        ? String(service.cost)
        : "0";

    const [newService] = await db
      .insert(plannedServices)
      .values({
        clientId,
        vendorId,
        serviceName: service.serviceName,
        cost: costValue,
        notes: service.notes ?? null,
      })
      .returning();

    return newService;
  }

  async deletePlannedService(id: number) {
    await db.delete(plannedServices).where(eq(plannedServices.id, id));
  }

  async getExpenses(clientId: number) {
    return db
      .select()
      .from(expenses)
      .where(eq(expenses.clientId, clientId))
      .orderBy(desc(expenses.createdAt));
  }

  async createExpense(insertExpense: InsertExpense) {
    const [expense] = await db
      .insert(expenses)
      .values(insertExpense)
      .returning();
    return expense;
  }

  async updateExpense(id: number, updates: Partial<InsertExpense>) {
    const [updated] = await db
      .update(expenses)
      .set(updates)
      .where(eq(expenses.id, id))
      .returning();
    return updated;
  }

  async deleteExpense(id: number) {
    await db.delete(expenses).where(eq(expenses.id, id));
  }
}

export const storage = new DatabaseStorage();
