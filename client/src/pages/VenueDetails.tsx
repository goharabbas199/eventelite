// FULL FILE REPLACEMENT (CORRECTED VERSION)

import { Layout } from "@/components/Layout";
import {
  useVenue,
  useCreateBookingOption,
  useDeleteBookingOption,
} from "@/hooks/use-venues";
import { Link, useRoute, useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  ArrowLeft,
  Plus,
  MapPin,
  Users,
  Trash2,
  Upload,
  ImagePlus,
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  insertBookingOptionSchema,
  type InsertBookingOption,
} from "@shared/schema";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useState, useRef } from "react";
import { Skeleton } from "@/components/ui/skeleton";
import { useQueryClient } from "@tanstack/react-query";

export default function VenueDetails() {
  const [, params] = useRoute("/venues/:id");
  const [, navigate] = useLocation();
  const id = Number(params?.id);
  const { data: venue, isLoading } = useVenue(id);
  const deleteOption = useDeleteBookingOption();
  const queryClient = useQueryClient();

  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(0);

  const mainImageInputRef = useRef<HTMLInputElement>(null);
  const galleryInputRef = useRef<HTMLInputElement>(null);

  async function uploadImage(file: File) {
    const formData = new FormData();
    formData.append("image", file);

    const uploadRes = await fetch("/api/upload", {
      method: "POST",
      body: formData,
    });

    const uploadData = await uploadRes.json();
    if (!uploadRes.ok) return null;
    return uploadData.url;
  }

  async function handleMainImageUpload(file: File) {
    const url = await uploadImage(file);
    if (!url) return;

    await fetch(`/api/venues/${id}/main-image`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ mainImage: url }),
    });

    queryClient.refetchQueries({ queryKey: ["venue", id] });
  }

  async function handleGalleryUpload(file: File) {
    const url = await uploadImage(file);
    if (!url) return;

    await fetch(`/api/venues/${id}/images`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ imageUrl: url }),
    });

    queryClient.refetchQueries({ queryKey: ["venue", id] });
  }

  if (isLoading)
    return (
      <Layout>
        <Skeleton className="h-96 w-full rounded-2xl" />
      </Layout>
    );

  if (!venue) return <Layout>Venue not found</Layout>;

  const images = [
    venue.mainImage,
    ...(venue.images?.map((img: any) => img.imageUrl) || []),
  ].filter(Boolean);

  return (
    <Layout title="Venue Details">
      <div className="mb-6">
        <Link
          href="/venues"
          className="text-sm text-slate-500 hover:text-blue-600 flex items-center mb-4"
        >
          <ArrowLeft className="w-4 h-4 mr-1" /> Back to Venues
        </Link>

        {/* IMAGE CONTROLS */}
        <div className="flex gap-3 mb-6">
          <input
            type="file"
            hidden
            ref={mainImageInputRef}
            accept="image/*"
            onChange={(e) =>
              e.target.files?.[0] && handleMainImageUpload(e.target.files[0])
            }
          />
          <input
            type="file"
            hidden
            ref={galleryInputRef}
            accept="image/*"
            onChange={(e) =>
              e.target.files?.[0] && handleGalleryUpload(e.target.files[0])
            }
          />

          <Button
            size="sm"
            variant="outline"
            onClick={() => mainImageInputRef.current?.click()}
          >
            <Upload className="w-4 h-4 mr-2" />
            {venue.mainImage ? "Change Main Image" : "Upload Main Image"}
          </Button>

          <Button
            size="sm"
            variant="outline"
            onClick={() => galleryInputRef.current?.click()}
          >
            <ImagePlus className="w-4 h-4 mr-2" />
            Add Gallery Image
          </Button>
        </div>

        {/* IMAGE DISPLAY */}
        {images.length > 0 && (
          <div className="flex gap-6 mb-10">
            <div className="flex flex-col gap-3 w-24">
              {images.map((img, index) => (
                <img
                  key={index}
                  src={img}
                  onClick={() => setSelectedIndex(index)}
                  className={`h-20 w-20 object-cover rounded-md border cursor-pointer transition ${
                    selectedIndex === index
                      ? "ring-2 ring-blue-600"
                      : "hover:ring-1"
                  }`}
                />
              ))}
            </div>

            <div className="flex-1">
              <div className="h-[420px] bg-gray-100 rounded-xl flex items-center justify-center overflow-hidden">
                <img
                  src={images[selectedIndex]}
                  className="max-h-full max-w-full object-contain"
                />
              </div>
            </div>
          </div>
        )}

        {/* DETAILS */}
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold">{venue.name}</h1>
            <p className="text-slate-500 flex items-center mt-2">
              <MapPin className="w-4 h-4 mr-1" /> {venue.location}
            </p>
          </div>

          <div className="flex gap-4">
            <div className="bg-white px-4 py-2 rounded-lg shadow border">
              <div className="text-xs uppercase font-bold text-slate-500">
                Capacity
              </div>
              <div className="font-bold text-lg">{venue.capacity}</div>
            </div>

            <div className="bg-white px-4 py-2 rounded-lg shadow border">
              <div className="text-xs uppercase font-bold text-slate-500">
                Base Price
              </div>
              <div className="font-bold text-lg text-emerald-600">
                ${venue.basePrice}
              </div>
            </div>
          </div>
        </div>
      </div>
      {/* CONTACT & GENERAL INFO */}
      {(venue.bookingPhone || venue.bookingEmail || venue.notes) && (
        <Card className="shadow-md mb-8">
          <CardHeader>
            <CardTitle>Booking & General Information</CardTitle>
          </CardHeader>

          <CardContent className="space-y-4 text-sm">
            {venue.bookingPhone && (
              <div>
                <div className="text-xs uppercase font-bold text-slate-500 mb-1">
                  Booking Phone
                </div>
                <div className="text-base">{venue.bookingPhone}</div>
              </div>
            )}

            {venue.bookingEmail && (
              <div>
                <div className="text-xs uppercase font-bold text-slate-500 mb-1">
                  Booking Email
                </div>
                <div className="text-base">{venue.bookingEmail}</div>
              </div>
            )}

            {venue.notes && (
              <div>
                <div className="text-xs uppercase font-bold text-slate-500 mb-1">
                  General Notes
                </div>
                <div className="text-base whitespace-pre-line">
                  {venue.notes}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* BOOKING PACKAGES */}
      <Card className="shadow-md mb-8">
        <CardHeader className="flex justify-between items-center">
          <CardTitle>Booking Packages</CardTitle>

          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button size="sm" variant="outline">
                <Plus className="w-4 h-4 mr-2" /> Add Package
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Add Booking Option</DialogTitle>
              </DialogHeader>
              <CreateOptionForm
                venueId={id}
                onSuccess={() => setIsDialogOpen(false)}
              />
            </DialogContent>
          </Dialog>
        </CardHeader>

        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Package Name</TableHead>
                <TableHead>Price</TableHead>
                <TableHead>Description</TableHead>
                <TableHead className="w-20 text-center">Action</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {venue.options?.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={4} className="text-center h-20">
                    No options defined.
                  </TableCell>
                </TableRow>
              ) : (
                venue.options.map((opt: any) => (
                  <TableRow key={opt.id}>
                    <TableCell>{opt.name}</TableCell>
                    <TableCell>
                      {opt.currency} {opt.price}
                    </TableCell>
                    <TableCell>{opt.description}</TableCell>
                    <TableCell className="text-center">
                      <Button
                        size="icon"
                        variant="ghost"
                        onClick={() => deleteOption.mutate(opt.id)}
                      >
                        <Trash2 className="w-4 h-4 text-red-500" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <div className="flex justify-end">
        <Button onClick={() => navigate("/venues")}>Done</Button>
      </div>
    </Layout>
  );
}
function CreateOptionForm({
  venueId,
  onSuccess,
}: {
  venueId: number;
  onSuccess: () => void;
}) {
  const { mutate, isPending } = useCreateBookingOption();

  const form = useForm<Omit<InsertBookingOption, "venueId">>({
    resolver: zodResolver(insertBookingOptionSchema.omit({ venueId: true })),
    defaultValues: {
      name: "",
      price: "",
      currency: "AED",
      description: "",
    },
  });

  function onSubmit(data: any) {
    mutate(
      {
        venueId,
        ...data,
        price: String(data.price),
      },
      {
        onSuccess: () => {
          form.reset();
          onSuccess();
        },
      },
    );
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5 py-4">
        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Package Name</FormLabel>
              <FormControl>
                <Input {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="grid grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="price"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Price</FormLabel>
                <FormControl>
                  <Input
                    type="number"
                    step="0.01"
                    {...field}
                    onChange={(e) => field.onChange(e.target.value)}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="currency"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Currency</FormLabel>
                <FormControl>
                  <select
                    {...field}
                    className="w-full border rounded-md h-10 px-3"
                  >
                    <option value="AED">AED</option>
                    <option value="USD">USD</option>
                    <option value="EUR">EUR</option>
                    <option value="GBP">GBP</option>
                  </select>
                </FormControl>
              </FormItem>
            )}
          />
        </div>

        <FormField
          control={form.control}
          name="description"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Description</FormLabel>
              <FormControl>
                <Textarea rows={4} {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <Button type="submit" disabled={isPending} className="w-full">
          {isPending ? "Adding..." : "Add Option"}
        </Button>
      </form>
    </Form>
  );
}
