import { ReactNode, useEffect, useState } from "react";
import { Navigate } from "react-router-dom";
import { auth, db } from "@/firebase";
import { onAuthStateChanged } from "firebase/auth";
import { doc, getDoc } from "firebase/firestore";

type Props = {
  children: ReactNode;
  allowed?: ("student" | "admin" | "club_admin")[]; // roles allowed for this route
};

export default function ProtectedRoute({ children, allowed }: Props) {
  const [loading, setLoading] = useState(true);
  const [authorized, setAuthorized] = useState(false);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (user) => {
      if (!user) {
        setAuthorized(false);
        setLoading(false);
        return;
      }

      try {
        const snap = await getDoc(doc(db, "users", user.uid));
        if (!snap.exists()) {
          setAuthorized(false);
          setLoading(false);
          return;
        }

        const data = snap.data();
        const role = String(data.role).toLowerCase();

        // If no role restriction → allow logged-in user
        if (!allowed || allowed.length === 0) {
          setAuthorized(true);
        } 
        // Check role match
else if (allowed.includes(role as "student" | "admin" | "club_admin")) {          setAuthorized(true);
        } 
        else {
          setAuthorized(false);
        }
      } catch {
        setAuthorized(false);
      }

      setLoading(false);
    });

    return () => unsub();
  }, [allowed]);

  if (loading) return null; // or loader

  if (!authorized) return <Navigate to="/login" replace />;

  return <>{children}</>;
}