function timestamp() {
  return new Date().toISOString();
}

function sendSuccess(res, data, message, status = 200) {
  const body = {
    success: true,
    data,
    timestamp: timestamp(),
  };
  if (message) body.message = message;
  return res.status(status).json(body);
}

function sendError(res, code, message, httpStatus = 400, details) {
  return res.status(httpStatus).json({
    success: false,
    error: {
      code: code || "ERROR",
      message,
      ...(details && { details }),
    },
    timestamp: timestamp(),
  });
}

module.exports = { sendSuccess, sendError, timestamp };
