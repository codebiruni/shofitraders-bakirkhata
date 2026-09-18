/**
 * SMS helper for Sonali SMS (sonalisms.com).
 *
 * All credentials are read from environment variables so they stay out of
 * source control. Configure them in .env.local:
 *
 *   SMS_API_URL=http://103.177.125.106:7788/sendtext
 *   SMS_API_KEY=...
 *   SMS_SECRET_KEY=...
 *   SMS_CALLER_ID=...        sender ID, either an approved mask such as
 *                            "Shofi Trade" or a phone number.
 *
 * Use the gateway IP, not `api.sonalisms.com`: that hostname answers
 * "ACCEPTD" but does not deliver the message, which is a silent failure.
 *
 * The gateway always answers with HTTP 200, so the verdict has to be read from
 * the JSON body — see `parseGatewayResponse`.
 */

interface SmsConfig {
    url: string;
    apiKey: string | undefined;
    secretKey: string | undefined;
    callerId: string | undefined;
}

function smsConfig(): SmsConfig {
    // No fallback host on purpose: silently defaulting to the wrong gateway
    // produced "accepted" messages that were never delivered.
    return {
        url: process.env.SMS_API_URL ?? "",
        apiKey: process.env.SMS_API_KEY,
        secretKey: process.env.SMS_SECRET_KEY,
        callerId: process.env.SMS_CALLER_ID,
    };
}

export function isSmsConfigured(): boolean {
    const c = smsConfig();
    return Boolean(c.url && c.apiKey && c.secretKey && c.callerId);
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

/**
 * Bangladeshi mobile numbers are `01[3-9]` plus 8 more digits, so in
 * international form `8801[3-9]` plus 8 digits.
 *
 * Worth checking locally: the gateway answers `ACCEPTD` even for numbers it
 * cannot possibly route (it accepts `12345`), so without this the app would
 * report a bogus number as sent.
 */
const BD_MOBILE_PATTERN = /^8801[3-9]\d{8}$/;

export function isValidBdMobile(phone: string): boolean {
    return BD_MOBILE_PATTERN.test(phone);
}

export interface SmsResult {
    ok: boolean;
    /** HTTP status code returned by the gateway (always 200 on success paths). */
    httpStatus?: number;
    /** Raw response body, kept for diagnosing failures. */
    body?: string;
    /** Gateway `Status` field: "0" ok, "109" invalid credentials, "114" bad parameter. */
    gatewayStatus?: string;
    /** Gateway `Text` field: "ACCEPTD" or "REJECTD". */
    gatewayText?: string;
    /** Gateway `Message_ID`, only present when the message was accepted. */
    messageId?: string;
    error?: string;
}

/** Gateway verdict meaning the message was queued for delivery. */
const GATEWAY_ACCEPTED = "ACCEPTD";

interface GatewayResponse {
    gatewayStatus?: string;
    gatewayText?: string;
    messageId?: string;
}

function asString(value: unknown): string | undefined {
    return typeof value === "string" ? value : undefined;
}

/**
 * The gateway replies with JSON such as
 * `{"Status":"0","Text":"ACCEPTD","Message_ID":"1280767384"}` — and it returns
 * HTTP 200 even for failures (invalid keys, rejected recipients), so the body
 * is the only reliable signal. Unparseable bodies report no verdict, which the
 * caller treats as a failure instead of assuming success.
 */
function parseGatewayResponse(body: string): GatewayResponse {
    let parsed: unknown;
    try {
        parsed = JSON.parse(body);
    } catch {
        return {};
    }
    if (typeof parsed !== "object" || parsed === null) return {};
    const record = parsed as Record<string, unknown>;
    return {
        gatewayStatus: asString(record.Status),
        gatewayText: asString(record.Text),
        messageId: asString(record.Message_ID),
    };
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

    if (!config.url || !config.apiKey || !config.secretKey || !config.callerId) {
        console.warn(
            `[sms] not configured (SMS_API_URL / SMS_API_KEY / SMS_SECRET_KEY / SMS_CALLER_ID missing) — skipping send to ${toUser}`
        );
        return { ok: false, error: "SMS not configured" };
    }

    const phone = normalizePhone(toUser);
    if (!isValidBdMobile(phone)) {
        console.error(
            `[sms] invalid Bangladeshi mobile number: "${toUser}" normalized to "${phone}"`
        );
        return { ok: false, error: `Invalid Bangladeshi mobile number: ${toUser}` };
    }

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
        const gateway = parseGatewayResponse(body);
        const accepted = res.ok && gateway.gatewayText === GATEWAY_ACCEPTED;

        // Log one pre-formatted string on purpose: Next's dev logger renders
        // plain objects as "{}", which previously hid the gateway's verdict.
        console.log(
            `[sms] ${accepted ? "accepted" : "FAILED"} to=${phone} callerID=${config.callerId} http=${res.status} status=${gateway.gatewayStatus ?? "-"} text=${gateway.gatewayText ?? "-"} id=${gateway.messageId ?? "-"}`
        );
        if (!accepted) {
            console.error(`[sms] gateway response body: ${body}`);
        }

        const result: SmsResult = {
            ok: accepted,
            httpStatus: res.status,
            body,
            gatewayStatus: gateway.gatewayStatus,
            gatewayText: gateway.gatewayText,
            messageId: gateway.messageId,
        };
        if (!accepted) {
            result.error = `${gateway.gatewayText ?? `HTTP ${res.status}`}${gateway.gatewayStatus ? ` (Status ${gateway.gatewayStatus})` : ""
                }`;
        }
        return result;
    } catch (err) {
        const message = err instanceof Error ? err.message : String(err);
        console.error(`[sms] request failed to=${phone}: ${message}`);
        return { ok: false, error: message };
    }
}
