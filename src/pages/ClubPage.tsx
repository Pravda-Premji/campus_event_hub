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
import { motion } from "framer-motion";
import { ArrowLeft, User, Calendar, Star } from "lucide-react";

const ClubPage = () => {
  const { clubId } = useParams(); // ✅ USE clubId (NOT name)
  const navigate = useNavigate();
  console.log("clubId:", clubId);

  const [club, setClub] = useState<any>(null);
  const [events, setEvents] = useState<any[]>([]);
  const [execom, setExecom] = useState<any[]>([]);
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
        setClub(clubSnap.data());
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
  <div className="min-h-screen bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50 relative overflow-hidden selection:bg-purple-200">
    
    {/* Abstract Background Orbs */}
    <div className="absolute top-[-10%] right-[-10%] w-[40%] h-[40%] bg-blue-400/20 rounded-full blur-[120px] pointer-events-none" />
    <div className="absolute bottom-[-10%] left-[-10%] w-[40%] h-[40%] bg-pink-400/20 rounded-full blur-[120px] pointer-events-none" />

    <div className="max-w-7xl mx-auto px-6 py-10 relative z-10">

      {/* 🔙 BACK */}
      <button 
        onClick={() => navigate("/student")}
        className="group flex items-center gap-2 mb-8 text-slate-500 hover:text-blue-600 font-semibold transition-colors bg-white/50 backdrop-blur-md px-5 py-2.5 rounded-full shadow-sm hover:shadow-md border border-white/60"
      >
        <ArrowLeft className="w-5 h-5 group-hover:-translate-x-1 transition-transform" />
        Back to Dashboard
      </button>

      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white/70 backdrop-blur-2xl rounded-[3rem] p-8 md:p-12 shadow-[0_20px_60px_rgba(0,0,0,0.05)] border border-white/80"
      >

        {/* 🟢 CLUB DETAILS */}
        <div className="text-center max-w-3xl mx-auto mb-16">
          <h1 className="text-5xl md:text-7xl font-extrabold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 mb-6 drop-shadow-sm leading-tight">
            {club?.name}
          </h1>
          <p className="text-xl text-slate-600 font-medium leading-relaxed bg-white/50 rounded-2xl p-6 border border-white/60 shadow-inner">
            {club?.intro}
          </p>
        </div>

        {/* 🟢 GALLERY */}
        <div className="mb-16">
          <h2 className="text-2xl font-black text-slate-800 mb-6 flex items-center gap-2">
            <Star className="w-6 h-6 text-purple-500" />
            Club Gallery
          </h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {club?.gallery?.map((img: string, i: number) => (
              <motion.img
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: i * 0.1 }}
                key={i}
                src={img}
                onClick={() => setSelectedImage(img)}
                className="w-full h-48 object-cover rounded-2xl cursor-pointer hover:scale-105 hover:shadow-xl transition-all duration-300 border-2 border-white/50"
              />
            ))}
          </div>
        </div>

        {/* 🟢 IMAGE MODAL */}
        {selectedImage && (
          <div
            className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4"
            onClick={() => setSelectedImage(null)}
          >
            <motion.img
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              src={selectedImage}
              className="max-h-[90vh] max-w-full rounded-2xl shadow-2xl border-4 border-white/20"
            />
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
          
          {/* 🟢 EXECOM */}
          <div className="lg:col-span-1">
            <h2 className="text-2xl font-black text-slate-800 mb-6 flex items-center gap-2">
              <User className="w-6 h-6 text-blue-500" />
              Execom Members
            </h2>

            <div className="space-y-4">
              {execom.length === 0 ? (
                <p className="text-slate-500 italic bg-white/50 p-4 rounded-xl text-center border border-white/60">No members yet</p>
              ) : (
                execom.map((m, i) => (
                  <motion.div
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.05 }}
                    key={m.id}
                    className="flex items-center gap-4 p-4 bg-white/80 backdrop-blur-md rounded-2xl border border-white/60 shadow-sm hover:shadow-md hover:-translate-y-1 transition-all duration-300 group"
                  >
                    {/* IMAGE */}
                    <img
                      src={m.imageURL}
                      alt={m.name}
                      className="w-14 h-14 rounded-full object-cover border-2 border-blue-100 group-hover:border-blue-400 shadow-sm transition-colors"
                    />

                    {/* TEXT */}
                    <div>
                      <p className="font-bold text-slate-800">{m.name}</p>
                      <p className="text-sm font-semibold bg-clip-text text-transparent bg-gradient-to-r from-blue-600 to-purple-600">{m.role}</p>
                    </div>
                  </motion.div>
                ))
              )}
            </div>
          </div>
          {/* 🟢 EVENTS (Mirroring the premium StudentHome event cards) */}
          <div className="lg:col-span-2">
            <h2 className="text-2xl font-black text-slate-800 mb-6 flex items-center gap-2">
              <Calendar className="w-6 h-6 text-pink-500" />
              Club Events
            </h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 perspective-1000">
              {events.length === 0 ? (
                <p className="text-slate-500 italic bg-white/50 p-6 rounded-2xl text-center border border-white/60 col-span-full">No events yet</p>
              ) : (
                events.map((event, i) => (
                  <motion.div
                    key={event.id}
                    onClick={() =>
                      navigate(`/student/event/${event.id}`)
                    }
                    initial={{ opacity: 0, y: 30, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    whileHover={{ y: -8 }}
                    transition={{ delay: i * 0.05, type: "spring", stiffness: 300, damping: 25 }}
                    className="group bg-white/80 backdrop-blur-xl rounded-[2rem] p-6 border border-white/60 shadow-lg hover:shadow-neon hover-3d flex flex-col gap-6 cursor-pointer transition-all duration-300 ease-out relative overflow-hidden"
                  >
                    
                    {/* Subtle gradient inner glow on hover */}
                    <div className="absolute inset-0 bg-gradient-to-br from-blue-400/10 via-purple-400/10 to-pink-400/10 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none" />
                    
                    <div className="space-y-3 relative z-10 flex-1">
                      <h3 className="text-2xl font-extrabold tracking-tight leading-tight text-slate-800 group-hover:text-transparent group-hover:bg-clip-text group-hover:bg-gradient-to-r group-hover:from-blue-600 group-hover:to-purple-600 transition-all duration-300">{event.title}</h3>
                      
                      <div className="flex flex-wrap items-center gap-2 text-sm font-semibold text-slate-500">
                        {event.date && (
                          <span className="flex items-center gap-1.5 bg-white border border-white/50 px-3 py-1.5 rounded-full text-xs shadow-sm">
                            <Calendar className="w-3.5 h-3.5 text-purple-500" /> 
                            {event.date}
                          </span>
                        )}
                      </div>
                    </div>
                    
                    <div className="relative z-10 w-full mt-auto text-right">
                       <span className="inline-flex items-center justify-center bg-gradient-to-r from-blue-600 to-purple-600 text-white text-sm font-bold rounded-full px-6 py-2 shadow-glow group-hover:scale-105 group-hover:brightness-110 transition-all duration-300 ease-out">
                         View Details
                       </span>
                    </div>
                  </motion.div>
                ))
              )}
            </div>
          </div>
        </div>

      </motion.div>
    </div>
  </div>
);
};

export default ClubPage;