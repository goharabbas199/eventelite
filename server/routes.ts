import type { Express } from "express";
import type { Server } from "http";
import { storage } from "./storage";
import { api } from "@shared/routes";
import { z } from "zod";
import cloudinary from "./cloudinary";
import multer from "multer";

const upload = multer({ storage: multer.memoryStorage() });

export async function registerRoutes(
  httpServer: Server,
  app: Express,
): Promise<Server> {
  // ===================== VENDORS ========================

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

  // ====================== VENUES ========================

  app.get(api.venues.list.path, async (_req, res) => {
    const venues = await storage.getVenues();
    res.json(venues);
  });

  app.post(api.venues.create.path, async (req, res) => {
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

  // ✅ NEW: UPDATE MAIN IMAGE
  app.patch("/api/venues/:id/main-image", async (req, res) => {
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

  app.delete(api.venues.delete.path, async (req, res) => {
    await storage.deleteVenue(Number(req.params.id));
    res.status(204).end();
  });
  // ✅ ADD GALLERY IMAGE
  app.post("/api/venues/:id/images", async (req, res) => {
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
  app.delete("/api/venue-images/:id", async (req, res) => {
    try {
      await storage.deleteVenueImage(Number(req.params.id));
      res.status(204).end();
    } catch (err) {
      console.error("Delete image error:", err);
      res.status(500).json({ message: "Failed to delete image" });
    }
  });

  // ================= BOOKING OPTIONS ====================

  app.post(api.bookingOptions.create.path, async (req, res) => {
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

  app.delete(api.bookingOptions.delete.path, async (req, res) => {
    await storage.deleteBookingOption(Number(req.params.id));
    res.status(204).end();
  });

  // ================= CLOUDINARY UPLOAD ==================

  app.post("/api/upload", upload.single("image"), async (req, res) => {
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

  return httpServer;
}
