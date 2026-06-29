"use strict";

function notFoundHandler(req, res) {
  return res.status(404).json({ message: "Resource not found" });
}

function safeErrorHandler(err, _req, res, next) {
  void next;
  const statusCode = Number.isInteger(err?.statusCode) ? err.statusCode : 500;
  const publicMessage =
    statusCode >= 500 ? "Something went wrong. Please try again." : err?.message || "Request failed";

  if (statusCode >= 500) {
    console.error("Unhandled server error:", err);
  } else {
    console.warn("Handled request error:", err?.message || err);
  }

  return res.status(statusCode).json({ message: publicMessage });
}

module.exports = { notFoundHandler, safeErrorHandler };
