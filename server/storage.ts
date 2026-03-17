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
  payments,
  vendorPayments,
  tasks,
  quotations,
  quotationItems,
  events,
  invoices,
  appSettings,
  type InsertVendor,
  type InsertVendorProduct,
  type InsertVenue,
  type InsertBookingOption,
  type InsertClient,
  type InsertPlannedService,
  type InsertExpense,
  type InsertPayment,
  type InsertVendorPayment,
  type InsertTask,
  type InsertQuotation,
  type InsertQuotationItem,
  type InsertEvent,
  type InsertInvoice,
} from "@shared/schema";
import { eq, desc } from "drizzle-orm";

export interface IStorage {
  getVendors(): Promise<any[]>;
  getVendor(id: number): Promise<any | undefined>;
  createVendor(vendor: InsertVendor): Promise<any>;
  updateVenue(id: number, updates: Partial<InsertVenue>): Promise<any>;
  updateVendor(id: number, updates: Partial<InsertVendor>): Promise<any>;
  deleteVendor(id: number): Promise<void>;
  createVendorProduct(product: InsertVendorProduct): Promise<any>;
  deleteVendorProduct(id: number): Promise<void>;

  getVenues(): Promise<any[]>;
  getVenue(id: number): Promise<any | undefined>;
  createVenue(venue: InsertVenue): Promise<any>;
  updateVenue(id: number, updates: Partial<InsertVenue>): Promise<any>;
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
  updatePlannedService(id: number, updates: Partial<InsertPlannedService>): Promise<any>;
  deletePlannedService(id: number): Promise<void>;

  getExpenses(clientId: number): Promise<any[]>;
  createExpense(expense: InsertExpense): Promise<any>;
  updateExpense(id: number, updates: Partial<InsertExpense>): Promise<any>;
  deleteExpense(id: number): Promise<void>;

  // Payments
  getPayments(clientId: number): Promise<any[]>;
  createPayment(payment: InsertPayment & { clientId: number }): Promise<any>;
  deletePayment(id: number): Promise<void>;

  // Vendor Payments
  getVendorPayments(clientId: number): Promise<any[]>;
  createVendorPayment(payment: InsertVendorPayment): Promise<any>;
  updateVendorPayment(id: number, updates: Partial<InsertVendorPayment>): Promise<any>;
  deleteVendorPayment(id: number): Promise<void>;

  // Tasks
  getTasks(clientId: number): Promise<any[]>;
  createTask(task: InsertTask & { clientId: number }): Promise<any>;
  updateTask(id: number, updates: Partial<InsertTask>): Promise<any>;
  deleteTask(id: number): Promise<void>;

  // Quotations
  getQuotations(): Promise<any[]>;
  getQuotation(id: number): Promise<any | undefined>;
  createQuotation(quotation: InsertQuotation, items: Omit<InsertQuotationItem, "quotationId">[]): Promise<any>;
  updateQuotation(id: number, updates: Partial<InsertQuotation>): Promise<any>;
  deleteQuotation(id: number): Promise<void>;

  // Events
  getEvents(): Promise<any[]>;
  getEvent(id: number): Promise<any | undefined>;
  getEventsByClient(clientId: number): Promise<any[]>;
  createEvent(event: InsertEvent): Promise<any>;
  updateEvent(id: number, updates: Partial<InsertEvent>): Promise<any>;
  deleteEvent(id: number): Promise<void>;

  // Invoices
  getInvoices(): Promise<any[]>;
  getInvoice(id: number): Promise<any | undefined>;
  getInvoicesByClient(clientId: number): Promise<any[]>;
  createInvoice(invoice: InsertInvoice): Promise<any>;
  updateInvoice(id: number, updates: Partial<InsertInvoice>): Promise<any>;
  deleteInvoice(id: number): Promise<void>;

  // App Settings
  getAllSettings(): Promise<Record<string, any>>;
  getSetting(key: string): Promise<any | undefined>;
  setSetting(key: string, value: any): Promise<void>;
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

