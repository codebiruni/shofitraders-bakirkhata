"use client";

import { useEffect, useState, useMemo } from "react";
import { toast } from "react-hot-toast";
import { MagnifyingGlass, FileText, Printer, CaretRight, PencilSimple } from "@phosphor-icons/react";
import { EmptyState } from "@/components/ui/EmptyState";
import { TableRowSkeleton } from "@/components/ui/Skeleton";
import { formatDateTime } from "@/lib/format";
import type { EditableInvoice } from "@/lib/types";

export function InvoiceList({
    onEdit,
}: {
    onEdit: (invoice: EditableInvoice) => void;
}) {
    const [invoices, setInvoices] = useState<EditableInvoice[]>([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState("");

    useEffect(() => {
        fetch("/api/invoices")
            .then((r) => r.json())
            .then((j) => {
                if (j.ok) {
                    setInvoices(j.data);
                }
            })
            .finally(() => setLoading(false));
    }, []);

    const filtered = useMemo(() => {
        if (!search.trim()) return invoices;
        const q = search.toLowerCase();
        return invoices.filter(
            (inv) =>
                inv.invoiceNo?.toLowerCase().includes(q) ||
                inv.customerName?.toLowerCase().includes(q)
        );
    }, [invoices, search]);

    const handlePrintInvoice = async (inv: EditableInvoice) => {
        try {
            const res = await fetch(`/api/invoices/${inv._id}`);
            const json = await res.json();
            if (!json.ok || !json.data) {
                toast.error("Could not load invoice details");
                return;
            }
            const d = json.data;

            const formatCurrency = (n: number) =>
                n.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 });

            const itemRows = (d.items || [])
                .map(
                    (it: any) => `
            <tr>
              <td>${it.sr}</td>
              <td>${it.name || "—"}</td>
              <td>${it.bundle ?? "—"}</td>
              <td>${it.pcs ?? "—"}</td>
              <td>${it.weight ?? "—"}</td>
              <td>${it.pricingType === "weight" ? "Weight" : "Pcs"}</td>
              <td class="right">${it.rate ? "৳ " + Number(it.rate).toLocaleString("en-IN") : "—"}</td>
              <td class="right">${it.discount ? Number(it.discount).toLocaleString("en-IN") + "%" : "—"}</td>
              <td class="right">${it.amount ? "৳ " + formatCurrency(Number(it.amount)) : "—"}</td>
            </tr>`
                )
                .join("");

            const html = `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<title>Invoice ${d.invoiceNo || "Draft"} — Shofi Traders</title>
<style>
  @page { size: A4; margin: 12mm 14mm; }
  * { margin: 0; padding: 0; box-sizing: border-box; }
  body { font-family: 'Segoe UI', system-ui, -apple-system, sans-serif; font-size: 11px; color: #1a1a1a; line-height: 1.4; }
  .letterhead { display: flex; justify-content: space-between; align-items: flex-start; border-bottom: 2.5px solid #155e52; padding-bottom: 14px; margin-bottom: 0; }
  .letterhead-left { display: flex; align-items: center; gap: 14px; }
  .letterhead-logo { height: 52px; width: auto; }
  .letterhead h1 { font-size: 20px; color: #155e52; font-weight: 800; letter-spacing: -0.3px; }
  .letterhead .tagline { font-size: 10px; color: #666; margin-top: 2px; }
  .letterhead-right { text-align: right; font-size: 10px; color: #666; line-height: 1.6; }
  .doc-title { text-align: center; border: 2px solid #155e52; padding: 7px 0; margin: 0 0 18px 0; font-size: 13px; font-weight: 800; letter-spacing: 3px; text-transform: uppercase; color: #155e52; }
  .meta-row { display: flex; gap: 32px; margin-bottom: 16px; padding-bottom: 12px; border-bottom: 1px dashed #ccc; font-size: 11px; }
  .meta-row .meta-label { font-weight: 600; color: #555; margin-right: 6px; }
  .addresses { display: flex; gap: 24px; margin-bottom: 18px; }
  .address-box { flex: 1; border: 1px solid #d0d0d0; border-radius: 4px; padding: 10px 12px; }
  .address-box h3 { font-size: 9px; text-transform: uppercase; letter-spacing: 1.5px; color: #888; margin-bottom: 6px; font-weight: 700; }
  .address-box p { font-size: 11px; line-height: 1.5; white-space: pre-line; }
  .items-title { font-size: 9px; text-transform: uppercase; letter-spacing: 1.5px; color: #888; font-weight: 700; margin-bottom: 6px; }
  table.items { width: 100%; border-collapse: collapse; margin-bottom: 16px; font-size: 10px; }
  table.items thead th { background: #155e52; color: #fff; padding: 7px 5px; text-align: left; font-size: 8.5px; text-transform: uppercase; letter-spacing: 0.6px; font-weight: 700; }
  table.items thead th.right { text-align: right; }
  table.items tbody td { padding: 6px 5px; border-bottom: 1px solid #e8e8e8; vertical-align: top; }
  table.items tbody td.right { text-align: right; font-variant-numeric: tabular-nums; }
  table.items tbody tr:nth-child(even) { background: #f9faf9; }
  .totals-row { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 14px; padding-bottom: 14px; border-bottom: 1px dashed #ccc; }
  .qty-words { max-width: 380px; font-size: 11px; }
  .qty-words .label { font-weight: 600; color: #555; }
  .totals-table { width: 240px; font-size: 11px; }
  .totals-table td { padding: 3px 6px; }
  .totals-table td:last-child { text-align: right; font-variant-numeric: tabular-nums; }
  .totals-table .grand-row { font-weight: 800; font-size: 14px; color: #155e52; border-top: 2px solid #155e52; }
  .totals-table .grand-row td { padding-top: 6px; }
  .totals-table .due-row td { color: #c2410c; }
  .totals-table .payment-row td { color: #15803d; }
  .delivery-note { margin-bottom: 14px; font-size: 11px; }
  .delivery-note .label { font-weight: 600; color: #555; }
  .logistics { border-top: 1px dashed #ccc; padding-top: 12px; margin-bottom: 16px; }
  .logistics h3 { font-size: 9px; text-transform: uppercase; letter-spacing: 1.5px; color: #888; font-weight: 700; margin-bottom: 8px; }
  .logistics-grid { display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 8px 16px; font-size: 10px; }
  .info-label { font-weight: 600; color: #555; margin-right: 4px; }
  .signatures { display: flex; justify-content: space-between; margin-top: 32px; padding-top: 16px; border-top: 1px solid #d0d0d0; font-size: 10px; }
  .sig-block { text-align: center; flex: 1; }
  .sig-block .sig-title { font-size: 9px; font-weight: 700; text-transform: uppercase; letter-spacing: 1px; color: #888; margin-bottom: 36px; }
  .sig-block .sig-line { border-top: 1px solid #333; width: 140px; margin: 0 auto; padding-top: 4px; color: #888; }
  .footer { margin-top: 20px; padding-top: 10px; border-top: 1px solid #e0e0e0; text-align: center; font-size: 8.5px; color: #aaa; }
  @media print { body { -webkit-print-color-adjust: exact; print-color-adjust: exact; } }
</style>
</head>
<body>
<div class="letterhead">
  <div class="letterhead-left">
    <img class="letterhead-logo" src="/assets/logo.webp" alt="Shofi Traders" />
    <div><h1>SHOFI TRADERS</h1><p class="tagline">Trusted Supplier &bull; Quality Products &bull; Reliable Delivery</p></div>
  </div>
  <div class="letterhead-right"><p>Munshirhat Bazar,Chauddagram,Cumilla</p><p>+8801311392727</p></div>
</div>
<div class="doc-title">Delivery Challan</div>
<div class="meta-row">
  <div><span class="meta-label">Invoice No:</span> ${d.invoiceNo || "—"}</div>
  <div><span class="meta-label">Date:</span> ${new Date(d.date).toLocaleDateString("en-IN", { day: "numeric", month: "long", year: "numeric" })}</div>
</div>
<div class="addresses">
  <div class="address-box"><h3>Bill To</h3><p><strong>${d.customerName || "—"}</strong>${d.customerPhone ? "<br>" + d.customerPhone : ""}${d.billToAddress ? "<br>" + d.billToAddress : ""}</p></div>
  <div class="address-box"><h3>Ship To / Delivery</h3><p>${[d.deliveryAddress ? "Address: " + d.deliveryAddress : "", d.deliverySiteContact ? "Contact: " + d.deliverySiteContact : "", d.deliveryFrom ? "From: " + d.deliveryFrom : ""].filter(Boolean).join("<br>") || "—"}</p></div>
</div>
<div class="items-title">Items / Goods Description</div>
<table class="items">
  <thead><tr><th>#</th><th>Name of Goods</th><th>Bundle</th><th>Pcs</th><th>Weight</th><th>Type</th><th class="right">Rate</th><th class="right">Discount %</th><th class="right">Amount</th></tr></thead>
  <tbody>${itemRows}</tbody>
</table>
<div class="totals-row">
  <div class="qty-words">${d.quantityInWords ? '<span class="label">In Words: </span>' + d.quantityInWords : ""}</div>
  <table class="totals-table">
    <tr><td>Sub Total</td><td>৳ ${formatCurrency(d.subTotal || 0)}</td></tr>
    ${d.previousDue ? `<tr class="due-row"><td>Previous Due</td><td>৳ ${formatCurrency(Number(d.previousDue))}</td></tr>` : ""}
    ${d.currentPayment ? `<tr class="payment-row"><td>Current Payment</td><td>৳ ${formatCurrency(Number(d.currentPayment))}</td></tr>` : ""}
    <tr class="grand-row"><td>Remaining Total</td><td>৳ ${formatCurrency(d.remainingTotal || 0)}</td></tr>
  </table>
</div>
${d.deliveryNote ? '<div class="delivery-note"><span class="label">Delivery Note / Remarks: </span>' + d.deliveryNote + "</div>" : ""}
<div class="signatures">
  <div class="sig-block"><div class="sig-title">Prepared By</div><div class="sig-line">Signature &amp; Date</div></div>
  <div class="sig-block"><div class="sig-title">Checked By</div><div class="sig-line">Signature &amp; Date</div></div>
  <div class="sig-block"><div class="sig-title">Received By</div><div class="sig-line">Customer Signature &amp; Date</div></div>
</div>
<div class="footer">This is a computer-generated document. For any queries, please contact Shofi Traders.</div>
</body>
</html>`;

            const frame = document.createElement("iframe");
            frame.style.cssText = "position:fixed;right:0;bottom:0;width:0;height:0;border:0;visibility:hidden;";
            frame.onload = () => {
                setTimeout(() => {
                    frame.contentWindow?.focus();
                    frame.contentWindow?.print();
                    setTimeout(() => frame.remove(), 1000);
                }, 250);
            };
            document.body.appendChild(frame);
            const doc = frame.contentDocument;
            if (!doc) return;
            doc.open();
            doc.write(html);
            doc.close();
        } catch {
            toast.error("Failed to load invoice for printing");
        }
    };

    if (loading) {
        return (
            <div className="space-y-4">
                <div className="h-9 w-full animate-pulse rounded-md bg-base-200" />
                <TableRowSkeleton rows={6} />
            </div>
        );
    }

    return (
        <div className="space-y-4">
            {/* Search */}
            <div className="relative">
                <MagnifyingGlass
                    size={16}
                    className="absolute left-3 top-1/2 -translate-y-1/2 text-ink-soft/50"
                />
                <input
                    className="w-full rounded-md border border-base-300 bg-white py-2 pl-9 pr-3 text-sm text-ink placeholder:text-ink-soft/50 focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary transition-colors"
                    placeholder="Search by invoice no, customer, or site…"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                />
            </div>

            {filtered.length === 0 ? (
                <EmptyState
                    icon={<FileText size={24} />}
                    title={search ? "No matching invoices" : "No invoices yet"}
                    description={
                        search
                            ? "Try a different search term."
                            : "Create your first delivery challan to get started."
                    }
                    className="py-10"
                />
            ) : (
                <>
                    <p className="text-xs text-ink-soft">
                        {filtered.length} invoice{filtered.length !== 1 ? "s" : ""}
                        {search && " found"}
                    </p>

                    <div className="space-y-2">
                        {filtered.map((inv) => (
                            <div
                                key={inv._id}
                                className="group flex items-center justify-between rounded-lg border border-base-300 bg-white px-4 py-3.5 transition-all hover:border-primary/30 hover:shadow-sm"
                            >
                                <div className="flex items-center gap-4 min-w-0">
                                    <div className="flex size-9 shrink-0 items-center justify-center rounded-md bg-primary/10 text-primary">
                                        <FileText size={18} />
                                    </div>
                                    <div className="min-w-0">
                                        <p className="text-sm font-semibold text-ink truncate">
                                            {inv.invoiceNo || "Draft Invoice"}
                                        </p>
                                        <p className="text-xs text-ink-soft truncate">
                                            {inv.customerName || "No customer"}
                                        </p>
                                    </div>
                                </div>

                                <div className="flex items-center gap-4 shrink-0">
                                    <div className="hidden sm:block text-right">
                                        <p className="text-xs font-medium text-ink">
                                            {new Date(inv.date).toLocaleDateString("en-IN", {
                                                day: "numeric",
                                                month: "short",
                                                year: "numeric",
                                            })}
                                            {inv.time ? ` · ${inv.time}` : ""}
                                        </p>
                                        <p className="text-[11px] text-green-700">
                                            Saved {formatDateTime(inv.updatedAt ?? inv.createdAt)}
                                        </p>
                                        <p className="text-[11px] text-ink-soft">
                                            Remaining: ৳ {inv.remainingTotal?.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 }) || "—"}
                                        </p>
                                    </div>

                                    <button
                                        onClick={() => onEdit(inv)}
                                        className="btn btn-ghost btn-xs gap-1 text-primary sm:opacity-0 sm:group-hover:opacity-100 transition-opacity"
                                        title="Edit invoice"
                                    >
                                        <PencilSimple size={14} />
                                        Edit
                                    </button>

                                    <button
                                        onClick={() => handlePrintInvoice(inv)}
                                        className="btn btn-ghost btn-xs gap-1 text-ink-soft sm:opacity-0 sm:group-hover:opacity-100 transition-opacity"
                                        title="Print invoice"
                                    >
                                        <Printer size={14} />
                                        Print
                                    </button>

                                    <CaretRight
                                        size={14}
                                        className="text-ink-soft/30 shrink-0"
                                    />
                                </div>
                            </div>
                        ))}
                    </div>
                </>
            )}
        </div>
    );
}
