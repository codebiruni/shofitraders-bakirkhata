import { NextResponse } from "next/server";
import { findBorrowerById, findTransactionsByBorrower } from "@/lib/queries";
import { objectIdSchema } from "@/lib/validators";
import { summarizeTransactions } from "@/lib/calculations";

export const dynamic = "force-dynamic";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const idCheck = objectIdSchema.safeParse(id);
  if (!idCheck.success) {
    return NextResponse.json({ error: "Invalid id" }, { status: 400 });
  }

  try {
    const borrower = await findBorrowerById(idCheck.data);
    if (!borrower) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }
    const txs = await findTransactionsByBorrower(idCheck.data);
    const summary = summarizeTransactions(txs);
    return NextResponse.json({
      ...borrower,
      totalBorrowed: summary.totalBorrowed,
      totalPaid: summary.totalPaid,
      outstanding: summary.outstanding,
      status: summary.status,
    });
  } catch (err) {
    console.error("[api/borrowers/:id] failed", err);
    return NextResponse.json(
      { error: "Something went wrong" },
      { status: 500 }
    );
  }
}
