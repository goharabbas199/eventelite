import { Layout } from "@/components/Layout";
import { useCreateVenue } from "@/hooks/use-venues";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { useLocation, Link } from "wouter";
import { ArrowLeft, Upload, X } from "lucide-react";
import { useState, useRef } from "react";

/* ===============================
   Validation Schema
================================ */

const venueFormSchema = z.object({
  name: z.string().min(1, "Venue name is required"),
  location: z.string().min(1, "Location is required"),
  capacity: z.number().min(1),
  basePrice: z.number().min(0),

  bookingPhone: z.string().optional(),
  bookingEmail: z.string().email("Invalid email").optional().or(z.literal("")),
  notes: z.string().optional(),
  extraCharges: z.string().optional(),
});

type VenueFormValues = z.infer<typeof venueFormSchema>;

export default function CreateVenue() {
  const createVenue = useCreateVenue();
  const [, navigate] = useLocation();
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const [imageUrls, setImageUrls] = useState<string[]>([]);
  const [uploading, setUploading] = useState(false);

  const form = useForm<VenueFormValues>({
    resolver: zodResolver(venueFormSchema),
    defaultValues: {
      name: "",
      location: "",
      capacity: 0,
      basePrice: 0,
      bookingPhone: "",
      bookingEmail: "",
      notes: "",
      extraCharges: "",
    },
  });

  /* ===============================
     IMAGE UPLOAD
  ================================= */

  const uploadToBackend = async (file: File) => {
    try {
      const formData = new FormData();
      formData.append("image", file);

      const response = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      });

      const data = await response.json();

      if (!response.ok) {
        alert("Upload failed");
        return null;
      }

      return data.url;
    } catch (error) {
      console.error("Upload error:", error);
      alert("Upload failed");
      return null;
    }
  };

  const handleImageChange = async (files: FileList | null) => {
    if (!files) return;

    setUploading(true);
    const uploadedUrls: string[] = [];

    for (let i = 0; i < files.length; i++) {
      const url = await uploadToBackend(files[i]);
      if (url) uploadedUrls.push(url);
    }

    setImageUrls((prev) => [...prev, ...uploadedUrls]);
    setUploading(false);
  };

  const removeImage = (index: number) => {
    setImageUrls((prev) => prev.filter((_, i) => i !== index));
  };

  const openFileDialog = () => {
    fileInputRef.current?.click();
  };

  async function onSubmit(data: VenueFormValues) {
    createVenue.mutate(
      {
        ...data,
        mainImage: imageUrls[0] || "",
        images: imageUrls,
      },
      {
        onSuccess: (venue) => {
          navigate(`/venues/${venue.id}`);
        },
      },
    );
  }

  return (
    <Layout title="Add Venue">
      <div className="max-w-4xl mx-auto">
        <Link
          href="/venues"
          className="text-sm text-slate-500 hover:text-blue-600 flex items-center mb-6"
        >
          <ArrowLeft className="w-4 h-4 mr-1" />
          Back to Venues
        </Link>

        <Card>
          <CardHeader>
            <CardTitle>Add New Venue</CardTitle>
          </CardHeader>

          <CardContent>
            <Form {...form}>
              <form
                onSubmit={form.handleSubmit(onSubmit)}
                className="space-y-6"
              >
                {/* BASIC INFO */}

                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Venue Name *</FormLabel>
                      <FormControl>
                        <Input {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="location"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Location *</FormLabel>
                      <FormControl>
                        <Input {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="grid grid-cols-2 gap-6">
                  <FormField
                    control={form.control}
                    name="capacity"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Capacity *</FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            value={field.value}
                            onChange={(e) =>
                              field.onChange(Number(e.target.value))
                            }
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="basePrice"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Base Price *</FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            step="0.01"
                            value={field.value}
                            onChange={(e) =>
                              field.onChange(Number(e.target.value))
                            }
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                {/* BOOKING CONTACT INFO */}

                <div className="grid grid-cols-2 gap-6">
                  <FormField
                    control={form.control}
                    name="bookingPhone"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Booking Phone</FormLabel>
                        <FormControl>
                          <Input placeholder="+971..." {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="bookingEmail"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Booking Email</FormLabel>
                        <FormControl>
                          <Input
                            type="email"
                            placeholder="booking@email.com"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                {/* GENERAL NOTES */}

                <FormField
                  control={form.control}
                  name="notes"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>General Notes</FormLabel>
                      <FormControl>
                        <Textarea rows={4} {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* IMAGE UPLOAD */}

                <div>
                  <FormLabel>Upload Venue Images</FormLabel>

                  <div
                    onClick={openFileDialog}
                    className="border-2 border-dashed rounded-xl p-8 text-center bg-slate-50 hover:bg-slate-100 transition cursor-pointer"
                  >
                    <Upload className="mx-auto w-8 h-8 text-slate-400 mb-2" />
                    <p className="text-sm text-slate-500">
                      {uploading
                        ? "Uploading images..."
                        : "Click to upload images"}
                    </p>
                  </div>

                  <input
                    ref={fileInputRef}
                    type="file"
                    multiple
                    accept="image/*"
                    className="hidden"
                    onChange={(e) => handleImageChange(e.target.files)}
                  />

                  {imageUrls.length > 0 && (
                    <div className="grid grid-cols-4 gap-4 mt-4">
                      {imageUrls.map((url, index) => (
                        <div key={index} className="relative">
                          <img
                            src={url}
                            alt="Venue"
                            className={`h-24 w-full object-cover rounded-lg border ${
                              index === 0 ? "ring-4 ring-blue-600" : ""
                            }`}
                          />
                          <button
                            type="button"
                            onClick={() => removeImage(index)}
                            className="absolute top-1 right-1 bg-black/70 text-white rounded-full p-1"
                          >
                            <X size={14} />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <Button
                  type="submit"
                  disabled={createVenue.isPending || uploading}
                  className="w-full bg-blue-600 hover:bg-blue-700"
                >
                  {createVenue.isPending
                    ? "Creating..."
                    : uploading
                      ? "Uploading images..."
                      : "Create Venue"}
                </Button>
              </form>
            </Form>
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
}
