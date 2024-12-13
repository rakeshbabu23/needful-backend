const { APIError, BadRequestError } = require("../lib/customError");

const errorMiddleware = async (err, req, res, next) => {
  //console.log("eeeeeeeeeeeeeeeeeeeeeeee", err);
  res.contentBody = {
    status: "error",
    statusCode: err.statusCode || 500,
    error: err.error,
    type: err.statusName || "INTERNAL_SERVER_ERROR",
    message: err.message || "Something went wrong on the server.",
    stack: process.env.NODE_ENV === "development" ? err.stack : {},
  };
  return res.status(err.statusCode).json({
    status: "error",
    statusCode: err.statusCode || 500,
    error: err.error,
    type: err.statusName || "INTERNAL_SERVER_ERROR",
    message: err.message || "Something went wrong on the server.",
    stack: process.env.NODE_ENV === "development" ? err.stack : {},
  });
};

module.exports = { errorMiddleware };
