import { z } from "zod";

const trimmedString = (max: number, label: string) =>
  z
    .string()
    .trim()
    .max(max, `${label} must be at most ${max} characters`);

// ---- Borrower ----

export const borrowerInputSchema = z.object({
  name: trimmedString(80, "Name").min(1, "Name is required"),
  phone: z
    .string()
    .trim()
    .max(40, "Phone must be at most 40 characters")
    .optional()
    .or(z.literal("").transform(() => undefined)),
  address: z
    .string()
    .trim()
    .max(200, "Address must be at most 200 characters")
    .optional()
    .or(z.literal("").transform(() => undefined)),
  notes: z
    .string()
    .trim()
    .max(500, "Notes must be at most 500 characters")
    .optional()
    .or(z.literal("").transform(() => undefined)),
});

export type BorrowerInput = z.infer<typeof borrowerInputSchema>;

// ---- Transaction ----

const amountSchema = z
  .number({ message: "Amount must be a number" })
  .positive("Amount must be greater than zero")
  .finite("Amount must be a valid number")
  .max(1_000_000_000, "Amount is too large");

const dateSchema = z
  .date({ message: "Invalid date" })
  .refine((d) => d.getTime() <= Date.now() + 24 * 60 * 60 * 1000, {
    message: "Date cannot be in the future",
  });

export const borrowingInputSchema = z.object({
  borrowerId: z.string().min(1, "Borrower is required"),
  amount: amountSchema,
  date: dateSchema,
  note: z
    .string()
    .trim()
    .max(300, "Note must be at most 300 characters")
    .optional()
    .or(z.literal("").transform(() => undefined)),
});

export const paymentInputSchema = z.object({
  borrowerId: z.string().min(1, "Borrower is required"),
  amount: amountSchema,
  date: dateSchema,
  paymentMethod: z.enum(["cash", "bank", "other"], {
    message: "Choose a payment method",
  }),
  note: z
    .string()
    .trim()
    .max(300, "Note must be at most 300 characters")
    .optional()
    .or(z.literal("").transform(() => undefined)),
});

export type BorrowingInput = z.infer<typeof borrowingInputSchema>;
export type PaymentInput = z.infer<typeof paymentInputSchema>;

// ---- ID ----
export const objectIdSchema = z
  .string()
  .regex(/^[a-fA-F0-9]{24}$/, "Invalid id");
