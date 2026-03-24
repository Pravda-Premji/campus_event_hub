import { ReactNode, useEffect, useState } from "react";
import { Navigate } from "react-router-dom";
import { auth, db } from "@/firebase";
import { onAuthStateChanged } from "firebase/auth";
import { doc, getDoc } from "firebase/firestore";

type Props = {
  children: ReactNode;
  allowed?: ("student" | "admin" | "club_admin" | "superadmin" | "clubadmin")[]; // roles allowed for this route
  requiredRole?: string;
  fallback?: string;
};

export default function ProtectedRoute({ children, allowed, fallback, requiredRole }: Props) {
  const [loading, setLoading] = useState(true);
  const [authorized, setAuthorized] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (user) => {
      if (!user) {
        setIsLoggedIn(false);
        setAuthorized(false);
        setLoading(false);
        return;
      }
      setIsLoggedIn(true);

      try {
        const snap = await getDoc(doc(db, "users", user.uid));
        if (!snap.exists()) {
          setAuthorized(false);
          setLoading(false);
          return;
        }

        const data = snap.data();
        const role = String(data.role).toLowerCase();

        // If exact requiredRole is given (higher priority than allowed)
        if (requiredRole) {
          if (role.toLowerCase() === requiredRole.toLowerCase() || data.role === requiredRole) {
            setAuthorized(true);
          } else {
            setAuthorized(false);
          }
        }
        // If no role restriction → allow logged-in user
        else if (!allowed || allowed.length === 0) {
          setAuthorized(true);
        } 
        // Check role match
        else if (allowed.includes(role as any)) {
          setAuthorized(true);
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

  if (!authorized) {
    if (isLoggedIn) {
      if (fallback) return <Navigate to={fallback} replace />;
      return <Navigate to="/student" replace />; // fallback to student if requiredRole fails as requested
    }
    return <Navigate to="/login" replace />;
  }

  // Exact handling per prompt for requiredRole:
  // if (requiredRole && userRole !== requiredRole) return <Navigate to="/student" />
  // This is handled by the initial check, setting authorized to false, which then falls through here.

  return <>{children}</>;
}