  async updateVendor(id: number, updates: Partial<InsertVendor>) {
    const [updated] = await db
      .update(vendors)
      .set(updates)
      .where(eq(vendors.id, id))
      .returning();

    return updated;
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

  async updateVenue(id: number, updates: Partial<InsertVenue>) {
    const [updated] = await db
      .update(venues)
      .set(updates)
      .where(eq(venues.id, id))
      .returning();

    return updated;
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

    const clientPayments = await db
      .select()
      .from(payments)
      .where(eq(payments.clientId, id))
      .orderBy(desc(payments.createdAt));

    const clientVendorPayments = await db
      .select()
      .from(vendorPayments)
      .where(eq(vendorPayments.clientId, id))
      .orderBy(desc(vendorPayments.createdAt));

    return {
      ...client[0],
      services: services ?? [],
      expenses: clientExpenses ?? [],
      payments: clientPayments ?? [],
      vendorPayments: clientVendorPayments ?? [],
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
        vendorCost: service.vendorCost != null ? String(service.vendorCost) : null,
        clientPrice: service.clientPrice != null ? String(service.clientPrice) : null,
        status: service.status ?? "Planned",
        notes: service.notes ?? null,
      })
      .returning();

    return newService;
  }

  async updatePlannedService(id: number, updates: Partial<InsertPlannedService>) {
    const [updated] = await db
      .update(plannedServices)
      .set(updates)
      .where(eq(plannedServices.id, id))
      .returning();
    return updated;
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

  async createExpense(insertExpense: InsertExpense & { clientId: number }) {
    const clientId = Number(insertExpense.clientId);

    if (isNaN(clientId)) {
      throw new Error("Invalid clientId in createExpense");
    }

    const costValue =
      insertExpense.cost !== undefined && insertExpense.cost !== null
        ? Number(insertExpense.cost)
        : 0;

    const [expense] = await db
      .insert(expenses)
      .values({
        clientId,
        category: insertExpense.category,
        item: insertExpense.item,
        cost: costValue,
        isPaid: insertExpense.isPaid ?? false,
      })
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

  // ================= PAYMENTS =================

  async getPayments(clientId: number) {
    return db
      .select()
      .from(payments)
      .where(eq(payments.clientId, clientId))
      .orderBy(desc(payments.createdAt));
  }

  async createPayment(payment: InsertPayment & { clientId: number }) {
    const [newPayment] = await db
      .insert(payments)
      .values({
        clientId: payment.clientId,
        amount: String(payment.amount),
        paymentDate: new Date(payment.paymentDate),
        paymentMethod: payment.paymentMethod || "Cash",
        notes: payment.notes || null,
      })
      .returning();
    return newPayment;
  }

  async deletePayment(id: number) {
    await db.delete(payments).where(eq(payments.id, id));
  }

  // ================= VENDOR PAYMENTS =================

  async getVendorPayments(clientId: number) {
    return db
      .select()
      .from(vendorPayments)
      .where(eq(vendorPayments.clientId, clientId))
      .orderBy(desc(vendorPayments.createdAt));
  }

  async createVendorPayment(payment: InsertVendorPayment) {
    const [newPayment] = await db
      .insert(vendorPayments)
      .values({
        vendorId: payment.vendorId,
        clientId: payment.clientId,
        serviceId: payment.serviceId || null,
        amount: String(payment.amount),
        status: payment.status || "Unpaid",
        paymentDate: payment.paymentDate ? new Date(payment.paymentDate) : null,
        notes: payment.notes || null,
      })
      .returning();
    return newPayment;
  }

  async updateVendorPayment(id: number, updates: Partial<InsertVendorPayment>) {
    const updateData: any = { ...updates };
    if (updates.amount !== undefined) updateData.amount = String(updates.amount);
    if (updates.paymentDate) updateData.paymentDate = new Date(updates.paymentDate as any);
    const [updated] = await db
      .update(vendorPayments)
      .set(updateData)
      .where(eq(vendorPayments.id, id))
      .returning();
    return updated;
  }

  async deleteVendorPayment(id: number) {
    await db.delete(vendorPayments).where(eq(vendorPayments.id, id));
  }

  // ================= TASKS =================

  async getTasks(clientId: number) {
    return db
      .select()
      .from(tasks)
      .where(eq(tasks.clientId, clientId))
      .orderBy(desc(tasks.createdAt));
  }

  async createTask(task: InsertTask & { clientId: number }) {
    const [newTask] = await db
      .insert(tasks)
      .values({
        clientId: task.clientId,
        title: task.title,
        status: task.status || "Pending",
        dueDate: task.dueDate ? new Date(task.dueDate as any) : null,
      })
      .returning();
    return newTask;
  }

  async updateTask(id: number, updates: Partial<InsertTask>) {
    const updateData: any = { ...updates };
    if (updates.dueDate) updateData.dueDate = new Date(updates.dueDate as any);
    const [updated] = await db
      .update(tasks)
      .set(updateData)
      .where(eq(tasks.id, id))
      .returning();
    return updated;
  }

  async deleteTask(id: number) {
    await db.delete(tasks).where(eq(tasks.id, id));
  }

  async updateVenue(id: number, updates: Partial<InsertVenue>) {
    const [updated] = await db
      .update(venues)
      .set(updates)
      .where(eq(venues.id, id))
      .returning();
    return updated;
  }

  async updateVendor(id: number, updates: Partial<InsertVendor>) {
    const [updated] = await db
      .update(vendors)
      .set(updates)
      .where(eq(vendors.id, id))
      .returning();
    return updated;
  }

  // ================= QUOTATIONS =================

  async getQuotations() {
    const rows = await db.select().from(quotations).orderBy(desc(quotations.createdAt));
    return Promise.all(
      rows.map(async (q) => {
        const items = await db.select().from(quotationItems).where(eq(quotationItems.quotationId, q.id));
        return { ...q, items };
      })
    );
  }

  async getQuotation(id: number) {
    const [q] = await db.select().from(quotations).where(eq(quotations.id, id));
    if (!q) return undefined;
    const items = await db.select().from(quotationItems).where(eq(quotationItems.quotationId, id));
    return { ...q, items };
  }

  async createQuotation(quotation: InsertQuotation, items: Omit<InsertQuotationItem, "quotationId">[]) {
    const [newQ] = await db.insert(quotations).values({
      clientId: quotation.clientId ?? null,
      eventType: quotation.eventType || "",
      guestCount: quotation.guestCount ?? null,
      venueId: quotation.venueId ?? null,
      totalCost: String(quotation.totalCost ?? 0),
      markupPercentage: String(quotation.markupPercentage ?? 0),
      discount: String(quotation.discount ?? 0),
      tax: String(quotation.tax ?? 0),
      finalPrice: String(quotation.finalPrice ?? 0),
      status: quotation.status || "Draft",
      notes: quotation.notes ?? null,
    }).returning();

    if (items.length > 0) {
      await db.insert(quotationItems).values(
        items.map((item) => ({
          quotationId: newQ.id,
          serviceName: item.serviceName,
          cost: String(item.cost),
        }))
      );
    }

    return this.getQuotation(newQ.id);
  }

  async updateQuotation(id: number, updates: Partial<InsertQuotation>) {
    const data: any = { ...updates };
    if (data.totalCost !== undefined) data.totalCost = String(data.totalCost);
    if (data.markupPercentage !== undefined) data.markupPercentage = String(data.markupPercentage);
    if (data.discount !== undefined) data.discount = String(data.discount);
    if (data.tax !== undefined) data.tax = String(data.tax);
    if (data.finalPrice !== undefined) data.finalPrice = String(data.finalPrice);
    const [updated] = await db.update(quotations).set(data).where(eq(quotations.id, id)).returning();
    const items = await db.select().from(quotationItems).where(eq(quotationItems.quotationId, id));
    return { ...updated, items };
  }

  async deleteQuotation(id: number) {
    await db.delete(quotationItems).where(eq(quotationItems.quotationId, id));
    await db.delete(quotations).where(eq(quotations.id, id));
  }

  // ================= EVENTS =================

  async getEvents() {
    return db.select().from(events).orderBy(desc(events.eventDate));
  }

  async getEvent(id: number) {
    const [event] = await db.select().from(events).where(eq(events.id, id));
    return event;
  }

  async getEventsByClient(clientId: number) {
    return db.select().from(events).where(eq(events.clientId, clientId)).orderBy(desc(events.eventDate));
  }

  async createEvent(insertEvent: InsertEvent) {
    const [event] = await db.insert(events).values({
      clientId: insertEvent.clientId,
      eventName: insertEvent.eventName,
      eventType: insertEvent.eventType,
      eventDate: new Date(insertEvent.eventDate as any),
      venueId: insertEvent.venueId ?? null,
      guestCount: insertEvent.guestCount ?? null,
      budget: insertEvent.budget != null ? String(insertEvent.budget) : null,
      status: insertEvent.status || "lead",
    }).returning();
    return event;
  }

  async updateEvent(id: number, updates: Partial<InsertEvent>) {
    const data: any = { ...updates };
    if (data.eventDate) data.eventDate = new Date(data.eventDate);
    if (data.budget !== undefined) data.budget = data.budget != null ? String(data.budget) : null;
    const [updated] = await db.update(events).set(data).where(eq(events.id, id)).returning();
    return updated;
  }

  async deleteEvent(id: number) {
    await db.delete(events).where(eq(events.id, id));
  }

  // ================= INVOICES =================

  async getInvoices() {
    return db.select().from(invoices).orderBy(desc(invoices.createdAt));
  }

  async getInvoice(id: number) {
    const [invoice] = await db.select().from(invoices).where(eq(invoices.id, id));
    return invoice;
  }

  async getInvoicesByClient(clientId: number) {
    return db.select().from(invoices).where(eq(invoices.clientId, clientId)).orderBy(desc(invoices.createdAt));
  }

  async createInvoice(insertInvoice: InsertInvoice) {
    const [invoice] = await db.insert(invoices).values({
      clientId: insertInvoice.clientId,
      quotationId: insertInvoice.quotationId ?? null,
      invoiceNumber: insertInvoice.invoiceNumber,
      amount: String(insertInvoice.amount),
      status: insertInvoice.status || "unpaid",
      dueDate: insertInvoice.dueDate ? new Date(insertInvoice.dueDate as any) : null,
      notes: insertInvoice.notes ?? null,
    }).returning();
    return invoice;
  }

  async updateInvoice(id: number, updates: Partial<InsertInvoice>) {
    const data: any = { ...updates };
    if (data.amount !== undefined) data.amount = String(data.amount);
    if (data.dueDate) data.dueDate = new Date(data.dueDate);
    const [updated] = await db.update(invoices).set(data).where(eq(invoices.id, id)).returning();
    return updated;
  }

  async deleteInvoice(id: number) {
    await db.delete(invoices).where(eq(invoices.id, id));
  }

  async getAllSettings(): Promise<Record<string, any>> {
    const rows = await db.select().from(appSettings);
    const result: Record<string, any> = {};
    for (const row of rows) {
      try { result[row.key] = JSON.parse(row.value); } catch { result[row.key] = row.value; }
    }
    return result;
  }

  async getSetting(key: string): Promise<any | undefined> {
    const [row] = await db.select().from(appSettings).where(eq(appSettings.key, key));
    if (!row) return undefined;
    try { return JSON.parse(row.value); } catch { return row.value; }
  }

  async setSetting(key: string, value: any): Promise<void> {
    const serialized = JSON.stringify(value);
    await db
      .insert(appSettings)
      .values({ key, value: serialized })
      .onConflictDoUpdate({ target: appSettings.key, set: { value: serialized } });
  }
}

export const storage = new DatabaseStorage();
