import { jsPDF } from "jspdf";
import { format } from "date-fns";

type QuotePdfClient = {
  name?: string | null;
  email?: string | null;
  phone?: string | null;
  eventDate?: string | Date | null;
};

type QuotePdfVenue = {
  name?: string | null;
  location?: string | null;
};

type QuotePdfItem = {
  serviceName?: string | null;
  cost?: string | number | null;
};

type QuotePdfData = {
  id?: number | null;
  eventType?: string | null;
  guestCount?: number | string | null;
  totalCost?: string | number | null;
  markupPercentage?: string | number | null;
  discount?: string | number | null;
  tax?: string | number | null;
  finalPrice?: string | number | null;
  status?: string | null;
  notes?: string | null;
  createdAt?: string | Date | null;
  items?: QuotePdfItem[];
};

const money = (value: unknown) =>
  `$${(Number(value) || 0).toLocaleString(undefined, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;

function displayDate(value: string | Date | null | undefined) {
  if (!value) return "—";
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? "—" : format(date, "MMM d, yyyy");
}

function safeFilename(value: string) {
  return value.trim().replace(/[^\w-]+/g, "_").replace(/^_+|_+$/g, "") || "Client";
}

export function downloadQuotePdf(
  quote: QuotePdfData,
  client?: QuotePdfClient | null,
  venue?: QuotePdfVenue | null,
) {
  const pdf = new jsPDF();
  const pageWidth = pdf.internal.pageSize.getWidth();
  const pageHeight = pdf.internal.pageSize.getHeight();
  const margin = 16;
  const right = pageWidth - margin;
  const quoteNumber = quote.id ? `#${String(quote.id).padStart(4, "0")}` : "Draft";

  pdf.setFillColor(49, 46, 129);
  pdf.rect(0, 0, pageWidth, 36, "F");
  pdf.setTextColor(255, 255, 255);
  pdf.setFont("helvetica", "bold");
  pdf.setFontSize(18);
  pdf.text("EventElite", margin, 16);
  pdf.setFontSize(10);
  pdf.setFont("helvetica", "normal");
  pdf.text("Professional Event Management", margin, 23);
  pdf.setFont("helvetica", "bold");
  pdf.setFontSize(14);
  pdf.text("QUOTATION", right, 15, { align: "right" });
  pdf.setFontSize(10);
  pdf.text(quoteNumber, right, 23, { align: "right" });
  pdf.setFont("helvetica", "normal");
  pdf.text((quote.status || "Draft").toUpperCase(), right, 30, { align: "right" });

  let y = 48;
  const columnGap = 12;
  const columnWidth = (pageWidth - margin * 2 - columnGap) / 2;
  const rightColumn = margin + columnWidth + columnGap;

  pdf.setTextColor(100, 116, 139);
  pdf.setFont("helvetica", "bold");
  pdf.setFontSize(8);
  pdf.text("PREPARED FOR", margin, y);
  pdf.text("EVENT DETAILS", rightColumn, y);

  y += 7;
  pdf.setTextColor(30, 41, 59);
  pdf.setFontSize(11);
  pdf.text(client?.name || "Client not specified", margin, y);
  pdf.text(quote.eventType || "Event", rightColumn, y);

  y += 6;
  pdf.setFont("helvetica", "normal");
  pdf.setFontSize(9);
  pdf.setTextColor(71, 85, 105);
  if (client?.email) pdf.text(client.email, margin, y);
  if (quote.guestCount) pdf.text(`${quote.guestCount} guests`, rightColumn, y);

  y += 5;
  if (client?.phone) pdf.text(client.phone, margin, y);
  const eventDate = displayDate(client?.eventDate);
  if (eventDate !== "—") pdf.text(`Event date: ${eventDate}`, rightColumn, y);

  y += 5;
  if (venue?.name) {
    pdf.text(`Venue: ${venue.name}`, rightColumn, y);
    y += 5;
    if (venue.location) pdf.text(venue.location, rightColumn, y);
  }

  y = Math.max(y + 7, 83);
  pdf.setDrawColor(226, 232, 240);
  pdf.line(margin, y, right, y);
  y += 10;

  const drawTableHeader = () => {
    pdf.setFillColor(241, 245, 249);
    pdf.roundedRect(margin, y - 5, pageWidth - margin * 2, 10, 2, 2, "F");
    pdf.setTextColor(71, 85, 105);
    pdf.setFont("helvetica", "bold");
    pdf.setFontSize(8);
    pdf.text("SERVICE", margin + 3, y + 1);
    pdf.text("AMOUNT", right - 3, y + 1, { align: "right" });
    y += 11;
  };

  drawTableHeader();
  const items = quote.items || [];
  if (items.length === 0) {
    pdf.setFont("helvetica", "normal");
    pdf.setFontSize(9);
    pdf.setTextColor(100, 116, 139);
    pdf.text("No line items", margin + 3, y);
    y += 8;
  }

  for (const item of items) {
    const lines = pdf.splitTextToSize(item.serviceName || "Service", pageWidth - margin * 2 - 58);
    const rowHeight = Math.max(9, lines.length * 5 + 3);
    if (y + rowHeight > pageHeight - 42) {
      pdf.addPage();
      y = 20;
      drawTableHeader();
    }

    pdf.setFont("helvetica", "normal");
    pdf.setFontSize(9);
    pdf.setTextColor(30, 41, 59);
    pdf.text(lines, margin + 3, y);
    pdf.text(money(item.cost), right - 3, y, { align: "right" });
    y += rowHeight;
    pdf.setDrawColor(241, 245, 249);
    pdf.line(margin, y - 2, right, y - 2);
  }

  if (y + 48 > pageHeight - 24) {
    pdf.addPage();
    y = 20;
  }

  y += 6;
  const totals = [
    ["Subtotal", money(quote.totalCost)],
    ["Markup", `${Number(quote.markupPercentage) || 0}%`],
    ["Discount", `${Number(quote.discount) || 0}%`],
    ["Tax", `${Number(quote.tax) || 0}%`],
  ];
  for (const [label, value] of totals) {
    pdf.setFont("helvetica", "normal");
    pdf.setFontSize(9);
    pdf.setTextColor(71, 85, 105);
    pdf.text(label, right - 58, y);
    pdf.text(value, right - 3, y, { align: "right" });
    y += 6;
  }

  y += 2;
  pdf.setDrawColor(203, 213, 225);
  pdf.line(right - 68, y - 4, right, y - 4);
  pdf.setFont("helvetica", "bold");
  pdf.setFontSize(12);
  pdf.setTextColor(49, 46, 129);
  pdf.text("TOTAL", right - 58, y + 2);
  pdf.text(money(quote.finalPrice), right - 3, y + 2, { align: "right" });

  if (quote.notes?.trim()) {
    y += 16;
    if (y > pageHeight - 35) {
      pdf.addPage();
      y = 20;
    }
    pdf.setFont("helvetica", "bold");
    pdf.setFontSize(8);
    pdf.setTextColor(100, 116, 139);
    pdf.text("NOTES", margin, y);
    y += 6;
    pdf.setFont("helvetica", "normal");
    pdf.setFontSize(9);
    pdf.setTextColor(71, 85, 105);
    pdf.text(pdf.splitTextToSize(quote.notes, pageWidth - margin * 2), margin, y);
  }

  const pageCount = pdf.getNumberOfPages();
  for (let page = 1; page <= pageCount; page++) {
    pdf.setPage(page);
    pdf.setFont("helvetica", "normal");
    pdf.setFontSize(8);
    pdf.setTextColor(148, 163, 184);
    pdf.text(`Created ${displayDate(quote.createdAt || new Date())}`, margin, pageHeight - 9);
    pdf.text(`Page ${page} of ${pageCount}`, right, pageHeight - 9, { align: "right" });
  }

  const filename = `EventElite_Quote_${quote.id || "Draft"}_${safeFilename(client?.name || "Client")}.pdf`;
  pdf.save(filename);
}
