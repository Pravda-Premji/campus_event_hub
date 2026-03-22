import { useEffect, useState } from "react";
import { db } from "@/firebase";
import {
  collection,
  query,
  where,
  getDocs,
  addDoc,
  serverTimestamp,
  updateDoc,
  deleteDoc,
  doc
} from "firebase/firestore";
import { useParams } from "react-router-dom";
import { Button } from "@/components/ui/button";

interface RegItem {
  id: string;
  userId?: string;
  email?: string;
  studentName?: string;
  branch?: string;
  year?: string;
  phone?: string;
  [key: string]: unknown;
}

interface CertItem {
  id?: string;
  userId?: string;
  eventId?: string;
  certificateURL?: string;
  [key: string]: unknown;
}

const AdminRegistrations = () => {
  const { eventId } = useParams();
  const [registrations, setRegistrations] = useState<RegItem[]>([]);
  const [uploadedCerts, setUploadedCerts] = useState<CertItem[]>([]);
  const [certFiles, setCertFiles] = useState<{ [key: string]: File | null }>({});
  const [uploadingId, setUploadingId] = useState<string | null>(null);

  const handleUploadCert = async (student: RegItem) => {
    const file = certFiles[student.id];
    if (!file) {
      alert("Please select a file first");
      return;
    }

    setUploadingId(student.id);
    try {
      let finalUserId = student.userId;

      if (!finalUserId) {
        if (!student.email) {
          alert("Error: Legacy registration missing both userId AND email! Cannot map certificate.");
          setUploadingId(null);
          return;
        }

        const userQ = query(collection(db, "users"), where("email", "==", student.email));
        const userSnap = await getDocs(userQ);
        if (!userSnap.empty) {
          finalUserId = userSnap.docs[0].id;
          
          await updateDoc(doc(db, "registrations", student.id), {
            userId: finalUserId
          });
          
        } else {
          alert("Error: Legacy registration could not find matching User ID via email.");
          setUploadingId(null);
          return;
        }
      }

      const formData = new FormData();
      formData.append("file", file);
      formData.append("upload_preset", "campus_upload"); 
      
      const res = await fetch("https://api.cloudinary.com/v1_1/drnrkdzfa/image/upload", {
        method: "POST",
        body: formData,
      });
      const data = await res.json();
      
      if (!data.secure_url) {
        alert("Upload error: Cloudinary URL not found");
        setUploadingId(null);
        return;
      }

      console.log("Saving certificate for:", finalUserId);
      console.log("Cloudinary URL:", data.secure_url);

      await addDoc(collection(db, "certificates"), {
        userId: finalUserId,
        eventId,
        certificateURL: data.secure_url,
        createdAt: serverTimestamp()
      });
      
      setUploadedCerts(prev => [...prev, { userId: finalUserId, eventId, certificateURL: data.secure_url }]);
      
      alert("Certificate uploaded successfully!");
      setCertFiles(prev => ({ ...prev, [student.id]: null }));
    } catch (err) {
      console.error(err);
      alert("Failed to upload certificate");
    } finally {
      setUploadingId(null);
    }
  };

  const handleDeleteCert = async (cert: CertItem) => {
    if (!cert.id) return;
    try {
      if (cert.certificateURL) {
        const parts = cert.certificateURL.split('/');
        const publicId = parts[parts.length - 1].split('.')[0];
        
        await fetch(`https://api.cloudinary.com/v1_1/drnrkdzfa/delete_by_token`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ public_id: publicId })
        }).catch(err => console.log(err));
      }

      await deleteDoc(doc(db, "certificates", cert.id));
      
      setUploadedCerts(prev => prev.filter(c => c.id !== cert.id));
      alert("Certificate deleted successfully");
    } catch (err) {
      console.error(err);
      alert("Failed to delete certificate");
    }
  };

  const handleReplaceCert = async (cert: CertItem, file: File) => {
    if (!cert.id) return;
    setUploadingId(cert.userId || null);
    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("upload_preset", "campus_upload"); 
      
      const res = await fetch("https://api.cloudinary.com/v1_1/drnrkdzfa/image/upload", {
        method: "POST",
        body: formData,
      });
      const data = await res.json();
      
      if (!data.secure_url) {
        alert("Upload error: Cloudinary URL not found");
        return;
      }

      await updateDoc(doc(db, "certificates", cert.id), {
        certificateURL: data.secure_url
      });
      
      setUploadedCerts(prev => prev.map(c => c.id === cert.id ? { ...c, certificateURL: data.secure_url } : c));
      alert("Certificate replaced successfully!");
    } catch (err) {
      console.error(err);
      alert("Failed to replace certificate");
    } finally {
      setUploadingId(null);
    }
  };

  useEffect(() => {
    const fetchData = async () => {
      if (!eventId) return;

      const q = query(
        collection(db, "registrations"),
        where("eventId", "==", eventId)
      );
      const snap = await getDocs(q);

      setRegistrations(
        snap.docs.map(doc => ({
          id: doc.id,
          ...(doc.data() as Omit<RegItem, "id">),
        }))
      );

      const certQ = query(
        collection(db, "certificates"),
        where("eventId", "==", eventId)
      );
      const certSnap = await getDocs(certQ);
      setUploadedCerts(certSnap.docs.map(doc => ({ id: doc.id, ...doc.data() as CertItem })));
    };

    fetchData();
  }, [eventId]);

  return (
    <div className="p-6">
      <h2 className="text-xl font-semibold mb-4">
        Registered Students
      </h2>

      {registrations.map(student => {
        const studentCert = uploadedCerts.find(c => c.userId === student.userId);
        const hasCert = !!studentCert;

        return (
          <div
            key={student.id}
            className="border rounded p-3 mb-2"
          >
            <p><strong>Name:</strong> {student.studentName}</p>
            <p><strong>Branch:</strong> {student.branch}</p>
            <p><strong>Year:</strong> {student.year}</p>
            <p><strong>Phone:</strong> {student.phone}</p>
            
            <div className="mt-3 pt-3 border-t">
              <p className="text-sm font-semibold mb-2">Upload Certificate</p>
              {hasCert && studentCert ? (
                <div className="flex flex-col gap-3">
                  <div className="flex items-center gap-2 text-green-600 font-semibold bg-green-50 px-3 py-2 rounded-lg border border-green-200">
                    <span>✅</span>
                    Certificate uploaded
                  </div>
                  <div className="flex items-center gap-2">
                    <Button size="sm" variant="outline" onClick={() => window.open(studentCert.certificateURL, '_blank')}>
                      View
                    </Button>
                    <Button size="sm" variant="destructive" onClick={() => handleDeleteCert(studentCert)}>
                      Delete
                    </Button>
                    
                    <div className="relative inline-flex">
                       <input 
                         type="file"
                         accept="application/pdf,image/*"
                         className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                         onChange={(e) => {
                           if (e.target.files?.[0]) handleReplaceCert(studentCert, e.target.files[0]);
                         }}
                       />
                       <Button size="sm" variant="secondary" className="pointer-events-none" disabled={uploadingId === studentCert.userId}>
                         {uploadingId === studentCert.userId ? "Replacing..." : "Replace"}
                       </Button>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="flex items-center gap-3">
                  <input 
                    type="file" 
                    accept="application/pdf,image/*"
                    onChange={(e) => setCertFiles(prev => ({ ...prev, [student.id]: e.target.files?.[0] || null }))}
                    className="text-sm"
                  />
                  <Button 
                    size="sm" 
                    onClick={() => handleUploadCert(student)}
                    disabled={uploadingId === student.id || !certFiles[student.id]}
                  >
                    {uploadingId === student.id ? "Uploading..." : "Upload"}
                  </Button>
                </div>
              )}
            </div>
          </div>
        )
      })}
    </div>
  );
};

export default AdminRegistrations;