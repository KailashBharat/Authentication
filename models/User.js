require("dotenv").config({ path: "./config.env" });
const crypto = require("crypto");
const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

const UserSchema = new mongoose.Schema({
  username: {
    type: String,
    required: [true, "Please provide a username"],
  },
  email: {
    type: String,
    required: [true, "Please provide an email"],
    unique: true,
    match: [
      /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9-]+(?:\.[a-zA-Z0-9-]+)*$/,
      "Please provide a valid email",
    ],
  },
  password: {
    type: String,
    required: [true, "Please add a password"],
    minlength: 6,
    select: false,
  },
  resetPasswordToken: String,
  resetPasswordExpire: Date,
});

UserSchema.pre("save", async function (next) {
  // This checks if the password of a certain user has been modified
  // In the getResetPasswordToken method, the user object wil be updated and saved without adding a modified password
  if (!this.isModified("password")) {
    next();
  }
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
  next();
});

// !!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!
// Always use the function keyword to declare functions when using schema-methods

// When the arrow function is used instead of the function keyword, an 'illegal arguments' error is thrown
UserSchema.methods.matchPassword = async function (password) {
  return await bcrypt.compare(password, this.password);
};

// When using the arrow function, the jwt doesn't sign the _id of the object in the payload
// So the bug is fixed when using the "function" keyword to declare a function
UserSchema.methods.getSignedToken = function () {
  // "This" refers to the the object we're calling the getSignedToken method on
  // View the auth controller to see that we're calling the getSignedToken method on the user object

  return jwt.sign({ id: this._id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRE,
  });
};

UserSchema.methods.getResetPasswordToken = function () {

// The use case for this function is to create a token as seen here below
// This token will be hashed and stored in the database
// There also needs to be a expireToken for the duration of the resetToken  (for security reasons)
// return the resetToken so it can be used in a controller


  const resetToken = crypto.randomBytes(32).toString("hex");

  this.resetPasswordToken = crypto
    .createHash("sha56")
    .update(resetToken)
    .digest("hex");

  this.resetPasswordExpire = Date.now() + 10 * 60 * 1000
  return resetToken
};

// mongoose.model("User", UserSchema)

const User = mongoose.model("User", UserSchema);
module.exports = User;
