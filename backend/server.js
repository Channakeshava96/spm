const express = require("express");
const mongoose = require("mongoose");
const bodyParser = require("body-parser");
const path = require("path");
const nodemailer = require('nodemailer');
require("dotenv").config();

const app = express();
const PORT = process.env.PORT || 3000;

// if (!process.env.MONGO_URI || !process.env.GMAIL || !process.env.PASS) {
//   console.error("Missing required environment variables. Please check your .env file.");
//   process.exit(1); // Stop server if critical env vars are missing
// }

// Middleware
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname))); // Serve static files (CSS, JS, images)

// MongoDB Connection
mongoose
  .connect(process.env.MONGO_URI, { useNewUrlParser: true, useUnifiedTopology: true })
  .then(() => console.log("MongoDB connected"))
  .catch((err) => console.error("MongoDB connection error:", err));


// Mongoose Schema and Model
const Contact = mongoose.model(
  "Contact",
  new mongoose.Schema({
    firstName: String,
    lastName: String,
    email: String,
    phoneNumber: String,
    message: String,
  })
);

// Serve the contact.html file
app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "contact.html"));
});

// API Endpoint for Form Submission
app.post("/submit-form", async (req, res) => {
  const { firstName, lastName, email, phoneNumber, message } = req.body;

  try {
    const contact = new Contact({ firstName, lastName, email, phoneNumber, message });
    await contact.save();  // Save to MongoDB
    
    // Send email via Nodemailer
    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: process.env.GMAIL, // Your Gmail address
        pass: process.env.PASS,   // Your Gmail password or App Password
      },
      tls: {
        rejectUnauthorized: false,  // ✅ Fix SSL certificate error
      }
    });

    const mailOptions = {
      from: email,  // Sender address
      to: process.env.GMAIL, // Recipient address (your email)
      subject: 'New Contact Form Submission',
      text: `You have a new contact form submission:\n\nFirst Name: ${firstName}\nLast Name: ${lastName}\nEmail: ${email}\nPhone Number: ${phoneNumber}\nMessage: ${message}`,
    };

  //   // Sending email and responding
  //   transporter.sendMail(mailOptions, (error, info) => {
  //     if (error) {
  //       console.log("Error sending email:", error);
  //       return res.status(500).send("Error sending email");  // Respond with error if email fails
  //     }
  //     console.log('Email sent: ' + info.response);
  //     res.status(200).send("Form submitted and email sent!");  // Only send response here
  //   });
  // } catch (error) {
  //   console.error("Error saving form data:", error);
  //   res.status(500).send("Error saving form data");  // Respond if form saving fails
  // }
  await transporter.sendMail(mailOptions);
    console.log("📧 Email sent successfully");
    
    res.status(200).json({ message: "Form submitted and email sent successfully!" });
  } catch (error) {
    console.error("⚠️ Error processing request:", error);
    res.status(500).json({ error: "Internal server error. Please try again later." });
  }
});

// Start the server
app.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
});
