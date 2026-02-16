import { storage } from "./storage";

export async function seedDatabase() {
  const existingVendors = await storage.getVendors();
  if (existingVendors.length === 0) {
    // Vendors
    const v1 = await storage.createVendor({
      name: "Gourmet Catering Co.",
      category: "Catering",
      contact: "chef@gourmet.com",
      notes: "High-end catering, specializes in French cuisine.",
    });
    await storage.createVendorProduct({
      vendorId: v1.id,
      name: "Gold Wedding Package",
      price: "150.00", // Per person
      description: "3-course meal with wine pairing",
    });
    await storage.createVendorProduct({
      vendorId: v1.id,
      name: "Silver Buffet",
      price: "80.00",
      description: "Buffet style dinner",
    });

    const v2 = await storage.createVendor({
      name: "Sound & Vision",
      category: "AV/Tech",
      contact: "tech@soundvision.com",
      notes: "Reliable AV setup for corporate events.",
    });
    await storage.createVendorProduct({
      vendorId: v2.id,
      name: "Full Concert Setup",
      price: "5000.00",
      description: "Stage, lights, and sound system",
    });

    // Venues
    const venue1 = await storage.createVenue({
      name: "The Grand Ballroom",
      location: "Downtown Hotel",
      capacity: 500,
      basePrice: "2000.00",
      extraCharges: "Cleaning fee: $200",
      notes: "Beautiful chandelier, large dance floor.",
    });
    await storage.createBookingOption({
      venueId: venue1.id,
      name: "Whole Day Rental",
      price: "2500.00",
      description: "8am - 12am access",
    });
    
    const venue2 = await storage.createVenue({
      name: "Sunset Garden",
      location: "City Park",
      capacity: 150,
      basePrice: "1000.00",
      extraCharges: "Security deposit: $500",
      notes: "Outdoor venue, weather dependent.",
    });

    // Clients
    const c1 = await storage.createClient({
      name: "Acme Corp",
      email: "events@acme.com",
      phone: "555-0123",
      eventDate: new Date("2024-12-15"),
      eventType: "Corporate Holiday Party",
      budget: "20000.00",
      status: "Confirmed",
      notes: "Annual holiday party for 200 employees.",
    });
    await storage.createPlannedService({
      clientId: c1.id,
      serviceName: "Catering - Gold Package",
      cost: "15000.00",
      notes: "For 100 people"
    });
    await storage.createExpense({
      clientId: c1.id,
      category: "Venue",
      item: "Ballroom Deposit",
      cost: "1000.00",
      isPaid: true
    });

    const c2 = await storage.createClient({
      name: "John & Jane Doe",
      email: "john@example.com",
      phone: "555-9876",
      eventDate: new Date("2025-06-20"),
      eventType: "Wedding",
      budget: "35000.00",
      status: "Lead",
      notes: "Looking for a summer wedding venue.",
    });
  }
}
