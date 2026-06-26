'use strict';

const crypto = require('crypto');

/**
 * License Key Library
 * 
 * Generates and validates cryptographically-signed license keys for software products.
 * Keys are self-contained (no database needed to validate) and tamper-proof (HMAC-signed).
 * 
 * Format: LIC-{base64url(payload)}-{base64url(signature)}
 * Payload is a compact JSON object: { p: productId, t: tier, f: features, e: expiryTs, a: activationsLimit }
 */

const LICENSE_PREFIX = 'LIC-';
const ALGORITHM = 'sha256';

/**
 * Generate a cryptographically-signed license key.
 * @param {Object} opts
 * @param {string} opts.productId - Product identifier (e.g. "env-sync")
 * @param {string} opts.tier - License tier: "pro", "team", "enterprise"
 * @param {string[]} opts.features - Feature flags this license grants
 * @param {number} opts.days - Validity period in days from now
 * @param {number} [opts.activations=3] - Max machine activations allowed
 * @param {string} secretKey - HMAC secret key (keep private)
 * @returns {string} The license key string
 */
function generateLicense(opts, secretKey) {
  if (!opts.productId) throw new Error('productId is required');
  if (!opts.tier) throw new Error('tier is required');
  if (!opts.days || opts.days <= 0) throw new Error('days must be a positive number');
  if (!secretKey) throw new Error('secretKey is required');

  const payload = {
    p: opts.productId,
    t: opts.tier,
    f: opts.features || [],
    e: Date.now() + opts.days * 24 * 60 * 60 * 1000,
    a: opts.activations || 3,
  };

  const payloadStr = JSON.stringify(payload);
  const payloadB64 = Buffer.from(payloadStr, 'utf8').toString('base64url');
  const signature = crypto
    .createHmac(ALGORITHM, secretKey)
    .update(payloadB64)
    .digest('base64url');

  return `${LICENSE_PREFIX}${payloadB64}.${signature}`;
}

/**
 * Parse and validate a license key's signature and expiry.
 * Does NOT check activation count (that requires server state).
 * @param {string} key - The license key string
 * @param {string} secretKey - The same HMAC secret used to generate
 * @returns {{ valid: boolean, payload: Object|null, error: string|null }}
 */
function validateLicense(key, secretKey) {
  if (!key || typeof key !== 'string') {
    return { valid: false, payload: null, error: 'Key is empty or not a string' };
  }

  if (!key.startsWith(LICENSE_PREFIX)) {
    return { valid: false, payload: null, error: `Key must start with ${LICENSE_PREFIX}` };
  }

  const body = key.slice(LICENSE_PREFIX.length);
  const sepIdx = body.lastIndexOf('.');
  if (sepIdx === -1) {
    return { valid: false, payload: null, error: 'Invalid key format: missing signature' };
  }

  const payloadB64 = body.slice(0, sepIdx);
  const signature = body.slice(sepIdx + 1);

  // Verify signature
  const expectedSig = crypto
    .createHmac(ALGORITHM, secretKey)
    .update(payloadB64)
    .digest('base64url');

  // Timing-safe comparison
  const sigBuf = Buffer.from(signature);
  const expBuf = Buffer.from(expectedSig);
  if (sigBuf.length !== expBuf.length || !crypto.timingSafeEqual(sigBuf, expBuf)) {
    return { valid: false, payload: null, error: 'Invalid signature: key may be forged or corrupted' };
  }

  // Parse payload
  let payload;
  try {
    const payloadStr = Buffer.from(payloadB64, 'base64url').toString('utf8');
    payload = JSON.parse(payloadStr);
  } catch (err) {
    return { valid: false, payload: null, error: 'Invalid payload: cannot decode' };
  }

  // Validate payload fields
  if (!payload.p || !payload.t) {
    return { valid: false, payload: null, error: 'Invalid payload: missing required fields' };
  }

  // Check expiry
  if (payload.e && Date.now() > payload.e) {
    return {
      valid: false,
      payload,
      error: `License expired on ${new Date(payload.e).toISOString()}`,
    };
  }

  return { valid: true, payload, error: null };
}

/**
 * Decode a key payload WITHOUT validating (for display/debugging only).
 * @param {string} key
 * @returns {Object|null}
 */
function decodePayload(key) {
  try {
    if (!key || !key.startsWith(LICENSE_PREFIX)) return null;
    const body = key.slice(LICENSE_PREFIX.length);
    const sepIdx = body.lastIndexOf('.');
    if (sepIdx === -1) return null;
    const payloadB64 = body.slice(0, sepIdx);
    const payloadStr = Buffer.from(payloadB64, 'base64url').toString('utf8');
    return JSON.parse(payloadStr);
  } catch {
    return null;
  }
}

/**
 * Format a license payload into a human-readable response object.
 * @param {Object} payload
 * @param {number} [activationsUsed]
 * @returns {Object}
 */
function formatLicenseResponse(payload, activationsUsed) {
  return {
    valid: true,
    productId: payload.p,
    tier: payload.t,
    features: payload.f || [],
    expiresAt: payload.e ? new Date(payload.e).toISOString() : null,
    activationsUsed: activationsUsed !== undefined ? activationsUsed : undefined,
    activationsLimit: payload.a || undefined,
  };
}

module.exports = {
  generateLicense,
  validateLicense,
  decodePayload,
  formatLicenseResponse,
  LICENSE_PREFIX,
  ALGORITHM,
};
