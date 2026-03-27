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
import { toast } from "sonner";
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
const [isRegistered, setIsRegistered] = useState(false);

  const [isProfileComplete, setIsProfileComplete] = useState(true);

  useEffect(() => {
    const checkUserStatus = async () => {
      const user = auth.currentUser;
      if (!user) {
        if (eventId) {
          setIsProfileComplete(true); // Don't block if not logged in until they try
        }
        return;
      }
      
      try {
        // Check profile
        const userDoc = await getDoc(doc(db, "users", user.uid));
        const userData = userDoc.data();
        
        if (!userData || !userData.name || !userData.branch || !userData.year || !userData.semester || !user.email) {
          setIsProfileComplete(false);
        } else {
          setIsProfileComplete(true);
        }

        // Check registration status
        if (!eventId) return;
        const q = query(
          collection(db, "registrations"),
          where("eventId", "==", eventId),
          where("userId", "==", user.uid)
        );
        const snap = await getDocs(q);
        if (!snap.empty) {
          setIsProfileComplete(true);
          setIsRegistered(true);
        }
      } catch (err) {
        console.error("Failed to check user status", err);
      }
    };
    
    if (auth.currentUser) {
      checkUserStatus();
    } else {
      const unsubscribe = auth.onAuthStateChanged((user) => {
        if (user) checkUserStatus();
      });
      return () => unsubscribe();
    }
  }, [eventId]);

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
  const handleFreeRegistration = async () => {
    try {
      const user = auth.currentUser;
      if (!user) {
        toast.error("Please login first");
        return;
      }

      if (isRegistered) {
        toast.error("Already Registered");
        return;
      }
      
      const existingQuery = query(
        collection(db, "registrations"),
        where("eventId", "==", eventId),
        where("userId", "==", user.uid)
      );
      const userDoc = await getDoc(doc(db, "users", user.uid));
      const userData = userDoc.data();

      if (!userData || !userData.name || !userData.branch || !userData.year || !userData.semester || !user.email) {
        toast.error("Please complete your profile before registering for events");
        return;
      }
      const existingSnap = await getDocs(existingQuery);
      if (!existingSnap.empty) {
        toast.error("Already Registered");
        setIsRegistered(true);
        return;
      }

      await addDoc(collection(db, "registrations"), {
        userId: user.uid,
        eventId: eventId,
        email: user.email || "",
        studentName: userData?.name || "",
        branch: userData?.branch || "",
        year: userData?.year || "",
        phone: userData?.phone || "",
        registeredAt: serverTimestamp(),
        createdAt: serverTimestamp()
      });

      await updateDoc(doc(db, "events", eventId!), {
        registeredCount: increment(1),
      });

      toast.success("Successfully Registered");
      setIsRegistered(true);

    } catch (err) {
      console.error(err);
      toast.error("Something went wrong");
    }
  };

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

if (!userData || !userData.name || !userData.branch || !userData.year || !userData.semester || !user.email) {
  toast.error("Please complete your profile before registering for events");
  return;
}

const existingSnap = await getDocs(existingQuery);

