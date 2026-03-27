import { useParams, useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import { db } from "@/firebase";
import {
  doc,
  getDoc,
  collection,
  query,
  where,
  getDocs,
} from "firebase/firestore";
import { Button } from "@/components/ui/button";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowLeft, User, Calendar, Star } from "lucide-react";

const ClubPage = () => {
  const { clubId } = useParams(); // ✅ USE clubId (NOT name)
  const navigate = useNavigate();
  console.log("clubId:", clubId);

  const [club, setClub] = useState<{ id: string; name?: string; intro?: string; gallery?: string[]; flagshipEvent?: string; [key: string]: unknown } | null>(null);
  const [events, setEvents] = useState<{ id: string; title?: string; date?: string; time?: string; posterURL?: string; [key: string]: unknown }[]>([]);
  const [execom, setExecom] = useState<{ id: string; name?: string; role?: string; imageURL?: string; [key: string]: unknown }[]>([]);
const [selectedImage, setSelectedImage] = useState<string | null>(null);
useEffect(() => {
  if (!clubId) return;

  const fetchData = async () => {
    try {
      console.log("Fetching club:", clubId);

      // ✅ CLUB
      const clubRef = doc(db, "clubs", clubId);
      const clubSnap = await getDoc(clubRef);

      if (clubSnap.exists()) {
        console.log("Club found:", clubSnap.data());
        setClub({ id: clubSnap.id, ...clubSnap.data() });
      } else {
        console.log("No club found");
      }

      // ✅ EXECOM
      const execomSnap = await getDocs(
        query(collection(db, "execomMembers"), where("clubId", "==", clubId))
      );

      console.log("Execom count:", execomSnap.docs.length);

      setExecom(
        execomSnap.docs.map(d => ({
          id: d.id,
          ...d.data(),
        }))
      );

      // ✅ EVENTS
      const eventsSnap = await getDocs(
        query(collection(db, "events"), where("clubId", "==", clubId))
      );

      console.log("Events count:", eventsSnap.docs.length);

      setEvents(
        eventsSnap.docs.map(d => ({
          id: d.id,
          ...d.data(),
        }))
      );

    } catch (err) {
      console.error("ERROR:", err);
    }
  };

  fetchData();
}, [clubId]);
  // ❌ IF CLUB NOT FOUND
  if (!club) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50 flex items-center justify-center">
        <div className="animate-pulse flex flex-col items-center gap-4">
          <div className="w-16 h-16 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
          <h2 className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-600 to-purple-600">Loading club details...</h2>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 relative overflow-hidden transition-colors duration-300">
      
      {/* Abstract Background Orbs */}
      <div className="fixed top-[-10%] right-[-10%] w-[40%] h-[40%] bg-indigo-400/10 dark:bg-indigo-600/10 rounded-full blur-[120px] pointer-events-none z-0" />
      <div className="fixed bottom-[-10%] left-[-10%] w-[40%] h-[40%] bg-purple-400/10 dark:bg-purple-600/10 rounded-full blur-[120px] pointer-events-none z-0" />

      {/* Hero Banner Gradient */}
      <div className="absolute top-0 w-full h-64 bg-gradient-to-br from-indigo-600 to-purple-700 z-0">
         <div className="absolute inset-0 bg-black/20 dark:bg-black/40 mix-blend-overlay" />
      </div>

      <div className="max-w-7xl mx-auto px-6 py-10 relative z-10 pt-8">

        {/* 🔙 BACK */}
        <button 
          onClick={() => navigate("/student")}
          className="group flex items-center gap-2 mb-10 text-white/90 hover:text-white font-semibold transition-colors bg-black/20 backdrop-blur-md px-5 py-2.5 rounded-full shadow-lg border border-white/20 w-max"
        >
          <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
          Back to Dashboard
        </button>

        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white dark:bg-slate-900 rounded-[2.5rem] p-8 md:p-12 shadow-2xl border border-slate-100 dark:border-slate-800 relative z-20 mt-8"
        >

          {/* 🟢 CLUB DETAILS */}
          <div className="text-center max-w-4xl mx-auto mb-16 relative">
            <h1 className="text-5xl md:text-6xl font-extrabold tracking-tight text-slate-800 dark:text-white mb-6 leading-tight">
              {club?.name}
            </h1>
            <p className="text-lg md:text-xl text-slate-600 dark:text-slate-400 font-medium leading-relaxed bg-slate-50 dark:bg-slate-800/50 rounded-2xl p-6 md:p-8 border border-slate-100 dark:border-slate-800 shadow-sm mx-auto">
              {club?.intro || "Welcome to our club page!"}
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
            
            {/* LEFT COLUMN: EVENTS & EXECOM */}
            <div className="lg:col-span-2 space-y-16">
              
              {/* 🟢 UPCOMING EVENTS */}
              <div>
                <h2 className="text-2xl font-black text-slate-800 dark:text-white mb-6 flex items-center gap-2">
                  <Calendar className="w-6 h-6 text-indigo-500" />
                  Upcoming Events
                </h2>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {events.filter(e => e.date && e.date >= new Date().toISOString().split("T")[0]).length === 0 ? (
                    <div className="col-span-1 md:col-span-2 py-12 text-center bg-slate-50 dark:bg-slate-800/30 rounded-2xl border border-slate-100 dark:border-slate-800">
                      <Calendar className="w-10 h-10 mx-auto text-slate-300 dark:text-slate-600 mb-3" />
                      <p className="text-slate-500 dark:text-slate-400 font-medium">No upcoming events currently scheduled.</p>
                    </div>
                  ) : (
                    events.filter(e => e.date && e.date >= new Date().toISOString().split("T")[0]).map((event, i) => (
                      <motion.div
                        key={event.id}
                        onClick={() => navigate(`/student/event/${event.id}`)}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        whileHover={{ y: -4 }}
                        transition={{ delay: i * 0.05 }}
                        className="group bg-white dark:bg-slate-800 rounded-2xl p-6 border border-slate-100 dark:border-slate-700 shadow-sm hover:shadow-xl hover:border-indigo-200 dark:hover:border-indigo-800 flex flex-col gap-6 cursor-pointer transition-all duration-300 relative overflow-hidden"
                      >
                        <div className="space-y-3 relative z-10 flex-1">
                          <h3 className="text-xl font-bold tracking-tight text-slate-800 dark:text-white group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">{event.title}</h3>
                          
                          <div className="flex flex-wrap items-center gap-2 text-sm font-semibold text-slate-500 dark:text-slate-400">
                            {event.date && (
                              <span className="flex items-center gap-1.5 bg-slate-50 dark:bg-slate-900 px-3 py-1.5 rounded-lg border border-slate-100 dark:border-slate-700">
                                <Calendar className="w-3.5 h-3.5 text-indigo-500" /> 
                                {event.date}
                              </span>
                            )}
                          </div>
                        </div>
                        
                        <div className="relative z-10 w-full mt-auto flex justify-end">
                           <span className="inline-flex items-center justify-center bg-slate-900 hover:bg-slate-800 dark:bg-white dark:hover:bg-slate-100 text-white dark:text-slate-900 text-sm font-bold rounded-full px-5 py-2 transition-all">
                             Register
                           </span>
                        </div>
                      </motion.div>
                    ))
                  )}
                </div>
              </div>

              {/* 🟢 PAST EVENTS */}
              {events.filter(e => e.date && e.date < new Date().toISOString().split("T")[0]).length > 0 && (
                <div className="mt-12">
                  <h2 className="text-2xl font-black text-slate-800 dark:text-white mb-6 flex items-center gap-2">
                    <Star className="w-6 h-6 text-slate-400" />
                    Past Events
                  </h2>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6 opacity-80">
                    {events.filter(e => e.date && e.date < new Date().toISOString().split("T")[0]).map((event, i) => (
                      <motion.div
                        key={event.id}
                        onClick={() => navigate(`/student/event/${event.id}`)}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        whileHover={{ y: -4 }}
                        transition={{ delay: i * 0.05 }}
                        className="group bg-slate-50 dark:bg-slate-800/50 rounded-2xl p-6 border border-slate-200 dark:border-slate-700 flex flex-col gap-6 cursor-pointer transition-all duration-300 relative overflow-hidden saturate-50"
                      >
                        <div className="space-y-3 relative z-10 flex-1">
                          <h3 className="text-xl font-bold tracking-tight text-slate-700 dark:text-slate-300 group-hover:text-slate-900 dark:group-hover:text-white transition-colors">{event.title}</h3>
                          
                          <div className="flex flex-wrap items-center gap-2 text-sm font-semibold text-slate-500 dark:text-slate-400">
                            {event.date && (
                              <span className="flex items-center gap-1.5 bg-slate-100 dark:bg-slate-900/50 px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-800">
                                <Calendar className="w-3.5 h-3.5 text-slate-400" /> 
                                {event.date}
                              </span>
                            )}
                          </div>
                        </div>
                        
                        <div className="relative z-10 w-full mt-auto flex justify-end">
                           <span className="inline-flex items-center justify-center bg-slate-300 dark:bg-slate-700 text-slate-500 dark:text-slate-400 text-sm font-bold rounded-full px-5 py-2">
                             Registration closed
                           </span>
                        </div>
                      </motion.div>
                    ))
                    }
                  </div>
                </div>
              )}

               {/* 🟢 GALLERY */}
              {club?.gallery && club.gallery.length > 0 && (
                <div>
                  <h2 className="text-2xl font-black text-slate-800 dark:text-white mb-6 flex items-center gap-2">
                    <Star className="w-6 h-6 text-amber-500" />
                    Club Gallery
                  </h2>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                    {club.gallery.map((img: string, i: number) => (
                      <motion.div
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ delay: i * 0.1 }}
                        key={i}
                        onClick={() => setSelectedImage(img)}
                        className="w-full aspect-square rounded-2xl overflow-hidden cursor-pointer border border-slate-100 dark:border-slate-800 relative group"
                      >
                        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors z-10" />
                        <img src={img} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                      </motion.div>
                    ))}
                  </div>
                </div>
              )}

            </div>

            {/* RIGHT COLUMN: SIDEBAR */}
            <div className="lg:col-span-1 space-y-8">
               
               {/* 🟢 EXECOM */}
               <div className="bg-slate-50 dark:bg-slate-800/50 rounded-3xl p-6 md:p-8 border border-slate-100 dark:border-slate-700/50">
                <h2 className="text-xl font-bold text-slate-800 dark:text-white mb-6 flex items-center gap-2">
                  <User className="w-5 h-5 text-purple-500" />
                  Team Coordinators
                </h2>

                <div className="flex flex-col gap-4">
                  {execom.length === 0 ? (
                    <p className="text-slate-500 dark:text-slate-400 text-sm italic text-center py-4">No members listed</p>
                  ) : (
                    execom.map((m, i) => (
                      <motion.div
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: i * 0.05 }}
                        key={m.id}
                        className="flex items-center gap-4 p-3 bg-white dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm hover:shadow-md transition-all group"
                      >
                        {/* IMAGE */}
                        {m.imageURL ? (
                          <img
                            src={m.imageURL}
                            alt={m.name}
                            className="w-12 h-12 rounded-full object-cover border-2 border-slate-100 dark:border-slate-700"
                          />
                        ) : (
                          <div className="w-12 h-12 rounded-full bg-indigo-100 dark:bg-indigo-900/50 flex items-center justify-center text-indigo-500 font-bold border-2 border-indigo-50 dark:border-indigo-800">
                             {m.name?.charAt(0) || "U"}
                          </div>
                        )}

                        {/* TEXT */}
                        <div>
                          <p className="font-bold text-sm text-slate-800 dark:text-white leading-tight">{m.name}</p>
                          <p className="text-xs font-semibold text-indigo-600 dark:text-indigo-400 mt-0.5">{m.role}</p>
                        </div>
                      </motion.div>
                    ))
                  )}
                </div>
               </div>
            </div>

          </div>
        </motion.div>
      </div>

      {/* 🟢 IMAGE MODAL */}
      <AnimatePresence>
        {selectedImage && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-slate-950/95 backdrop-blur-xl flex items-center justify-center z-50 p-6 cursor-zoom-out"
            onClick={() => setSelectedImage(null)}
          >
            <motion.img
              initial={{ scale: 0.95 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0.95 }}
              src={selectedImage}
              className="max-h-[90vh] max-w-full rounded-2xl shadow-2xl border border-white/10 object-contain"
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

export default ClubPage;