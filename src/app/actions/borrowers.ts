"use server";

import { ObjectId } from "mongodb";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { getDb } from "@/lib/mongodb";
import {
  borrowerInputSchema,
  objectIdSchema,
} from "@/lib/validators";
import type { ActionResult, Borrower } from "@/lib/types";

const BORROWERS = "borrowers";
const TRANSACTIONS = "transactions";

function bad(message: string): ActionResult<never> {
  return { ok: false, error: message };
}

function ok<T>(data: T): ActionResult<T> {
  return { ok: true, data };
}

function toBorrowerId(): string {
  return new ObjectId().toHexString();
}

function normalizeOptional(value: string | undefined | null): string | undefined {
  if (value === undefined || value === null) return undefined;
  const v = value.trim();
  return v.length === 0 ? undefined : v;
}

export async function createBorrower(formData: FormData): Promise<ActionResult<{ id: string }>> {
  const raw = {
    name: formData.get("name")?.toString() ?? "",
    phone: formData.get("phone")?.toString() ?? "",
    address: formData.get("address")?.toString() ?? "",
    notes: formData.get("notes")?.toString() ?? "",
  };
  const parsed = borrowerInputSchema.safeParse({
    name: raw.name,
    phone: normalizeOptional(raw.phone),
    address: normalizeOptional(raw.address),
    notes: normalizeOptional(raw.notes),
  });
  if (!parsed.success) {
    return bad(parsed.error.issues[0]?.message ?? "Invalid input");
  }

  const now = new Date();
  const id = toBorrowerId();
  const doc: Borrower = {
    _id: id,
    name: parsed.data.name,
    phone: parsed.data.phone,
    address: parsed.data.address,
    notes: parsed.data.notes,
    createdAt: now,
    updatedAt: now,
  };

  try {
    const db = await getDb();
    await db.collection<Borrower>(BORROWERS).insertOne(doc);
  } catch (err) {
    console.error("[createBorrower] failed", err);
    return bad("Something went wrong. Please try again.");
  }

  revalidatePath("/");
  revalidatePath("/borrowers");
  return ok({ id });
}

export async function updateBorrower(
  id: string,
  formData: FormData
): Promise<ActionResult<{ id: string }>> {
  const idCheck = objectIdSchema.safeParse(id);
  if (!idCheck.success) return bad("Invalid borrower id");

  const raw = {
    name: formData.get("name")?.toString() ?? "",
    phone: formData.get("phone")?.toString() ?? "",
    address: formData.get("address")?.toString() ?? "",
    notes: formData.get("notes")?.toString() ?? "",
  };
  const parsed = borrowerInputSchema.safeParse({
    name: raw.name,
    phone: normalizeOptional(raw.phone),
    address: normalizeOptional(raw.address),
    notes: normalizeOptional(raw.notes),
  });
  if (!parsed.success) {
    return bad(parsed.error.issues[0]?.message ?? "Invalid input");
  }

  try {
    const db = await getDb();
    const result = await db.collection<Borrower>(BORROWERS).updateOne(
      { _id: idCheck.data },
      {
        $set: {
          name: parsed.data.name,
          phone: parsed.data.phone ?? undefined,
          address: parsed.data.address ?? undefined,
          notes: parsed.data.notes ?? undefined,
          updatedAt: new Date(),
        },
      }
    );
    if (result.matchedCount === 0) return bad("Borrower not found");
  } catch (err) {
    console.error("[updateBorrower] failed", err);
    return bad("Something went wrong. Please try again.");
  }

  revalidatePath("/");
  revalidatePath("/borrowers");
  revalidatePath(`/borrowers/${id}`);
  return ok({ id });
}

export async function deleteBorrower(id: string): Promise<ActionResult<null>> {
  const idCheck = objectIdSchema.safeParse(id);
  if (!idCheck.success) return bad("Invalid borrower id");

  try {
    const db = await getDb();
    // Cascade delete transactions
    await db.collection(TRANSACTIONS).deleteMany({ borrowerId: idCheck.data });
    const result = await db.collection<Borrower>(BORROWERS).deleteOne({ _id: idCheck.data });
    if (result.deletedCount === 0) return bad("Borrower not found");
  } catch (err) {
    console.error("[deleteBorrower] failed", err);
    return bad("Something went wrong. Please try again.");
  }

  revalidatePath("/");
  revalidatePath("/borrowers");
  revalidatePath("/transactions");
  return ok(null);
}

/**
 * Form action wrapper for create — redirects to the new profile on success.
 */
export async function createBorrowerAndRedirect(formData: FormData): Promise<void> {
  const result = await createBorrower(formData);
  if (result.ok) {
    redirect(`/borrowers/${result.data.id}`);
  }
}
