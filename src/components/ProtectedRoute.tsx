import { Navigate } from "react-router-dom";
import { useEffect, useState } from "react";
import { onAuthStateChanged, User } from "firebase/auth";
import { auth } from "@/firebase";

const ProtectedRoute = ({ children }: { children: JSX.Element }) => {
  const [user, setUser] = useState<User | null | undefined>(undefined);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
    });
    return () => unsubscribe();
  }, []);

  // While checking auth state
  if (user === undefined) return null;

  // If NOT logged in → BLOCK access (even using browser back)
  if (!user) {
    return <Navigate to="/login" replace />;
  }

  // If logged in → allow page
  return children;
};

export default ProtectedRoute;