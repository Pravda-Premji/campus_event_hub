import { useParams, useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import { auth, db } from "@/firebase";
import { doc, getDoc } from "firebase/firestore";
import { addDoc, collection, serverTimestamp,updateDoc,increment} from "firebase/firestore";
import { query, where, getDocs } from "firebase/firestore";
const EventDetails = () => {
const { eventId } = useParams();
const navigate = useNavigate();
const [event, setEvent] = useState<any>(null);
const [paymentFile, setPaymentFile] = useState<File | null>(null);

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
    const existingQuery = query(
  collection(db, "registrations"),
  where("eventId", "==", eventId),
  where("email", "==", user.email)
);

const existingSnap = await getDocs(existingQuery);

if (!existingSnap.empty) {
  alert("You already registered for this event");
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
    if (!userData.branch || !userData.year || !userData.phone) {
  alert("Please complete your profile before registering.");
  return;
}

await addDoc(collection(db, "registrations"), {
  eventId,
  studentName: userData.name || "",
  branch: userData.branch || "",
  year: userData.year || "",
  phone: userData.phone || "",
  email: user.email || "",
  screenshotURL,
  createdAt: serverTimestamp(),
});
    await updateDoc(doc(db, "events", eventId!), {
      registeredCount: increment(1),
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
<label className="block mt-4 mb-1 font-medium">
  Upload Payment Screenshot
</label>
<input
  type="file"
  onChange={(e) =>
    setPaymentFile(e.target.files?.[0] || null)
  }
  className="border rounded px-3 py-2 w-full mt-3"
/>
<button
  disabled={!paymentFile}
  onClick={handleSubmitPayment}
  className={`px-6 py-3 rounded-lg text-white ${
    paymentFile ? "bg-green-500" : "bg-gray-400 cursor-not-allowed"
  }`}
>
  Register
</button>
     
    </div>
  );
};

export default EventDetails;