const ErrorResponse = require("../utils/errorResponse");


// When you call next with an error object, it automatically gets send to the errorHandler middleware

const errorHandler = (err, req, res, next) => {
//   the error variable is created that has full acces to the properties of the err object
    let error = { ...err };

  error.message = err.message;
  
  if (err.code === 11000) {
    const message = `Duplicate Field Value Enter`;
    error = new ErrorResponse(message, 400);
  }

  if(err.name === "ValidationError"){
      const message = Object.values(err.errors).map(val=>val.message)
      error = new ErrorResponse(message,400)
  }
// If no statusCode is given, then there is prolly a server error
// So always have a backup value if no statusCode of message is given
  res.status(err.statusCode || 500).json({
      succes: false,
      error: error.message || "Server Error"
  })
};

module.exports = errorHandler
