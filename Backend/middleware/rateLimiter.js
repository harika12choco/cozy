const rateLimit = require("express-rate-limit");

const loginLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 5,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    error: "Too many login attempts. Try again in 1 minute."
  }
});

const writeLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 120,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    error: "Too many requests. Please slow down."
  }
});

/**
 * HIGH-4 FIX: Strict limiter for the public contact form (POST /messages).
 * 5 submissions per 10 minutes per IP prevents spam/flooding.
 */
const messageLimiter = rateLimit({
  windowMs: 10 * 60 * 1000,
  max: 5,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    error: "Too many messages submitted. Please wait 10 minutes before trying again."
  }
});

module.exports = {
  loginLimiter,
  writeLimiter,
  messageLimiter
};