if (!existingSnap.empty) {
  alert("You already registered for this event");
  return;
}

    if ((event?.eventType === "paid" || event?.isPaid) && !paymentFile) {
      alert("Please upload payment screenshot before registering");
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
  paymentScreenshot: screenshotURL, // Added for new requirement
  createdAt: serverTimestamp(),
  registeredAt: serverTimestamp(), // Added for new requirement
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
      <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex items-center justify-center">
        <div className="animate-pulse flex flex-col items-center gap-4">
          <div className="w-16 h-16 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin" />
          <h2 className="text-2xl font-bold text-slate-800 dark:text-white">Loading experience...</h2>
        </div>
      </div>
    );
  }

  const todayString = new Date().toISOString().split("T")[0];
  const isPastEvent = event?.date ? event.date < todayString : false;

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 relative overflow-x-hidden transition-colors duration-300 flex flex-col">
      
      {/* Abstract Background Orbs */}
      <div className="fixed top-[-10%] left-[-10%] w-[40%] h-[40%] bg-indigo-400/10 dark:bg-indigo-600/10 rounded-full blur-[120px] pointer-events-none z-0" />
      <div className="fixed bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-purple-400/10 dark:bg-purple-600/10 rounded-full blur-[120px] pointer-events-none z-0" />

      {/* Hero Banner Area */}
      <div 
        className="w-full h-80 md:h-[32rem] relative z-10 cursor-zoom-in"
        onClick={() => setShowImageModal(true)}
      >
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-slate-900/60 to-slate-50 dark:to-slate-950 z-10 pointer-events-none" />
        <img 
          src={event.posterURL} 
          alt={event.title} 
          className="w-full h-full object-cover object-center"
        />
      </div>

      <div className="w-full flex-1 max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 relative z-20 -mt-32 md:-mt-48 mb-20">

        {/* 🔙 BACK */}
        <button
          onClick={() => navigate(-1)}
          className="group flex items-center gap-2 mb-6 text-white hover:text-indigo-200 font-semibold transition-colors bg-black/30 backdrop-blur-md px-5 py-2.5 rounded-full shadow-lg border border-white/20 w-max"
        >
          <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
          Back to Events
        </button>

        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
          className="bg-white dark:bg-slate-900 rounded-[2rem] shadow-2xl border border-slate-100 dark:border-slate-800 overflow-hidden flex flex-col md:flex-row"
        >

          {/* Left/Top Content Area */}
          <div className="flex-1 p-8 md:p-12 border-b md:border-b-0 md:border-r border-slate-100 dark:border-slate-800">
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-extrabold tracking-tight text-slate-800 dark:text-white mb-8 leading-tight">
              {event.title}
            </h1>

            {/* 📅 META INFO ROW */}
            <div className="flex flex-wrap items-center gap-3 mb-10 text-sm font-bold text-slate-700 dark:text-slate-300">
              <div className="flex items-center gap-2 bg-indigo-50 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-400 px-4 py-2.5 rounded-xl border border-indigo-100 dark:border-indigo-800/30">
                <Calendar className="w-4 h-4" /> {event.date || "TBD"}
              </div>
              <div className="flex items-center gap-2 bg-purple-50 dark:bg-purple-900/30 text-purple-700 dark:text-purple-400 px-4 py-2.5 rounded-xl border border-purple-100 dark:border-purple-800/30">
                <Clock className="w-4 h-4" /> {event.time || "TBD"}
              </div>
              <div className="flex items-center gap-2 bg-rose-50 dark:bg-rose-900/30 text-rose-700 dark:text-rose-400 px-4 py-2.5 rounded-xl border border-rose-100 dark:border-rose-800/30">
                <MapPin className="w-4 h-4" /> {event.location || event.venue || "Campus"}
              </div>
               {event.eventType === "paid" && (
                 <div className="flex items-center gap-2 bg-amber-50 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400 px-4 py-2.5 rounded-xl uppercase tracking-widest text-[10px] border border-amber-100 dark:border-amber-800/30">
                   <Zap className="w-3 h-3" /> Paid Event
                 </div>
               )}
            </div>

            <div className="prose dark:prose-invert max-w-none">
               <p className="text-lg text-slate-600 dark:text-slate-400 leading-relaxed font-medium whitespace-pre-wrap">
                 {event.description}
               </p>
            </div>
          </div>

          {/* Right/Bottom Sticky Registration Panel */}
          <div className="w-full md:w-[26rem] bg-slate-50 dark:bg-slate-800/50 p-8 md:p-10 flex flex-col shrink-0 relative">
             <div className="sticky top-10 space-y-8">
               {!showRegister ? (
                 <div className="space-y-6">
                   <div className="text-center space-y-2 mb-8">
                      <p className="text-slate-500 dark:text-slate-400 font-semibold text-sm tracking-wide uppercase">Secure your spot</p>
                      <p className="text-5xl font-black text-slate-800 dark:text-white">
                        {event.eventType === "paid" ? "₹Paid" : "Free"}
                      </p>
                   </div>
                   {isPastEvent ? (
                     <button
                       disabled
                       className="w-full relative inline-flex items-center justify-center gap-3 bg-slate-300 dark:bg-slate-700 text-slate-500 dark:text-slate-400 px-6 py-5 rounded-2xl text-lg md:text-xl font-bold cursor-not-allowed"
                     >
                       Registration closed — event date is over
                     </button>
                   ) : !isProfileComplete ? (
                     <button
                       disabled
                       className="w-full relative inline-flex items-center justify-center gap-3 bg-red-100 dark:bg-red-900/40 text-red-600 dark:text-red-400 px-6 py-5 rounded-2xl text-sm md:text-base font-bold cursor-not-allowed border border-red-200 dark:border-red-800"
                     >
                       Please complete your profile before registering for events
                     </button>
                   ) : (
                     <button
                       onClick={() => setShowRegister(true)}
                       className="w-full group relative inline-flex items-center justify-center gap-3 bg-indigo-600 hover:bg-indigo-700 dark:bg-indigo-500 dark:hover:bg-indigo-600 text-white px-8 py-5 rounded-2xl text-xl font-bold shadow-[0_8px_30px_rgba(79,70,229,0.3)] hover:shadow-[0_8px_30px_rgba(79,70,229,0.5)] hover:scale-[1.02] transition-all duration-300"
                     >
                       <Zap className="w-6 h-6 animate-pulse" />
                       Register Now
                     </button>
                   )}
                 </div>
               ) : (
                  <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
                    <h3 className="text-xl font-bold text-slate-800 dark:text-white flex items-center justify-center gap-2 mb-6 border-b border-slate-200 dark:border-slate-700 pb-4">
                      <CheckCircle2 className="w-6 h-6 text-indigo-500" />
                      Complete Registration
                    </h3>

                    {event.eventType === "free" && (
                      <button 
                        onClick={handleFreeRegistration}
                        disabled={isRegistered}
                        className={`w-full px-6 py-4 rounded-xl font-bold text-lg transition-all duration-300 ${
                          isRegistered 
                            ? "bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400 cursor-not-allowed border border-emerald-200 dark:border-emerald-800/30" 
                            : "bg-emerald-500 hover:bg-emerald-600 text-white shadow-[0_8px_30px_rgba(16,185,129,0.3)] hover:scale-[1.02]"
                        }`}
                      >
                        {isRegistered ? "You're Registered!" : "Confirm Selection"}
                      </button>
                    )}

                    {event.eventType === "paid" && (
                      <div className="space-y-6">

                        {/* Payment Info */}
                        <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 border border-slate-200 dark:border-slate-700 shadow-sm text-center">
                          <p className="text-sm font-bold text-slate-500 dark:text-slate-400 mb-2 uppercase tracking-widest">Pay via UPI</p>
                          <p className="text-2xl font-black text-indigo-600 dark:text-indigo-400 mb-4 select-all">
                            {event.upiId || "N/A"}
                          </p>
                          <p className="text-sm text-slate-600 dark:text-slate-400 bg-slate-50 dark:bg-slate-800 p-3 rounded-lg border border-slate-100 dark:border-slate-700">
                            {event.paymentInstructions || "Send exact amount to the UPI ID above."}
                          </p>
                        </div>

                        {/* Upload */}
                        {event.requireScreenshot && (
                          <div className="border-2 border-dashed border-slate-300 dark:border-slate-600 rounded-2xl p-6 text-center hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors cursor-pointer group relative bg-white dark:bg-slate-900">
                            <input
                              type="file"
                              onChange={(e) =>
                                setPaymentFile(e.target.files?.[0] || null)
                              }
                              className="absolute inset-0 opacity-0 cursor-pointer w-full h-full z-10"
                            />

                            <Upload className="w-8 h-8 text-slate-400 mx-auto mb-3 group-hover:text-indigo-500 transition-colors" />

                            <p className="text-slate-600 dark:text-slate-400 text-sm font-medium">
                              Upload payment screenshot
                            </p>

                            {paymentFile && (
                              <p className="mt-3 text-emerald-600 dark:text-emerald-400 font-bold text-xs bg-emerald-50 dark:bg-emerald-900/30 p-2 rounded-md">
                                {paymentFile.name}
                              </p>
                            )}
                          </div>
                        )}

                        {/* Submit Button */}
                        <button
                          onClick={handleSubmitPayment}
                          className="w-full bg-indigo-600 hover:bg-indigo-700 text-white px-8 py-4 rounded-xl font-bold text-lg shadow-[0_8px_30px_rgba(79,70,229,0.3)] hover:scale-[1.02] transition-all duration-300"
                        >
                          Submit Payment
                        </button>
                      </div>
                    )}
                  </div>
               )}
             </div>
          </div>
        </motion.div>
      </div>

      {/* FULLSCREEN IMAGE MODAL */}
      <AnimatePresence>
        {showImageModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setShowImageModal(false)}
            className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-950/95 p-4 backdrop-blur-xl cursor-zoom-out"
          >
            <motion.img
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 20 }}
              src={event.posterURL}
              alt="Event Poster Fullscreen"
              className="max-w-full max-h-[90vh] object-contain rounded-2xl shadow-2xl border border-white/10"
              onClick={(e) => e.stopPropagation()}
            />
            <p className="absolute bottom-6 text-white/50 text-sm font-semibold tracking-widest pointer-events-none">
              CLICK ANYWHERE TO CLOSE
            </p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default EventDetails;