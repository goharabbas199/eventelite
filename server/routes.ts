import type { Express } from "express";
import type { Server } from "http";
import { storage } from "./storage";
import { api } from "@shared/routes";
import { z } from "zod";
import cloudinary, { cloudinaryConfigured } from "./cloudinary";
import multer from "multer";
import { runAI } from "./services/aiService";
import rateLimit from "express-rate-limit";
import { requireAuth, requirePermission } from "./authorization";

const upload = multer({ storage: multer.memoryStorage() });

export async function registerRoutes(
  httpServer: Server,
  app: Express,
): Promise<Server> {

  // ===================== AUTH ===========================

  const authLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 30,
    message: { message: "Too many requests. Please try again later." },
    standardHeaders: true,
    legacyHeaders: false,
  });

  function safeUser(user: any) {
    const { passwordHash: _ph, ...rest } = user;
    return rest;
  }

  // POST /api/auth/logout
  app.post("/api/auth/logout", (req, res) => {
    req.logout(() => {
      req.session.destroy(() => {
        res.clearCookie("connect.sid");
        res.json({ success: true });
      });
    });
  });

  // GET /api/auth/me
  app.get("/api/auth/me", (req, res) => {
    if (!req.isAuthenticated() || !req.user) {
      return res.status(401).json({ message: "Not authenticated" });
    }
    res.json(safeUser(req.user));
  });

  // ===================== VENDORS ========================

  app.get(api.vendors.list.path, async (_req, res) => {
    const vendors = await storage.getVendors();
    res.json(vendors);
  });

  app.post(api.vendors.create.path, requirePermission("business:write"), async (req, res) => {
    try {
      const input = api.vendors.create.input.parse(req.body);
      const vendor = await storage.createVendor(input);
      res.status(201).json(vendor);
    } catch (err) {
      if (err instanceof z.ZodError) {
        return res.status(400).json({ message: err.errors[0].message });
      }
      res.status(500).json({ message: "Failed to create vendor" });
    }
  });

  app.get(api.vendors.get.path, async (req, res) => {
    const vendor = await storage.getVendor(Number(req.params.id));
    if (!vendor) return res.status(404).json({ message: "Vendor not found" });
    res.json(vendor);
  });

  app.delete(api.vendors.delete.path, requirePermission("business:delete"), async (req, res) => {
    await storage.deleteVendor(Number(req.params.id));
    res.status(204).end();
  });

  // UPDATE VENDOR
  app.put("/api/vendors/:id", requirePermission("business:write"), async (req, res) => {
    try {
      const vendorId = Number(req.params.id);

      const updated = await storage.updateVendor(vendorId, req.body);

      res.json(updated);
    } catch (err) {
      console.error("Update vendor error:", err);
      res.status(500).json({ message: "Failed to update vendor" });
    }
  });

  // ================= VENDOR PRODUCTS =================

  app.post("/api/vendors/:vendorId/products", requirePermission("business:write"), async (req, res) => {
    try {
      const vendorId = Number(req.params.vendorId);

      const productData = {
        ...req.body,
        vendorId,
      };

      const product = await storage.createVendorProduct(productData);

      res.status(201).json(product);
    } catch (error) {
      console.error("Create vendor product error:", error);
      res.status(500).json({ message: "Failed to create vendor product" });
    }
  });

  app.delete("/api/vendor-products/:id", requirePermission("business:delete"), async (req, res) => {
    try {
      await storage.deleteVendorProduct(Number(req.params.id));
      res.status(204).end();
    } catch (error) {
      console.error("Delete vendor product error:", error);
      res.status(500).json({ message: "Failed to delete vendor product" });
    }
  });

  // ====================== VENUES ========================

  app.get(api.venues.list.path, async (_req, res) => {
    const venues = await storage.getVenues();
    res.json(venues);
  });

  app.post(api.venues.create.path, requirePermission("business:write"), async (req, res) => {
    try {
      const { images = [], ...venueData } = req.body;

      const input = api.venues.create.input.parse(venueData);
      const venue = await storage.createVenue(input);

      if (Array.isArray(images) && images.length > 0) {
        await storage.addVenueImages(venue.id, images);
      }

      res.status(201).json(venue);
    } catch (err) {
      if (err instanceof z.ZodError) {
        return res.status(400).json({ message: err.errors[0].message });
      }
      res.status(500).json({ message: "Failed to create venue" });
    }
  });

  app.get(api.venues.get.path, async (req, res) => {
    const venue = await storage.getVenue(Number(req.params.id));
    if (!venue) return res.status(404).json({ message: "Venue not found" });
    res.json(venue);
  });

  // UPDATE VENUE
  // UPDATE VENUE
  app.patch("/api/venues/:id", requirePermission("business:write"), async (req, res) => {
    try {
      const venueId = Number(req.params.id);

      const updated = await storage.updateVenue(venueId, req.body);

      res.json(updated);
    } catch (err) {
      console.error("Update venue error:", err);
      res.status(500).json({ message: "Failed to update venue" });
    }
  });

  // ✅ NEW: UPDATE MAIN IMAGE
  app.patch("/api/venues/:id/main-image", requirePermission("business:write"), async (req, res) => {
    try {
      const venueId = Number(req.params.id);
      const { mainImage } = req.body;

      if (!mainImage) {
        return res.status(400).json({ message: "Main image URL required" });
      }

      const updated = await storage.updateVenueMainImage(venueId, mainImage);

      res.json(updated);
    } catch (err) {
      console.error("Update main image error:", err);
      res.status(500).json({ message: "Failed to update main image" });
    }
  });

  app.delete(api.venues.delete.path, requirePermission("business:delete"), async (req, res) => {
    await storage.deleteVenue(Number(req.params.id));
    res.status(204).end();
  });
  // ✅ ADD GALLERY IMAGE
  app.post("/api/venues/:id/images", requirePermission("business:write"), async (req, res) => {
    try {
      const venueId = Number(req.params.id);
      const { imageUrl } = req.body;

      if (!imageUrl) {
        return res.status(400).json({ message: "Image URL required" });
      }

      await storage.addVenueImages(venueId, [imageUrl]);

      res.status(201).json({ success: true });
    } catch (err) {
      console.error("Add gallery image error:", err);
      res.status(500).json({ message: "Failed to add gallery image" });
    }
  });
  // DELETE GALLERY IMAGE
  app.delete("/api/venue-images/:id", requirePermission("business:delete"), async (req, res) => {
    try {
      await storage.deleteVenueImage(Number(req.params.id));
      res.status(204).end();
    } catch (err) {
      console.error("Delete image error:", err);
      res.status(500).json({ message: "Failed to delete image" });
    }
  });

  // ================= PAYMENTS ===========================

  app.get("/api/clients/:clientId/payments", async (req, res) => {
    const clientId = Number(req.params.clientId);
    const result = await storage.getPayments(clientId);
    res.json(result);
  });

  app.post("/api/clients/:clientId/payments", requirePermission("financial:write"), async (req, res) => {
    try {
      const clientId = Number(req.params.clientId);
      const payment = await storage.createPayment({ ...req.body, clientId });
      res.status(201).json(payment);
    } catch (err) {
      console.error("Create payment error:", err);
      res.status(500).json({ message: "Failed to create payment" });
    }
  });

  app.delete("/api/payments/:id", requirePermission("financial:write"), async (req, res) => {
    await storage.deletePayment(Number(req.params.id));
    res.status(204).end();
  });

  // ================= VENDOR PAYMENTS ====================

  app.get("/api/clients/:clientId/vendor-payments", async (req, res) => {
    const clientId = Number(req.params.clientId);
    const result = await storage.getVendorPayments(clientId);
    res.json(result);
  });

  app.post("/api/clients/:clientId/vendor-payments", requirePermission("financial:write"), async (req, res) => {
    try {
      const clientId = Number(req.params.clientId);
      const payment = await storage.createVendorPayment({ ...req.body, clientId });
      res.status(201).json(payment);
    } catch (err) {
      console.error("Create vendor payment error:", err);
      res.status(500).json({ message: "Failed to create vendor payment" });
    }
  });

  app.patch("/api/vendor-payments/:id", requirePermission("financial:write"), async (req, res) => {
    try {
      const id = Number(req.params.id);
      const updated = await storage.updateVendorPayment(id, req.body);
      res.json(updated);
    } catch (err) {
      console.error("Update vendor payment error:", err);
      res.status(500).json({ message: "Failed to update vendor payment" });
    }
  });

  app.delete("/api/vendor-payments/:id", requirePermission("financial:write"), async (req, res) => {
    await storage.deleteVendorPayment(Number(req.params.id));
    res.status(204).end();
  });

  // ================= BOOKING OPTIONS ====================

  app.post(api.bookingOptions.create.path, requirePermission("business:write"), async (req, res) => {
    try {
      const venueId = Number(req.params.venueId);

      const input = api.bookingOptions.create.input.parse({
        ...req.body,
        venueId,
        price: String(req.body.price),
      });

      const option = await storage.createBookingOption(input);

      res.status(201).json(option);
    } catch (err) {
      if (err instanceof z.ZodError) {
        return res.status(400).json({ message: err.errors[0].message });
      }

      console.error("Create booking option error:", err);
      res.status(500).json({ message: "Failed to create booking option" });
    }
  });

  app.delete(api.bookingOptions.delete.path, requirePermission("business:delete"), async (req, res) => {
    await storage.deleteBookingOption(Number(req.params.id));
    res.status(204).end();
  });

  // ====================== CLIENTS ========================

  app.get(api.clients.list.path, async (_req, res) => {
    const clients = await storage.getClients();
    res.json(clients);
  });

  app.post(api.clients.create.path, requirePermission("business:write"), async (req, res) => {
    try {
      const body = {
        ...req.body,
        // ✅ Convert string to real Date before Zod validation
        eventDate: new Date(req.body.eventDate),
      };

      const input = api.clients.create.input.parse(body);

      const client = await storage.createClient(input);
      res.status(201).json(client);
    } catch (err) {
      if (err instanceof z.ZodError) {
        return res.status(400).json({ message: err.errors[0].message });
      }
      console.error("Create client error:", err);
      res.status(500).json({ message: "Failed to create client" });
    }
  });

  app.get(api.clients.get.path, async (req, res) => {
    const client = await storage.getClient(Number(req.params.id));
    if (!client) return res.status(404).json({ message: "Client not found" });
    res.json(client);
  });

  app.patch(api.clients.update.path, requirePermission("business:write"), async (req, res) => {
    try {
      const body: any = { ...req.body };

      if (body.eventDate) {
        body.eventDate = new Date(body.eventDate);
      }

      const input = api.clients.update.input.parse(body);

      const client = await storage.updateClient(Number(req.params.id), input);
      res.json(client);
    } catch (err) {
      if (err instanceof z.ZodError) {
        return res.status(400).json({ message: err.errors[0].message });
      }
      res.status(500).json({ message: "Failed to update client" });
    }
  });

  app.post(api.clients.confirmBudget.path, requirePermission("financial:write"), async (req, res) => {
    try {
      const input = api.clients.confirmBudget.input.parse(req.body);
      const client = await storage.confirmBudget(Number(req.params.id), input);
      if (!client) return res.status(404).json({ message: "Client not found" });
      res.json(client);
    } catch (err) {
      if (err instanceof z.ZodError) {
        return res.status(400).json({ message: err.errors[0].message });
      }
      console.error("Confirm budget error:", err);
      res.status(500).json({ message: "Failed to confirm budget" });
    }
  });

  app.delete(api.clients.delete.path, requirePermission("business:delete"), async (req, res) => {
    await storage.deleteClient(Number(req.params.id));
    res.status(204).end();
  });

  // ================= PLANNED SERVICES ====================

  // CREATE PLANNED SERVICE
  app.post(api.plannedServices.create.path, requirePermission("business:write"), async (req, res) => {
    try {
      const clientId = Number(req.params.clientId);

      if (isNaN(clientId)) {
        return res.status(400).json({
          message: "Invalid clientId in route params",
        });
      }

      const bodyWithClient = {
        ...req.body,
        clientId,
      };

      const input = api.plannedServices.create.input.parse(bodyWithClient);

      const service = await storage.createPlannedService({
        ...input,
        clientId,
      });

      // ── Automation: AI checklist ────────────────────────────────────────────
      // Vendor payments are created client-side (in ServiceForm) to ensure
      // immediate cache invalidation and UI update.
      const automations: Promise<void>[] = [];

      // Generate AI checklist tasks for this service
      automations.push(
        runAI({
          feature: "service_checklist",
          prompt: `Generate a task checklist for a ${service.serviceName} service`,
        })
          .then(async (aiResult) => {
            const taskTitles: string[] = aiResult?.tasks || [];
            for (const title of taskTitles) {
              await storage.createTask({
                clientId,
                serviceId: service.id,
                title,
                status: "Pending",
                aiGenerated: true,
              });
            }
          })
          .catch((e) => console.error("[AI checklist] Failed:", e))
      );

      await Promise.allSettled(automations);
      // ──────────────────────────────────────────────────────────────────────

      res.status(201).json(service);
    } catch (err) {
      if (err instanceof z.ZodError) {
        return res.status(400).json({ message: err.errors[0].message });
      }

      console.error("Create service error:", err);

      res.status(500).json({
        message:
          err instanceof Error ? err.message : "Failed to create service",
      });
    }
  });

  // UPDATE PLANNED SERVICE
  app.patch("/api/services/:id", requirePermission("business:write"), async (req, res) => {
    try {
      const id = Number(req.params.id);
      const updates = req.body;
      if (updates.cost !== undefined) updates.cost = String(updates.cost);
      if (updates.vendorCost !== undefined) updates.vendorCost = String(updates.vendorCost);
      if (updates.clientPrice !== undefined) updates.clientPrice = String(updates.clientPrice);
      const service = await storage.updatePlannedService(id, updates);
      res.json(service);
    } catch (err) {
      console.error("Update service error:", err);
      res.status(500).json({ message: "Failed to update service" });
    }
  });

  // DELETE PLANNED SERVICE (both paths for compatibility)
  app.delete("/api/services/:id", requirePermission("business:delete"), async (req, res) => {
    try {
      const serviceId = Number(req.params.id);
      if (isNaN(serviceId)) return res.status(400).json({ message: "Invalid service id" });
      await storage.deletePlannedService(serviceId);
      res.status(204).end();
    } catch (err) {
      console.error("Delete planned service error:", err);
      res.status(500).json({ message: "Failed to delete service" });
    }
  });

  app.delete("/api/planned-services/:id", requirePermission("business:delete"), async (req, res) => {
    try {
      const serviceId = Number(req.params.id);
      if (isNaN(serviceId)) return res.status(400).json({ message: "Invalid service id" });
      await storage.deletePlannedService(serviceId);
      res.status(204).end();
    } catch (err) {
      console.error("Delete planned service error:", err);
      res.status(500).json({ message: "Failed to delete service" });
    }
  });

  // ===================== EXPENSES ========================

  app.get(api.expenses.list.path, async (req, res) => {
    const clientId = Number(req.params.clientId);

    if (isNaN(clientId)) {
      return res.status(400).json({
        message: "Invalid clientId in route params",
      });
    }

    const expenses = await storage.getExpenses(clientId);
    return res.json(expenses);
  });

  app.post(api.expenses.create.path, requirePermission("financial:write"), async (req, res) => {
    try {
      const clientId = Number(req.params.clientId);

      if (isNaN(clientId)) {
        return res.status(400).json({
          message: "Invalid clientId in route params",
        });
      }

      const parsed = api.expenses.create.input.parse(req.body);

      const expense = await storage.createExpense({
        ...parsed,
        clientId,
      });

      return res.status(201).json(expense);
    } catch (err) {
      console.error("Create expense error:", err);

      if (err instanceof z.ZodError) {
        return res.status(400).json({ message: err.errors[0].message });
      }

      return res.status(500).json({
        message:
          err instanceof Error ? err.message : "Failed to create expense",
      });
    }
  });

  app.patch(api.expenses.update.path, requirePermission("financial:write"), async (req, res) => {
    try {
      const input = api.expenses.update.input.parse(req.body);
      const expense = await storage.updateExpense(Number(req.params.id), input);
      return res.json(expense);
    } catch (err) {
      if (err instanceof z.ZodError) {
        return res.status(400).json({ message: err.errors[0].message });
      }

      return res.status(500).json({
        message: "Failed to update expense",
      });
    }
  });

  app.delete(api.expenses.delete.path, requirePermission("financial:write"), async (req, res) => {
    await storage.deleteExpense(Number(req.params.id));
    return res.status(204).end();
  });

  // ====================== TASKS ==========================

  app.get("/api/clients/:clientId/tasks", async (req, res) => {
    const clientId = Number(req.params.clientId);
    const list = await storage.getTasks(clientId);
    res.json(list);
  });

  app.post("/api/clients/:clientId/tasks", requirePermission("business:write"), async (req, res) => {
    try {
      const clientId = Number(req.params.clientId);
      const task = await storage.createTask({ ...req.body, clientId });
      res.status(201).json(task);
    } catch (err) {
      console.error("Create task error:", err);
      res.status(500).json({ message: "Failed to create task" });
    }
  });

  app.patch("/api/tasks/:id", requirePermission("business:write"), async (req, res) => {
    try {
      const task = await storage.updateTask(Number(req.params.id), req.body);
      res.json(task);
    } catch (err) {
      res.status(500).json({ message: "Failed to update task" });
    }
  });

  app.delete("/api/tasks/:id", requirePermission("business:delete"), async (req, res) => {
    await storage.deleteTask(Number(req.params.id));
    res.status(204).end();
  });

  // ================= CLOUDINARY UPLOAD ==================

  app.post("/api/upload", requirePermission("business:write"), upload.single("image"), async (req, res) => {
    if (!cloudinaryConfigured) {
      return res.status(503).json({ message: "Image upload is not configured. Please set Cloudinary environment variables." });
    }
    try {
      if (!req.file) {
        return res.status(400).json({ message: "No image provided" });
      }

      const base64Image = `data:${req.file.mimetype};base64,${req.file.buffer.toString("base64")}`;

      const uploaded = await cloudinary.uploader.upload(base64Image, {
        folder: "eventelite",
      });

      res.json({ url: uploaded.secure_url });
    } catch (error: any) {
      console.error("Cloudinary upload error:", error);
      res.status(500).json({
        message: "Upload failed",
        cloudinaryError: error?.message || error,
      });
    }
  });

  // ================= QUOTATIONS ===================

  app.get("/api/quotations", async (_req, res) => {
    const all = await storage.getQuotations();
    res.json(all);
  });

  app.get("/api/quotations/:id", async (req, res) => {
    const q = await storage.getQuotation(Number(req.params.id));
    if (!q) return res.status(404).json({ message: "Quotation not found" });
    res.json(q);
  });

  app.post("/api/quotations", requirePermission("financial:write"), async (req, res) => {
    try {
      const { items = [], ...quotationData } = req.body;
      const q = await storage.createQuotation(quotationData, items);
      res.status(201).json(q);
    } catch (err: any) {
      res.status(500).json({ message: err?.message || "Failed to create quotation" });
    }
  });

  app.patch("/api/quotations/:id", requirePermission("financial:write"), async (req, res) => {
    try {
      const updated = await storage.updateQuotation(Number(req.params.id), req.body);
      res.json(updated);
    } catch (err: any) {
      res.status(500).json({ message: err?.message || "Failed to update quotation" });
    }
  });

  app.delete("/api/quotations/:id", requirePermission("business:delete"), async (req, res) => {
    await storage.deleteQuotation(Number(req.params.id));
    res.status(204).end();
  });

  // ====================== EVENTS ==========================

  app.get("/api/events", async (_req, res) => {
    const all = await storage.getEvents();
    res.json(all);
  });

  app.get("/api/events/:id", async (req, res) => {
    const event = await storage.getEvent(Number(req.params.id));
    if (!event) return res.status(404).json({ message: "Event not found" });
    res.json(event);
  });

  app.get("/api/clients/:clientId/events", async (req, res) => {
    const clientId = Number(req.params.clientId);
    const all = await storage.getEventsByClient(clientId);
    res.json(all);
  });

  app.post("/api/events", requirePermission("business:write"), async (req, res) => {
    try {
      const clientId = Number(req.body.clientId);
      if (!Number.isInteger(clientId) || !(await storage.getClient(clientId))) {
        return res.status(400).json({ message: "A valid client is required for every event" });
      }
      const body = { ...req.body, clientId, eventDate: new Date(req.body.eventDate) };
      const event = await storage.createEvent(body);
      res.status(201).json(event);
    } catch (err: any) {
      console.error("Create event error:", err);
      res.status(500).json({ message: err?.message || "Failed to create event" });
    }
  });

  app.patch("/api/events/:id", requirePermission("business:write"), async (req, res) => {
    try {
      const body = { ...req.body };
      if (body.clientId !== undefined) {
        const clientId = Number(body.clientId);
        if (!Number.isInteger(clientId) || !(await storage.getClient(clientId))) {
          return res.status(400).json({ message: "A valid client is required for every event" });
        }
        body.clientId = clientId;
      }
      if (body.eventDate) body.eventDate = new Date(body.eventDate);
      const updated = await storage.updateEvent(Number(req.params.id), body);
      if (!updated) return res.status(404).json({ message: "Event not found" });
      res.json(updated);
    } catch (err: any) {
      res.status(500).json({ message: err?.message || "Failed to update event" });
    }
  });

  app.delete("/api/events/:id", requirePermission("business:delete"), async (req, res) => {
    await storage.deleteEvent(Number(req.params.id));
    res.status(204).end();
  });

  // ====================== INVOICES ==========================

  app.get("/api/invoices", async (_req, res) => {
    const all = await storage.getInvoices();
    res.json(all);
  });

  app.get("/api/invoices/:id", async (req, res) => {
    const invoice = await storage.getInvoice(Number(req.params.id));
    if (!invoice) return res.status(404).json({ message: "Invoice not found" });
    res.json(invoice);
  });

  app.get("/api/clients/:clientId/invoices", async (req, res) => {
    const clientId = Number(req.params.clientId);
    const all = await storage.getInvoicesByClient(clientId);
    res.json(all);
  });

  app.post("/api/invoices", requirePermission("financial:write"), async (req, res) => {
    try {
      const invoice = await storage.createInvoice(req.body);
      res.status(201).json(invoice);
    } catch (err: any) {
      console.error("Create invoice error:", err);
      res.status(500).json({ message: err?.message || "Failed to create invoice" });
    }
  });

  app.patch("/api/invoices/:id", requirePermission("financial:write"), async (req, res) => {
    try {
      const updated = await storage.updateInvoice(Number(req.params.id), req.body);
      res.json(updated);
    } catch (err: any) {
      res.status(500).json({ message: err?.message || "Failed to update invoice" });
    }
  });

  app.delete("/api/invoices/:id", requirePermission("business:delete"), async (req, res) => {
    await storage.deleteInvoice(Number(req.params.id));
    res.status(204).end();
  });

  // ================== CLIENT PORTAL (public) ====================

  app.get("/api/portal/invoice/:id", async (req, res) => {
    try {
      const invoice = await storage.getInvoice(Number(req.params.id));
      if (!invoice) return res.status(404).json({ message: "Invoice not found" });
      const client = await storage.getClient(invoice.clientId);
      const quotation = invoice.quotationId ? await storage.getQuotation(invoice.quotationId) : null;
      res.json({ invoice, client, quotation });
    } catch (err) {
      res.status(500).json({ message: "Failed to load portal data" });
    }
  });

  // ========================= AI ==============================

  app.get("/api/ai/status", (_req, res) => {
    const hasOpenAI = !!(
      process.env.AI_INTEGRATIONS_OPENAI_API_KEY ||
      process.env.OPENAI_API_KEY
    );
    res.json({
      engine: hasOpenAI ? "openai" : "built-in",
      model: hasOpenAI ? "GPT-4o" : "EventElite Built-in AI",
      available: true,
      features: ["event_planner", "quote_generator", "vendor_recommendation", "budget_planner", "profit_optimizer", "assistant"],
    });
  });

  app.post("/api/ai", requireAuth, async (req, res) => {
    try {
      const { feature, prompt, context } = req.body;
      if (!feature || !prompt) {
        return res.status(400).json({ message: "feature and prompt are required" });
      }
      const result = await runAI({ feature, prompt, context });
      res.json(result);
    } catch (err: any) {
      console.error("AI error:", err);
      res.status(500).json({ message: err?.message || "AI request failed" });
    }
  });

  // =================== FIREBASE AUTH ========================
  // Verifies a Firebase ID token (from Google or Phone OTP) and
  // creates/finds the corresponding user, then opens an Express session.

  app.post("/api/auth/firebase", async (req, res, next) => {
    try {
      const { verifyFirebaseToken } = await import("./firebase");
      const { idToken, fullName: providedName, email: providedEmail } = z.object({
        idToken:       z.string().min(1),
        fullName:      z.string().optional(),
        email:         z.string().email().optional(),
      }).parse(req.body);

      const decoded = await verifyFirebaseToken(idToken);
      if (!decoded) {
        return res.status(401).json({ message: "Invalid or expired Firebase token" });
      }

      const uid        = decoded.uid;
      const tokenEmail = decoded.email || null;
      const tokenName  = decoded.name  || null;
      const tokenPhone = decoded.phone_number || null;
      const tokenPhoto = decoded.picture || null;

      // Phone-only users may not have an email in the token yet.
      // The client must supply one in that case.
      const email = tokenEmail || providedEmail;
      if (!email) {
        // Return a signal so the frontend shows a "complete profile" step
        return res.status(202).json({ status: "profile_required", uid, phone: tokenPhone });
      }

      const fullName = tokenName || providedName || email.split("@")[0];

      const emailVerified = decoded.email_verified === true;

      const user = await storage.findOrCreateFirebaseUser({
        firebaseUid: uid,
        email,
        fullName,
        avatarUrl: tokenPhoto || undefined,
        phone: tokenPhone || undefined,
        emailVerified,
      });

      req.login(user, (err) => {
        if (err) return next(err);
        const { passwordHash: _ph, ...safeUser } = user;
        res.json(safeUser);
      });
    } catch (err) {
      if (err instanceof z.ZodError) {
        return res.status(400).json({ message: err.errors[0].message });
      }
      console.error("Firebase auth error:", err);
      res.status(500).json({ message: "Firebase authentication failed" });
    }
  });

  // ===================== USER PROFILE ========================

  app.get("/api/user/profile", (req, res) => {
    if (!req.isAuthenticated() || !req.user) {
      return res.status(401).json({ message: "Not authenticated" });
    }
    const u = req.user as any;
    res.json({
      id:        u.id,
      fullName:  u.fullName,
      email:     u.email,
      role:      u.role,
      phone:     u.phone     ?? "",
      bio:       u.bio       ?? "",
      avatarUrl: u.avatarUrl ?? "",
    });
  });

  app.patch("/api/user/profile", requireAuth, async (req, res) => {
    try {
      const userId = (req.user as any).id as number;
      const schema = z.object({
        fullName:  z.string().min(2).optional(),
        email:     z.string().email().optional(),
        phone:     z.string().nullable().optional(),
        bio:       z.string().nullable().optional(),
        avatarUrl: z.string().nullable().optional(),
      });
      const data = schema.parse(req.body);

      // If email is changing, check it's not already taken
      if (data.email) {
        const existing = await storage.getUserByEmail(data.email);
        if (existing && existing.id !== userId) {
          return res.status(409).json({ message: "Email already in use by another account" });
        }
      }

       const updated = await storage.updateUserProfile(userId, data);
      // Refresh passport session so req.user reflects new data
      req.login(updated, (err) => {
        if (err) return res.status(500).json({ message: "Profile update failed" });
        const { passwordHash: _ph, ...safe } = updated;
        res.json({
          ...safe,
          phone:     safe.phone     ?? "",
          bio:       safe.bio       ?? "",
          avatarUrl: safe.avatarUrl ?? "",
        });
      });
    } catch (err) {
      if (err instanceof z.ZodError) {
        return res.status(400).json({ message: err.errors[0].message });
      }
      console.error("Profile update error:", err);
      res.status(500).json({ message: "Failed to update profile" });
    }
  });

  app.patch("/api/admin/users/:id/role", requirePermission("users:manage"), async (req, res) => {
    try {
      const role = z.enum(["owner", "admin", "manager", "staff", "user"]).parse(req.body?.role);
      const targetUserId = Number(req.params.id);
      if (!Number.isInteger(targetUserId)) {
        return res.status(400).json({ message: "Invalid user id" });
      }
      const actorUserId = Number((req.user as any).id);
      if (targetUserId === actorUserId) {
        return res.status(403).json({ message: "You cannot change your own role" });
      }
      const target = await storage.getUserById(targetUserId);
      if (!target) return res.status(404).json({ message: "User not found" });
      const updated = await storage.updateUserRole(targetUserId, role);
      res.json(safeUser(updated));
    } catch (err) {
      if (err instanceof z.ZodError) {
        return res.status(400).json({ message: "A valid role is required" });
      }
      res.status(500).json({ message: "Failed to update user role" });
    }
  });

  // ===================== APP SETTINGS ========================

  // Non-profile sections defaults (appearance, notifications, etc.)
  const DEFAULT_SETTINGS: Record<string, any> = {
    business: {
      companyName: "",
      email: "",
      phone: "",
      website: "",
      address: "",
      city: "",
      state: "",
      country: "",
      timezone: "America/New_York",
      currency: "USD",
      taxId: "",
      logoUrl: "",
    },
    notifications: {
      emailReminders: true,
      upcomingEvents: true,
      newClientAlert: true,
      quoteAccepted: true,
      quotePending: false,
      paymentReceived: true,
      vendorUpdates: false,
      weeklyReport: true,
      marketingTips: false,
    },
    appearance: {
      theme: "dark",
      density: "comfortable",
      accentColor: "indigo",
      sidebarCollapsed: false,
      animationsEnabled: true,
    },
    security: {
      twofa: false,
      sessionAlerts: true,
    },
  };

  app.get("/api/settings", requireAuth, async (req, res) => {
    try {
      const stored = await storage.getAllSettings();
      const merged: Record<string, any> = {};
      for (const key of Object.keys(DEFAULT_SETTINGS)) {
        merged[key] = stored[key] ?? DEFAULT_SETTINGS[key];
      }

      // Profile always comes from the authenticated user, not from appSettings
       const u = req.user as any;
      merged.profile = {
        name:      u?.fullName  ?? "",
        email:     u?.email     ?? "",
        phone:     u?.phone     ?? "",
        role:      u?.role      ?? "owner",
        avatarUrl: u?.avatarUrl ?? "",
        bio:       u?.bio       ?? "",
      };

      res.json(merged);
    } catch (err) {
      res.status(500).json({ message: "Failed to load settings" });
    }
  });

  app.put("/api/settings/:section", requireAuth, async (req, res) => {
    try {
      const { section } = req.params;

      // Profile changes are saved to the users table, not appSettings
      if (section === "profile") {
        const userId = (req.user as any).id as number;
        const { name, email, phone, avatarUrl, bio } = req.body;
        const updated = await storage.updateUserProfile(userId, {
          fullName:  name,
          email:     email,
          phone:     phone     ?? null,
          bio:       bio       ?? null,
          avatarUrl: avatarUrl ?? null,
        });
        // Refresh session
        req.login(updated, (err) => {
          if (err) return res.status(500).json({ message: "Session refresh failed" });
          res.json({
            name:      updated.fullName,
            email:     updated.email,
            phone:     updated.phone     ?? "",
            role:      updated.role,
            avatarUrl: updated.avatarUrl ?? "",
            bio:       updated.bio       ?? "",
          });
        });
        return;
      }

      const allowed = Object.keys(DEFAULT_SETTINGS);
      if (!allowed.includes(section)) {
        return res.status(400).json({ message: "Unknown settings section" });
      }
      const canManageSettings =
        (req.user as any).role === "owner" || (req.user as any).role === "admin";
      if (!canManageSettings) {
        return res.status(403).json({ message: "You do not have permission to perform this action" });
      }
      await storage.setSetting(section, req.body);
      const value = await storage.getSetting(section);
      res.json(value);
    } catch (err) {
      res.status(500).json({ message: "Failed to save settings" });
    }
  });

  return httpServer;
}
