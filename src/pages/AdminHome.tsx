import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Calendar, LogOut, Plus, Trash2, Edit3, Clock, MapPin } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { signOut } from "firebase/auth";
import { auth, db } from "@/firebase";
import {
  collection, doc, getDocs, setDoc, updateDoc, deleteDoc, query, where
} from "firebase/firestore";
import { addDoc, getDoc} from "firebase/firestore";
import { arrayUnion, arrayRemove } from "firebase/firestore";
interface EventItem {
  id: string;
  title: string;
  description: string;
  date: string;
  time: string;
  location: string;
  posterURL?: string;
  eventType: "free" | "paid";
  requireScreenshot?: boolean;
}

const AdminHome = () => {
  const navigate = useNavigate();

  const [events, setEvents] = useState<EventItem[]>([]);
  const [form, setForm] = useState({
    title: "",
    description: "",
    date: "",
    time: "",
    location: "",
  });

  const [poster, setPoster] = useState<File | null>(null);
  const [eventType, setEventType] = useState<"free" | "paid">("free");
  const [requireScreenshot, setRequireScreenshot] = useState(false);

  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  const [registrations, setRegistrations] = useState<{ id: string; studentName?: string; branch?: string; year?: string; phone?: string; screenshotURL?: string; [key: string]: unknown }[]>([]);
  const [selectedEventId, setSelectedEventId] = useState("");

  const [clubId, setClubId] = useState("");
  const [clubProfile, setClubProfile] = useState({
  name: "",
  intro: "",
  flagshipEvent: "",
});

const [execom, setExecom] = useState<{ id: string; name?: string; role?: string; imageURL?: string; clubId?: string; [key: string]: unknown }[]>([]);
const [member, setMember] = useState({ name: "", role: "" });
const [memberImage, setMemberImage] = useState<File | null>(null);
const [galleryFiles, setGalleryFiles] = useState<File[]>([]);
const [galleryImages, setGalleryImages] = useState<string[]>([]);

  // ✅ FETCH EVENTS
 useEffect(() => {
  const fetchData = async () => {
    try {
      const user = auth.currentUser;
      if (!user?.email) return;

      // ✅ STEP 1: GET CLUB
      const clubQuery = query(
        collection(db, "clubs"),
        where("adminEmail", "==", user.email)
      );

      const clubSnap = await getDocs(clubQuery);

      if (clubSnap.empty) {
        console.log("No club found");
        return;
      }

      const clubDoc = clubSnap.docs[0];
      const clubId = clubDoc.id;

      console.log("Club ID:", clubId); // 🔥 DEBUG

      setClubId(clubId);

      const clubData = clubDoc.data();

      setClubProfile({
        name: clubData.name || "",
        intro: clubData.intro || "",
        flagshipEvent: clubData.flagshipEvent || "",
      });
      setGalleryImages(clubData.gallery || []);

      // ✅ STEP 2: FETCH EXECOM
      const execomSnap = await getDocs(
        query(collection(db, "execomMembers"), where("clubId", "==", clubId))
      );

      console.log("Execom:", execomSnap.docs.length); // DEBUG

      setExecom(
        execomSnap.docs.map(d => ({
          id: d.id,
          ...d.data(),
        }))
      );

      // ✅ STEP 3: FETCH EVENTS
      const eventsSnap = await getDocs(
        query(collection(db, "events"), where("clubId", "==", clubId))
      );

      console.log("Events:", eventsSnap.docs.length); // DEBUG

      setEvents(
        eventsSnap.docs.map(d => ({
          id: d.id,
          ...(d.data() as EventItem),
        }))
      );

    } catch (err) {
      console.error("FETCH ERROR:", err);
    }
  };

  fetchData();
}, []);

  // ✅ LOAD REGISTRATIONS
  const loadRegistrations = async (eventId: string) => {
    const q = query(collection(db, "registrations"), where("eventId", "==", eventId));
    const snap = await getDocs(q);
    setRegistrations(snap.docs.map(doc => ({ id: doc.id, ...doc.data() })));
  };

  // ✅ RESET
  const resetForm = () => {
    setForm({ title: "", description: "", date: "", time: "", location: "" });
    setPoster(null);
    setEditingId(null);
    setShowForm(false);
  };

  // ✅ CREATE / UPDATE EVENT
  const handleSubmitEvent = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!form.title || !form.date) {
      toast.error("Fill required fields");
      return;
    }

    let posterURL = "";

    if (poster) {
      const formData = new FormData();
      formData.append("file", poster);
      formData.append("upload_preset", "campus_upload");

      const res = await fetch(
        "https://api.cloudinary.com/v1_1/drnrkdzfa/image/upload",
        { method: "POST", body: formData }
      );

      const data = await res.json();
      posterURL = data.secure_url;
    }

    const eventData = {
      ...form,
      posterURL,
      clubId: clubId,
      eventType,
      requireScreenshot,
    };

    if (editingId) {
      await updateDoc(doc(db, "events", editingId), eventData);
      toast.success("Event updated");
    } else {
      const docRef = doc(collection(db, "events"));
      await setDoc(docRef, eventData);
      setEvents(prev => [...prev, { ...eventData, id: docRef.id }]);
      toast.success("Event created");
    }

    resetForm();
  };

  // ✅ DELETE EVENT
  const handleDeleteEvent = async (id: string) => {
    await deleteDoc(doc(db, "events", id));
    setEvents(prev => prev.filter(e => e.id !== id));
  };

  const handleEditEvent = (event: EventItem) => {
    setEditingId(event.id);
    setForm({
      title: event.title || "",
      description: event.description || "",
      date: event.date || "",
      time: event.time || "",
      location: event.location || ""
    });
    setEventType(event.eventType || "free");
    setRequireScreenshot(event.requireScreenshot || false);
    setShowForm(true);
    
    // Smooth scroll to the top so the form is instantly visible to the user
    window.scrollTo({ top: 0, behavior: "smooth" });
  };
