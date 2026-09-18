/**
 * Send one real SMS through the Sonali SMS gateway and print the verdict.
 *
 * Usage:
 *   node scripts/sms-test.mjs 01764047140
 *
 * Credentials are read from .env.local, so this exercises exactly the same
 * code path as src/lib/sms.ts. Useful when a message "does not fire": the
 * gateway always answers HTTP 200, so the `Text` field is the real result —
 * "ACCEPTD" means it was queued, "REJECTD" means the gateway refused it.
 */
import { readFileSync } from "node:fs";

const phoneArg = process.argv[2];
if (!phoneArg) {
    console.error("Usage: node scripts/sms-test.mjs <phone number>");
    console.error("Example: node scripts/sms-test.mjs 01764047140");
    process.exit(1);
}

// Minimal .env.local loader (no dotenv dependency in this project).
const env = {};
for (const line of readFileSync(new URL("../.env.local", import.meta.url), "utf8").split("\n")) {
    const match = /^\s*([A-Z0-9_]+)\s*=\s*(.*)$/.exec(line);
    if (match) env[match[1]] = match[2].replace(/^["']|["']$/g, "");
}

const url = env.SMS_API_URL;
const missing = ["SMS_API_URL", "SMS_API_KEY", "SMS_SECRET_KEY", "SMS_CALLER_ID"].filter(
    (k) => !env[k]
);
if (missing.length > 0) {
    console.error(`Missing in .env.local: ${missing.join(", ")}`);
    process.exit(1);
}

function normalizePhone(phone) {
    let digits = phone.replace(/\D/g, "");
    if (digits.startsWith("880")) return digits;
    if (digits.startsWith("0")) digits = digits.slice(1);
    return "880" + digits;
}

const toUser = normalizePhone(phoneArg);
const messageContent = `SHOFI TRADERS: test SMS ${new Date().toLocaleString("en-IN")}`;

console.log(`url        : ${url}`);
console.log(`callerID   : ${JSON.stringify(env.SMS_CALLER_ID)}`);
console.log(`toUser     : ${phoneArg} -> ${toUser}`);
console.log(`message    : ${messageContent}`);
console.log("sending...\n");

const params = new URLSearchParams({
    apikey: env.SMS_API_KEY,
    secretkey: env.SMS_SECRET_KEY,
    callerID: env.SMS_CALLER_ID,
    toUser,
    messageContent,
});

const res = await fetch(`${url}?${params.toString()}`);
const body = await res.text();

let parsed = {};
try {
    parsed = JSON.parse(body);
} catch {
    // leave empty — reported below
}

console.log(`http status : ${res.status}`);
console.log(`body        : ${body}`);
console.log(`gateway Text: ${parsed.Text ?? "(unparseable)"}`);
console.log(`message id  : ${parsed.Message_ID || "(none)"}`);
console.log(
    `\nverdict     : ${parsed.Text === "ACCEPTD"
        ? "ACCEPTED by the gateway (check the handset)"
        : "NOT ACCEPTED — see Status/Text above"
    }`
);
if (parsed.Text === "ACCEPTD") {
    console.log(
        "If ACCEPTD but nothing arrives, the sender ID (SMS_CALLER_ID) is not\n" +
        "provisioned for this account, or the account has no SMS balance."
    );
}
