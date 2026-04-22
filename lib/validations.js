/**
 * lib/validations.js — Reusable validation helpers for route handlers
 *
 * All validators return { valid: boolean, errors: Record<string, string> }.
 * Build payloads with the `parse*` helpers, then pass to `validate*`.
 */

// ─── Primitives ───────────────────────────────────────────────────────────────

export function isEmail(str) {
  return typeof str === 'string' && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(str.trim());
}

export function isPhone(str) {
  return typeof str === 'string' && /^\+?[\d\s\-()]{7,15}$/.test(str.trim());
}

export function isPincode(str) {
  return typeof str === 'string' && /^\d{6}$/.test(str.trim());
}

export function isUrl(str) {
  try {
    new URL(str);
    return true;
  } catch {
    return false;
  }
}

export function isNonEmpty(str) {
  return typeof str === 'string' && str.trim().length > 0;
}

// ─── Validator builder ────────────────────────────────────────────────────────

/**
 * Run a list of checks on a data object.
 * @param {Record<string, any>} data
 * @param {Array<{ field: string, check: (v: any) => boolean, message: string }>} rules
 * @returns {{ valid: boolean, errors: Record<string, string> }}
 */
export function validate(data, rules) {
  const errors = {};
  for (const { field, check, message } of rules) {
    if (!check(data[field])) {
      errors[field] = message;
    }
  }
  return { valid: Object.keys(errors).length === 0, errors };
}

// ─── Domain validators ────────────────────────────────────────────────────────

/**
 * Validate onboarding personal details payload.
 */
export function validatePersonalDetails(data) {
  return validate(data, [
    { field: 'firstName',  check: isNonEmpty,  message: 'First name is required.' },
    { field: 'city',       check: isNonEmpty,  message: 'City is required.' },
    { field: 'pincode',    check: isPincode,   message: 'A valid 6-digit pincode is required.' },
  ]);
}

/**
 * Validate company creation/update payload.
 */
export function validateCompany(data) {
  return validate(data, [
    { field: 'name', check: isNonEmpty, message: 'Company name is required.' },
    { field: 'slug', check: (v) => typeof v === 'string' && /^[a-z0-9-]{3,100}$/.test(v),
      message: 'Slug must be 3–100 lowercase alphanumeric characters or hyphens.' },
    { field: 'city', check: isNonEmpty, message: 'City is required.' },
  ]);
}

/**
 * Validate job creation payload.
 */
export function validateJob(data) {
  return validate(data, [
    { field: 'title',    check: isNonEmpty, message: 'Job title is required.' },
    { field: 'category', check: isNonEmpty, message: 'Job category is required.' },
    { field: 'description', check: (v) => typeof v === 'string' && v.trim().length >= 50,
      message: 'Description must be at least 50 characters.' },
    { field: 'jobType',  check: isNonEmpty, message: 'Job type is required.' },
    { field: 'workMode', check: isNonEmpty, message: 'Work mode is required.' },
  ]);
}

/**
 * Validate job location payload.
 */
export function validateJobLocation(data) {
  return validate(data, [
    { field: 'city',    check: isNonEmpty, message: 'City is required.' },
    { field: 'state',   check: isNonEmpty, message: 'State is required.' },
    { field: 'pincode', check: isPincode,  message: 'A valid 6-digit pincode is required.' },
  ]);
}

/**
 * Validate application submission payload.
 */
export function validateApplication(data) {
  return validate(data, [
    { field: 'jobId', check: isNonEmpty, message: 'Job ID is required.' },
  ]);
}

/**
 * Validate a chat message payload.
 */
export function validateMessage(data) {
  return validate(data, [
    { field: 'body', check: (v) => typeof v === 'string' && v.trim().length > 0,
      message: 'Message body cannot be empty.' },
    { field: 'conversationId', check: isNonEmpty, message: 'Conversation ID is required.' },
  ]);
}

/**
 * Validate a Razorpay payment verification payload.
 */
export function validatePaymentVerification(data) {
  return validate(data, [
    { field: 'razorpayOrderId',   check: isNonEmpty, message: 'Order ID is required.' },
    { field: 'razorpayPaymentId', check: isNonEmpty, message: 'Payment ID is required.' },
    { field: 'razorpaySignature', check: isNonEmpty, message: 'Signature is required.' },
  ]);
}

// ─── Request body parser ──────────────────────────────────────────────────────

/**
 * Safely parse a request body as JSON.
 * Returns null if the body is missing, empty, or malformed.
 *
 * @param {Request} req
 * @returns {Promise<object | null>}
 */
export async function parseBody(req) {
  try {
    const text = await req.text();
    if (!text) return null;
    return JSON.parse(text);
  } catch {
    return null;
  }
}
