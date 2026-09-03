import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/mongodb";
import { ObjectId } from "mongodb";
import type { Invoice } from "@/lib/types";

export async function POST(req: NextRequest) {
    try {
        const data = await req.json();
        const now = new Date();
        const doc: Invoice = {
            ...data,
            _id: new ObjectId().toHexString(),
            createdAt: now,
            updatedAt: now,
            date: new Date(data.date),
            time:
                typeof data.time === "string" && data.time
                    ? data.time
                    : now.toTimeString().slice(0, 5),
        };
        const db = await getDb();
        await db.collection<Invoice>("invoices").insertOne(doc);
        return NextResponse.json({ ok: true, data: doc });
    } catch (err) {
        console.error("[POST /api/invoices]", err);
        return NextResponse.json({ ok: false, error: "Failed to create invoice" }, { status: 500 });
    }
}

export async function GET() {
    try {
        const db = await getDb();
        const invoices = await db.collection<Invoice>("invoices").find({}).sort({ date: -1 }).toArray();
        return NextResponse.json({ ok: true, data: invoices });
    } catch (err) {
        console.error("[GET /api/invoices]", err);
        return NextResponse.json({ ok: false, error: "Failed to load invoices" }, { status: 500 });
    }
}
