"use client";

import { useState, useMemo } from "react";
import { toast } from "react-hot-toast";
import { Plus, Trash, Printer, FloppyDisk, X, CheckCircle } from "@phosphor-icons/react";
import { numberToWords, formatDateTime } from "@/lib/format";
import type { EditableInvoice } from "@/lib/types";

type PricingType = "weight" | "pcs";

interface Item {
    sr: number;
    name: string;
    bundle: string;
    pcs: string;
    weight: string;
    pricingType: PricingType;
    rate: string;
    discount: string;
}

const emptyItem = (sr: number): Item => ({
    sr,
    name: "",
    bundle: "",
    pcs: "",
    weight: "",
    pricingType: "weight",
    rate: "",
    discount: "",
});

export function InvoiceForm({
    initialInvoice,
    onExitEdit,
}: {
    initialInvoice?: EditableInvoice | null;
    onExitEdit?: () => void;
}) {
    const generateInvoiceNo = () => {
        const now = new Date();
        const yyyy = now.getFullYear();
        const mm = String(now.getMonth() + 1).padStart(2, '0');
        const random = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
        return `ST-${yyyy}${mm}-${random}`;
    };

    const [invoiceNo, setInvoiceNo] = useState(initialInvoice?.invoiceNo ?? generateInvoiceNo());
    const [date, setDate] = useState(
        () => initialInvoice?.date?.slice(0, 10) ?? new Date().toISOString().slice(0, 10)
    );
    const [time, setTime] = useState(
        () => initialInvoice?.time ?? new Date().toTimeString().slice(0, 5)
    );
    const [editingId, setEditingId] = useState<string | null>(initialInvoice?._id ?? null);
    const [savedAt, setSavedAt] = useState<string | null>(
        initialInvoice?.updatedAt ?? initialInvoice?.createdAt ?? null
    );
    const [customerName, setCustomerName] = useState(initialInvoice?.customerName ?? "");
    const [customerPhone, setCustomerPhone] = useState(initialInvoice?.customerPhone ?? "");
    const [billToAddress, setBillToAddress] = useState(initialInvoice?.billToAddress ?? "");
    const [deliveryContact, setDeliveryContact] = useState(initialInvoice?.deliverySiteContact ?? "");
    const [deliveryAddress, setDeliveryAddress] = useState(initialInvoice?.deliveryAddress ?? "");
    const [deliveryFrom, setDeliveryFrom] = useState(initialInvoice?.deliveryFrom ?? "Shofi Traders");
    const [items, setItems] = useState<Item[]>(() =>
        initialInvoice?.items?.length
            ? initialInvoice.items.map((it) => ({
                sr: it.sr,
                name: it.name ?? "",
                bundle: it.bundle != null ? String(it.bundle) : "",
                pcs: it.pcs != null ? String(it.pcs) : "",
                weight: it.weight != null ? String(it.weight) : "",
                pricingType: it.pricingType ?? "weight",
                rate: it.rate != null ? String(it.rate) : "",
                discount: it.discount != null ? String(it.discount) : "",
            }))
            : [emptyItem(1)]
    );
    const [previousDue, setPreviousDue] = useState(
        initialInvoice?.previousDue != null ? String(initialInvoice.previousDue) : ""
    );
    const [currentPayment, setCurrentPayment] = useState(
        initialInvoice?.currentPayment != null ? String(initialInvoice.currentPayment) : ""
    );
    const [deliveryNote, setDeliveryNote] = useState(initialInvoice?.deliveryNote ?? "");
    const [loading, setLoading] = useState(false);

    const itemAmounts = items.map((it) => {
        const rate = Number(it.rate || 0);
        const qty = it.pricingType === "weight" ? Number(it.weight || 0) : Number(it.pcs || 0);
        const gross = rate * qty;
        const discountPct = Number(it.discount || 0);
        return gross - (gross * discountPct) / 100;
    });

    const subTotal = itemAmounts.reduce((sum, amt) => sum + amt, 0);
    const prevDue = Number(previousDue || 0);
    const currPayment = Number(currentPayment || 0);
    const remainingTotal = subTotal + prevDue - currPayment;

    const amountInWords = useMemo(() => numberToWords(remainingTotal), [remainingTotal]);

    const updateItem = (idx: number, field: keyof Item, value: string) => {
        setItems((prev) =>
            prev.map((it, i) => (i === idx ? { ...it, [field]: value } : it))
        );
    };

    const addItem = () => {
        setItems((prev) => [...prev, emptyItem(prev.length + 1)]);
    };

    const removeItem = (idx: number) => {
        setItems((prev) =>
            prev.filter((_, i) => i !== idx).map((it, i) => ({ ...it, sr: i + 1 }))
        );
    };

    const resetForm = () => {
        setInvoiceNo(generateInvoiceNo());
        setDate(new Date().toISOString().slice(0, 10));
        setTime(new Date().toTimeString().slice(0, 5));
        setEditingId(null);
        setSavedAt(null);
        setCustomerName("");
        setCustomerPhone("");
        setBillToAddress("");
        setDeliveryContact("");
        setDeliveryAddress("");
        setDeliveryFrom("Shofi Traders");
        setItems([emptyItem(1)]);
        setPreviousDue("");
        setCurrentPayment("");
        setDeliveryNote("");
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!customerName.trim()) {
            toast.error("Customer name is required");
            return;
        }
        if (!deliveryAddress.trim()) {
            toast.error("Delivery address is required");
            return;
        }
        setLoading(true);
        try {
            const payload = {
                invoiceNo,
                date,
                time,
                customerName,
                customerPhone,
                billToAddress,
                deliverySiteContact: deliveryContact,
                deliveryAddress,
                deliveryFrom,
                items: items.map((it, i) => ({
                    sr: it.sr,
                    name: it.name,
                    bundle: it.bundle ? Number(it.bundle) : undefined,
                    pcs: it.pcs ? Number(it.pcs) : undefined,
                    weight: it.weight ? Number(it.weight) : undefined,
                    pricingType: it.pricingType,
                    rate: it.rate ? Number(it.rate) : undefined,
                    discount: it.discount ? Number(it.discount) : undefined,
                    amount: itemAmounts[i] || undefined,
                })),
                subTotal: subTotal || undefined,
                previousDue: prevDue || undefined,
                currentPayment: currPayment || undefined,
                remainingTotal: remainingTotal || undefined,
                quantityInWords: amountInWords,
                deliveryNote,
            };
            const res = await fetch(
                editingId ? `/api/invoices/${editingId}` : "/api/invoices",
                {
                    method: editingId ? "PATCH" : "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify(payload),
                }
            );
            const json = await res.json();
            if (json.ok) {
                const saved = json.data?.updatedAt ?? new Date().toISOString();
                if (editingId) {
                    toast.success("Invoice updated successfully");
                    onExitEdit?.();
                } else {
                    toast.success("Invoice saved successfully");
                    resetForm();
                }
                setSavedAt(saved);
            } else {
                toast.error(json.error || "Failed to save invoice");
            }
        } catch {
            toast.error("Failed to save invoice");
        } finally {
            setLoading(false);
        }
    };

    const handlePrint = () => {
        const formatCurrency = (n: number) =>
            n.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 });

        const itemRows = items
            .map(
                (it, i) => `
            <tr>
              <td>${it.sr}</td>
              <td>${it.name || "—"}</td>
              <td>${it.bundle || "—"}</td>
              <td>${it.pcs || "—"}</td>
              <td>${it.weight || "—"}</td>
              <td>${it.pricingType === "weight" ? "Weight" : "Pcs"}</td>
              <td class="right">${it.rate ? "৳ " + Number(it.rate).toLocaleString("en-IN") : "—"}</td>
              <td class="right">${it.discount ? Number(it.discount).toLocaleString("en-IN") + "%" : "—"}</td>
              <td class="right">${itemAmounts[i] ? "৳ " + formatCurrency(itemAmounts[i]) : "—"}</td>
            </tr>`
            )
            .join("");

        const html = `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<title>Invoice ${invoiceNo || "Draft"} — Shofi Traders</title>
<style>
  @page { size: A4; margin: 12mm 14mm; }
  * { margin: 0; padding: 0; box-sizing: border-box; }
  body {
    font-family: 'Segoe UI', system-ui, -apple-system, sans-serif;
    font-size: 11px;
    color: #1a1a1a;
    line-height: 1.4;
  }

  .letterhead {
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
    border-bottom: 2.5px solid #155e52;
    padding-bottom: 14px;
    margin-bottom: 0;
  }
  .letterhead-left { display: flex; align-items: center; gap: 14px; }
  .letterhead-logo { height: 52px; width: auto; }
  .letterhead h1 { font-size: 20px; color: #155e52; font-weight: 800; letter-spacing: -0.3px; }
  .letterhead .tagline { font-size: 10px; color: #666; margin-top: 2px; }
  .letterhead-right { text-align: right; font-size: 10px; color: #666; line-height: 1.6; }

  .doc-title {
    text-align: center;
    border: 2px solid #155e52;
    padding: 7px 0;
    margin: 0 0 18px 0;
    font-size: 13px;
    font-weight: 800;
    letter-spacing: 3px;
    text-transform: uppercase;
    color: #155e52;
  }

  .meta-row {
    display: flex;
    gap: 32px;
    margin-bottom: 16px;
    padding-bottom: 12px;
    border-bottom: 1px dashed #ccc;
    font-size: 11px;
  }
  .meta-row .meta-label { font-weight: 600; color: #555; margin-right: 6px; }

  .addresses {
    display: flex;
    gap: 24px;
    margin-bottom: 18px;
  }
  .address-box {
    flex: 1;
    border: 1px solid #d0d0d0;
    border-radius: 4px;
    padding: 10px 12px;
  }
  .address-box h3 {
    font-size: 9px;
    text-transform: uppercase;
    letter-spacing: 1.5px;
    color: #888;
    margin-bottom: 6px;
    font-weight: 700;
  }
  .address-box p { font-size: 11px; line-height: 1.5; white-space: pre-line; }

  .items-title {
    font-size: 9px;
    text-transform: uppercase;
    letter-spacing: 1.5px;
    color: #888;
    font-weight: 700;
    margin-bottom: 6px;
  }
  table.items {
    width: 100%;
    border-collapse: collapse;
    margin-bottom: 16px;
    font-size: 9px;
  }
  table.items thead th {
    background: #155e52;
    color: #fff;
    padding: 6px 4px;
    text-align: left;
    font-size: 7.5px;
    text-transform: uppercase;
    letter-spacing: 0.5px;
    font-weight: 700;
  }
  table.items thead th.right { text-align: right; }
  table.items tbody td {
    padding: 5px 4px;
    border-bottom: 1px solid #e8e8e8;
    vertical-align: top;
  }
  table.items tbody td.right { text-align: right; font-variant-numeric: tabular-nums; }
  table.items tbody tr:nth-child(even) { background: #f9faf9; }

  .totals-row {
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
    margin-bottom: 14px;
    padding-bottom: 14px;
    border-bottom: 1px dashed #ccc;
  }
  .qty-words { max-width: 380px; font-size: 11px; }
  .qty-words .label { font-weight: 600; color: #555; }
  .totals-table { width: 260px; font-size: 11px; }
  .totals-table td { padding: 3px 6px; }
  .totals-table td:last-child { text-align: right; font-variant-numeric: tabular-nums; }
  .totals-table .grand-row { font-weight: 800; font-size: 14px; color: #155e52; border-top: 2px solid #155e52; }
  .totals-table .grand-row td { padding-top: 6px; }
  .totals-table .due-row td { color: #c2410c; }
  .totals-table .payment-row td { color: #15803d; }

  .delivery-note { margin-bottom: 14px; font-size: 11px; }
  .delivery-note .label { font-weight: 600; color: #555; }

  .signatures {
    display: flex;
    justify-content: space-between;
    margin-top: 32px;
    padding-top: 16px;
    border-top: 1px solid #d0d0d0;
    font-size: 10px;
  }
  .sig-block { text-align: center; flex: 1; }
  .sig-block .sig-title {
    font-size: 9px;
    font-weight: 700;
    text-transform: uppercase;
    letter-spacing: 1px;
    color: #888;
    margin-bottom: 36px;
  }
  .sig-block .sig-line {
    border-top: 1px solid #333;
    width: 140px;
    margin: 0 auto;
    padding-top: 4px;
    color: #888;
  }

  .footer {
    margin-top: 20px;
    padding-top: 10px;
    border-top: 1px solid #e0e0e0;
    text-align: center;
    font-size: 8.5px;
    color: #aaa;
  }

  @media print {
    body { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
  }
</style>
</head>
<body>

<div class="letterhead">
  <div class="letterhead-left">
    <img class="letterhead-logo" src="/assets/logo.webp" alt="Shofi Traders" />
    <div>
      <h1>SHOFI TRADERS</h1>
      <p class="tagline">Trusted Supplier &bull; Quality Products &bull; Reliable Delivery</p>
    </div>
  </div>
  <div class="letterhead-right">
    <p>Munshirhat Bazar,Chauddagram,Cumilla</p>
    <p>+8801311392727</p>
  </div>
</div>

<div class="doc-title">Delivery Challan</div>

<div class="meta-row">
  <div class="meta-item"><span class="meta-label">Invoice No:</span> ${invoiceNo || "—"}</div>
  <div class="meta-item"><span class="meta-label">Date:</span> ${new Date(date).toLocaleDateString("en-IN", { day: "numeric", month: "long", year: "numeric" })}${time ? " · " + time : ""}</div>
</div>

<div class="addresses">
  <div class="address-box">
    <h3>Bill To</h3>
    <p><strong>${customerName || "—"}</strong>${customerPhone ? "<br>" + customerPhone : ""}${billToAddress ? "<br>" + billToAddress : ""}</p>
  </div>
  <div class="address-box">
    <h3>Ship To / Delivery</h3>
    <p>${[
                deliveryAddress ? "Address: " + deliveryAddress : "",
                deliveryContact ? "Contact: " + deliveryContact : "",
                deliveryFrom ? "From: " + deliveryFrom : "",
            ].filter(Boolean).join("<br>") || "—"}</p>
  </div>
</div>

<div class="items-title">Items / Goods Description</div>
<table class="items">
  <thead>
    <tr>
      <th>#</th>
      <th>Name of Goods</th>
      <th>Bundle</th>
      <th>Pcs</th>
      <th>Weight</th>
      <th>Type</th>
      <th class="right">Rate</th>
      <th class="right">Discount %</th>
      <th class="right">Amount</th>
    </tr>
  </thead>
  <tbody>
    ${itemRows}
  </tbody>
</table>

<div class="totals-row">
  <div class="qty-words">
    <span class="label">In Words: </span>${amountInWords}
  </div>
  <table class="totals-table">
    <tr>
      <td>Sub Total</td>
      <td>৳ ${formatCurrency(subTotal)}</td>
    </tr>
    ${prevDue > 0 ? `<tr class="due-row"><td>Previous Due</td><td>৳ ${formatCurrency(prevDue)}</td></tr>` : ""}
    ${currPayment > 0 ? `<tr class="payment-row"><td>Current Payment</td><td>৳ ${formatCurrency(currPayment)}</td></tr>` : ""}
    <tr class="grand-row">
      <td>Remaining Total</td>
      <td>৳ ${formatCurrency(remainingTotal)}</td>
    </tr>
  </table>
</div>

${deliveryNote ? `
<div class="delivery-note">
  <span class="label">Delivery Note / Remarks: </span>${deliveryNote}
