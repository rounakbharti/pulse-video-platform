'use strict';

/**
 * Safely extract a plain ObjectId string from a field that may be:
 *  - A raw ObjectId        (e.g. from the JWT or unpopulated doc)
 *  - A populated document  (e.g. { _id: ObjectId, name: '...' })
 *  - A plain string
 *
 * This is needed because authenticate.js calls .populate('tenantId')
 * for the Navbar UX, which turns tenantId into a full sub-document.
 */
const extractId = (field) => {
  if (!field) return null;
  // Populated document — grab the _id
  if (field._id) return field._id.toString();
  // Raw ObjectId or string
  return field.toString();
};

module.exports = { extractId };
