import { getDb } from "./mongodb";
import type { Invoice, InvoiceItem } from "./types";
import { ObjectId } from "mongodb";

export async function createInvoice(data: Omit<Invoice, "_id" | "createdAt" | "updatedAt">) {
    try {
        const db = await getDb();
        const now = new Date();
        const doc: Invoice = {
            ...data,
            time: data.time ?? now.toTimeString().slice(0, 5),
            _id: new ObjectId().toHexString(),
            createdAt: now,
            updatedAt: now,
        };
        await db.collection<Invoice>("invoices").insertOne(doc);
        return { ok: true as const, data: doc };
    } catch (err) {
        console.error("[createInvoice]", err);
        return { ok: false as const, error: "Failed to create invoice" };
    }
}

export async function listInvoices() {
    try {
        const db = await getDb();
        const invoices = await db.collection<Invoice>("invoices").find({}).sort({ date: -1, createdAt: -1 }).toArray();
        return { ok: true as const, data: invoices };
    } catch (err) {
        console.error("[listInvoices]", err);
        return { ok: false as const, error: "Failed to load invoices" };
    }
}

export async function getInvoiceById(id: string) {
    try {
        const db = await getDb();
        const invoice = await db.collection<Invoice>("invoices").findOne({ _id: id });
        return invoice
            ? { ok: true as const, data: invoice }
            : { ok: false as const, error: "Invoice not found" };
    } catch (err) {
        console.error("[getInvoiceById]", err);
        return { ok: false as const, error: "Failed to load invoice" };
    }
}

export async function updateInvoice(
    id: string,
    data: Partial<Omit<Invoice, "_id" | "createdAt" | "updatedAt">>
) {
    try {
        const db = await getDb();
        const now = new Date();
        const result = await db.collection<Invoice>("invoices").updateOne(
            { _id: id },
            { $set: { ...data, time: data.time ?? now.toTimeString().slice(0, 5), updatedAt: now } }
        );
        if (result.matchedCount === 0) {
            return { ok: false as const, error: "Invoice not found" };
        }
        const invoice = await db.collection<Invoice>("invoices").findOne({ _id: id });
        return { ok: true as const, data: invoice! };
    } catch (err) {
        console.error("[updateInvoice]", err);
        return { ok: false as const, error: "Failed to update invoice" };
    }
}
