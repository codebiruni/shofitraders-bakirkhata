/**
 * SMS helper for Sonali SMS (sonalisms.com).
 *
 * All credentials are read from environment variables so they stay out of
 * source control. Configure them in .env.local:
 *
 *   SMS_API_URL=http://api.sonalisms.com:7788/sendtext
 *   SMS_API_KEY=...
 *   SMS_SECRET_KEY=...
 *   SMS_CALLER_ID=...        (the sender phone number, e.g. 01764047140)
 */

interface SmsConfig {
    url: string;
    apiKey: string | undefined;
    secretKey: string | undefined;
    callerId: string | undefined;
}

function smsConfig(): SmsConfig {
    return {
        url: process.env.SMS_API_URL ?? "http://api.sonalisms.com:7788/sendtext",
        apiKey: process.env.SMS_API_KEY,
        secretKey: process.env.SMS_SECRET_KEY,
        callerId: process.env.SMS_CALLER_ID,
    };
}

export function isSmsConfigured(): boolean {
    const c = smsConfig();
    return Boolean(c.apiKey && c.secretKey && c.callerId);
}

/**
 * Normalize a Bangladeshi phone number to international format.
 * "01764047140" -> "8801764047140"
 * "8801764047140" stays as-is.
 */
export function normalizePhone(phone: string): string {
    let digits = phone.replace(/\D/g, "");
    if (digits.startsWith("880")) return digits;
    if (digits.startsWith("0")) digits = digits.slice(1);
    return "880" + digits;
}

export interface SmsResult {
    ok: boolean;
    status?: number;
    body?: string;
    error?: string;
}

/**
 * Send an SMS message. Never throws — always resolves to a result object so
 * callers can safely fire-and-forget without risking an unhandled rejection.
 */
export async function sendSms(
    toUser: string,
    messageContent: string
): Promise<SmsResult> {
    const config = smsConfig();

    if (!config.apiKey || !config.secretKey || !config.callerId) {
        console.warn("[sms] SMS not configured. Skipping send.", { toUser });
        return { ok: false, error: "SMS not configured" };
    }

    const phone = normalizePhone(toUser);
    const params = new URLSearchParams({
        apikey: config.apiKey,
        secretkey: config.secretKey,
        callerID: config.callerId,
        toUser: phone,
        messageContent,
    });

    try {
        const res = await fetch(`${config.url}?${params.toString()}`);
        const body = await res.text();
        console.log("[sms] send", { toUser: phone, status: res.status, body });
        return { ok: res.ok, status: res.status, body };
    } catch (err) {
        const message = err instanceof Error ? err.message : String(err);
        console.error("[sms] send failed", err);
        return { ok: false, error: message };
    }
}
