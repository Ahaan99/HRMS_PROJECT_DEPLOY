export const errorMiddleware = (err, req, res, next) => {
  console.log(`ERROR: -- ${err}`);

  res.status(500).json({
    success: false,
    message: err?.message || "Server Error",
  });
};
