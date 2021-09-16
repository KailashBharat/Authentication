require("dotenv").config({ path: "./config.env" });
const User = require("../models/User");
const ErrorResponse = require("../utils/errorResponse");
const sendEmail = require("../utils/sendEmail");
const crypto = require("crypto");

exports.register = async (req, res, next) => {
  const { username, email, password } = req.body;

  try {
    const user = await User.create({ username, email, password });

    sendToken(user, 200, res);
  } catch (error) {
    // res.status(500).json({ succes: false, error: error.message });
    // When you call next with an error object, it automatically gets send to the errorHandler middleware
    next(error);
  }
};

exports.login = async (req, res, next) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return next(new ErrorResponse("Please provide an email and password", 400));
  }

  try {
    const user = await User.findOne({ email }).select("+password");

    if (!user) {
      return next(new ErrorResponse("Invalid Credentials", 401));
    }

    const isMatch = await user.matchPassword(password);

    if (!isMatch) {
      return next(new ErrorResponse("Invalid Credentials", 401));
    }

    sendToken(user, 201, res);
  } catch (error) {
    return res.status(500).json({ succes: false, error: error.message });
  }
};

exports.forgotpassword = async (req, res, next) => {
  // email is needed to send the resetPassword link to
  // and also to verify that the user is in the database
  const { email } = req.body;

  if (!email) {
    return next(new ErrorResponse("Please fill in your email", 400));
  }
  try {
    // Find out if user is in the database
    const user = await User.findOne({ email });

    if (!user) {
      return next(new ErrorResponse("Email could not be sent", 404));
    }

    // generate a resetToken
    // view the UserSchema methods to see how this is done
    const resetToken = user.getResetPasswordToken();

    // the resetToken en expire date must be saved to the db
    await user.save();

    // generate resetUrl to store the resetToken
    const resetUrl = `https://localhost:${process.env.PORT}/${resetToken}`;

    // This is the message that is sent to the user via email
    const message = `
        <h1>You have requested a password reset</h1>
        <p>Please go tho this link to reset your password</p>
        <a href=${resetUrl} clicktracking=off>${resetUrl}</a>
      `;
    try {
      // The sendEmail function is executed to send the email containing the needed information to reset the password
      // view the sendEmail.js util to see how it's done using the sendgrid API and the nodemailer package
      await sendEmail({
        to: user.email,
        subject: "Password Reset Request",
        html: message,
      });
      res.status(200).json({ succes: true, data: "Email sent" });
    } catch (error) {
      // before the sendEmail function was executed, the resetToken and expireToken were sent to the db
      // in case something went wrong thereafter, it's safe to set the resetToken and expireToken to undefined
      // so no existing token can be used to reset the password
      user.resetPasswordToken = undefined;
      user.resetPasswordExpire = undefined;

      await user.save();

      next(new ErrorResponse("Email could not be sent", 500));
    }
  } catch (error) {
    return next(error);
  }
};

exports.resetpassword = async (req, res, next) => {
  // The resetToken that is in the params of the resetUrl in the forgotpassword controller will be used in this route
  // The resetToken will be verified with the token that is stored in the db
  // That's why the hash is created here as well
  // View the UserSchema methods to see that the hash is created and stored the exact same way
  const resetPasswordToken = crypto
    .createHash("sha256")
    .update(req.params.resetToken)
    .digest("hex");

  try {
    const user = await User.findOne({
      resetPasswordToken,
      resetPasswordExpire: { $gt: Date.now() },
    });

    // If the resetPasswordToken doesn't exist or it has expired
    // then the token will be invalid
    if (!user) {
      return next(new ErrorResponse("Invalid Reset Token", 400));
    }

    // Here the password will be reset and the token will be used for this
    // Best practise is to reset the token to undefined so the resetToken can't be used anymore
    user.password = req.body.password;
    user.resetPasswordToken = undefined;
    user.resetPasswordExpire = undefined;

    await user.save();

    res.status(200).json({
      succes: true,
      data: "Password succesfully updated",
    });
  } catch (error) {
    next(error);
  }
};

const sendToken = (user, statusCode, res) => {
  const token = user.getSignedToken();
  res.status(statusCode).json({ succes: true, token });
};
