function errorHandler(err, req, res, next) {
  console.error("[error]", err.message);

  return res.status(500).json({
    message: "Unable to complete this query right now. Please retry in a moment.",
    details: process.env.NODE_ENV === "development" ? err.message : undefined,
  });
}

module.exports = { errorHandler };
