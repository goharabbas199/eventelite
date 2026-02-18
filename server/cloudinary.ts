import { v2 as cloudinary } from "cloudinary";

/* =====================================================
   STRICT ENV VALIDATION
===================================================== */

const cloudName = process.env.CLOUDINARY_CLOUD_NAME;
const apiKey = process.env.CLOUDINARY_API_KEY;
const apiSecret = process.env.CLOUDINARY_API_SECRET;

if (!cloudName || !apiKey || !apiSecret) {
   console.error("❌ Cloudinary environment variables missing!");
   console.error("CLOUDINARY_CLOUD_NAME:", cloudName);
   console.error("CLOUDINARY_API_KEY exists:", !!apiKey);
   console.error("CLOUDINARY_API_SECRET exists:", !!apiSecret);

   throw new Error("Cloudinary configuration incomplete.");
}

/* =====================================================
   CLOUDINARY CONFIG
===================================================== */

cloudinary.config({
   cloud_name: cloudName,
   api_key: apiKey,
   api_secret: apiSecret,
});

/* =====================================================
   DEBUG LOG
===================================================== */

console.log("✅ Cloudinary configured successfully");
console.log("Cloud name:", cloudName);

export default cloudinary;