</div>` : ""}

<div class="signatures">
  <div class="sig-block">
    <div class="sig-title">Prepared By</div>
    <div class="sig-line">Signature &amp; Date</div>
  </div>
  <div class="sig-block">
    <div class="sig-title">Checked By</div>
    <div class="sig-line">Signature &amp; Date</div>
  </div>
  <div class="sig-block">
    <div class="sig-title">Received By</div>
    <div class="sig-line">Customer Signature &amp; Date</div>
  </div>
</div>

<div class="footer">
  This is a computer-generated document. For any queries, please contact Shofi Traders.
</div>

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
    };

    const inputClass =
        "w-full rounded-md border border-base-300 bg-white px-3 py-2 text-sm text-ink placeholder:text-ink-soft/50 focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary transition-colors";
    const labelClass = "block text-xs font-semibold uppercase tracking-wider text-ink-soft mb-1.5";
    const selectClass =
        "w-full rounded-md border border-base-300 bg-white px-3 py-2 text-sm text-ink focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary transition-colors";

    return (
        <div className="space-y-6">
            {/* Toolbar */}
            <div className="flex items-center justify-between">
                <div>
                    <div className="flex items-center gap-2">
                        <h2 className="text-lg font-semibold text-ink">
                            {editingId ? "Edit Delivery Invoice" : "New Delivery Invoice"}
                        </h2>
                        {editingId && (
                            <span className="badge badge-primary badge-sm">Editing</span>
                        )}
                    </div>
                    <p className="text-xs text-ink-soft">
                        {savedAt ? (
                            <span className="inline-flex items-center gap-1 font-medium text-green-700">
                                <CheckCircle size={14} weight="fill" />
                                Saved {formatDateTime(savedAt)}
                            </span>
                        ) : (
                            "Fill in the details below to generate a professional challan"
                        )}
                    </p>
                </div>
                <div className="flex items-center gap-2">
                    {editingId && (
                        <button
                            type="button"
                            onClick={() => {
                                resetForm();
                                onExitEdit?.();
                            }}
                            className="btn btn-ghost btn-sm gap-1.5 text-ink-soft"
                        >
                            <X size={16} />
                            Cancel
                        </button>
                    )}
                    <button
                        type="button"
                        onClick={resetForm}
                        className="btn btn-ghost btn-sm gap-1.5 text-ink-soft"
                    >
                        <X size={16} />
                        Clear
                    </button>
                    <button
                        type="button"
                        onClick={handlePrint}
                        className="btn btn-outline btn-sm gap-1.5"
                    >
                        <Printer size={16} />
                        Print
                    </button>
                    <button
                        type="submit"
                        form="invoice-form"
                        disabled={loading}
                        className="btn btn-primary btn-sm gap-1.5"
                    >
                        <FloppyDisk size={16} />
                        {loading ? "Saving…" : editingId ? "Update Invoice" : "Save Invoice"}
                    </button>
                </div>
            </div>

            {/* The Invoice Document */}
            <div className="bg-white border border-base-300 rounded-lg shadow-sm">
                {/* Company Header */}
                <div className="flex items-start justify-between px-8 pt-8 pb-5 border-b-2 border-primary">
                    <div className="flex items-center gap-4">
                        <img
                            src="/assets/logo.webp"
                            alt="Shofi Traders"
                            className="h-14 w-auto object-contain"
                        />
                        <div>
                            <h3 className="text-xl font-bold tracking-tight text-ink">
                                SHOFI TRADERS
                            </h3>
                            <p className="text-xs text-ink-soft">
                                Trusted Supplier • Quality Products • Reliable Delivery
                            </p>
                        </div>
                    </div>
                    <div className="text-right text-xs text-ink-soft space-y-0.5">
                        <p>Munshirhat Bazar,Chauddagram,Cumilla</p>
                        <p>+8801311392727</p>
                    </div>
                </div>

                {/* Document Title */}
                <div className="mx-8 -mt-[1px]">
                    <div className="border-2 border-primary py-2.5 text-center">
                        <span className="text-sm font-bold uppercase tracking-[3px] text-primary">
                            Delivery Invoice
                        </span>
                    </div>
                </div>

                <form id="invoice-form" onSubmit={handleSubmit} className="px-8 pb-8">
                    {/* Invoice Details Row */}
                    <div className="grid grid-cols-2 gap-6 mt-6 pb-5 border-b border-dashed border-base-300">
                        <div>
                            <label className={labelClass}>Invoice No.</label>
                            <input
                                className={`${inputClass} disabled:bg-base-200 disabled:text-ink-soft`}
                                placeholder="Auto-generated"
                                value={invoiceNo}
                                disabled
                            />
                        </div>
                        <div className="grid grid-cols-2 gap-3">
                            <div>
                                <label className={labelClass}>Date</label>
                                <input
                                    type="date"
                                    className={inputClass}
                                    value={date}
                                    onChange={(e) => setDate(e.target.value)}
                                    required
                                />
                            </div>
                            <div>
                                <label className={labelClass}>Time</label>
                                <input
                                    type="time"
                                    className={inputClass}
                                    value={time}
                                    onChange={(e) => setTime(e.target.value)}
                                />
                            </div>
                        </div>
                    </div>

                    {/* Bill To / Ship To */}
                    <div className="grid grid-cols-2 gap-6 mt-5">
                        <div className="border border-base-300 rounded-md p-4 bg-base-100/50">
                            <h4 className="text-[10px] font-bold uppercase tracking-[2px] text-ink-soft mb-3">
                                Bill To
                            </h4>
                            <div className="space-y-3">
                                <div>
                                    <label className="text-[11px] font-medium text-ink-soft">
                                        Customer Name <span className="text-error">*</span>
                                    </label>
                                    <input
                                        className={inputClass + " mt-1"}
                                        placeholder="Company or individual name"
                                        value={customerName}
                                        onChange={(e) => setCustomerName(e.target.value)}
                                        required
                                    />
                                </div>
                                <div>
                                    <label className="text-[11px] font-medium text-ink-soft">
                                        Phone / Mobile
                                    </label>
                                    <input
                                        className={inputClass + " mt-1"}
                                        placeholder="Phone number"
                                        value={customerPhone}
                                        onChange={(e) => setCustomerPhone(e.target.value)}
                                    />
                                </div>
                                <div>
                                    <label className="text-[11px] font-medium text-ink-soft">
                                        Billing Address
                                    </label>
                                    <textarea
                                        className={inputClass + " mt-1 resize-none"}
                                        rows={2}
                                        placeholder="Full billing address"
                                        value={billToAddress}
                                        onChange={(e) => setBillToAddress(e.target.value)}
                                    />
                                </div>
                            </div>
                        </div>

                        <div className="border border-base-300 rounded-md p-4 bg-base-100/50">
                            <h4 className="text-[10px] font-bold uppercase tracking-[2px] text-ink-soft mb-3">
                                Ship To / Delivery
                            </h4>
                            <div className="space-y-3">
                                <div>
                                    <label className="text-[11px] font-medium text-ink-soft">
                                        Site Contact No.
                                    </label>
                                    <input
                                        className={inputClass + " mt-1"}
                                        placeholder="Phone number at site"
                                        value={deliveryContact}
                                        onChange={(e) => setDeliveryContact(e.target.value)}
                                    />
                                </div>
                                <div>
                                    <label className="text-[11px] font-medium text-ink-soft">
                                        Delivery Address <span className="text-error">*</span>
                                    </label>
                                    <textarea
                                        className={inputClass + " mt-1 resize-none"}
                                        rows={2}
                                        placeholder="Full delivery address"
                                        value={deliveryAddress}
                                        onChange={(e) => setDeliveryAddress(e.target.value)}
                                        required
                                    />
                                </div>
                                <div>
                                    <label className="text-[11px] font-medium text-ink-soft">
                                        Delivery From
                                    </label>
                                    <input
                                        className={inputClass + " mt-1"}
                                        value={deliveryFrom}
                                        onChange={(e) => setDeliveryFrom(e.target.value)}
                                    />
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Items Table */}
                    <div className="mt-6">
                        <h4 className="text-[10px] font-bold uppercase tracking-[2px] text-ink-soft mb-3">
                            Items / Goods Description
                        </h4>
                        <div className="overflow-x-auto border border-base-300 rounded-md">
                            <table className="w-full text-xs">
                                <thead>
                                    <tr className="bg-primary text-primary-content">
                                        <th className="p-2.5 text-center font-semibold w-10">#</th>
                                        <th className="p-2.5 text-left font-semibold min-w-[200px]">
                                            Name of Goods
                                        </th>
                                        <th className="p-2.5 text-right font-semibold">Bundle</th>
                                        <th className="p-2.5 text-right font-semibold">Pcs</th>
                                        <th className="p-2.5 text-right font-semibold">Weight</th>
                                        <th className="p-2.5 text-left font-semibold">Type</th>
                                        <th className="p-2.5 text-right font-semibold">Rate (৳)</th>
                                        <th className="p-2.5 text-right font-semibold">Discount (%)</th>
                                        <th className="p-2.5 text-right font-semibold">Amount (৳)</th>
                                        <th className="p-2.5 w-10"></th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-base-200">
                                    {items.map((it, idx) => (
                                        <tr
                                            key={idx}
                                            className="hover:bg-base-100/70 transition-colors"
                                        >
                                            <td className="p-2 text-ink-soft font-medium text-center">
                                                {it.sr}
                                            </td>
                                            <td className="p-1.5">
                                                <input
                                                    className="w-full rounded border border-base-300 bg-white px-2 py-1.5 text-xs focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary transition-colors"
                                                    value={it.name}
                                                    onChange={(e) => updateItem(idx, "name", e.target.value)}
                                                    placeholder="Item description"
                                                />
                                            </td>
                                            <td className="p-1.5">
                                                <input
                                                    type="number"
                                                    className="w-16 rounded border border-base-300 bg-white px-2 py-1.5 text-xs text-right focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary transition-colors"
                                                    value={it.bundle}
                                                    onChange={(e) => updateItem(idx, "bundle", e.target.value)}
                                                    placeholder="0"
                                                />
                                            </td>
                                            <td className="p-1.5">
                                                <input
                                                    type="number"
                                                    className="w-16 rounded border border-base-300 bg-white px-2 py-1.5 text-xs text-right focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary transition-colors"
                                                    value={it.pcs}
                                                    onChange={(e) => updateItem(idx, "pcs", e.target.value)}
                                                    placeholder="0"
                                                />
                                            </td>
                                            <td className="p-1.5">
                                                <input
                                                    type="number"
                                                    className="w-20 rounded border border-base-300 bg-white px-2 py-1.5 text-xs text-right focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary transition-colors"
                                                    value={it.weight}
                                                    onChange={(e) => updateItem(idx, "weight", e.target.value)}
                                                    placeholder="0.00"
                                                    step="0.01"
                                                />
                                            </td>
                                            <td className="p-1.5">
                                                <select
                                                    className={selectClass + " text-xs py-1.5"}
                                                    value={it.pricingType}
                                                    onChange={(e) =>
                                                        updateItem(idx, "pricingType", e.target.value as PricingType)
                                                    }
                                                >
                                                    <option value="weight">Weight</option>
                                                    <option value="pcs">Pcs</option>
                                                </select>
                                            </td>
                                            <td className="p-1.5">
                                                <input
                                                    type="number"
                                                    className="w-24 rounded border border-base-300 bg-white px-2 py-1.5 text-xs text-right focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary transition-colors"
                                                    value={it.rate}
                                                    onChange={(e) => updateItem(idx, "rate", e.target.value)}
                                                    placeholder="0.00"
                                                    step="0.01"
                                                />
                                            </td>
                                            <td className="p-1.5">
                                                <div className="relative">
                                                    <input
                                                        type="number"
                                                        min="0"
                                                        max="100"
                                                        className="w-20 rounded border border-base-300 bg-white pl-2 pr-6 py-1.5 text-xs text-right focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary transition-colors"
                                                        value={it.discount}
                                                        onChange={(e) => updateItem(idx, "discount", e.target.value)}
                                                        placeholder="0"
                                                        step="0.01"
                                                    />
                                                    <span className="absolute inset-y-0 right-2 flex items-center text-xs text-ink-soft pointer-events-none">
                                                        %
                                                    </span>
                                                </div>
                                            </td>
                                            <td className="p-1.5 text-right">
                                                <span className="text-xs font-semibold text-ink tabular-nums">
                                                    {itemAmounts[idx]
                                                        ? "৳ " + itemAmounts[idx].toLocaleString("en-IN", {
                                                            minimumFractionDigits: 2,
                                                            maximumFractionDigits: 2,
                                                        })
                                                        : "—"}
                                                </span>
                                            </td>
                                            <td className="p-1.5 text-center">
                                                {items.length > 1 && (
                                                    <button
                                                        type="button"
                                                        onClick={() => removeItem(idx)}
                                                        className="text-error/60 hover:text-error transition-colors p-1"
                                                        title="Remove item"
                                                    >
                                                        <Trash size={14} />
                                                    </button>
                                                )}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                        <button
                            type="button"
                            onClick={addItem}
                            className="mt-2 flex items-center gap-1.5 text-xs font-medium text-primary hover:text-primary/80 transition-colors py-1.5 px-2 rounded-md hover:bg-primary/5"
                        >
                            <Plus size={14} />
                            Add Item Row
                        </button>
                    </div>

                    {/* Pricing Section */}
                    <div className="mt-5 pt-5 border-t border-dashed border-base-300">
                        <h4 className="text-[10px] font-bold uppercase tracking-[2px] text-ink-soft mb-3">
                            Pricing
                        </h4>
                        <div className="grid grid-cols-2 gap-6">
                            <div className="space-y-3">
                                <div>
                                    <label className="text-[11px] font-medium text-ink-soft">
                                        Previous Due
                                    </label>
                                    <input
                                        type="number"
                                        className={inputClass + " mt-1"}
                                        placeholder="0.00"
                                        value={previousDue}
                                        onChange={(e) => setPreviousDue(e.target.value)}
                                        step="0.01"
                                    />
                                </div>
                                <div>
                                    <label className="text-[11px] font-medium text-ink-soft">
                                        Current Payment
                                    </label>
                                    <input
                                        type="number"
                                        className={inputClass + " mt-1"}
                                        placeholder="0.00"
                                        value={currentPayment}
                                        onChange={(e) => setCurrentPayment(e.target.value)}
                                        step="0.01"
                                    />
                                </div>
                            </div>
                            <div className="flex justify-end">
                                <div className="w-64 space-y-2">
                                    <div className="flex justify-between text-sm">
                                        <span className="text-ink-soft">Sub Total</span>
                                        <span className="font-semibold text-ink tabular-nums">
                                            ৳ {subTotal.toLocaleString("en-IN", {
                                                minimumFractionDigits: 2,
                                                maximumFractionDigits: 2,
                                            })}
                                        </span>
                                    </div>
                                    {prevDue > 0 && (
                                        <div className="flex justify-between text-sm">
                                            <span className="text-ink-soft">Previous Due</span>
                                            <span className="font-medium text-orange-700 tabular-nums">
                                                ৳ {prevDue.toLocaleString("en-IN", {
                                                    minimumFractionDigits: 2,
                                                    maximumFractionDigits: 2,
                                                })}
                                            </span>
                                        </div>
                                    )}
                                    {currPayment > 0 && (
                                        <div className="flex justify-between text-sm">
                                            <span className="text-ink-soft">Current Payment</span>
                                            <span className="font-medium text-green-700 tabular-nums">
                                                − ৳ {currPayment.toLocaleString("en-IN", {
                                                    minimumFractionDigits: 2,
                                                    maximumFractionDigits: 2,
                                                })}
                                            </span>
                                        </div>
                                    )}
                                    <div className="flex justify-between border-t-2 border-primary pt-2 text-base">
                                        <span className="font-bold text-ink">Remaining Total</span>
                                        <span className="font-bold text-primary tabular-nums">
                                            ৳ {remainingTotal.toLocaleString("en-IN", {
                                                minimumFractionDigits: 2,
                                                maximumFractionDigits: 2,
                                            })}
                                        </span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Total Amount in Words */}
                    <div className="mt-4">
                        <label className={labelClass}>Total Amount in Words</label>
                        <div className="w-full rounded-md border border-base-300 bg-base-100 px-3 py-2 text-sm text-ink font-medium">
                            {amountInWords}
                        </div>
                    </div>

                    {/* Delivery Note */}
                    <div className="mt-4">
                        <label className={labelClass}>Delivery Note / Remarks</label>
                        <textarea
                            className={inputClass + " resize-none"}
                            rows={2}
                            placeholder="Any special instructions or remarks…"
                            value={deliveryNote}
                            onChange={(e) => setDeliveryNote(e.target.value)}
                        />
                    </div>

                    {/* Signature Blocks */}
                    <div className="mt-8 pt-5 border-t border-base-300">
                        <div className="grid grid-cols-3 gap-8">
                            <div className="text-center">
                                <p className="text-[10px] font-semibold uppercase tracking-wider text-ink-soft mb-8">
                                    Prepared By
                                </p>
                                <div className="border-t border-ink/30 pt-2">
                                    <p className="text-xs text-ink-soft">Signature & Date</p>
                                </div>
                            </div>
                            <div className="text-center">
                                <p className="text-[10px] font-semibold uppercase tracking-wider text-ink-soft mb-8">
                                    Checked By
                                </p>
                                <div className="border-t border-ink/30 pt-2">
                                    <p className="text-xs text-ink-soft">Signature & Date</p>
                                </div>
                            </div>
                            <div className="text-center">
                                <p className="text-[10px] font-semibold uppercase tracking-wider text-ink-soft mb-8">
                                    Received By
                                </p>
                                <div className="border-t border-ink/30 pt-2">
                                    <p className="text-xs text-ink-soft">Customer Signature & Date</p>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Footer */}
                    <div className="mt-6 pt-4 border-t border-base-200 text-center">
                        <p className="text-[10px] text-ink-soft/60">
                            This is a computer-generated document. For any queries, please contact Shofi Traders.
                        </p>
                    </div>
                </form>
            </div>
        </div>
    );
}