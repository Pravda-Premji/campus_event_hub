import { Navigate } from "react-router-dom";
import { useEffect, useState } from "react";
import { onAuthStateChanged, User } from "firebase/auth";
import { doc, getDoc } from "firebase/firestore";
import { auth } from "@/firebase";
import { db } from "@/firebase";

interface Props {
  children: JSX.Element;
  allowed: string[];
}

const ProtectedRoute = ({ children, allowed }: Props) => {
  const [user, setUser] = useState<User | null | undefined>(undefined);
  const [role, setRole] = useState<string | null>(null);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      if (!currentUser) {
        setUser(null);
        return;
      }

      setUser(currentUser);

      const snap = await getDoc(doc(db, "users", currentUser.uid));
      setRole(snap.data()?.role || null);
    });

    return () => unsubscribe();
  }, []);

  if (user === undefined) return null;
  if (!user) return <Navigate to="/login" replace />;

  if (!allowed.includes(role || "")) {
    return <Navigate to="/login" replace />;
  }

  return children;
};

export default ProtectedRoute;