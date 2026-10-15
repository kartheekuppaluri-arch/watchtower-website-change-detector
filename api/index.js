// Vercel Serverless Function entry point
//
// Vercel invokes this file for every request matched by vercel.json rewrites.
// The Express app exported here acts as the handler function.
// Vercel preserves the original request URL (e.g., /api/monitors) via rewrites,
// so the Express router can match routes normally.

const app = require('../server/index');

module.exports = app;
