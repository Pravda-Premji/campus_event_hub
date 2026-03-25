import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useNavigate } from "react-router-dom";
import {
  Calendar, User, LogOut, Clock, Search, Star, ChevronLeft, ChevronRight,
  Award, MapPin, Bell, LayoutDashboard, Megaphone, CheckCircle
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

import { toast } from "sonner"; 
import { auth, db } from "../firebase";
import {
  collection,
  addDoc,
  getDocs,
  doc,
  updateDoc,
  getDoc,
  query,
  where,
  orderBy,
  onSnapshot,
  limit,
  arrayUnion,
} from "firebase/firestore";

interface EventItem {
  id: string;
  title: string;
  description?: string;
  date: string;
  time?: string;
  location?: string;
  registrationLink?: string;
  club?: string;
  registeredCount?: number;
}

export interface CertificateItem {
  id: string;
  userId?: string;
  eventId?: string;
  eventName?: string;
  certificateURL?: string;
  createdAt?: { seconds: number; nanoseconds?: number };
}

export interface ClubItem {
  id: string;
  name: string;
  emoji?: string;
  [key: string]: unknown;
}

const clubs = [
  { name: "FOSS Club", emoji: "👩‍💻" },
  { name: "Robotics Club", emoji: "🤖" },
  { name: "IEEE", emoji: "🌍" },
  { name: "Orenda", emoji: "🎵" },
  { name: "Navarasa", emoji: "💃" },
];

const getDownloadUrl = (url?: string) => {
  if (!url) return "";
  if (url.includes("/upload/fl_attachment/")) return url;
  return url.replace("/upload/", "/upload/fl_attachment/");
};

const StudentHome = () => {
  const navigate = useNavigate();

  const [collapsed, setCollapsed] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
  const [showAnnouncements, setShowAnnouncements] = useState(false);
  const announcementRef = useRef<HTMLDivElement>(null);

  const [announcements, setAnnouncements] = useState<{id: string; title: string; message: string; createdAt: Date; readBy?: string[]}[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);

  const [name, setName] = useState("");
  const [registerNumber, setRegisterNumber] = useState("");
  const [phone, setPhone] = useState("");
  const [branch, setBranch] = useState("");
  const [year, setYear] = useState("");
  const [photoURL, setPhotoURL] = useState("");
const [flippedId, setFlippedId] = useState<string | null>(null);
  const [events, setEvents] = useState<EventItem[]>([]);
  const [searchQuery, setSearchQuery] = useState("");

  const [activeTab, setActiveTab] =
    useState<"dashboard" | "events" | "today" | "announcements" | "profile">("dashboard");

  const [certificates, setCertificates] = useState<CertificateItem[]>([]);
  const [myRegistrations, setMyRegistrations] = useState<{eventId?: string}[]>([]);
  const [previewCert, setPreviewCert] = useState<string | null>(null);

  const [isEditing, setIsEditing] = useState(false);

  const [profileData, setProfileData] = useState({
    name: "Student Name",
    class: "S6 CSE",
    photoURL: "",
  });
  const [clubs, setClubs] = useState<ClubItem[]>([]);
  /* ---------------- LOAD EVENTS ---------------- */

  const loadEvents = async () => {
    const querySnapshot = await getDocs(collection(db, "events"));

    const eventList: EventItem[] = await Promise.all(
      querySnapshot.docs.map(async (docSnap) => {
        const data = docSnap.data();
        
        const regSnap = await getDocs(query(collection(db, "registrations"), where("eventId", "==", docSnap.id)));

        return {
          id: docSnap.id,
          title: data.title || "",
          description: data.description || "",
          date: typeof data.date === "string" ? data.date : data.date?.seconds ? new Date(data.date.seconds * 1000).toLocaleDateString() : "",
          time: typeof data.time === "string" ? data.time : "",
          location: data.location || "",
          registrationLink: data.registrationLink || "",
          club: data.club || "",
          registeredCount: regSnap.size, // ✅ REAL COUNT
        };
      })
    );

    setEvents(eventList);
  };

 useEffect(() => {
  const fetchData = async () => {
    await loadEvents(); // existing

    // 🔥 ADD THIS
    try {
      const clubSnap = await getDocs(collection(db, "clubs"));

      setClubs(
        clubSnap.docs.map(d => {
          const data = d.data();
          return {
            id: d.id,
            name: data.name || "Unknown Club",
            emoji: data.emoji || "🏆",
          } as ClubItem;
        })
      );
    } catch (err) {
      console.error("Error fetching clubs:", err);
    }
  };

  fetchData();
}, []);

  /* ---------------- LOAD ANNOUNCEMENTS ---------------- */
  useEffect(() => {
    const today = new Date().toISOString().split("T")[0];
    const q = query(
      collection(db, "announcements"),
      where("expiryDate", ">=", today)
    );

    const unsubscribe = onSnapshot(q, (snap) => {
      let list = snap.docs.map(d => ({
        id: d.id,
        title: d.data().title || "",
        message: d.data().message || "",
        createdAt: d.data().createdAt?.toDate() || new Date(),
        readBy: d.data().readBy || [],
        ...d.data(),
      })) as {id: string; title: string; message: string; createdAt: Date; readBy?: string[]}[];
      
      list.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
      setAnnouncements(list);
      
      // We calculate unreadCount here, but what if auth.currentUser is not yet populated?
      // It's usually fine since this component is under ProtectedRoute 
      // but just to be safe, we check it.
      const user = auth.currentUser;
      if (user) {
        setUnreadCount(list.filter(a => !(a.readBy || []).includes(user.uid)).length);
      }
    }, (error) => {
      console.error("Error fetching announcements:", error);
    });

    return () => unsubscribe();
  }, []);

  const handleOpenAnnouncements = async () => {
    setShowAnnouncements(!showAnnouncements);
    if (!showAnnouncements) {
      const user = auth.currentUser;
      if (!user) return;
      const unreadList = announcements.filter(a => !(a.readBy || []).includes(user.uid));
      if (unreadList.length > 0) {
        try {
          for (const ann of unreadList) {
            const docRef = doc(db, "announcements", ann.id);
            await updateDoc(docRef, { readBy: arrayUnion(user.uid) });
          }
        } catch (err) {
          console.error("Error marking announcements as read", err);
        }
      }
    }
  };

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (announcementRef.current && !announcementRef.current.contains(event.target as Node)) {
        setShowAnnouncements(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  /* ---------------- LOAD PROFILE ---------------- */

  useEffect(() => {
    const loadProfile = async () => {
      const user = auth.currentUser;
      if (!user) return;

      const docRef = doc(db, "users", user.uid);
      const docSnap = await getDoc(docRef);

      if (docSnap.exists()) {
        const data = docSnap.data();

        setName(data.name || "");
        setRegisterNumber(data.registerNumber || "");
        setPhone(data.phone || "");
        setBranch(data.branch || "");
        setYear(data.year || "");
        setPhotoURL(data.photoURL || "");
      }

      try {
        const certQuery = query(
          collection(db, "certificates"), 
          where("userId", "==", user.uid)
        );
        const certSnap = await getDocs(certQuery);
        setCertificates(certSnap.docs.map(doc => ({ id: doc.id, ...doc.data() })));
      } catch (err) {
        console.error("Error fetching certificates", err);
      }

      // Fetch registrations for banner matching
      try {
        const regQuery = query(
          collection(db, "registrations"),
          where("userId", "==", user.uid)
        );
        const regSnap = await getDocs(regQuery);
        setMyRegistrations(regSnap.docs.map(doc => doc.data() as {eventId?: string}));
      } catch (err) {
        console.error("Error fetching registrations", err);
      }
    };

    loadProfile();
  }, []);

  // Compute Events starting within 24 hours that user registered for
  const tomorrowEvents = events.filter(e => {
    if (!e.date || !e.time) return false;
    const evtDate = new Date(`${e.date} ${e.time}`);
    const timeDiffMs = evtDate.getTime() - Date.now();
    const hoursDiff = timeDiffMs / (1000 * 60 * 60);
    return hoursDiff > 0 && hoursDiff <= 24 && myRegistrations.some(r => r.eventId === e.id);
  });

  /* ---------------- SAVE PROFILE ---------------- */

  const handleSave = async () => {
    const user = auth.currentUser;
    if (!user) return;

    await updateDoc(doc(db, "users", user.uid), {
      name,
      registerNumber,
      phone,
      branch,
      year,
      photoURL,
    });

    toast.success("Profile saved successfully");
    setIsEditing(false);
  };

  /* ---------------- REGISTER EVENT ---------------- */

  

  /* ---------------- FILTER EVENTS ---------------- */


  const todayString = new Date().toISOString().split("T")[0];

  const filteredEvents = events.filter((e) => {
    const matchesSearch = (e.title || "").toLowerCase().includes(searchQuery.toLowerCase());
    if (!matchesSearch) return false;

    if (!e.date) return false;

    if (activeTab === "today") {
      return e.date === todayString;
    }
    if (activeTab === "events") {
      return e.date > todayString;
    }
    return true;
  });
  /* ---------------- IMAGE UPLOAD ---------------- */

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const toastId = toast.loading("Uploading image...");

    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("upload_preset", "campus_upload");

      const res = await fetch(
        "https://api.cloudinary.com/v1_1/drnrkdzfa/image/upload",
        {
          method: "POST",
          body: formData,
        }
      );

      const data = await res.json();
      
      const user = auth.currentUser;
      if (user && data.secure_url) {
        await updateDoc(doc(db, "users", user.uid), {
          photoURL: data.secure_url
        });
        setPhotoURL(data.secure_url);
        setProfileData(prev => ({ ...prev, photoURL: data.secure_url }));
        toast.success("Profile image updated!", { id: toastId });
      } else {
        throw new Error("Upload failed");
      }
    } catch (err) {
      console.error(err);
      toast.error("Failed to upload image", { id: toastId });
    }
  };

  /* ---------------- UI ---------------- */

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex font-sans text-slate-900 dark:text-slate-100 transition-colors duration-300">

      {/* SIDEBAR */}
      <aside
        className={`hidden lg:flex ${
          collapsed ? "w-20" : "w-72"
        } bg-white dark:bg-slate-900 flex-col fixed inset-y-0 left-0 z-40 transition-all duration-300 ease-in-out shadow-[4px_0_24px_rgba(0,0,0,0.02)] dark:shadow-[4px_0_24px_rgba(0,0,0,0.2)] border-r border-slate-100 dark:border-slate-800`}
      >
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="absolute -right-3.5 top-7 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-500 hover:text-indigo-600 p-1.5 rounded-full shadow-md transition-all z-50 hover:scale-110"
        >
          {collapsed ? <ChevronRight size={14} /> : <ChevronLeft size={14} />}
        </button>

        <div className="p-6 h-20 flex items-center border-b border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-3 w-full">
            <div className="bg-gradient-to-br from-indigo-500 to-blue-600 text-white shadow-lg p-2.5 rounded-xl">
              <Calendar className="h-5 w-5" />
            </div>
            {!collapsed && (
              <span className="font-display text-2xl tracking-tight font-extrabold text-slate-800 dark:text-white">
                Tharang
              </span>
            )}
          </div>
        </div>

        <nav className="flex-1 px-4 py-6 space-y-2 overflow-y-auto w-full styled-scrollbar">
          {[
            { id: "dashboard", icon: LayoutDashboard, label: "Dashboard", color: "text-blue-500" },
            { id: "events", icon: Star, label: "Events", color: "text-indigo-500" },
            { id: "today", icon: Clock, label: "What's Today", color: "text-amber-500" },
            { id: "announcements", icon: Megaphone, label: "Announcements", color: "text-rose-500" },
            { id: "profile", icon: User, label: "Profile", color: "text-emerald-500" },
          ].map((item) => (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id as any)}
              className={`w-full flex items-center gap-3 px-3 py-3 rounded-xl text-sm font-semibold transition-all duration-300 ${
                activeTab === item.id
                  ? "bg-indigo-50 dark:bg-indigo-500/10 text-indigo-700 dark:text-indigo-300 shadow-sm border border-indigo-100 dark:border-indigo-500/20"
                  : "text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800/50 hover:text-slate-900 dark:hover:text-white"
              }`}
            >
              <item.icon className={`h-5 w-5 ${activeTab === item.id ? item.color : ""}`} />
              {!collapsed && <span>{item.label}</span>}
            </button>
          ))}

          {!collapsed && (
            <div className="pt-8 pb-3 text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest px-3">
              Clubs
            </div>
          )}

          {clubs.map((club) => (
            <button
              key={club.name}
              onClick={() => navigate(`/student/club/${club.id}`)}
              className="w-full flex items-center gap-3 px-3 py-2 text-sm font-semibold text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800/50 hover:text-slate-900 dark:hover:text-white transition-all duration-200 rounded-xl group"
            >
              <span className="text-base group-hover:scale-125 transition-transform duration-300 drop-shadow-sm">{club.emoji}</span>
              {!collapsed && <span>{club.name}</span>}
            </button>
          ))}
        </nav>

        <div className="p-4 border-t border-slate-100 dark:border-slate-800">
          <button
            onClick={async () => { await auth.signOut(); navigate("/"); }}
            className="w-full flex items-center gap-3 px-3 py-3 text-sm font-semibold text-slate-500 dark:text-slate-400 hover:bg-rose-50 dark:hover:bg-rose-500/10 hover:text-rose-600 dark:hover:text-rose-400 rounded-xl transition-colors duration-200"
          >
            <LogOut className="h-5 w-5" />
            {!collapsed && <span>Sign Out</span>}
          </button>
        </div>
      </aside>

      {/* MAIN CONTENT */}
      <main className={`flex-1 ${collapsed ? "lg:ml-20" : "lg:ml-72"} transition-all duration-300 relative z-10 flex flex-col min-h-screen`}>
        
        {/* HEADER */}
        <header className="sticky top-0 z-30 bg-white/70 dark:bg-slate-900/70 backdrop-blur-xl border-b border-slate-200/50 dark:border-slate-800/50 px-8 py-5 flex items-center justify-between shadow-sm">
          <div className="flex flex-col">
            <h1 className="font-display text-2xl md:text-3xl tracking-tight font-extrabold text-slate-800 dark:text-white capitalize drop-shadow-sm">
              {activeTab === "dashboard" && `Welcome, ${name ? name.split(" ")[0] : "Student"}`}
              {activeTab !== "dashboard" && activeTab}
            </h1>
            <p className="text-slate-500 dark:text-slate-400 text-sm font-medium mt-1">
              {activeTab === "dashboard" && "Overview and quick access"}
              {activeTab === "events" && "Discover and track campus events"}
              {activeTab === "today" && "Your daily campus planner"}
              {activeTab === "announcements" && "Latest updates and notices"}
              {activeTab === "profile" && "Manage your academic persona"}
            </p>
          </div>

          <div className="flex items-center gap-4">
            <div className="relative" ref={announcementRef}>
              <button className="flex items-center justify-center shrink-0 rounded-full hover:scale-105 transition-all text-slate-500 dark:text-slate-400 hover:text-blue-500 p-2" onClick={handleOpenAnnouncements}>
                <Bell className="w-6 h-6" />
                {unreadCount > 0 && (
                  <span className="absolute top-1 right-1 bg-red-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full border-2 border-white dark:border-slate-900 shadow-sm leading-none flex items-center justify-center min-w-[18px]">
                    {unreadCount > 9 ? "9+" : unreadCount}
                  </span>
                )}
              </button>
              
              <AnimatePresence>
                {showAnnouncements && (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.95, y: 10 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95, y: 10 }}
                    className="absolute right-0 mt-3 bg-white dark:bg-slate-800 shadow-2xl rounded-2xl p-4 w-80 sm:w-96 border border-slate-100 dark:border-slate-700 z-50 flex flex-col gap-3 max-h-[80vh] overflow-y-auto"
                  >
                    <div className="flex items-center justify-between mb-1">
                      <h3 className="font-extrabold text-slate-800 dark:text-white text-lg">Quick Notices</h3>
                      <button onClick={() => { setActiveTab("announcements"); setShowAnnouncements(false); }} className="text-xs text-blue-500 font-bold hover:underline">View All</button>
                    </div>
                    {announcements.slice(0, 3).map((ann) => {
                       const isUnread = !(ann.readBy || []).includes(auth.currentUser?.uid || "");
                       return (
                         <div key={ann.id} className={`p-3 rounded-lg shadow-sm border-l-4 ${isUnread ? "bg-blue-50 dark:bg-blue-900/20 border-blue-500" : "bg-slate-50 dark:bg-slate-800/80 border-slate-300 dark:border-slate-600"}`}>
                           <h4 className={`font-bold text-sm ${isUnread ? "text-blue-900 dark:text-blue-200" : "text-slate-700 dark:text-slate-300"}`}>{ann.title}</h4>
                           <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 line-clamp-2">{ann.message}</p>
                         </div>
                       )
                    })}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            <button onClick={() => setActiveTab("profile")} className="flex items-center justify-center shrink-0 rounded-full hover:scale-105 transition-all outline-none">
               {photoURL ? (
                 <img src={photoURL} className="w-10 h-10 rounded-full object-cover shadow-sm border border-slate-200 dark:border-slate-700" alt="Avatar" />
               ) : (
                 <div className="w-10 h-10 rounded-full bg-gradient-to-br from-indigo-500 to-blue-600 text-white flex items-center justify-center font-bold text-lg shadow-sm">
                   {name ? name.charAt(0).toUpperCase() : "U"}
                 </div>
               )}
            </button>
          </div>
        </header>



        {/* PAGE CONTENT WRAPPER */}
        <div className="p-6 md:p-8 flex-1 w-full max-w-7xl mx-auto space-y-8 animate-in fade-in duration-500">
          
          {/* 1. DASHBOARD OVERVIEW */}
          {activeTab === "dashboard" && (
            <div className="space-y-8">
              {/* Stat Cards */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-700 p-6 flex flex-col justify-center gap-4 hover:shadow-md hover:scale-[1.02] transition-all">
                  <div className="w-12 h-12 rounded-xl bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 flex items-center justify-center">
                    <Star className="w-6 h-6" />
                  </div>
                  <div>
                    <h4 className="text-3xl font-extrabold text-slate-800 dark:text-white">{myRegistrations.length}</h4>
                    <p className="text-sm font-semibold text-slate-500 dark:text-slate-400">Registered Events</p>
                  </div>
                </div>
                <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-700 p-6 flex flex-col justify-center gap-4 hover:shadow-md hover:scale-[1.02] transition-all">
                  <div className="w-12 h-12 rounded-xl bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600 dark:text-indigo-400 flex items-center justify-center">
                    <Calendar className="w-6 h-6" />
                  </div>
                  <div>
                    <h4 className="text-3xl font-extrabold text-slate-800 dark:text-white">{events.length}</h4>
                    <p className="text-sm font-semibold text-slate-500 dark:text-slate-400">Total Upcoming Events</p>
                  </div>
                </div>
                <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-700 p-6 flex flex-col justify-center gap-4 hover:shadow-md hover:scale-[1.02] transition-all">
                  <div className="w-12 h-12 rounded-xl bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
                    <Award className="w-6 h-6" />
                  </div>
                  <div>
                    <h4 className="text-3xl font-extrabold text-slate-800 dark:text-white">{certificates.length}</h4>
                    <p className="text-sm font-semibold text-slate-500 dark:text-slate-400">Certificates Earned</p>
                  </div>
                </div>
              </div>

              {/* Upcoming Events Horizontal Carousel */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-xl font-bold text-slate-800 dark:text-white">Upcoming Events</h3>
                  <button onClick={() => setActiveTab("events")} className="text-sm text-blue-600 dark:text-blue-400 font-bold hover:underline">View All</button>
                </div>
                
                {filteredEvents.length === 0 ? (
                   <div className="w-full bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700 rounded-2xl p-10 text-center flex flex-col items-center">
                     <Calendar className="w-12 h-12 text-slate-300 dark:text-slate-600 mb-4" />
                     <p className="text-lg font-bold text-slate-500 dark:text-slate-400">No events found.</p>
                   </div>
                ) : (
                  <div className="flex overflow-x-auto gap-6 snap-x pb-4 styled-scrollbar px-1">
                    {filteredEvents.slice(0, 5).map((event) => (
                      <div key={event.id} onClick={() => navigate(`/student/event/${event.id}`)} className="cursor-pointer snap-start shrink-0 w-72 md:w-80 bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-700 overflow-hidden hover:shadow-xl hover:-translate-y-1 transition-all duration-300 flex flex-col">
                        <div className="bg-gradient-to-r from-indigo-500 to-blue-500 h-24 p-5 flex items-end relative overflow-hidden">
                           <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full blur-2xl -mr-10 -mt-10" />
                           <h4 className="text-white font-bold text-lg leading-tight line-clamp-2 drop-shadow-sm">{event.title}</h4>
                        </div>
                        <div className="p-5 flex-1 flex flex-col justify-between gap-4">
                           <div className="space-y-2">
                             <span className="inline-flex items-center gap-1.5 text-xs font-bold text-blue-700 dark:text-blue-300 bg-blue-50 dark:bg-blue-900/30 px-2 py-1 rounded-md mb-1">{event.club || "Campus Event"}</span>
                             <div className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-400 font-medium">
                               <Calendar className="w-4 h-4 text-indigo-500" /> {event.date || "TBD"}
                             </div>
                             <div className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-400 font-medium">
                               <MapPin className="w-4 h-4 text-rose-500" /> {event.location || (event as any).venue || "Venue TBD"}
                             </div>
                           </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Registered Approaching Events Panel */}
              {tomorrowEvents.length > 0 && (
                <div className="bg-gradient-to-r from-amber-500 to-orange-500 rounded-2xl p-6 shadow-lg border border-orange-400/50 text-white flex flex-col md:flex-row items-center justify-between gap-6">
                   <div>
                     <h3 className="text-2xl font-black drop-shadow-sm flex items-center gap-2">⚠️ Approaching Event <span className="animate-pulse">●</span></h3>
                     <p className="font-semibold text-orange-50 mt-1">You have events starting in less than 24 hours!</p>
                   </div>
                   <button onClick={() => setActiveTab("today")} className="bg-white/20 hover:bg-white/30 backdrop-blur-md px-6 py-2.5 rounded-full font-bold transition-colors">
                     View Schedule
                   </button>
                </div>
              )}
            </div>
          )}

          {/* 2. TODAY TAB - PLANNER */}
          {activeTab === "today" && (
            <div className="space-y-6">
              <div className="bg-indigo-600 dark:bg-indigo-900 rounded-3xl p-8 text-white shadow-xl relative overflow-hidden">
                <div className="absolute -right-20 -top-20 w-64 h-64 bg-white/10 rounded-full blur-3xl pointer-events-none" />
                <h2 className="text-3xl font-black mb-2 flex items-center gap-3"><Clock className="w-8 h-8" /> Today's Planner</h2>
                <p className="font-medium text-indigo-100">Your schedule for {new Date().toLocaleDateString(undefined, { weekday: 'long', month: 'long', day: 'numeric' })}</p>
              </div>

              {filteredEvents.length === 0 ? (
                <div className="py-20 text-center text-slate-500 dark:text-slate-400 bg-white dark:bg-slate-800 rounded-2xl border border-slate-100 dark:border-slate-700 shadow-sm">
                  <Clock className="w-16 h-16 mx-auto mb-4 text-slate-300 dark:text-slate-600" />
                  <p className="text-xl font-bold">Your day is clear!</p>
                  <p className="text-sm mt-2">No events are scheduled for today.</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {filteredEvents.map((event) => (
                    <motion.div key={event.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="bg-white dark:bg-slate-800 p-6 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-700 flex flex-col gap-4">
                       <div className="flex justify-between items-start">
                         <div className="bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400 px-3 py-1 rounded-md text-xs font-bold uppercase tracking-wider flex items-center gap-1.5 animate-pulse">
                           <div className="w-2 h-2 rounded-full bg-amber-500" /> Happening Today
                         </div>
                         <span className="font-bold text-slate-700 dark:text-slate-300 bg-slate-100 dark:bg-slate-700 px-3 py-1 rounded-lg text-sm">{event.time || "All Day"}</span>
                       </div>
                       <div>
                         <h3 className="text-2xl font-extrabold text-slate-800 dark:text-white mb-2">{event.title}</h3>
                         <div className="flex items-center gap-2 text-sm font-semibold text-slate-500 dark:text-slate-400">
                           <MapPin className="w-4 h-4 text-rose-500" /> {event.location || (event as any).venue || "Campus"}
                         </div>
                       </div>
                       <button onClick={() => navigate(`/student/event/${event.id}`)} className="mt-auto w-full bg-slate-900 dark:bg-white text-white dark:text-slate-900 py-3 rounded-xl font-bold hover:opacity-90 transition-opacity">
                         View Details
                       </button>
                    </motion.div>
                  ))}
                </div>
              )}
            </div>
          )}


        {/* 3. EVENTS TAB - TIMELINE */}
          {activeTab === "events" && (
            <div className="space-y-8">
               <div className="flex justify-between items-center mb-6">
                 <h2 className="text-2xl font-bold text-slate-800 dark:text-white">Events Timeline</h2>
                 
                 <div className="relative w-72 group">
                   <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 group-focus-within:text-indigo-500 transition-colors" />
                   <Input
                     placeholder="Search events..."
                     value={searchQuery}
                     onChange={(e) => setSearchQuery(e.target.value)}
                     className="pl-11 rounded-full bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 h-11 text-slate-700 dark:text-slate-200 focus-visible:ring-indigo-500"
                   />
                 </div>
               </div>

               {filteredEvents.length === 0 ? (
                 <div className="py-20 text-center text-slate-500 dark:text-slate-400 bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-700">
                   <Search className="w-12 h-12 mx-auto mb-4 opacity-50" />
                   <p className="text-lg font-bold">No events found matching your search.</p>
                 </div>
               ) : (
                 <div className="relative border-l-2 border-indigo-100 dark:border-indigo-900 ml-4 md:ml-6 space-y-12 pb-10">
                   {filteredEvents.sort((a,b) => (a.date > b.date ? 1 : -1)).map((event) => (
                     <motion.div key={event.id} initial={{opacity:0, x:-20}} animate={{opacity:1, x:0}} className="relative pl-8 md:pl-12">
                       {/* Timeline dot */}
                       <div className="absolute -left-[9px] top-6 w-4 h-4 rounded-full bg-indigo-500 shadow-[0_0_0_4px_rgba(99,102,241,0.2)] dark:shadow-[0_0_0_4px_rgba(99,102,241,0.1)]" />
                       
                       {/* Event Card */}
                       <div onClick={() => navigate(`/student/event/${event.id}`)} className="bg-white dark:bg-slate-800 p-6 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-700 hover:shadow-lg hover:-translate-y-1 transition-all cursor-pointer group flex flex-col md:flex-row gap-6">
                         <div className="flex-1 space-y-3">
                           <div className="flex items-center gap-3">
                             <span className="text-sm font-bold text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-900/30 px-3 py-1 rounded-full">{event.date}</span>
                             {event.club && <span className="text-xs font-bold text-slate-500 dark:text-slate-400 border border-slate-200 dark:border-slate-600 px-2 py-1 rounded-md">{event.club}</span>}
                           </div>
                           <h3 className="text-xl font-bold text-slate-800 dark:text-white group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">{event.title}</h3>
                           <p className="text-sm text-slate-600 dark:text-slate-400 line-clamp-2 md:w-4/5">{event.description || "Join us for this upcoming campus event. Click to view more details and register."}</p>
                         </div>
                         <div className="shrink-0 flex flex-col gap-2 justify-center md:items-end border-t md:border-t-0 md:border-l border-slate-100 dark:border-slate-700 pt-4 md:pt-0 md:pl-6">
                           <span className="flex items-center gap-2 text-sm font-semibold text-slate-600 dark:text-slate-300"><Clock className="w-4 h-4 text-emerald-500" /> {event.time || "TBD"}</span>
                           <span className="flex items-center gap-2 text-sm font-semibold text-slate-600 dark:text-slate-300"><MapPin className="w-4 h-4 text-rose-500" /> {event.location || (event as any).venue || "Campus"}</span>
                         </div>
                       </div>
                     </motion.div>
                   ))}
                 </div>
               )}
            </div>
          )}

          {/* 4. ANNOUNCEMENTS TAB */}
          {activeTab === "announcements" && (
            <div className="space-y-6">
               <div className="flex items-center gap-3 border-b border-slate-200 dark:border-slate-700 pb-4">
                 <div className="bg-rose-100 dark:bg-rose-900/30 p-2 rounded-lg text-rose-600 dark:text-rose-400">
                   <Megaphone className="w-6 h-6" />
                 </div>
                 <h2 className="text-2xl font-bold text-slate-800 dark:text-white">Campus Feed</h2>
               </div>

               {announcements.length === 0 ? (
                 <div className="py-20 text-center text-slate-500 dark:text-slate-400 bg-white dark:bg-slate-800 rounded-2xl border border-slate-100 dark:border-slate-700 shadow-sm">
                   <Bell className="w-16 h-16 mx-auto mb-4 text-slate-300 dark:text-slate-600" />
                   <p className="text-lg font-bold">You're all caught up!</p>
                 </div>
               ) : (
                 <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                   {announcements.map((ann) => {
                     const isUnread = !(ann.readBy || []).includes(auth.currentUser?.uid || "");
                     return (
                       <motion.div key={ann.id} initial={{opacity:0, scale:0.95}} animate={{opacity:1, scale:1}} className={`bg-white dark:bg-slate-800 p-6 rounded-2xl shadow-sm border ${isUnread ? "border-rose-400 shadow-rose-100 dark:shadow-rose-900/20" : "border-slate-100 dark:border-slate-700"} flex flex-col`}>
                          <div className="flex justify-between items-start mb-4">
                            <h3 className="text-lg font-bold text-slate-800 dark:text-white pr-4">{ann.title}</h3>
                            {isUnread && <span className="bg-rose-500 text-white text-[10px] uppercase tracking-wider font-bold px-2 py-0.5 rounded-sm shrink-0">New</span>}
                          </div>
                          <p className="text-slate-600 dark:text-slate-400 text-sm leading-relaxed whitespace-pre-wrap flex-1">{ann.message}</p>
                          <div className="mt-6 pt-4 border-t border-slate-100 dark:border-slate-700 text-xs font-semibold text-slate-400 dark:text-slate-500 text-right">
                             {ann.createdAt instanceof Date ? ann.createdAt.toLocaleDateString(undefined, { month: 'long', day: 'numeric', year: 'numeric'}) : "Recently"}
                          </div>
                       </motion.div>
                     )
                   })}
                 </div>
               )}
            </div>
          )}

          {/* 5. PROFILE & CERTIFICATES TAB */}
          {activeTab === "profile" && (
            <div className="space-y-8 max-w-5xl mx-auto">
               {/* Banner & Avatar */}
               <div className="bg-white dark:bg-slate-800 rounded-3xl shadow-sm border border-slate-100 dark:border-slate-700 overflow-hidden">
                 <div className="h-40 bg-gradient-to-r from-blue-600 to-indigo-600 relative">
                   <div className="absolute inset-0 bg-white/10 dark:bg-black/10 mix-blend-overlay" />
                 </div>
                 <div className="px-8 pb-8 relative">
                   <div className="flex flex-col sm:flex-row items-center sm:items-end justify-between gap-6 -mt-16 sm:-mt-20">
                     <div className="relative group/avatar cursor-pointer shrink-0 z-10">
                       <div className="h-32 w-32 rounded-full overflow-hidden bg-slate-100 dark:bg-slate-900 flex items-center justify-center border-4 border-white dark:border-slate-800 shadow-xl transition-all">
                         {photoURL ? (
                           <img src={photoURL} alt="Profile" className="h-full w-full object-cover" />
                         ) : (
                           <div className="w-full h-full bg-indigo-500 text-white flex items-center justify-center font-bold text-4xl">
                             {name ? name.charAt(0).toUpperCase() : "U"}
                           </div>
                         )}
                       </div>
                       {isEditing && (
                         <div className="absolute inset-0 bg-black/60 rounded-full opacity-0 group-hover/avatar:opacity-100 flex items-center justify-center transition-opacity border-4 border-transparent">
                           <span className="text-white text-xs font-bold uppercase tracking-widest">Edit</span>
                           <input type="file" accept="image/*" onChange={handleImageUpload} className="absolute inset-0 opacity-0 cursor-pointer" />
                         </div>
                       )}
                     </div>
                     <Button onClick={() => isEditing ? handleSave() : setIsEditing(true)} className="rounded-full px-6 py-2 bg-slate-900 dark:bg-white text-white dark:text-slate-900 font-bold hover:scale-105 transition-all mb-2 border-0 shadow-md">
                       {isEditing ? "Save Profile" : "Edit Profile"}
                     </Button>
                   </div>
                   
                   <div className="mt-8">
                     {isEditing ? (
                       <div className="grid grid-cols-1 md:grid-cols-2 gap-6 bg-slate-50 dark:bg-slate-900/50 p-6 rounded-2xl border border-slate-100 dark:border-slate-700">
                         <div className="col-span-1 md:col-span-2 bg-amber-50 dark:bg-amber-900/20 border-l-4 border-amber-500 p-4 rounded-r-lg mb-2">
                           <p className="text-amber-800 dark:text-amber-400 text-sm font-bold flex items-center gap-2"><CheckCircle className="w-4 h-4"/> Full Name is required for valid certificates.</p>
                         </div>
                         <Input placeholder="Full Name" value={name} onChange={(e) => setName(e.target.value)} className="bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 dark:text-white" />
                         <Input placeholder="Register Number" value={registerNumber} onChange={(e) => setRegisterNumber(e.target.value)} className="bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 dark:text-white" />
                         <Input placeholder="Phone Number" value={phone} onChange={(e) => setPhone(e.target.value)} className="bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 dark:text-white" />
                         <Input placeholder="Branch" value={branch} onChange={(e) => setBranch(e.target.value)} className="bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 dark:text-white" />
                         <Input placeholder="Year" value={year} onChange={(e) => setYear(e.target.value)} className="bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 dark:text-white col-span-1 md:col-span-2" />
                       </div>
                     ) : (
                       <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                         <div className="col-span-1 md:col-span-2">
                           <h2 className="text-2xl font-black text-slate-800 dark:text-white">{name || "Student Name"}</h2>
                           <p className="text-slate-500 dark:text-slate-400 font-medium mb-6">{auth.currentUser?.email}</p>
                           <div className="grid grid-cols-2 gap-y-4 gap-x-8">
                             <div>
                               <p className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-1">Branch</p>
                               <p className="font-semibold text-slate-700 dark:text-slate-300">{branch || "—"}</p>
                             </div>
                             <div>
                               <p className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-1">Year</p>
                               <p className="font-semibold text-slate-700 dark:text-slate-300">{year || "—"}</p>
                             </div>
                             <div>
                               <p className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-1">Register No.</p>
                               <p className="font-semibold text-slate-700 dark:text-slate-300">{registerNumber || "—"}</p>
                             </div>
                             <div>
                               <p className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-1">Phone</p>
                               <p className="font-semibold text-slate-700 dark:text-slate-300">{phone || "—"}</p>
                             </div>
                           </div>
                         </div>
                         <div className="col-span-1 flex flex-col gap-4">
                           <div className="bg-blue-50 dark:bg-blue-900/20 rounded-2xl p-4 border border-blue-100 dark:border-blue-900/30">
                             <p className="text-xs font-bold text-blue-600 dark:text-blue-400 uppercase tracking-wider mb-1">Events Joined</p>
                             <p className="text-3xl font-black text-blue-700 dark:text-blue-300">{myRegistrations.length}</p>
                           </div>
                           <div className="bg-emerald-50 dark:bg-emerald-900/20 rounded-2xl p-4 border border-emerald-100 dark:border-emerald-900/30">
                             <p className="text-xs font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-wider mb-1">Certificates</p>
                             <p className="text-3xl font-black text-emerald-700 dark:text-emerald-300">{certificates.length}</p>
                           </div>
                         </div>
                       </div>
                     )}
                   </div>
                 </div>
               </div>

               {/* My Certificates Section */}
               <div className="bg-white dark:bg-slate-800 rounded-3xl p-8 shadow-sm border border-slate-100 dark:border-slate-700">
                 <div className="flex items-center gap-3 mb-6">
                   <div className="bg-emerald-100 dark:bg-emerald-900/30 p-2 rounded-xl text-emerald-600 dark:text-emerald-400">
                     <Award className="w-6 h-6" />
                   </div>
                   <h3 className="text-2xl font-bold text-slate-800 dark:text-white">My Certificates</h3>
                 </div>

                 {certificates.length === 0 ? (
                   <div className="text-center py-10 bg-slate-50 dark:bg-slate-900/50 rounded-2xl border border-slate-100 dark:border-slate-800">
                     <p className="font-medium text-slate-500 dark:text-slate-400">You haven't earned any certificates yet.</p>
                   </div>
                 ) : (
                   <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                     {certificates.map((cert) => (
                       <div key={cert.id} className="bg-slate-50 dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-700 hover:shadow-md transition-shadow flex flex-col items-center text-center gap-4">
                         <div className="w-16 h-16 bg-gradient-to-br from-emerald-400 to-teal-500 rounded-2xl flex items-center justify-center text-white shadow-lg mb-2">
                           <Award className="w-8 h-8" />
                         </div>
                         <div>
                           <h4 className="font-bold text-slate-800 dark:text-white">{cert.eventName || "Event Certificate"}</h4>
                           <p className="text-xs mt-1 text-slate-500 dark:text-slate-400 font-semibold">{cert.createdAt ? new Date((cert.createdAt as any).seconds * 1000).toLocaleDateString() : "Recently"}</p>
                         </div>
                         <div className="flex w-full gap-2 mt-2 flex-col sm:flex-row">
                           <Button onClick={() => setPreviewCert(cert.certificateURL!)} variant="outline" className="flex-1 rounded-full border-slate-200 dark:border-slate-600 dark:text-white hover:bg-slate-100 dark:hover:bg-slate-800">View</Button>
                           <a href={getDownloadUrl(cert.certificateURL)} download className="flex-1 flex justify-center items-center bg-emerald-500 text-white rounded-full font-bold hover:bg-emerald-600 transition-colors py-2 px-4 shadow-sm text-sm">Download</a>
                         </div>
                       </div>
                     ))}
                   </div>
                 )}
               </div>
            </div>
          )}

        </div>

      </main>

      {/* CERTIFICATE PREVIEW MODAL */}
      <AnimatePresence>
        {previewCert && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-50 p-6"
            onClick={() => setPreviewCert(null)}
          >
            <motion.div 
              initial={{ scale: 0.95, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.95, y: 20 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-white p-6 rounded-3xl w-full max-w-4xl h-[85vh] shadow-2xl flex flex-col relative"
            >
              <button 
                onClick={() => setPreviewCert(null)}
                className="absolute top-[-15px] right-[-15px] bg-white border border-slate-200 shadow-md text-slate-600 hover:text-red-500 hover:scale-110 p-2 rounded-full transition-all z-10"
              >
                ✕
              </button>
              <div className="flex-1 rounded-2xl overflow-hidden bg-slate-100 border border-slate-200">
                <iframe
                  src={previewCert}
                  className="w-full h-full"
                  title="Certificate Preview"
                />
              </div>
              <div className="mt-4 flex justify-between items-center">
                <p className="text-slate-500 font-medium">Certificate Preview</p>
                <a 
                  href={getDownloadUrl(previewCert)} 
                  download
                  className="bg-blue-600 text-white px-6 py-2.5 rounded-full font-bold shadow hover:bg-blue-700 transition-colors"
                >
                  Download HD
                </a>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

    </div>
  );
};

export default StudentHome;