// The ErrorResponse class extends the Error class and uses it for custom error handling 
// The Error object has 2 properties: name and message
class ErrorResponse extends Error {
  constructor(message, statusCode) {
    // By calling the super method, we call the parent's constructor method
    // and gets access to the parent's properties and methods
    // So the message argument inside the super method is the initial argument of the parent's constructor

    super(message);
    this.statusCode = statusCode;
  }
}

module.exports = ErrorResponse;
