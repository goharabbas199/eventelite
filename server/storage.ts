import { db } from "./db";
import {
  users,
  emailVerifications,
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
  organizations,
  type User,
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
import { eq, desc, and, gt, isNull } from "drizzle-orm";
import { getOrganizationId } from "./organization-context";

export interface IStorage {
  // Users / Auth
  getUserByEmail(email: string): Promise<User | undefined>;
  getUserById(id: number): Promise<User | undefined>;
  getUserByGoogleId(googleId: string): Promise<User | undefined>;
  createUser(data: { fullName: string; email: string; passwordHash?: string | null; googleId?: string; emailVerified?: boolean }): Promise<User>;
  updateUserProfile(id: number, data: { fullName?: string; email?: string; phone?: string | null; bio?: string | null; avatarUrl?: string | null }): Promise<User>;
  updateUserRole(id: number, role: string): Promise<User>;
  findUserByFirebaseUid(firebaseUid: string): Promise<User | undefined>;
  findOrCreateFirebaseUser(data: { firebaseUid: string; email: string; fullName: string; avatarUrl?: string; phone?: string; emailVerified?: boolean }): Promise<User>;
  updateUserEmailVerified(id: number): Promise<User>;
  updateUserPassword(id: number, passwordHash: string): Promise<User>;
  linkGoogleId(userId: number, googleId: string): Promise<User>;
  // OTP
  createOtp(data: { email: string; code: string; type: string; expiresAt: Date }): Promise<any>;
  getValidOtp(email: string, code: string, type: string): Promise<any>;
  markOtpUsed(id: number): Promise<void>;

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
  confirmBudget(id: number, updates: {
    venueId?: number | null;
    budgetPlan: Record<string, unknown>;
    checklistTasks: Array<{ title: string }>;
  }): Promise<any>;
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
  private organizationId(): number {
    const organizationId = getOrganizationId();
    if (!organizationId) throw new Error("Organization context is required");
    return organizationId;
  }

  private async defaultOrganizationId(): Promise<number> {
    const [organization] = await db.select({ id: organizations.id }).from(organizations).orderBy(organizations.id).limit(1);
    if (!organization) throw new Error("No organization is configured");
    return organization.id;
  }

  private async clientInOrganization(id: number): Promise<boolean> {
    const [row] = await db.select({ id: clients.id }).from(clients).where(and(eq(clients.id, id), eq(clients.organizationId, this.organizationId())));
    return Boolean(row);
  }

  private async vendorInOrganization(id: number): Promise<boolean> {
    const [row] = await db.select({ id: vendors.id }).from(vendors).where(and(eq(vendors.id, id), eq(vendors.organizationId, this.organizationId())));
    return Boolean(row);
  }

  private async venueInOrganization(id: number): Promise<boolean> {
    const [row] = await db.select({ id: venues.id }).from(venues).where(and(eq(venues.id, id), eq(venues.organizationId, this.organizationId())));
    return Boolean(row);
  }

  private async quotationInOrganization(id: number): Promise<boolean> {
    const [row] = await db.select({ id: quotations.id }).from(quotations).where(and(eq(quotations.id, id), eq(quotations.organizationId, this.organizationId())));
    return Boolean(row);
  }

  private async invoiceInOrganization(id: number): Promise<boolean> {
    const [row] = await db.select({ id: invoices.id }).from(invoices).where(and(eq(invoices.id, id), eq(invoices.organizationId, this.organizationId())));
    return Boolean(row);
  }

  // ── Users / Auth ──────────────────────────────────────────────────────────
  async getUserByEmail(email: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.email, email.toLowerCase().trim()));
    return user;
  }

  async getUserById(id: number): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }

  async createUser(data: { fullName: string; email: string; passwordHash?: string | null; googleId?: string; emailVerified?: boolean }): Promise<User> {
    const organizationId = await this.defaultOrganizationId();
    const [user] = await db
      .insert(users)
      .values({
        organizationId,
        fullName: data.fullName,
        email: data.email.toLowerCase().trim(),
        passwordHash: data.passwordHash ?? null,
        googleId: data.googleId ?? null,
        emailVerified: data.emailVerified ?? false,
      })
      .returning();
    return user;
  }

  async findUserByFirebaseUid(firebaseUid: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.firebaseUid, firebaseUid));
    return user;
  }

  async findOrCreateFirebaseUser(data: {
    firebaseUid: string;
    email: string;
    fullName: string;
    avatarUrl?: string;
    phone?: string;
    emailVerified?: boolean;
  }): Promise<User> {
    const byUid = await this.findUserByFirebaseUid(data.firebaseUid);
    if (byUid) {
      // Always sync emailVerified from Firebase token
      if (data.emailVerified && !byUid.emailVerified) {
        const [updated] = await db
          .update(users)
          .set({ emailVerified: true })
          .where(eq(users.id, byUid.id))
          .returning();
        return updated;
      }
      return byUid;
    }

    const byEmail = await this.getUserByEmail(data.email);
    if (byEmail) {
      const [updated] = await db
        .update(users)
        .set({
          firebaseUid: data.firebaseUid,
          avatarUrl: byEmail.avatarUrl || data.avatarUrl || null,
          phone: byEmail.phone || data.phone || null,
          emailVerified: data.emailVerified ?? byEmail.emailVerified,
        })
        .where(eq(users.id, byEmail.id))
        .returning();
      return updated;
    }

    const [created] = await db
      .insert(users)
      .values({
        organizationId: await this.defaultOrganizationId(),
        firebaseUid: data.firebaseUid,
        fullName: data.fullName,
        email: data.email.toLowerCase().trim(),
        passwordHash: null,
        avatarUrl: data.avatarUrl || null,
        phone: data.phone || null,
        emailVerified: data.emailVerified ?? false,
      })
      .returning();
    return created;
  }

  async getUserByGoogleId(googleId: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.googleId, googleId));
    return user;
  }

  async updateUserEmailVerified(id: number): Promise<User> {
    const [user] = await db
      .update(users)
      .set({ emailVerified: true })
      .where(eq(users.id, id))
      .returning();
    return user;
  }

  async updateUserPassword(id: number, passwordHash: string): Promise<User> {
    const [user] = await db
      .update(users)
      .set({ passwordHash })
      .where(eq(users.id, id))
      .returning();
    return user;
  }

  async linkGoogleId(userId: number, googleId: string): Promise<User> {
    const [user] = await db
      .update(users)
      .set({ googleId, emailVerified: true })
      .where(eq(users.id, userId))
      .returning();
    return user;
  }

  async createOtp(data: { email: string; code: string; type: string; expiresAt: Date }): Promise<any> {
    const [otp] = await db
      .insert(emailVerifications)
      .values({
        email: data.email.toLowerCase().trim(),
        code: data.code,
        type: data.type,
        expiresAt: data.expiresAt,
      })
      .returning();
    return otp;
  }

  async getValidOtp(email: string, code: string, type: string): Promise<any> {
    const [otp] = await db
      .select()
      .from(emailVerifications)
      .where(
        and(
          eq(emailVerifications.email, email.toLowerCase().trim()),
          eq(emailVerifications.code, code),
          eq(emailVerifications.type, type),
          gt(emailVerifications.expiresAt, new Date()),
          isNull(emailVerifications.usedAt)
        )
      )
      .orderBy(desc(emailVerifications.createdAt))
      .limit(1);
    return otp;
  }

  async markOtpUsed(id: number): Promise<void> {
    await db
      .update(emailVerifications)
      .set({ usedAt: new Date() })
      .where(eq(emailVerifications.id, id));
  }

  async updateUserProfile(id: number, data: {
    fullName?: string;
    email?: string;
    phone?: string | null;
    bio?: string | null;
    avatarUrl?: string | null;
  }): Promise<User> {
    const updates: Partial<typeof users.$inferInsert> = {};
    if (data.fullName !== undefined) updates.fullName = data.fullName;
    if (data.email    !== undefined) updates.email    = data.email.toLowerCase().trim();
    if (data.phone    !== undefined) updates.phone    = data.phone;
    if (data.bio      !== undefined) updates.bio      = data.bio;
    if (data.avatarUrl !== undefined) updates.avatarUrl = data.avatarUrl;
    const [user] = await db.update(users).set(updates).where(eq(users.id, id)).returning();
    return user;
  }

  async updateUserRole(id: number, role: string): Promise<User> {
    const [user] = await db.update(users).set({ role }).where(eq(users.id, id)).returning();
    return user;
  }

  async getVendors() {
    return db.select().from(vendors).where(eq(vendors.organizationId, this.organizationId())).orderBy(desc(vendors.createdAt));
  }

  async getVendor(id: number) {
    const vendor = await db.select().from(vendors).where(and(eq(vendors.id, id), eq(vendors.organizationId, this.organizationId())));
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
    const [vendor] = await db.insert(vendors).values({ ...insertVendor, organizationId: this.organizationId() }).returning();
    return vendor;
  }

  async updateVendor(id: number, updates: Partial<InsertVendor>) {
    const { organizationId: _organizationId, ...safeUpdates } = updates as Partial<InsertVendor> & { organizationId?: number };
    const [updated] = await db
      .update(vendors)
      .set(safeUpdates)
      .where(and(eq(vendors.id, id), eq(vendors.organizationId, this.organizationId())))
      .returning();

    return updated;
  }

  async deleteVendor(id: number) {
    if (!(await this.vendorInOrganization(id))) return;
    await db.delete(vendorProducts).where(eq(vendorProducts.vendorId, id));
    await db.delete(vendors).where(and(eq(vendors.id, id), eq(vendors.organizationId, this.organizationId())));
  }

  async createVendorProduct(product: InsertVendorProduct) {
    if (!(await this.vendorInOrganization(product.vendorId))) return undefined;
    const [newProduct] = await db
      .insert(vendorProducts)
      .values(product)
      .returning();
    return newProduct;
  }

  async deleteVendorProduct(id: number) {
    const [product] = await db.select({ vendorId: vendorProducts.vendorId }).from(vendorProducts).where(eq(vendorProducts.id, id));
    if (!product || !(await this.vendorInOrganization(product.vendorId))) return;
    await db.delete(vendorProducts).where(eq(vendorProducts.id, id));
  }

  async getVenues() {
    return db.select().from(venues).where(eq(venues.organizationId, this.organizationId())).orderBy(desc(venues.createdAt));
  }

  async getVenue(id: number) {
    const venue = await db.select().from(venues).where(and(eq(venues.id, id), eq(venues.organizationId, this.organizationId())));
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
    const [venue] = await db.insert(venues).values({ ...insertVenue, organizationId: this.organizationId() }).returning();
    return venue;
  }

  async updateVenue(id: number, updates: Partial<InsertVenue>) {
    const { organizationId: _organizationId, ...safeUpdates } = updates as Partial<InsertVenue> & { organizationId?: number };
    const [updated] = await db
      .update(venues)
      .set(safeUpdates)
      .where(and(eq(venues.id, id), eq(venues.organizationId, this.organizationId())))
      .returning();

    return updated;
  }

  async deleteVenue(id: number) {
    if (!(await this.venueInOrganization(id))) return;
    await db.delete(venueImages).where(eq(venueImages.venueId, id));
    await db.delete(bookingOptions).where(eq(bookingOptions.venueId, id));
    await db.delete(venues).where(and(eq(venues.id, id), eq(venues.organizationId, this.organizationId())));
  }

  async updateVenueMainImage(id: number, mainImage: string) {
    const [updated] = await db
      .update(venues)
      .set({ mainImage })
      .where(and(eq(venues.id, id), eq(venues.organizationId, this.organizationId())))
      .returning();
    return updated;
  }

  async createBookingOption(option: InsertBookingOption) {
    if (!(await this.venueInOrganization(option.venueId))) return undefined;
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
    const [option] = await db.select({ venueId: bookingOptions.venueId }).from(bookingOptions).where(eq(bookingOptions.id, id));
    if (!option || !(await this.venueInOrganization(option.venueId))) return;
    await db.delete(bookingOptions).where(eq(bookingOptions.id, id));
  }

  async addVenueImages(venueId: number, images: string[]) {
    if (!images?.length) return;
    if (!(await this.venueInOrganization(venueId))) return;

    await db.insert(venueImages).values(
      images.map((url) => ({
        venueId,
        imageUrl: url,
      })),
    );
  }

  async deleteVenueImage(id: number) {
    const [image] = await db.select({ venueId: venueImages.venueId }).from(venueImages).where(eq(venueImages.id, id));
    if (!image || !(await this.venueInOrganization(image.venueId))) return;
    await db.delete(venueImages).where(eq(venueImages.id, id));
  }

  async getClients() {
    return db.select().from(clients).where(eq(clients.organizationId, this.organizationId())).orderBy(desc(clients.createdAt));
  }

  async getClient(id: number) {
    const client = await db.select().from(clients).where(and(eq(clients.id, id), eq(clients.organizationId, this.organizationId())));
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

    const clientEvents = await db
      .select()
      .from(events)
      .where(eq(events.clientId, id))
      .orderBy(desc(events.eventDate));

    return {
      ...client[0],
      services: services ?? [],
      expenses: clientExpenses ?? [],
      payments: clientPayments ?? [],
      vendorPayments: clientVendorPayments ?? [],
      events: clientEvents ?? [],
    };
  }

  async createClient(insertClient: InsertClient) {
    if (insertClient.venueId != null && !(await this.venueInOrganization(insertClient.venueId))) return undefined;
    const [client] = await db.insert(clients).values({ ...insertClient, organizationId: this.organizationId() }).returning();
    return client;
  }

  async updateClient(id: number, updates: Partial<InsertClient>) {
    if (!(await this.clientInOrganization(id))) return undefined;
    if (updates.venueId != null && !(await this.venueInOrganization(updates.venueId))) return undefined;
    const { organizationId: _organizationId, ...safeUpdates } = updates as Partial<InsertClient> & { organizationId?: number };
    const [updated] = await db
      .update(clients)
      .set(safeUpdates)
      .where(and(eq(clients.id, id), eq(clients.organizationId, this.organizationId())))
      .returning();
    return updated;
  }

  async confirmBudget(
    id: number,
    updates: {
      venueId?: number | null;
      budgetPlan: Record<string, unknown>;
      checklistTasks: Array<{ title: string }>;
    },
  ) {
    if (!(await this.clientInOrganization(id))) return undefined;
    if (updates.venueId != null && !(await this.venueInOrganization(updates.venueId))) return undefined;
    return db.transaction(async (tx) => {
      const [updated] = await tx
        .update(clients)
        .set({
          venueId: updates.venueId ?? null,
          status: "Confirmed",
          budgetPlan: updates.budgetPlan,
        })
        .where(and(eq(clients.id, id), eq(clients.organizationId, this.organizationId())))
        .returning();

      if (!updated) return undefined;

      // Preserve manual and service-specific tasks. Only replace tasks
      // created by a previous budget confirmation.
      await tx
        .delete(tasks)
        .where(and(eq(tasks.clientId, id), eq(tasks.aiGenerated, true), isNull(tasks.serviceId)));

      if (updates.checklistTasks.length > 0) {
        await tx.insert(tasks).values(
          updates.checklistTasks.map((task) => ({
            clientId: id,
            title: task.title,
            status: "Pending",
            aiGenerated: true,
            serviceId: null,
            dueDate: null,
          })),
        );
      }

      return updated;
    });
  }

  async deleteClient(id: number) {
    if (!(await this.clientInOrganization(id))) return;
    await db.delete(events).where(eq(events.clientId, id));
    await db.delete(plannedServices).where(eq(plannedServices.clientId, id));
    await db.delete(expenses).where(eq(expenses.clientId, id));
    await db.delete(clients).where(and(eq(clients.id, id), eq(clients.organizationId, this.organizationId())));
  }

  async createPlannedService(service: InsertPlannedService) {
    const clientId = Number((service as InsertPlannedService & { clientId?: number }).clientId);

    if (isNaN(clientId)) {
      throw new Error("Invalid clientId received in createPlannedService");
    }
    if (!(await this.clientInOrganization(clientId))) return undefined;

    const vendorId =
      service.vendorId !== undefined && service.vendorId !== null
        ? Number(service.vendorId)
        : null;
    if (vendorId !== null && !(await this.vendorInOrganization(vendorId))) return undefined;

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
    const [service] = await db.select({ clientId: plannedServices.clientId }).from(plannedServices).where(eq(plannedServices.id, id));
    if (!service || !(await this.clientInOrganization(service.clientId))) return undefined;
    if (updates.clientId !== undefined && !(await this.clientInOrganization(Number(updates.clientId)))) return undefined;
    if (updates.vendorId !== undefined && updates.vendorId !== null && !(await this.vendorInOrganization(Number(updates.vendorId)))) return undefined;
    const { clientId: _clientId, vendorId: _vendorId, ...safeUpdates } = updates;
    const [updated] = await db
      .update(plannedServices)
      .set({ ...safeUpdates, ...(updates.clientId !== undefined ? { clientId: Number(updates.clientId) } : {}), ...(updates.vendorId !== undefined ? { vendorId: updates.vendorId === null ? null : Number(updates.vendorId) } : {}) })
      .where(eq(plannedServices.id, id))
      .returning();
    return updated;
  }

  async deletePlannedService(id: number) {
    const [service] = await db.select({ clientId: plannedServices.clientId }).from(plannedServices).where(eq(plannedServices.id, id));
    if (!service || !(await this.clientInOrganization(service.clientId))) return;
    // Null out serviceId on tasks linked to this service so they become general tasks
    await db
      .update(tasks)
      .set({ serviceId: null })
      .where(eq(tasks.serviceId, id));
    await db.delete(plannedServices).where(eq(plannedServices.id, id));
  }

  async getExpenses(clientId: number) {
    if (!(await this.clientInOrganization(clientId))) return [];
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
    if (!(await this.clientInOrganization(clientId))) return undefined;

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
        cost: String(costValue),
        isPaid: insertExpense.isPaid ?? false,
      })
      .returning();

    return expense;
  }

  async updateExpense(id: number, updates: Partial<InsertExpense>) {
    const scopedUpdates = updates as Partial<InsertExpense> & { clientId?: number };
    const [expense] = await db.select({ clientId: expenses.clientId }).from(expenses).where(eq(expenses.id, id));
    if (!expense || !(await this.clientInOrganization(expense.clientId))) return undefined;
    if (scopedUpdates.clientId !== undefined && !(await this.clientInOrganization(Number(scopedUpdates.clientId)))) return undefined;
    const [updated] = await db
      .update(expenses)
      .set(updates)
      .where(eq(expenses.id, id))
      .returning();
    return updated;
  }

  async deleteExpense(id: number) {
    const [expense] = await db.select({ clientId: expenses.clientId }).from(expenses).where(eq(expenses.id, id));
    if (!expense || !(await this.clientInOrganization(expense.clientId))) return;
    await db.delete(expenses).where(eq(expenses.id, id));
  }

  // ================= PAYMENTS =================

  async getPayments(clientId: number) {
    if (!(await this.clientInOrganization(clientId))) return [];
    return db
      .select()
      .from(payments)
      .where(eq(payments.clientId, clientId))
      .orderBy(desc(payments.createdAt));
  }

  async createPayment(payment: InsertPayment & { clientId: number }) {
    if (!(await this.clientInOrganization(payment.clientId))) return undefined;
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
    const [payment] = await db.select({ clientId: payments.clientId }).from(payments).where(eq(payments.id, id));
    if (!payment || !(await this.clientInOrganization(payment.clientId))) return;
    await db.delete(payments).where(eq(payments.id, id));
  }

  // ================= VENDOR PAYMENTS =================

  async getVendorPayments(clientId: number) {
    if (!(await this.clientInOrganization(clientId))) return [];
    return db
      .select()
      .from(vendorPayments)
      .where(eq(vendorPayments.clientId, clientId))
      .orderBy(desc(vendorPayments.createdAt));
  }

  async createVendorPayment(payment: InsertVendorPayment) {
    if (!(await this.clientInOrganization(payment.clientId))) return undefined;
    if (!(await this.vendorInOrganization(payment.vendorId))) return undefined;
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
    const [payment] = await db.select({ clientId: vendorPayments.clientId, vendorId: vendorPayments.vendorId }).from(vendorPayments).where(eq(vendorPayments.id, id));
    if (!payment || !(await this.clientInOrganization(payment.clientId)) || !(await this.vendorInOrganization(payment.vendorId))) return undefined;
    if (updates.clientId !== undefined && !(await this.clientInOrganization(Number(updates.clientId)))) return undefined;
    if (updates.vendorId !== undefined && !(await this.vendorInOrganization(Number(updates.vendorId)))) return undefined;
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
    const [payment] = await db.select({ clientId: vendorPayments.clientId }).from(vendorPayments).where(eq(vendorPayments.id, id));
    if (!payment || !(await this.clientInOrganization(payment.clientId))) return;
    await db.delete(vendorPayments).where(eq(vendorPayments.id, id));
  }

  // ================= TASKS =================

  async getTasks(clientId: number) {
    if (!(await this.clientInOrganization(clientId))) return [];
    return db
      .select()
      .from(tasks)
      .where(eq(tasks.clientId, clientId))
      .orderBy(desc(tasks.createdAt));
  }

  async createTask(task: InsertTask & { clientId: number; serviceId?: number | null; aiGenerated?: boolean }) {
    if (!(await this.clientInOrganization(task.clientId))) return undefined;
    const [newTask] = await db
      .insert(tasks)
      .values({
        clientId: task.clientId,
        serviceId: task.serviceId ?? null,
        title: task.title,
        status: task.status || "Pending",
        aiGenerated: task.aiGenerated ?? false,
        dueDate: task.dueDate ? new Date(task.dueDate as any) : null,
      })
      .returning();
    return newTask;
  }

  async updateTask(id: number, updates: Partial<InsertTask>) {
    const scopedUpdates = updates as Partial<InsertTask> & { clientId?: number };
    const [task] = await db.select({ clientId: tasks.clientId }).from(tasks).where(eq(tasks.id, id));
    if (!task || !(await this.clientInOrganization(task.clientId))) return undefined;
    if (scopedUpdates.clientId !== undefined && !(await this.clientInOrganization(Number(scopedUpdates.clientId)))) return undefined;
    if (updates.serviceId !== undefined && updates.serviceId !== null) {
      const [service] = await db
        .select({ clientId: plannedServices.clientId })
        .from(plannedServices)
        .where(eq(plannedServices.id, Number(updates.serviceId)));
      const targetClientId = scopedUpdates.clientId !== undefined ? Number(scopedUpdates.clientId) : task.clientId;
      if (!service || service.clientId !== targetClientId || !(await this.clientInOrganization(service.clientId))) return undefined;
    }
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
    const [task] = await db.select({ clientId: tasks.clientId }).from(tasks).where(eq(tasks.id, id));
    if (!task || !(await this.clientInOrganization(task.clientId))) return;
    await db.delete(tasks).where(eq(tasks.id, id));
  }

  // ================= QUOTATIONS =================

  async getQuotations() {
    const rows = await db.select().from(quotations).where(eq(quotations.organizationId, this.organizationId())).orderBy(desc(quotations.createdAt));
    return Promise.all(
      rows.map(async (q) => {
        const items = await db.select().from(quotationItems).where(eq(quotationItems.quotationId, q.id));
        return { ...q, items };
      })
    );
  }

  async getQuotation(id: number) {
    const [q] = await db.select().from(quotations).where(and(eq(quotations.id, id), eq(quotations.organizationId, this.organizationId())));
    if (!q) return undefined;
    const items = await db.select().from(quotationItems).where(eq(quotationItems.quotationId, id));
    return { ...q, items };
  }

  async createQuotation(quotation: InsertQuotation, items: Omit<InsertQuotationItem, "quotationId">[]) {
    const organizationId = this.organizationId();
    if (quotation.clientId != null && !(await this.clientInOrganization(quotation.clientId))) return undefined;
    if (quotation.venueId != null && !(await this.venueInOrganization(quotation.venueId))) return undefined;
    const [newQ] = await db.insert(quotations).values({
      organizationId,
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
    const [existing] = await db.select({ organizationId: quotations.organizationId }).from(quotations).where(and(eq(quotations.id, id), eq(quotations.organizationId, this.organizationId())));
    if (!existing) return undefined;
    if (updates.clientId != null && !(await this.clientInOrganization(updates.clientId))) return undefined;
    if (updates.venueId != null && !(await this.venueInOrganization(updates.venueId))) return undefined;
    const { organizationId: _organizationId, ...data } = updates as Partial<InsertQuotation> & { organizationId?: number };
    if (data.totalCost !== undefined) data.totalCost = String(data.totalCost);
    if (data.markupPercentage !== undefined) data.markupPercentage = String(data.markupPercentage);
    if (data.discount !== undefined) data.discount = String(data.discount);
    if (data.tax !== undefined) data.tax = String(data.tax);
    if (data.finalPrice !== undefined) data.finalPrice = String(data.finalPrice);
    const [updated] = await db.update(quotations).set(data).where(and(eq(quotations.id, id), eq(quotations.organizationId, this.organizationId()))).returning();
    const items = await db.select().from(quotationItems).where(eq(quotationItems.quotationId, id));
    return { ...updated, items };
  }

  async deleteQuotation(id: number) {
    if (!(await this.quotationInOrganization(id))) return;
    await db.delete(quotationItems).where(eq(quotationItems.quotationId, id));
    await db.delete(quotations).where(eq(quotations.id, id));
  }

  // ================= EVENTS =================

  async getEvents() {
    return db.select().from(events).where(eq(events.organizationId, this.organizationId())).orderBy(desc(events.eventDate));
  }

  async getEvent(id: number) {
    const [event] = await db.select().from(events).where(and(eq(events.id, id), eq(events.organizationId, this.organizationId())));
    return event;
  }

  async getEventsByClient(clientId: number) {
    if (!(await this.clientInOrganization(clientId))) return [];
    return db.select().from(events).where(eq(events.clientId, clientId)).orderBy(desc(events.eventDate));
  }

  async createEvent(insertEvent: InsertEvent) {
    const organizationId = this.organizationId();
    if (!(await this.clientInOrganization(insertEvent.clientId))) return undefined;
    if (insertEvent.venueId != null && !(await this.venueInOrganization(insertEvent.venueId))) return undefined;
    const [event] = await db.insert(events).values({
      organizationId,
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
    const [existing] = await db.select({ organizationId: events.organizationId }).from(events).where(and(eq(events.id, id), eq(events.organizationId, this.organizationId())));
    if (!existing) return undefined;
    if (updates.clientId != null && !(await this.clientInOrganization(updates.clientId))) return undefined;
    if (updates.venueId != null && !(await this.venueInOrganization(updates.venueId))) return undefined;
    const { organizationId: _organizationId, ...data } = updates as Partial<InsertEvent> & { organizationId?: number };
    if (data.eventDate) data.eventDate = new Date(data.eventDate);
    if (data.budget !== undefined) data.budget = data.budget != null ? String(data.budget) : null;
    const [updated] = await db.update(events).set(data).where(and(eq(events.id, id), eq(events.organizationId, this.organizationId()))).returning();
    return updated;
  }

  async deleteEvent(id: number) {
    await db.delete(events).where(and(eq(events.id, id), eq(events.organizationId, this.organizationId())));
  }

  // ================= INVOICES =================

  async getInvoices() {
    return db.select().from(invoices).where(eq(invoices.organizationId, this.organizationId())).orderBy(desc(invoices.createdAt));
  }

  async getInvoice(id: number) {
    const [invoice] = await db.select().from(invoices).where(and(eq(invoices.id, id), eq(invoices.organizationId, this.organizationId())));
    return invoice;
  }

  async getInvoicesByClient(clientId: number) {
    if (!(await this.clientInOrganization(clientId))) return [];
    return db.select().from(invoices).where(eq(invoices.clientId, clientId)).orderBy(desc(invoices.createdAt));
  }

  async createInvoice(insertInvoice: InsertInvoice) {
    const organizationId = this.organizationId();
    if (!(await this.clientInOrganization(insertInvoice.clientId))) return undefined;
    if (insertInvoice.quotationId != null && !(await this.quotationInOrganization(insertInvoice.quotationId))) return undefined;
    const [invoice] = await db.insert(invoices).values({
      organizationId,
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
    if (!(await this.invoiceInOrganization(id))) return undefined;
    if (updates.clientId != null && !(await this.clientInOrganization(updates.clientId))) return undefined;
    if (updates.quotationId != null && !(await this.quotationInOrganization(updates.quotationId))) return undefined;
    const { organizationId: _organizationId, ...data } = updates as Partial<InsertInvoice> & { organizationId?: number };
    if (data.amount !== undefined) data.amount = String(data.amount);
    if (data.dueDate) data.dueDate = new Date(data.dueDate);
    const [updated] = await db.update(invoices).set(data).where(and(eq(invoices.id, id), eq(invoices.organizationId, this.organizationId()))).returning();
    return updated;
  }

  async deleteInvoice(id: number) {
    await db.delete(invoices).where(and(eq(invoices.id, id), eq(invoices.organizationId, this.organizationId())));
  }

  async getAllSettings(): Promise<Record<string, any>> {
    const rows = await db.select().from(appSettings).where(eq(appSettings.organizationId, this.organizationId()));
    const result: Record<string, any> = {};
    for (const row of rows) {
      try { result[row.key] = JSON.parse(row.value); } catch { result[row.key] = row.value; }
    }
    return result;
  }

  async getSetting(key: string): Promise<any | undefined> {
    const [row] = await db.select().from(appSettings).where(and(eq(appSettings.key, key), eq(appSettings.organizationId, this.organizationId())));
    if (!row) return undefined;
    try { return JSON.parse(row.value); } catch { return row.value; }
  }

  async setSetting(key: string, value: any): Promise<void> {
    const organizationId = this.organizationId();
    const serialized = JSON.stringify(value);
    await db
      .insert(appSettings)
      .values({ organizationId, key, value: serialized })
      .onConflictDoUpdate({ target: [appSettings.organizationId, appSettings.key], set: { value: serialized } });
  }
}

export const storage = new DatabaseStorage();
