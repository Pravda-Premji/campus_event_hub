const { onSchedule } = require("firebase-functions/v2/scheduler");
const admin = require("firebase-admin");
const nodemailer = require("nodemailer");

admin.initializeApp();
const db = admin.firestore();

// 📧 NODEMAILER CONFIGURATION
// Create a Google App Password for your Gmail account and place it here.
const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: "your-email@gmail.com", // ⚠️ REPLACE WITH REAL EMAIL
    pass: "your-app-password",    // ⚠️ REPLACE WITH REAL APP PASSWORD
  },
});

exports.sendEventReminders = onSchedule("every 60 minutes", async (event) => {
  const now = new Date();
  console.log("Checking for upcoming events at:", now.toISOString());

  const eventsSnapshot = await db.collection("events").get();

  for (const eventDoc of eventsSnapshot.docs) {
    const eventData = eventDoc.data();

    // Check if event has valid date and time strings
    if (!eventData.date || !eventData.time) continue;

    // We assume event.date is formatted as "YYYY-MM-DD" and time as "HH:MM"
    const eventDateTimeString = `${eventData.date} ${eventData.time}`;
    const eventDateTime = new Date(eventDateTimeString);

    if (isNaN(eventDateTime.getTime())) {
      console.warn(`Invalid date/time for event ${eventDoc.id}`);
      continue;
    }

    const diffMs = eventDateTime.getTime() - now.getTime();
    const hoursDiff = diffMs / (1000 * 60 * 60);

    // Filter to events starting exactly within the next 23 to 24 hours.
    if (hoursDiff <= 24 && hoursDiff > 23) {
      console.log(`Event "${eventData.title}" starts in ~24hrs. Processing...`);
      await processReminderEmails(eventDoc.id, eventData);
    }
  }
});

async function processReminderEmails(eventId, eventData) {
  // Query registrations specifically for this event
  const registrationsSnapshot = await db.collection("registrations")
    .where("eventId", "==", eventId)
    .get();

  if (registrationsSnapshot.empty) {
    console.log(`No registrations found for event ${eventId}`);
    return;
  }

  for (const regDoc of registrationsSnapshot.docs) {
    const regData = regDoc.data();
    
    // Stop duplicate dispatch natively
    if (regData.reminderSent === true) {
      continue;
    }

    let studentEmail = regData.email;

    // Fallback: If registration doc doesn't explicitly store email, fetch it from 'users'
    if (!studentEmail && regData.userId) {
      const userDoc = await db.collection("users").doc(regData.userId).get();
      if (userDoc.exists) {
        studentEmail = userDoc.data().email;
      }
    }

    if (!studentEmail) {
      console.warn(`Could not find an email for registration ${regDoc.id}`);
      continue;
    }

    // HTML Email Template
    const mailOptions = {
      from: '"Campus Event Hub" <your-email@gmail.com>', // ⚠️ REPLACE with your email
      to: studentEmail,
      subject: "Reminder: Your Event Starts Tomorrow",
      text: `Hello,

This is a reminder that your registered event starts in 24 hours.

Event Name: ${eventData.title}
Date: ${eventData.date}
Time: ${eventData.time}
Venue: ${eventData.venue || eventData.location || "Campus"}

Please arrive on time.`,
      html: `
        <div style="font-family: sans-serif; padding: 20px;">
          <p>Hello,</p>
          <p>This is a reminder that your registered event starts in 24 hours.</p>
          <div style="background: #f1f5f9; padding: 15px; border-radius: 8px;">
            <p><strong>Event Name:</strong> ${eventData.title}</p>
            <p><strong>Date:</strong> ${eventData.date}</p>
            <p><strong>Time:</strong> ${eventData.time}</p>
            <p><strong>Venue:</strong> ${eventData.venue || eventData.location || "Campus"}</p>
          </div>
          <p>Please arrive on time.</p>
        </div>
      `,
    };

    try {
      await transporter.sendMail(mailOptions);
      console.log(`Reminder email sent successfully to ${studentEmail}`);
      
      // Permanently update document status avoiding further collisions
      await regDoc.ref.update({
        reminderSent: true
      });
    } catch (err) {
      console.error(`Error sending email to ${studentEmail}:`, err);
    }
  }
}