const handleSaveClubProfile = async () => {
  try {
    const user = auth.currentUser;
    if (!user?.email) return;

    const q = query(
      collection(db, "clubs"),
      where("adminEmail", "==", user.email)
    );

    const snap = await getDocs(q);

    if (!snap.empty) {
      await updateDoc(snap.docs[0].ref, clubProfile);
    } else {
      await addDoc(collection(db, "clubs"), {
        ...clubProfile,
        adminEmail: user.email,
      });
    }

    toast.success("Club profile saved");
  } catch (err) {
    console.error(err);
    toast.error("Error saving profile");
  }
};
const handleAddExecom = async () => {
  if (!member.name || !member.role) {
    toast.error("Fill all fields");
    return;
  }

  try {
    let imageURL = "";

    if (memberImage) {
      const formData = new FormData();
      formData.append("file", memberImage);
      formData.append("upload_preset", "campus_upload");

      const res = await fetch(
        "https://api.cloudinary.com/v1_1/drnrkdzfa/image/upload",
        { method: "POST", body: formData }
      );

      const data = await res.json();
      imageURL = data.secure_url;
    }

    const docRef = doc(collection(db, "execomMembers"));

    const newMember = {
      name: member.name,
      role: member.role,
      imageURL,
      clubId: clubId,
    };

    await setDoc(docRef, newMember);

    setExecom(prev => [...prev, { id: docRef.id, ...newMember }]);
    setMember({ name: "", role: "" });
    setMemberImage(null);

    toast.success("Member added");
  } catch (err) {
    console.error(err);
  }
};
const [selectedImage, setSelectedImage] = useState<string | null>(null);
const handleUploadGallery = async () => {
  if (!galleryFiles.length) {
    toast.error("Select images first");
    return;
  }

  try {
    const urls: string[] = [];

    for (const file of galleryFiles) {
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
      urls.push(data.secure_url);
    }

    // 🔥 SAVE TO CURRENT CLUB ONLY
    await updateDoc(doc(db, "clubs", clubId), {
      gallery: arrayUnion(...urls),
    });

    setGalleryImages(prev => [...prev, ...urls]);

    toast.success("Gallery updated!");
    setGalleryFiles([]);

  } catch (err) {
    console.error(err);
    toast.error("Upload failed");
  }
};

