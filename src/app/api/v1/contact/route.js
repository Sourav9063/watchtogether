import nodemailer from "nodemailer";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const LOCAL_SECURITY_HEADER = "x-contact-api-key";
const MAX_NAME_LENGTH = 100;
const MAX_EMAIL_LENGTH = 254;
const MAX_SUBJECT_LENGTH = 150;
const MAX_MESSAGE_LENGTH = 5000;

function getEnvList(key) {
  return (process.env[key] || "")
    .split(",")
    .map((origin) => origin.trim())
    .filter(Boolean);
}

function getAllowedOrigins() {
  return getEnvList("CONTACT_ALLOWED_ORIGINS");
}

function getLocalOrigins() {
  return getEnvList("CONTACT_LOCAL_ORIGINS");
}

function getCorsHeaders(origin) {
  return {
    "Access-Control-Allow-Origin": origin,
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Access-Control-Allow-Headers": `Content-Type, ${LOCAL_SECURITY_HEADER}`,
    "Access-Control-Max-Age": "86400",
    Vary: "Origin",
  };
}

function getOrigin(request) {
  return request.headers.get("origin") || "";
}

function getResponseHeaders(origin) {
  return {
    ...getCorsHeaders(origin),
    "X-Content-Type-Options": "nosniff",
    "Referrer-Policy": "no-referrer",
  };
}

function isAllowedOrigin(request) {
  const origin = getOrigin(request);

  return getAllowedOrigins().includes(origin);
}

function hasValidLocalSecurityHeader(request) {
  if (!getLocalOrigins().includes(getOrigin(request))) {
    return true;
  }

  const localApiKey = process.env.CONTACT_LOCAL_API_KEY;

  return (
    Boolean(localApiKey) &&
    request.headers.get(LOCAL_SECURITY_HEADER) === localApiKey
  );
}

function jsonResponse(request, body, status) {
  return Response.json(body, {
    status,
    headers: getResponseHeaders(getOrigin(request)),
  });
}

function getRequiredEnv(key) {
  const value = process.env[key];

  if (!value) {
    throw new Error(`${key} missing`);
  }

  return value;
}

function sanitizeHeaderValue(value) {
  return String(value || "").replace(/[\r\n]/g, " ").trim();
}

function isValidEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

function getValidationError({ name, email, subject, message }) {
  if (!email || !message) {
    return "Email and message are required";
  }

  if (name.length > MAX_NAME_LENGTH) {
    return `Name must be ${MAX_NAME_LENGTH} characters or fewer`;
  }

  if (email.length > MAX_EMAIL_LENGTH || !isValidEmail(email)) {
    return "Email must be a valid email address";
  }

  if (subject.length > MAX_SUBJECT_LENGTH) {
    return `Subject must be ${MAX_SUBJECT_LENGTH} characters or fewer`;
  }

  if (message.length > MAX_MESSAGE_LENGTH) {
    return `Message must be ${MAX_MESSAGE_LENGTH} characters or fewer`;
  }

  return "";
}

function createTransporter() {
  const port = Number(process.env.SMTP_PORT || 587);

  return nodemailer.createTransport({
    host: getRequiredEnv("SMTP_HOST"),
    port,
    secure: process.env.SMTP_SECURE === "true" || port === 465,
    auth: {
      user: getRequiredEnv("SMTP_USER"),
      pass: getRequiredEnv("SMTP_PASS"),
    },
  });
}

export async function OPTIONS(request) {
  if (!isAllowedOrigin(request)) {
    return Response.json({ error: "Forbidden origin" }, { status: 403 });
  }

  return new Response(null, {
    status: 204,
    headers: getResponseHeaders(getOrigin(request)),
  });
}

export async function POST(request) {
  if (!isAllowedOrigin(request)) {
    return Response.json({ error: "Forbidden origin" }, { status: 403 });
  }

  if (!hasValidLocalSecurityHeader(request)) {
    return jsonResponse(request, { error: "Invalid local API key" }, 401);
  }

  let body;

  try {
    body = await request.json();
  } catch {
    return jsonResponse(request, { error: "Invalid JSON body" }, 400);
  }

  const name = sanitizeHeaderValue(body.name);
  const email = sanitizeHeaderValue(body.email);
  const subject = sanitizeHeaderValue(body.subject || "Website contact");
  const message = String(body.message || "").trim();
  const validationError = getValidationError({
    name,
    email,
    subject,
    message,
  });

  if (validationError) {
    return jsonResponse(request, { error: validationError }, 400);
  }

  try {
    const transporter = createTransporter();

    await transporter.sendMail({
      from: getRequiredEnv("MAIL_FROM"),
      to: getRequiredEnv("MAIL_TO"),
      replyTo: email,
      subject,
      text: [
        `Name: ${name || "Not provided"}`,
        `Email: ${email}`,
        "",
        message,
      ].join("\n"),
    });

    return jsonResponse(request, { ok: true }, 200);
  } catch (error) {
    console.error("Contact email failed", error);
    return jsonResponse(request, { error: "Email failed" }, 500);
  }
}
