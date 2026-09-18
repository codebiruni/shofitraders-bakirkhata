"use server";

import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { bulkMessageSchema } from "@/lib/validators";
import { findBorrowersWithPhone } from "@/lib/queries";
import { isSmsConfigured, sendSms } from "@/lib/sms";
import type { ActionResult } from "@/lib/types";

export interface BulkMessageResult {
  /** Number of customers that had a phone number and were attempted. */
  total: number;
  /** SMS accepted by the gateway. */
  sent: number;
  /** Deliveries the gateway rejected or that errored. */
  failed: number;
  /** Recipients skipped (no usable phone number). */
  skipped: number;
  /** Names of the customers whose SMS failed, for a quick summary. */
  failedNames: string[];
}

const DELAY_BETWEEN_SMS_MS = 150;

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Send one message to every customer that has a phone number.
 *
 * The message is delivered customer-by-customer (sequentially) so the SMS
 * gateway is not flooded. Individual failures are collected and reported
 * instead of aborting the whole batch.
 */
export async function sendBulkMessage(
  formData: FormData
): Promise<ActionResult<BulkMessageResult>> {
  // Server Actions are reachable via direct POST requests, so authentication
  // is verified here and not only in the page/middleware that renders the UI.
  const session = await getServerSession(authOptions);
  if (!session) {
    return { ok: false, error: "You are not signed in. Please sign in again." };
  }

  const parsed = bulkMessageSchema.safeParse({
    message: formData.get("message")?.toString() ?? "",
  });
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Invalid message" };
  }

  if (!isSmsConfigured()) {
    return {
      ok: false,
      error:
        "SMS is not configured. Add SMS_API_KEY, SMS_SECRET_KEY and SMS_CALLER_ID to .env.local.",
    };
  }

  let recipients;
  try {
    recipients = await findBorrowersWithPhone();
  } catch (err) {
    console.error("[sendBulkMessage] loading recipients failed", err);
    return { ok: false, error: "Could not load customers. Please try again." };
  }

  const message = parsed.data.message;
  const failedNames: string[] = [];
  let sent = 0;
  let failed = 0;
  let skipped = 0;

  for (let i = 0; i < recipients.length; i += 1) {
    const borrower = recipients[i];
    const phone = borrower.phone?.trim();
    if (!phone) {
      skipped += 1;
      continue;
    }

    const result = await sendSms(phone, message);
    if (result.ok) {
      sent += 1;
    } else {
      failed += 1;
      failedNames.push(borrower.name);
    }

    // Small pause between messages to stay friendly with the gateway.
    if (i < recipients.length - 1) await sleep(DELAY_BETWEEN_SMS_MS);
  }

  return {
    ok: true,
    data: {
      total: recipients.length,
      sent,
      failed,
      skipped,
      failedNames,
    },
  };
}
