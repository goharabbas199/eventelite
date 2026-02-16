import type { Express } from "express";
import type { Server } from "http";
import { storage } from "./storage";
import { api } from "@shared/routes";
import { z } from "zod";

export async function registerRoutes(
  httpServer: Server,
  app: Express
): Promise<Server> {
  
  // === Vendors ===
  app.get(api.vendors.list.path, async (req, res) => {
    const vendors = await storage.getVendors();
    res.json(vendors);
  });

  app.post(api.vendors.create.path, async (req, res) => {
    try {
      const input = api.vendors.create.input.parse(req.body);
      const vendor = await storage.createVendor(input);
      res.status(201).json(vendor);
    } catch (err) {
      if (err instanceof z.ZodError) {
        return res.status(400).json({ message: err.errors[0].message });
      }
      throw err;
    }
  });

  app.get(api.vendors.get.path, async (req, res) => {
    const vendor = await storage.getVendor(Number(req.params.id));
    if (!vendor) return res.status(404).json({ message: "Vendor not found" });
    res.json(vendor);
  });

  app.delete(api.vendors.delete.path, async (req, res) => {
    await storage.deleteVendor(Number(req.params.id));
    res.status(204).end();
  });

  // Vendor Products
  app.post(api.vendorProducts.create.path, async (req, res) => {
    try {
      const input = api.vendorProducts.create.input.parse(req.body);
      const product = await storage.createVendorProduct({
        ...input,
        vendorId: Number(req.params.vendorId)
      });
      res.status(201).json(product);
    } catch (err) {
      if (err instanceof z.ZodError) {
        return res.status(400).json({ message: err.errors[0].message });
      }
      throw err;
    }
  });

  app.delete(api.vendorProducts.delete.path, async (req, res) => {
    await storage.deleteVendorProduct(Number(req.params.id));
    res.status(204).end();
  });


  // === Venues ===
  app.get(api.venues.list.path, async (req, res) => {
    const venues = await storage.getVenues();
    res.json(venues);
  });

  app.post(api.venues.create.path, async (req, res) => {
    try {
      const input = api.venues.create.input.parse(req.body);
      const venue = await storage.createVenue(input);
      res.status(201).json(venue);
    } catch (err) {
      if (err instanceof z.ZodError) {
        return res.status(400).json({ message: err.errors[0].message });
      }
      throw err;
    }
  });

  app.get(api.venues.get.path, async (req, res) => {
    const venue = await storage.getVenue(Number(req.params.id));
    if (!venue) return res.status(404).json({ message: "Venue not found" });
    res.json(venue);
  });
  
  app.delete(api.venues.delete.path, async (req, res) => {
    await storage.deleteVenue(Number(req.params.id));
    res.status(204).end();
  });

  // Venue Options
  app.post(api.bookingOptions.create.path, async (req, res) => {
    try {
      const input = api.bookingOptions.create.input.parse(req.body);
      const option = await storage.createBookingOption({
        ...input,
        venueId: Number(req.params.venueId)
      });
      res.status(201).json(option);
    } catch (err) {
      if (err instanceof z.ZodError) {
        return res.status(400).json({ message: err.errors[0].message });
      }
      throw err;
    }
  });

  app.delete(api.bookingOptions.delete.path, async (req, res) => {
    await storage.deleteBookingOption(Number(req.params.id));
    res.status(204).end();
  });


  // === Clients ===
  app.get(api.clients.list.path, async (req, res) => {
    const clients = await storage.getClients();
    res.json(clients);
  });

  app.post(api.clients.create.path, async (req, res) => {
    try {
      const input = api.clients.create.input.parse(req.body);
      const client = await storage.createClient(input);
      res.status(201).json(client);
    } catch (err) {
      if (err instanceof z.ZodError) {
        return res.status(400).json({ message: err.errors[0].message });
      }
      throw err;
    }
  });

  app.get(api.clients.get.path, async (req, res) => {
    const client = await storage.getClient(Number(req.params.id));
    if (!client) return res.status(404).json({ message: "Client not found" });
    res.json(client);
  });

  app.patch(api.clients.update.path, async (req, res) => {
    try {
      const input = api.clients.update.input.parse(req.body);
      const client = await storage.updateClient(Number(req.params.id), input);
      res.json(client);
    } catch (err) {
      if (err instanceof z.ZodError) {
        return res.status(400).json({ message: err.errors[0].message });
      }
      throw err;
    }
  });

  app.delete(api.clients.delete.path, async (req, res) => {
    await storage.deleteClient(Number(req.params.id));
    res.status(204).end();
  });

  // Planned Services
  app.post(api.plannedServices.create.path, async (req, res) => {
    try {
      const input = api.plannedServices.create.input.parse(req.body);
      const service = await storage.createPlannedService({
        ...input,
        clientId: Number(req.params.clientId)
      });
      res.status(201).json(service);
    } catch (err) {
      if (err instanceof z.ZodError) {
        return res.status(400).json({ message: err.errors[0].message });
      }
      throw err;
    }
  });

  app.delete(api.plannedServices.delete.path, async (req, res) => {
    await storage.deletePlannedService(Number(req.params.id));
    res.status(204).end();
  });
  
  // Expenses
  app.get(api.expenses.list.path, async (req, res) => {
    const expenses = await storage.getExpenses(Number(req.params.clientId));
    res.json(expenses);
  });
  
  app.post(api.expenses.create.path, async (req, res) => {
    try {
      const input = api.expenses.create.input.parse(req.body);
      const expense = await storage.createExpense({
        ...input,
        clientId: Number(req.params.clientId)
      });
      res.status(201).json(expense);
    } catch (err) {
      if (err instanceof z.ZodError) {
        return res.status(400).json({ message: err.errors[0].message });
      }
      throw err;
    }
  });
  
  app.patch(api.expenses.update.path, async (req, res) => {
     try {
      const input = api.expenses.update.input.parse(req.body);
      const expense = await storage.updateExpense(Number(req.params.id), input);
      res.json(expense);
    } catch (err) {
      if (err instanceof z.ZodError) {
        return res.status(400).json({ message: err.errors[0].message });
      }
      throw err;
    }
  });
  
  app.delete(api.expenses.delete.path, async (req, res) => {
    await storage.deleteExpense(Number(req.params.id));
    res.status(204).end();
  });

  return httpServer;
}
