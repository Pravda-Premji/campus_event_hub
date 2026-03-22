import { useParams, useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import { auth, db } from "@/firebase";
import { doc, getDoc } from "firebase/firestore";
import {
  addDoc,
  collection,
  serverTimestamp,
  updateDoc,
  increment,
} from "firebase/firestore";
import { query, where, getDocs } from "firebase/firestore";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowLeft, CheckCircle2, QrCode, Upload, Zap, Calendar, Clock, MapPin } from "lucide-react";
const EventDetails = () => {
const { eventId } = useParams();
const navigate = useNavigate();

interface EventDetailItem {
  id?: string;
  title?: string;
  description?: string;
  posterURL?: string;
  eventType?: "free" | "paid";
  requireScreenshot?: boolean;
  upiId?: string;
  paymentInstructions?: string;
  registeredCount?: number;
  date?: string;
  time?: string;
  location?: string;
  venue?: string;
  [key: string]: unknown;
}

const [event, setEvent] = useState<EventDetailItem | null>(null);
const [showRegister, setShowRegister] = useState(false);
const [paymentFile, setPaymentFile] = useState<File | null>(null);
const [showImageModal, setShowImageModal] = useState(false);

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
  userId: user.uid,
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
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50 flex items-center justify-center">
        <div className="animate-pulse flex flex-col items-center gap-4">
          <div className="w-16 h-16 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
          <h2 className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-600 to-purple-600">Loading experience...</h2>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50 relative overflow-hidden selection:bg-purple-200">
      
      {/* Abstract Background Orbs */}
      <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-blue-400/20 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-pink-400/20 rounded-full blur-[120px] pointer-events-none" />

      <div className="max-w-5xl mx-auto px-6 py-12 relative z-10">

{/* 🔙 BACK */}
<button
  onClick={() => navigate(-1)}
  className="group flex items-center gap-2 mb-8 text-slate-500 hover:text-blue-600 font-semibold transition-colors bg-white/50 backdrop-blur-md px-5 py-2.5 rounded-full shadow-sm hover:shadow-md border border-white/60"
>
  <ArrowLeft className="w-5 h-5 group-hover:-translate-x-1 transition-transform" />
  Back to Events
</button>

<motion.div
  initial={{ opacity: 0, scale: 0.95, y: 30 }}
  animate={{ opacity: 1, scale: 1, y: 0 }}
  transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
  className="bg-white/70 backdrop-blur-2xl rounded-[3rem] p-4 sm:p-6 md:p-8 shadow-[0_20px_60px_rgba(0,0,0,0.05)] border border-white/80"
>

  {/* 🖼 POSTER */}
  <div 
    className="relative w-full h-80 md:h-[32rem] rounded-[2.5rem] overflow-hidden shadow-2xl mb-12 border-4 border-white group cursor-pointer"
    onClick={() => setShowImageModal(true)}
  >
    <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent z-10 pointer-events-none" />
    <img
      src={event.posterURL}
      alt={event.title}
      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700 ease-out"
    />
  </div>

  <div className="px-4 md:px-12 pb-12">
    
    {/* 📝 DETAILS */}
    <h1 className="text-4xl sm:text-5xl md:text-7xl font-extrabold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 mb-6 drop-shadow-sm leading-tight text-center sm:text-left">
      {event.title}
    </h1>

    {/* 📅 META INFO */}
    <div className="flex flex-wrap items-center gap-4 mb-8 text-slate-700 font-bold justify-center sm:justify-start">
      <div className="flex items-center gap-2 bg-blue-50/80 backdrop-blur-sm px-5 py-2.5 rounded-2xl border border-blue-200 shadow-sm">
        <Calendar className="w-5 h-5 text-blue-500" />
        {event.date || "TBD"}
      </div>
      <div className="flex items-center gap-2 bg-purple-50/80 backdrop-blur-sm px-5 py-2.5 rounded-2xl border border-purple-200 shadow-sm">
        <Clock className="w-5 h-5 text-purple-500" />
        {event.time || "TBD"}
      </div>
      <div className="flex items-center gap-2 bg-pink-50/80 backdrop-blur-sm px-5 py-2.5 rounded-2xl border border-pink-200 shadow-sm">
        <MapPin className="w-5 h-5 text-pink-500" />
        {event.location || event.venue || "Campus"}
      </div>
    </div>

    <p className="text-lg md:text-xl text-slate-600 leading-relaxed font-medium mb-16 max-w-4xl">
      {event.description}
    </p>

    {/* CTA */}
    {!showRegister ? (
      <div className="flex justify-center">
        <button
          onClick={() => setShowRegister(true)}
          className="group relative inline-flex items-center gap-4 bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 text-white px-12 py-5 rounded-full text-xl font-black shadow-lg hover:shadow-2xl hover:scale-105 hover:brightness-110 transition-all duration-300 overflow-hidden"
        >
          <div className="absolute inset-0 bg-white/20 w-full translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-700 ease-in-out" />
          <Zap className="w-6 h-6 animate-pulse" />
          Register Now
        </button>
      </div>
    ) : (
      <motion.div
        initial={{ opacity: 0, height: 0, y: 20 }}
        animate={{ opacity: 1, height: "auto", y: 0 }}
        className="mt-8 bg-white/90 rounded-[2.5rem] p-10 shadow-xl border border-blue-100"
      >

        <h3 className="text-3xl font-extrabold text-slate-800 mb-8 flex items-center gap-3">
          <CheckCircle2 className="w-8 h-8 text-blue-500" />
          Complete Registration
        </h3>

        <div className="space-y-8">

          {/* FREE EVENT */}
          {event.eventType === "free" && (
            <button className="w-full sm:w-auto bg-gradient-to-r from-emerald-500 to-teal-500 text-white px-10 py-4 rounded-full font-bold text-lg shadow-lg hover:shadow-xl hover:scale-105 transition-all duration-300">
              Confirm Free Registration
            </button>
          )}

          {/* PAID EVENT */}
          {event.eventType === "paid" && (
            <div className="space-y-8">

              {/* Payment Info */}
              <div className="bg-blue-50/50 rounded-3xl p-8 border border-blue-100/50">
                <div className="flex items-center gap-3 mb-4">
                  <QrCode className="w-6 h-6 text-purple-600" />
                  <p className="text-lg font-bold text-slate-800">
                    Payment Details
                  </p>
                </div>

                <p className="text-2xl font-black bg-clip-text text-transparent bg-gradient-to-r from-blue-600 to-purple-600 mb-2">
                  {event.upiId}
                </p>

                <p className="text-slate-600 font-medium">
                  {event.paymentInstructions}
                </p>
              </div>

              {/* Upload */}
              {event.requireScreenshot && (
                <div className="border-2 border-dashed border-slate-300 rounded-3xl p-8 text-center hover:bg-slate-50 hover:border-blue-400 transition-colors cursor-pointer group relative">
                  <input
                    type="file"
                    onChange={(e) =>
                      setPaymentFile(e.target.files?.[0] || null)
                    }
                    className="absolute inset-0 opacity-0 cursor-pointer w-full h-full z-10"
                  />

                  <Upload className="w-10 h-10 text-slate-400 mx-auto mb-4 group-hover:text-blue-500 transition-colors" />

                  <p className="text-slate-600 font-medium">
                    Click or drag to attach payment proof
                  </p>

                  {paymentFile && (
                    <p className="mt-3 text-green-600 font-semibold">
                      File selected: {paymentFile.name}
                    </p>
                  )}
                </div>
              )}

              {/* Submit Button */}
              <button
                onClick={handleSubmitPayment}
                className="w-full bg-gradient-to-r from-orange-500 to-pink-500 text-white px-10 py-4 rounded-full font-bold text-lg shadow-lg hover:shadow-xl hover:scale-105 transition-all duration-300"
              >
                Submit Payment
              </button>

            </div>
          )}

        </div>
      </motion.div>
    )}
  </div>
</motion.div>
      {/* FULLSCREEN IMAGE MODAL */}
      <AnimatePresence>
        {showImageModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setShowImageModal(false)}
            className="fixed inset-0 z-[100] flex items-center justify-center bg-black/95 p-4 backdrop-blur-md cursor-zoom-out"
          >
            <motion.img
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 20 }}
              src={event.posterURL}
              alt="Event Poster Fullscreen"
              className="max-w-full max-h-[90vh] object-contain rounded-2xl shadow-2xl border-2 border-white/10"
              onClick={(e) => e.stopPropagation()} // Prevent clicking image from closing it immediately
            />
            {/* Close instruction */}
            <p className="absolute bottom-6 text-white/50 text-sm font-semibold tracking-widest pointer-events-none">
              CLICK ANYWHERE TO CLOSE
            </p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
    </div>
  );
};
export default EventDetails;