import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/mongodb";
import { ObjectId } from "mongodb";
import type { Invoice } from "@/lib/types";

export async function GET(
    _req: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;
        const db = await getDb();
        const invoice = await db
            .collection<Invoice>("invoices")
            .findOne({ _id: id });

        if (!invoice) {
            return NextResponse.json(
                { ok: false, error: "Invoice not found" },
                { status: 404 }
            );
        }

        return NextResponse.json({ ok: true, data: invoice });
    } catch (err) {
        console.error("[GET /api/invoices/[id]]", err);
        return NextResponse.json(
            { ok: false, error: "Failed to load invoice" },
            { status: 500 }
        );
    }
}

export async function PATCH(
    req: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;
        const data = await req.json();
        const now = new Date();

        const { _id, createdAt, ...rest } = data ?? {};
        const fields = {
            ...rest,
            date: data?.date ? new Date(data.date) : new Date(),
            time:
                typeof data?.time === "string" && data.time
                    ? data.time
                    : now.toTimeString().slice(0, 5),
            updatedAt: now,
        };

        const db = await getDb();
        const result = await db
            .collection<Invoice>("invoices")
            .updateOne({ _id: id }, { $set: fields });

        if (result.matchedCount === 0) {
            return NextResponse.json(
                { ok: false, error: "Invoice not found" },
                { status: 404 }
            );
        }

        const invoice = await db
            .collection<Invoice>("invoices")
            .findOne({ _id: id });

        return NextResponse.json({ ok: true, data: invoice });
    } catch (err) {
        console.error("[PATCH /api/invoices/[id]]", err);
        return NextResponse.json(
            { ok: false, error: "Failed to update invoice" },
            { status: 500 }
        );
    }
}