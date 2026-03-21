import { useParams, useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import { auth, db } from "@/firebase";
import { doc, getDoc } from "firebase/firestore";
import { addDoc, collection, serverTimestamp} from "firebase/firestore";
const EventDetails = () => {
  const { eventId } = useParams();
  const navigate = useNavigate();
const [showRegister, setShowRegister] = useState(false);
  const [event, setEvent] = useState<any>(null);
const [paymentFile, setPaymentFile] = useState<File | null>(null);
  // ✅ FETCH EVENT FROM FIRESTORE
  useEffect(() => {
    const fetchEvent = async () => {
      if (!eventId) return;

      try {
        const eventDoc = await getDoc(doc(db, "events", eventId));

        if (eventDoc.exists()) {
          setEvent(eventDoc.data());
        }
      } catch (err) {
        console.error("Error fetching event:", err);
      }
    };

    fetchEvent();
  }, [eventId]);
  //store things to admin
  const handleSubmitPayment = async () => {
  try {
    const user = auth.currentUser;
    if (!user) return;

    // 🔥 GET STUDENT DETAILS
    const userDoc = await getDoc(doc(db, "users", user.uid));
    const userData = userDoc.data();

    if (!userData) {
      alert("User data not found");
      return;
    }

    // 🔥 UPLOAD IMAGE TO CLOUDINARY
    let screenshotURL = "";

    if (paymentFile) {
      const formData = new FormData();
      formData.append("file", paymentFile);
      formData.append("upload_preset", "campus_upload");

      const res = await fetch(
        "https://api.cloudinary.com/v1_1/drnrkdzfa/image/upload",
        {
          method: "POST",
          body: formData,
        }
      );

      const data = await res.json();
      screenshotURL = data.secure_url;
    }

    // 🔥 SAVE TO FIRESTORE
    await addDoc(collection(db, "registrations"), {
      eventId: eventId,
      studentName: userData.name,
      branch: userData.branch,
      year: userData.year,
      email: user.email,
      screenshotURL,
      createdAt: serverTimestamp(),
    });

    alert("Registration successful!");

  } catch (err) {
    console.error(err);
    alert("Something went wrong");
  }
}; 

  // ✅ LOADING STATE
  if (!event) {
    return (
      <div className="p-10">
        <h2 className="text-xl font-semibold">Loading event...</h2>
      </div>
    );
  }

  return (
    <div className="p-10 max-w-4xl mx-auto">

      {/* 🔙 BACK */}
      <button
        onClick={() => navigate(-1)}
        className="mb-6 text-blue-500 underline"
      >
        ← Back
      </button>

      {/* 🖼 POSTER */}
      <img
        src={event.posterURL}
        alt={event.title}
        className="w-full rounded-xl mb-6"
      />

      {/* 📝 DETAILS */}
      <h1 className="text-3xl font-bold mb-4">{event.title}</h1>
      <p className="mb-6">{event.description}</p>
<button
  onClick={() => setShowRegister(true)}
  className="bg-green-500 text-white px-6 py-3 rounded-lg"
>
  Register
</button>
     {showRegister && (
  <div className="mt-6 space-y-4">

    {event.eventType === "free" && (
      <button className="bg-green-600 text-white px-6 py-3 rounded-lg">
        Confirm Registration
      </button>
    )}

    {event.eventType === "paid" && (
      <>
        <p><strong>UPI:</strong> {event.upiId}</p>
        <p>{event.paymentInstructions}</p>

        {event.requireScreenshot && (
          <input type="file"
            onChange={(e) => setPaymentFile(e.target.files?.[0] || null)}/>
        )}

        <button className="bg-orange-500 text-white px-6 py-3 rounded-lg">
          Submit Payment
        </button>
      </>
    )}

  </div>
)}
    </div>
  );
};

export default EventDetails;