const handleDeleteGalleryImage = async (url: string) => {
  try {
    const parts = url.split('/');
    const publicId = parts[parts.length - 1].split('.')[0];
    
    await fetch(`https://api.cloudinary.com/v1_1/drnrkdzfa/delete_by_token`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ public_id: publicId })
    });

    await updateDoc(doc(db, "clubs", clubId), {
      gallery: arrayRemove(url)
    });

    setGalleryImages(prev => prev.filter(img => img !== url));
    toast.success("Image deleted");
  } catch (error) {
    console.error(error);
    toast.error("Failed to delete image");
  }
};
const handleDeleteMember = async (id: string) => {
  await deleteDoc(doc(db, "execomMembers", id));
  setExecom(prev => prev.filter(m => m.id !== id));
};
  return (
    <div className="min-h-screen bg-white">

      {/* HEADER */}
      <header className="bg-primary px-6 py-4 flex justify-between">
        <span className="text-white font-bold">Admin Panel</span>

        <button
          onClick={async () => {
            await signOut(auth);
            navigate("/login");
          }}
          className="text-white"
        >
          <LogOut />
        </button>
      </header>

      <div className="p-6">
        {/* CLUB GALLERY */}
<h2 className="text-xl font-bold mt-6">Club Gallery</h2>

<div className="bg-card p-4 rounded mt-3 space-y-3">

  <input
    type="file"
    multiple
    accept="image/*"
    onChange={(e) =>
      setGalleryFiles(Array.from(e.target.files || []))
    }
  />

  <Button
    onClick={handleUploadGallery}
    className="bg-blue-500 text-white"
  >
    Upload Images
  </Button>

</div>

{galleryImages.length > 0 && (
  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6">
    {galleryImages.map((url, i) => (
      <div key={i} className="relative group">
        <img src={url} className="rounded-lg object-cover w-full h-32" />
        <button
          className="absolute top-2 right-2 bg-red-500 hover:bg-red-600 text-white px-2 py-1 rounded text-sm opacity-0 group-hover:opacity-100 transition-opacity"
          onClick={() => handleDeleteGalleryImage(url)}
        >
          Delete
        </button>
      </div>
    ))}
  </div>
)}

        {/* CLUB PROFILE */}
<h2 className="text-xl font-bold mt-6">Club Profile</h2>

<div className="bg-card p-4 rounded mt-3 space-y-3">
  <Input
    placeholder="Club Name"
    value={clubProfile.name}
    onChange={e => setClubProfile({ ...clubProfile, name: e.target.value })}
  />

  <Textarea
    placeholder="Club Introduction"
    value={clubProfile.intro}
    onChange={e => setClubProfile({ ...clubProfile, intro: e.target.value })}
  />

  <Input
    placeholder="Flagship Event"
    value={clubProfile.flagshipEvent}
    onChange={e => setClubProfile({ ...clubProfile, flagshipEvent: e.target.value })}
  />

  <Button onClick={handleSaveClubProfile}>
    Save Club Profile
  </Button>
</div>

{/* EXECOM */}
<h2 className="text-xl font-bold mt-6">Execom Members</h2>

<div className="bg-card p-4 rounded mt-3 space-y-3">

  <Input
    placeholder="Member Name"
    value={member.name}
    onChange={e => setMember({ ...member, name: e.target.value })}
  />

  <Input
    placeholder="Role"
    value={member.role}
    onChange={e => setMember({ ...member, role: e.target.value })}
  />

  <input
    type="file"
    onChange={e => setMemberImage(e.target.files?.[0] || null)}
  />

  <Button onClick={handleAddExecom}>
    Add Member
  </Button>
</div>
<div className="grid grid-cols-2 md:grid-cols-3 gap-4 mt-4">
  {execom.map(m => (
    <div key={m.id} className="border p-3 rounded text-center">

      {m.imageURL && (
        <img
          src={m.imageURL}
          className="w-20 h-20 rounded-full mx-auto object-cover"
        />
      )}

      <p className="font-semibold mt-2">{m.name}</p>
      <p className="text-sm text-muted-foreground">{m.role}</p>

      <Button size="sm" onClick={() => handleDeleteMember(m.id)}>
        <Trash2 />
      </Button>
    </div>
  ))}
</div>
        {/* CREATE BUTTON */}
        {!showForm && (
          <Button onClick={() => { resetForm(); setShowForm(true); }} className="mt-8">
            <Plus className="mr-2 w-4 h-4" /> New Event
          </Button>
        )}

        {/* FORM (Moved to top so it's visible immediately) */}
        {showForm && (
          <div className="bg-card p-6 rounded-lg shadow-md mt-6 border border-border">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xl font-bold">{editingId ? "Edit Event" : "Create New Event"}</h3>
              <Button variant="ghost" onClick={resetForm}>Cancel</Button>
            </div>
            <form onSubmit={handleSubmitEvent} className="space-y-4">
              <Input placeholder="Event Title" value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} />
              <Textarea placeholder="Description" value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} />
              
              <div className="grid grid-cols-2 gap-4">
                <Input type="date" value={form.date} onChange={e => setForm({ ...form, date: e.target.value })} />
                <Input type="time" value={form.time} onChange={e => setForm({ ...form, time: e.target.value })} />
              </div>
              
              <Input placeholder="Venue / Location" value={form.location} onChange={e => setForm({ ...form, location: e.target.value })} />

              <div>
                <label className="text-sm font-medium mb-1 block">Event Poster (Optional)</label>
                <input type="file" className="block w-full text-sm" onChange={e => setPoster(e.target.files?.[0] || null)} />
              </div>

              {/* EVENT TYPE */}
              <div className="flex gap-6 items-center border-t pt-4">
                <p className="text-sm font-semibold">Event Type:</p>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input type="radio" checked={eventType === "free"} onChange={() => setEventType("free")} />
                  Free
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input type="radio" checked={eventType === "paid"} onChange={() => setEventType("paid")} />
                  Paid
                </label>
              </div>

              {eventType === "paid" && (
                <div className="bg-slate-50 p-3 rounded border">
                  <label className="flex items-center gap-2 text-sm font-medium cursor-pointer">
                    <input
                      type="checkbox"
                      checked={requireScreenshot}
                      onChange={() => setRequireScreenshot(!requireScreenshot)}
                    />
                    Require Payment Screenshot from Students
                  </label>
                </div>
              )}

              <Button type="submit" className="w-full">{editingId ? "Update Event" : "Create Event"}</Button>
            </form>
          </div>
        )}

        {/* EVENTS */}
        <div className="mt-6 space-y-4">
          {events.map(event => (
            <div key={event.id} className="p-4 border rounded">

              {event.posterURL && (
                <img src={event.posterURL} className="w-full h-40 object-cover mb-2" />
              )}

              <h3 className="font-bold">{event.title}</h3>
              <p>{event.description}</p>

              <p>{event.date} | {event.time}</p>
              <p>{event.location}</p>

              <div className="flex gap-2 mt-2">
                <Button onClick={() => handleDeleteEvent(event.id)}>
                  <Trash2 />
                </Button>
                
                <Button onClick={() => handleEditEvent(event)} variant="outline">
                  <Edit3 className="w-4 h-4 mr-1" /> Edit
                </Button>

                <button
                   onClick={() =>
                    navigate(`/admin/registrations/${event.id}`)
                }
                className="bg-blue-900 text-white px-4 py-2 rounded"
            >
               View Registrations
            </button>
              </div>

              {/* REGISTRATIONS */}
              {selectedEventId === event.id && (
                <div className="mt-3">
                  {registrations.map(r => (
                    <div key={r.id} className="border p-2 mt-2">
                      <p>{r.studentName}</p>
                      <p>{r.branch}</p>
                      <p>{r.year}</p>

                      {r.screenshotURL && (
                        <img src={r.screenshotURL} className="w-32 mt-2" />
                      )}
                    </div>
                  ))}
                </div>
              )}

            </div>
          ))}
        </div>

        {/* (FORM WAS HERE, MOVED TO TOP) */}
      </div>
    </div>
  );
};

export default AdminHome;