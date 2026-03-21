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
      <div className="min-h-screen flex items-center justify-center">
        <p>Loading club...</p>
      </div>
    );
  }

 return (
  <div className="min-h-screen p-6">

    {/* 🔙 BACK */}
    <button onClick={() => navigate("/student")}>
      ← Back
    </button>

    {/* 🟢 CLUB DETAILS */}
    <h1 className="text-2xl font-bold mt-4">{club?.name}</h1>
    <p className="text-muted-foreground mt-2">{club?.intro}</p>

    {/* 🟢 GALLERY */}
    <div className="grid grid-cols-2 md:grid-cols-3 gap-2 mt-4">
      {club?.gallery?.map((img: string, i: number) => (
        <img
          key={i}
          src={img}
          onClick={() => setSelectedImage(img)}
          className="w-full h-32 object-cover rounded-lg cursor-pointer hover:scale-105 transition"
        />
      ))}
    </div>

    {/* 🟢 IMAGE MODAL */}
    {selectedImage && (
      <div
        className="fixed inset-0 bg-black/80 flex items-center justify-center z-50"
        onClick={() => setSelectedImage(null)}
      >
        <img
          src={selectedImage}
          className="max-h-[80%] max-w-[90%] rounded-lg"
        />
      </div>
    )}

    {/* 🟢 EXECOM */}
<h2 className="mt-6 font-semibold text-lg">Execom Members</h2>

<div className="space-y-3 mt-2">
  {execom.length === 0 ? (
    <p>No members yet</p>
  ) : (
    execom.map((m) => (
      <div
        key={m.id}
        className="flex items-center gap-3 p-3 border rounded"
      >
        {/* IMAGE */}
        <img
          src={m.imageURL}
          alt={m.name}
          className="w-12 h-12 rounded-full object-cover"
        />

        {/* TEXT */}
        <div>
          <p className="font-semibold">{m.name}</p>
          <p className="text-sm text-muted-foreground">{m.role}</p>
        </div>
      </div>
    ))
  )}
</div>
    {/* 🟢 EVENTS */}
    <h2 className="mt-6 font-semibold text-lg">Events</h2>
    <div className="space-y-3 mt-2">
      {events.length === 0 ? (
        <p>No events yet</p>
      ) : (
        events.map((e) => (
          <div
            key={e.id}
            onClick={() => navigate(`/student/event/${e.id}`)}
            className="p-4 border rounded cursor-pointer hover:bg-muted"
          >
            <h3 className="font-semibold">{e.title}</h3>
            <p className="text-sm text-muted-foreground">
              {e.date} • {e.location}
            </p>
          </div>
        ))
      )}
    </div>

  </div>
);
};

export default ClubPage;