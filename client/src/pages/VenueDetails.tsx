// FULL FILE REPLACEMENT – FIXED EDIT FORM STRUCTURE

import { Layout } from "@/components/Layout";
import {
  useVenue,
  useCreateBookingOption,
  useDeleteBookingOption,
  useUpdateVenue,
} from "@/hooks/use-venues";
import { Link, useRoute, useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
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
  Trash2,
  Upload,
  ImagePlus,
  ChevronDown,
  ChevronUp,
  Pencil,
  Users,
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
  const [showContact, setShowContact] = useState(true);
  const [showPackages, setShowPackages] = useState(true);
  const [imageToDelete, setImageToDelete] = useState<number | null>(null);
  const [packageToDelete, setPackageToDelete] = useState<number | null>(null);

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
      <div className="space-y-10">
        <Link
          href="/venues"
          className="text-sm text-slate-500 hover:text-blue-600 flex items-center"
        >
          <ArrowLeft className="w-4 h-4 mr-1" /> Back to Venues
        </Link>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
          {/* LEFT */}
          <div className="space-y-6">
            <div className="flex gap-3">
              <input
                type="file"
                hidden
                ref={mainImageInputRef}
                accept="image/*"
                onChange={(e) =>
                  e.target.files?.[0] &&
                  handleMainImageUpload(e.target.files[0])
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
                Change Main Image
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

            {images.length > 0 && (
              <div className="flex gap-6">
                <div className="flex flex-col gap-3 w-24">
                  {venue.images?.map((img: any, index: number) => (
                    <div key={img.id} className="relative group">
                      <img
                        src={img.imageUrl}
                        onClick={() => setSelectedIndex(index + 1)}
                        className={`h-20 w-20 object-cover rounded-lg border cursor-pointer ${
                          selectedIndex === index + 1
                            ? "ring-2 ring-blue-600"
                            : "hover:ring-1"
                        }`}
                      />

                      {/* Delete Button */}
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setImageToDelete(img.id);
                        }}
                        className="absolute top-1 right-1 bg-white rounded-full p-1 shadow opacity-0 group-hover:opacity-100 transition"
                      >
                        <Trash2 className="w-3 h-3 text-red-500" />
                      </button>
                    </div>
                  ))}
                </div>

                <div className="flex-1">
                  <div className="h-[420px] bg-slate-50 rounded-2xl flex items-center justify-center overflow-hidden">
                    <img
                      src={images[selectedIndex]}
                      className="max-h-full max-w-full object-contain"
                    />
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* RIGHT */}
          <div className="space-y-8">
            <div className="flex justify-between items-start">
              <div>
                <h1 className="text-3xl font-semibold text-slate-900">
                  {venue.name}
                </h1>
                <p className="text-slate-500 flex items-center mt-2">
                  <MapPin className="w-4 h-4 mr-1" />
                  {venue.location}
                </p>
              </div>

              <Dialog>
                <DialogTrigger asChild>
                  <Button size="sm" variant="outline">
                    <Pencil className="w-4 h-4 mr-2" />
                    Edit Venue
                  </Button>
                </DialogTrigger>

                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Edit Venue</DialogTitle>
                  </DialogHeader>
                  <EditVenueForm venue={venue} />
                </DialogContent>
              </Dialog>
            </div>

            <div className="grid grid-cols-2 gap-6">
              {/* Capacity Card */}
              <div className="bg-white px-6 py-5 rounded-2xl border shadow-sm hover:shadow-md transition">
                <div className="flex items-center justify-between">
                  <span className="text-xs uppercase font-semibold text-slate-500">
                    Capacity
                  </span>
                  <Users className="w-5 h-5 text-slate-400" />
                </div>

                <div className="mt-3 text-3xl font-bold text-slate-900">
                  {venue.capacity}
                </div>

                <div className="text-xs text-slate-400 mt-1">
                  Maximum guest count
                </div>
              </div>

              {/* Base Price Card */}
              <div className="bg-white px-6 py-5 rounded-2xl border shadow-sm hover:shadow-md transition">
                <div className="flex items-center justify-between">
                  <span className="text-xs uppercase font-semibold text-slate-500">
                    Base Price
                  </span>
                  <Plus className="w-5 h-5 text-emerald-500" />
                </div>

                <div className="mt-3 text-3xl font-bold text-emerald-600">
                  ${Number(venue.basePrice).toLocaleString()}
                </div>

                <div className="text-xs text-slate-400 mt-1">
                  Starting package rate
                </div>
              </div>
            </div>

            {(venue.bookingPhone || venue.bookingEmail || venue.notes) && (
              <Card className="border shadow-sm">
                <CardContent className="p-5 space-y-4">
                  <div
                    className="flex justify-between items-center cursor-pointer"
                    onClick={() => setShowContact(!showContact)}
                  >
                    <h3 className="font-semibold text-slate-800">
                      Booking & General Information
                    </h3>
                    {showContact ? (
                      <ChevronUp className="w-4 h-4" />
                    ) : (
                      <ChevronDown className="w-4 h-4" />
                    )}
                  </div>

                  {showContact && (
                    <div className="grid gap-4 text-sm">
                      {venue.bookingPhone && (
                        <div>
                          <div className="text-xs uppercase font-semibold text-slate-500">
                            Booking Phone
                          </div>
                          <a
                            href={`tel:${venue.bookingPhone}`}
                            className="text-blue-600 hover:underline"
                          >
                            {venue.bookingPhone}
                          </a>
                        </div>
                      )}

                      {venue.bookingEmail && (
                        <div>
                          <div className="text-xs uppercase font-semibold text-slate-500">
                            Booking Email
                          </div>
                          <a
                            href={`mailto:${venue.bookingEmail}`}
                            className="text-blue-600 hover:underline"
                          >
                            {venue.bookingEmail}
                          </a>
                        </div>
                      )}

                      {venue.notes && (
                        <div>
                          <div className="text-xs uppercase font-semibold text-slate-500">
                            General Notes
                          </div>
                          <div className="whitespace-pre-line break-words">
                            {venue.notes}
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </CardContent>
              </Card>
            )}
          </div>
        </div>

        {/* BOOKING PACKAGES */}
        <Card className="border shadow-sm">
          <CardContent className="p-6">
            <div className="flex justify-between items-center mb-6">
              <div
                className="flex items-center gap-2 cursor-pointer"
                onClick={() => setShowPackages(!showPackages)}
              >
                <h3 className="font-semibold text-slate-900">
                  Booking Packages ({venue.options?.length || 0})
                </h3>
                {showPackages ? (
                  <ChevronUp className="w-4 h-4" />
                ) : (
                  <ChevronDown className="w-4 h-4" />
                )}
              </div>

              <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                <DialogTrigger asChild>
                  <Button size="sm" variant="outline">
                    <Plus className="w-4 h-4 mr-2" />
                    Add Package
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
            </div>

            {showPackages && (
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
                            onClick={() => setPackageToDelete(opt.id)}
                          >
                            <Trash2 className="w-4 h-4 text-red-500" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>

        {/* IMAGE DELETE CONFIRMATION DIALOG */}
        <Dialog
          open={imageToDelete !== null}
          onOpenChange={() => setImageToDelete(null)}
        >
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Delete Image</DialogTitle>
            </DialogHeader>

            <p className="text-sm text-slate-500">
              Are you sure you want to delete this image? This action cannot be
              undone.
            </p>

            <div className="flex justify-end gap-3 mt-6">
              <Button variant="outline" onClick={() => setImageToDelete(null)}>
                Cancel
              </Button>

              <Button
                variant="destructive"
                onClick={async () => {
                  if (!imageToDelete) return;

                  await fetch(`/api/venue-images/${imageToDelete}`, {
                    method: "DELETE",
                  });

                  setImageToDelete(null);
                  queryClient.refetchQueries({ queryKey: ["venue", id] });
                }}
              >
                Delete
              </Button>
            </div>
          </DialogContent>
        </Dialog>

        {/* PACKAGE DELETE CONFIRMATION DIALOG */}
        <Dialog
          open={packageToDelete !== null}
          onOpenChange={() => setPackageToDelete(null)}
        >
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Delete Package</DialogTitle>
            </DialogHeader>

            <p className="text-sm text-slate-500">
              Are you sure you want to delete this booking package? This action
              cannot be undone.
            </p>

            <div className="flex justify-end gap-3 mt-6">
              <Button
                variant="outline"
                onClick={() => setPackageToDelete(null)}
              >
                Cancel
              </Button>

              <Button
                variant="destructive"
                onClick={() => {
                  if (!packageToDelete) return;

                  deleteOption.mutate(packageToDelete, {
                    onSuccess: () => {
                      setPackageToDelete(null);
                    },
                  });
                }}
              >
                Delete
              </Button>
            </div>
          </DialogContent>
        </Dialog>

        <div className="flex justify-end">
          <Button onClick={() => navigate("/venues")}>Done</Button>
        </div>
      </div>
    </Layout>
  );
}

/* ================= CREATE OPTION FORM ================= */

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
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6 py-4">
        {/* Package Name */}
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

        {/* Price & Currency */}
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

        {/* Description */}
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

/* ================= EDIT VENUE FORM ================= */

function EditVenueForm({ venue }: { venue: any }) {
  const { mutate, isPending } = useUpdateVenue();

  const form = useForm({
    defaultValues: {
      name: venue.name,
      location: venue.location,
      capacity: venue.capacity,
      basePrice: venue.basePrice,
      bookingPhone: venue.bookingPhone || "",
      bookingEmail: venue.bookingEmail || "",
      notes: venue.notes || "",
    },
  });

  function onSubmit(data: any) {
    mutate(
      {
        id: venue.id,
        ...data,
      },
      {
        onSuccess: () => {
          window.location.reload();
        },
      },
    );
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6 py-4">
        {/* Name */}
        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Venue Name</FormLabel>
              <FormControl>
                <Input {...field} />
              </FormControl>
            </FormItem>
          )}
        />

        {/* Location */}
        <FormField
          control={form.control}
          name="location"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Location</FormLabel>
              <FormControl>
                <Input {...field} />
              </FormControl>
            </FormItem>
          )}
        />

        {/* Capacity & Base Price */}
        <div className="grid grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="capacity"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Capacity</FormLabel>
                <FormControl>
                  <Input type="number" {...field} />
                </FormControl>
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="basePrice"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Base Price</FormLabel>
                <FormControl>
                  <Input type="number" {...field} />
                </FormControl>
              </FormItem>
            )}
          />
        </div>

        {/* Booking Phone & Email */}
        <div className="grid grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="bookingPhone"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Booking Phone</FormLabel>
                <FormControl>
                  <Input {...field} />
                </FormControl>
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
                  <Input type="email" {...field} />
                </FormControl>
              </FormItem>
            )}
          />
        </div>

        {/* Notes */}
        <FormField
          control={form.control}
          name="notes"
          render={({ field }) => (
            <FormItem>
              <FormLabel>General Notes</FormLabel>
              <FormControl>
                <Textarea rows={4} {...field} />
              </FormControl>
            </FormItem>
          )}
        />

        <Button type="submit" disabled={isPending} className="w-full">
          {isPending ? "Saving..." : "Save Changes"}
        </Button>
      </form>
    </Form>
  );
}
