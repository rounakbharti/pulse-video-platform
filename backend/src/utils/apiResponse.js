'use strict';

/**
 * Consistent API response helpers.
 * Every controller uses these so the frontend always gets the same JSON shape.
 *
 * Success:  { success: true,  data: {...},   message: "..." }
 * Error:    { success: false, message: "...", errors: [...] }
 */

const ok = (res, data = {}, message = 'Success', statusCode = 200) =>
  res.status(statusCode).json({ success: true, message, data });

const created = (res, data = {}, message = 'Created') =>
  ok(res, data, message, 201);

const badRequest = (res, message = 'Bad request', errors = []) =>
  res.status(400).json({ success: false, message, errors });

const unauthorized = (res, message = 'Unauthorized') =>
  res.status(401).json({ success: false, message });

const forbidden = (res, message = 'Forbidden') =>
  res.status(403).json({ success: false, message });

const notFound = (res, message = 'Not found') =>
  res.status(404).json({ success: false, message });

const conflict = (res, message = 'Conflict') =>
  res.status(409).json({ success: false, message });

module.exports = { ok, created, badRequest, unauthorized, forbidden, notFound, conflict };
