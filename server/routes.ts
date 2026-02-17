import type { Express } from "express";
import type { Server } from "http";
import { storage } from "./storage";
import { api } from "@shared/routes";
import { z } from "zod";
import cloudinary from "./cloudinary";

export async function registerRoutes(
  httpServer: Server,
  app: Express,
): Promise<Server> {
  // ======================================================
  // ===================== VENDORS ========================
  // ======================================================

  app.get(api.vendors.list.path, async (_req, res) => {
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
      console.error("Create vendor error:", err);
      res.status(500).json({ message: "Failed to create vendor" });
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

  // ======================================================
  // ====================== VENUES ========================
  // ======================================================

  app.get(api.venues.list.path, async (_req, res) => {
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
      console.error("Create venue error:", err);
      res.status(500).json({ message: "Failed to create venue" });
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

  // ======================================================
  // ============ BACKEND CLOUDINARY UPLOAD ==============
  // ======================================================

  app.post("/api/upload", async (req, res) => {
    try {
      const { image } = req.body;

      if (!image) {
        return res.status(400).json({ message: "No image provided" });
      }

      console.log("Uploading to Cloudinary...");
      console.log("Cloud name:", process.env.CLOUDINARY_CLOUD_NAME);
      console.log("API key exists:", !!process.env.CLOUDINARY_API_KEY);
      console.log("API secret exists:", !!process.env.CLOUDINARY_API_SECRET);

      const uploaded = await cloudinary.uploader.upload(image, {
        folder: "eventelite",
      });

      console.log("Upload success:", uploaded.secure_url);

      res.json({ url: uploaded.secure_url });
    } catch (error: any) {
      console.error("Cloudinary FULL error:");
      console.error(error);

      res.status(500).json({
        message: "Upload failed",
        cloudinaryError: error?.message || error,
      });
    }
  });

  // ======================================================
  // ============ VENUE IMAGE MANAGEMENT =================
  // ======================================================

  app.post("/api/venues/:venueId/images", async (req, res) => {
    try {
      const venueId = Number(req.params.venueId);
      const { imageUrl } = req.body;

      if (!imageUrl) {
        return res.status(400).json({ message: "Image URL is required" });
      }

      await storage.addVenueImages(venueId, [imageUrl]);

      res.status(201).json({ success: true });
    } catch (err) {
      console.error("Add venue image error:", err);
      res.status(500).json({ message: "Failed to add image" });
    }
  });

  return httpServer;
}
