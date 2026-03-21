import { useEffect, useState } from "react";
import { db } from "@/firebase";
import {
  collection,
  query,
  where,
  getDocs,
  orderBy,
} from "firebase/firestore";
import { useParams } from "react-router-dom";

const AdminRegistrations = () => {
  const { eventId } = useParams();
  const [registrations, setRegistrations] = useState<any[]>([]);

  useEffect(() => {
    const fetchRegistrations = async () => {
      if (!eventId) return;

      const q = query(
        collection(db, "registrations"),
        where("eventId", "==", eventId),
        
      );

      const snap = await getDocs(q);

      setRegistrations(
        snap.docs.map(doc => ({
          id: doc.id,
          ...doc.data(),
        }))
      );
    };

    fetchRegistrations();
  }, [eventId]);

  return (
    <div className="p-6">
      <h2 className="text-xl font-semibold mb-4">
        Registered Students
      </h2>

      {registrations.map(student => (
        <div
          key={student.id}
          className="border rounded p-3 mb-2"
        >
          <p><strong>Name:</strong> {student.studentName}</p>
          <p><strong>Branch:</strong> {student.branch}</p>
          <p><strong>Year:</strong> {student.year}</p>
          <p><strong>Phone:</strong> {student.phone}</p>
        </div>
      ))}
    </div>
  );
};

export default AdminRegistrations;