import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { LogOut, Search, ChevronLeft, ChevronRight, User, ShieldCheck, Download, Eye, FileText } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { auth, db } from "../firebase";
import {
  collection,
  query,
  where,
  getDocs,
  doc,
  getDoc,
  setDoc,
  updateDoc,
  orderBy
} from "firebase/firestore";

interface StudentItem {
  id: string;
  name: string;
  email: string;
  branch?: string;
  year?: string;
  semester?: string;
  registerNumber?: string;
  photoURL?: string;
  allowStaffView?: boolean;
}

interface RegistrationItem {
  id: string;
  eventId: string;
  eventName?: string;
  date?: string;
  status?: string;
}

interface CertItem {
  id: string;
  eventId: string;
  certificateURL: string;
}

const StaffAdvisorPage = () => {
  const navigate = useNavigate();
  const [collapsed, setCollapsed] = useState(false);
  const [loading, setLoading] = useState(true);
  
  const [staffProfile, setStaffProfile] = useState<any>(null);
  const [students, setStudents] = useState<StudentItem[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  
  const [selectedStudent, setSelectedStudent] = useState<StudentItem | null>(null);
  const [studentRegs, setStudentRegs] = useState<RegistrationItem[]>([]);
  const [studentCerts, setStudentCerts] = useState<CertItem[]>([]);
  
  const [profileForm, setProfileForm] = useState({ branch: "", year: "", semester: "" });
  const [isUpdatingProfile, setIsUpdatingProfile] = useState(false);

  useEffect(() => {
    const loadStaffData = async () => {
      const user = auth.currentUser;
      if (!user) {
        setLoading(false);
        return;
      }

      try {
        const docRef = doc(db, "users", user.uid);
        const docSnap = await getDoc(docRef);

        let data;
        if (docSnap.exists()) {
          data = docSnap.data();
        } else {
          data = {
            uid: user.uid,
            email: user.email,
            role: "staffAdvisor",
            branch: "",
            year: "",
            semester: ""
          };
          await setDoc(docRef, data);
        }

        setStaffProfile(data);
        setProfileForm({ branch: data.branch || "", year: data.year || "", semester: data.semester || "" });
        console.log("User UID:", user.uid);
        console.log("Staff:", data);
        
        if (data.branch && data.year && data.semester) {
          fetchFilteredStudents(data.branch, data.year, data.semester);
        } else {
           setLoading(false);
           toast.error("Please complete your profile (branch, year, semester) to view students");
        }
      } catch (err) {
        console.error(err);
        toast.error("Error loading staff data");
        setLoading(false);
      }
    };
    loadStaffData();
  }, []);

  const normalize = (v: any) => String(v || "").trim().toLowerCase();

  const fetchFilteredStudents = async (branch: string, year: string, semester: string) => {
    setLoading(true);
    
    try {
      const q = query(
        collection(db, "users"),
        where("role", "==", "student")
      );
      
      const snap = await getDocs(q);
      const allStudents = snap.docs.map(d => ({ id: d.id, ...d.data() } as StudentItem));
      console.log("Students:", allStudents);

      const list = allStudents.filter(s => {
        return normalize(s.branch) === normalize(branch) && 
               normalize(s.year) === normalize(year) && 
               normalize(s.semester) === normalize(semester) &&
               s.allowStaffView === true;
      });

      console.log("Filtered:", list);

      list.sort((a,b) => (a.name || "").localeCompare(b.name || ""));
      setStudents(list);
    } catch(err) {
      console.error("Fetch error:", err);
      toast.error("Failed to fetch students");
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!profileForm.branch || !profileForm.year || !profileForm.semester) {
      toast.error("Please complete your profile (branch, year, semester) to view students");
      return;
    }
    
    setIsUpdatingProfile(true);
    try {
      const user = auth.currentUser;
      if (!user) return;
      
      await updateDoc(doc(db, "users", user.uid), {
        branch: profileForm.branch,
        year: profileForm.year,
        semester: profileForm.semester
      });
      
      const newStaff = { ...staffProfile, ...profileForm };
      setStaffProfile(newStaff);
      console.log("Staff after update:", newStaff);
      toast.success("Profile updated successfully");
      fetchFilteredStudents(newStaff.branch, newStaff.year, newStaff.semester);
    } catch (err) {
      console.error(err);
      toast.error("Failed to update profile");
    } finally {
      setIsUpdatingProfile(false);
    }
  };

  const loadStudentDetails = async (student: StudentItem) => {
    setSelectedStudent(student);
    
    // Privacy check
    if (student.allowStaffView === false) {
      setStudentRegs([]);
      setStudentCerts([]);
      return;
    }

    // fetch registrations and map events
    try {
      const regQ = query(collection(db, "registrations"), where("userId", "==", student.id));
      const regSnap = await getDocs(regQ);
      
      const eventsSnap = await getDocs(collection(db, "events"));
      const allEvents = eventsSnap.docs.map(e => ({id: e.id, ...e.data()} as any));
      
      const today = new Date().toISOString().split("T")[0];
      
      const regs: RegistrationItem[] = regSnap.docs.map(d => {
        const data = d.data();
        const eventData = allEvents.find(e => e.id === data.eventId);
        
        return {
          id: d.id,
          eventId: data.eventId,
          eventName: eventData?.title || data.eventName || data.eventTitle || "Unknown Event",
          date: eventData?.date || (data.registeredAt?.seconds ? new Date(data.registeredAt.seconds * 1000).toLocaleDateString() : "Unknown Date"),
          status: (eventData?.date && eventData.date >= today) ? "Upcoming" : "Completed"
        };
      });
      setStudentRegs(regs);
    } catch(err) { console.error(err); }

    // fetch certificates
    try {
      const certQ = query(collection(db, "certificates"), where("userId", "==", student.id));
      const certSnap = await getDocs(certQ);
      const certs: CertItem[] = certSnap.docs.map(d => ({
        id: d.id,
        eventId: d.data().eventId,
        certificateURL: d.data().certificateURL
      }));
      setStudentCerts(certs);
    } catch(err) { console.error(err); }
  };

  const filteredStudents = students.filter(s => 
    (s.name || "").toLowerCase().includes(searchQuery.toLowerCase()) || 
    (s.registerNumber || "").toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex font-sans text-slate-900 dark:text-slate-100 transition-colors duration-300">
      
      {/* SIDEBAR */}
      <aside className={`hidden lg:flex ${collapsed ? "w-20" : "w-72"} bg-white dark:bg-slate-900 flex-col fixed inset-y-0 left-0 z-40 transition-all duration-300 shadow-[4px_0_24px_rgba(0,0,0,0.02)] border-r border-slate-100 dark:border-slate-800`}>
        <button onClick={() => setCollapsed(!collapsed)} className="absolute -right-3.5 top-7 bg-white dark:bg-slate-800 border text-slate-500 hover:text-indigo-600 p-1.5 rounded-full shadow-md z-50">
          {collapsed ? <ChevronRight size={14} /> : <ChevronLeft size={14} />}
        </button>

        <div className="p-6 h-20 flex items-center border-b border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-3">
            <div className="bg-gradient-to-br from-indigo-500 to-blue-600 text-white shadow-lg p-2.5 rounded-xl">
              <ShieldCheck className="h-5 w-5" />
            </div>
            {!collapsed && <span className="font-display text-xl font-extrabold">Staff Portal</span>}
          </div>
        </div>

        <nav className="flex-1 px-4 py-6">
          <button className="w-full flex items-center gap-3 px-3 py-3 rounded-xl text-sm font-semibold bg-indigo-50 dark:bg-indigo-500/10 text-indigo-700 dark:text-indigo-300 shadow-sm border border-indigo-100 dark:border-indigo-500/20">
            <User className="h-5 w-5 text-indigo-500" />
            {!collapsed && <span>My Students</span>}
          </button>
        </nav>

        <div className="p-4 border-t border-slate-100 dark:border-slate-800">
          <button onClick={async () => { await auth.signOut(); navigate("/"); }} className="w-full flex items-center gap-3 px-3 py-3 text-sm font-semibold text-slate-500 hover:text-rose-600 rounded-xl">
            <LogOut className="h-5 w-5" />
            {!collapsed && <span>Sign Out</span>}
          </button>
        </div>
      </aside>

      {/* MAIN CONTENT */}
      <main className={`flex-1 ${collapsed ? "lg:ml-20" : "lg:ml-72"} transition-all duration-300 flex flex-col min-h-screen`}>
        
        <header className="sticky top-0 z-30 bg-white/70 dark:bg-slate-900/70 backdrop-blur-xl border-b border-slate-200/50 dark:border-slate-800/50 px-8 py-5 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-extrabold drop-shadow-sm">Welcome, {staffProfile?.name?.split(" ")[0] || "Advisor"}</h1>
            <p className="text-slate-500 dark:text-slate-400 text-sm font-medium mt-1">
              Class: {staffProfile?.branch} • Year {staffProfile?.year} • Sem {staffProfile?.semester}
            </p>
          </div>
        </header>

        <div className="p-6 md:p-8 flex-1 flex flex-col lg:flex-row gap-8 max-w-[1600px] w-full mx-auto">
          
          {/* STUDENT LIST OR PROFILE SETUP */}
          <div className="w-full lg:w-1/3 flex flex-col gap-4">
             {(!staffProfile?.branch || !staffProfile?.year || !staffProfile?.semester) ? (
               <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-700 overflow-hidden flex-1 p-8 flex flex-col justify-center animate-in fade-in zoom-in-95 duration-300">
                 <ShieldCheck className="w-12 h-12 text-indigo-500 mb-4 mx-auto opacity-80" />
                 <h2 className="text-xl font-bold text-center text-slate-800 dark:text-slate-200 mb-2">Profile Incomplete</h2>
                 <p className="text-center text-slate-500 text-sm mb-6">Please complete your profile (branch, year, semester) to view students</p>
                 <form onSubmit={handleUpdateProfile} className="space-y-4">
                    <div>
                      <label className="text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1 block">Branch</label>
                      <Input value={profileForm.branch} onChange={(e) => setProfileForm({...profileForm, branch: e.target.value})} placeholder="e.g. cs1, it, ec" className="bg-slate-50 dark:bg-slate-900 border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 rounded-xl" />
                    </div>
                    <div>
                      <label className="text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1 block">Year</label>
                      <Input value={profileForm.year} onChange={(e) => setProfileForm({...profileForm, year: e.target.value})} placeholder="e.g. 1, 2, 3, 4" className="bg-slate-50 dark:bg-slate-900 border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 rounded-xl" />
                    </div>
                    <div>
                      <label className="text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1 block">Semester</label>
                      <Input value={profileForm.semester} onChange={(e) => setProfileForm({...profileForm, semester: e.target.value})} placeholder="e.g. 1, 2, 3" className="bg-slate-50 dark:bg-slate-900 border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 rounded-xl" />
                    </div>
                    <Button type="submit" disabled={isUpdatingProfile} className="w-full bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl py-5 font-bold shadow-sm shadow-indigo-200/50 mt-2 transition-all">
                      {isUpdatingProfile ? "Saving Profile..." : "Complete Profile"}
                    </Button>
                 </form>
               </div>
             ) : (
               <>
                 <div className="relative">
                   <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                   <Input
                     placeholder="Search student..."
                     value={searchQuery}
                     onChange={(e) => setSearchQuery(e.target.value)}
                     className="pl-11 rounded-full bg-white dark:bg-slate-800"
                   />
                 </div>
                 
                 <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-700 overflow-hidden flex-1 flex flex-col">
                   <div className="p-4 border-b border-slate-100 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800/50">
                     <h2 className="font-bold text-slate-700 dark:text-slate-300">Students ({filteredStudents.length})</h2>
                   </div>
                   <div className="overflow-y-auto flex-1 p-2 max-h-[600px] styled-scrollbar">
                     {loading ? (
                       <div className="p-8 text-center text-slate-500 font-medium animate-pulse flex flex-col items-center">
                         <span className="w-6 h-6 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin mb-3"></span>
                         Fetching students...
                       </div>
                     ) : (
                       <>
                         {filteredStudents.map(student => (
                           <button 
                             key={student.id} 
                             onClick={() => loadStudentDetails(student)}
                             className={`w-full text-left p-3 rounded-xl mb-1 flex items-center gap-3 transition-colors ${selectedStudent?.id === student.id ? "bg-indigo-50 dark:bg-indigo-900/30 border border-indigo-100 dark:border-indigo-800" : "hover:bg-slate-50 dark:hover:bg-slate-700/50 border border-transparent"}`}
                           >
                             <div className="w-10 h-10 rounded-full bg-slate-200 dark:bg-slate-700 overflow-hidden shrink-0 flex items-center justify-center font-bold text-indigo-500">
                               {student.photoURL ? <img src={student.photoURL} alt="" className="w-full h-full object-cover" /> : student.name?.charAt(0).toUpperCase()}
                             </div>
                             <div className="flex-1 overflow-hidden">
                               <p className={`font-bold truncate ${selectedStudent?.id === student.id ? "text-indigo-700 dark:text-indigo-300" : "text-slate-700 dark:text-slate-200"}`}>{student.name}</p>
                               <p className="text-xs text-slate-500 truncate">{student.registerNumber || student.email}</p>
                             </div>
                           </button>
                         ))}
                         {filteredStudents.length === 0 && (
                           <div className="p-8 text-center text-slate-400 font-medium">No students found for this class</div>
                         )}
                       </>
                     )}
                   </div>
                 </div>
               </>
             )}
          </div>

          {/* STUDENT DETAILS PANEL */}
          <div className="w-full lg:w-2/3">
             {selectedStudent ? (
               <div className="bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700 rounded-3xl shadow-sm overflow-hidden flex flex-col h-full animate-in fade-in slide-in-from-bottom-4">
                 <div className="p-8 border-b border-slate-100 dark:border-slate-700 bg-gradient-to-r from-indigo-500/5 to-blue-500/5 dark:from-indigo-500/10 dark:to-blue-500/10 flex items-center gap-6">
                    <div className="w-20 h-20 rounded-2xl bg-white dark:bg-slate-700 shadow-sm overflow-hidden border-2 border-white dark:border-slate-600 shrink-0 flex items-center justify-center font-bold text-3xl text-indigo-500">
                      {selectedStudent.photoURL ? <img src={selectedStudent.photoURL} alt="" className="w-full h-full object-cover" /> : selectedStudent.name?.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <h2 className="text-2xl font-black text-slate-800 dark:text-white">{selectedStudent.name}</h2>
                      <p className="text-slate-500 font-medium">{selectedStudent.email}</p>
                      {selectedStudent.registerNumber && <p className="text-sm font-semibold text-indigo-600 dark:text-indigo-400 mt-1">Reg No: {selectedStudent.registerNumber}</p>}
                    </div>
                 </div>

                 <div className="p-8 flex-1 overflow-y-auto">
                   <h3 className="text-lg font-bold mb-4 flex items-center gap-2"><FileText className="w-5 h-5 text-indigo-500" /> Event Participation</h3>
                   {selectedStudent.allowStaffView === false ? (
                     <div className="bg-slate-50 dark:bg-slate-900/50 p-8 rounded-2xl border border-rose-100 dark:border-rose-900/30 flex flex-col items-center justify-center text-center mt-10">
                       <ShieldCheck className="w-16 h-16 text-rose-500 mb-4 opacity-80" />
                       <h4 className="font-bold text-xl text-slate-800 dark:text-slate-200">Access Restricted</h4>
                       <p className="text-slate-500 dark:text-slate-400 mt-2 text-sm max-w-sm">This student has restricted access to their activity. Privacy settings must be enabled by the student in their profile.</p>
                     </div>
                   ) : (
                     <div className="space-y-4">
                       {studentRegs.length === 0 ? (
                         <p className="text-slate-500 text-sm">No events found for this student.</p>
                       ) : (
                         studentRegs.map(reg => {
                           const cert = studentCerts.find(c => c.eventId === reg.eventId);
                           return (
                             <div key={reg.id} className="bg-slate-50 dark:bg-slate-900/50 p-4 rounded-2xl border border-slate-100 dark:border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-4 scale-100 hover:scale-[1.01] transition-transform">
                               <div>
                                 <h4 className="font-bold text-slate-800 dark:text-slate-200">{reg.eventName}</h4>
                                 <div className="flex items-center gap-3 mt-1.5">
                                   <p className="text-xs text-slate-500 bg-slate-200/50 dark:bg-slate-800 w-fit px-2 py-0.5 rounded-md font-medium">Date: {reg.date}</p>
                                   <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full ${reg.status === 'Upcoming' ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400' : 'bg-slate-200 text-slate-700 dark:bg-slate-800 dark:text-slate-300'}`}>{reg.status}</span>
                                 </div>
                               </div>
                               {cert && (
                                 <div className="flex gap-2">
                                   <Button size="sm" variant="outline" className="border-indigo-200 text-indigo-700 bg-indigo-50/50 hover:bg-indigo-100 dark:bg-indigo-900/50 dark:text-indigo-300 dark:border-indigo-800" onClick={() => window.open(cert.certificateURL, '_blank')}>
                                     <Eye className="w-4 h-4 mr-1.5" /> View
                                   </Button>
                                   <a href={cert.certificateURL} download={`Certificate-${reg.eventName}.jpg`} target="_blank" rel="noopener noreferrer">
                                     <Button size="sm" className="bg-indigo-600 hover:bg-indigo-700 text-white shadow-sm">
                                       <Download className="w-4 h-4 mr-1.5" /> Download
                                     </Button>
                                   </a>
                                 </div>
                               )}
                             </div>
                           )
                         })
                       )}
                     </div>
                   )}
                 </div>
               </div>
             ) : (
               <div className="h-full border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-3xl flex flex-col items-center justify-center text-slate-400">
                 <User className="w-16 h-16 mb-4 opacity-50" />
                 <p className="font-semibold text-lg">Select a student</p>
                 <p className="text-sm">Click on a student's name to view their details & certificates.</p>
               </div>
             )}
          </div>

        </div>
      </main>
    </div>
  );
};

export default StaffAdvisorPage;
