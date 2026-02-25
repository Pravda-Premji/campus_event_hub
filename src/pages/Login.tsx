// 🔹 imports (clean)
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowLeft, Calendar } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";

import { auth, db } from "@/firebase";

import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  sendPasswordResetEmail,
  sendEmailVerification,
  updateProfile,
} from "firebase/auth";

import {
  doc,
  setDoc,
  getDoc,
  collection,
  query,
  where,
  getDocs,
} from "firebase/firestore";

const Login = () => {
  const navigate = useNavigate();

  const [isSignUp, setIsSignUp] = useState(false);
  const [showForgot, setShowForgot] = useState(false);

  const [confirmPassword, setConfirmPassword] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [forgotEmail, setForgotEmail] = useState("");
  const [verified, setVerified] = useState(false);

  // ================= EMAIL VERIFIED MESSAGE =================
  useEffect(() => {
    const user = auth.currentUser;
    if (user && user.emailVerified) {
      setVerified(true);
    }
  }, []);

  // ================= SIGNUP / LOGIN =================
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!email || !password) {
      toast.error("Fill all fields");
      return;
    }

    try {
      // -------- SIGNUP --------
      if (isSignUp) {
        if (password !== confirmPassword) {
          toast.error("Passwords do not match");
          return;
        }

        const q = query(
          collection(db, "allowed_users"),
          where("email", "==", email)
        );
        const allowed = await getDocs(q);

        if (allowed.empty) {
          toast.error("User not allowed");
          return;
        }

        const allowedData = allowed.docs[0].data();

        const cred = await createUserWithEmailAndPassword(auth, email, password);
        const user = cred.user;

        if (name) await updateProfile(user, { displayName: name });

        await setDoc(doc(db, "users", user.uid), {
          name,
          email,
          role: allowedData.role,
          club: allowedData.club || null,
        });

        await sendEmailVerification(user);

        toast.success("Verification email sent. Please verify and then login.", {
          duration: 5000,
        });

        return;
      }

      // -------- LOGIN --------
      const cred = await signInWithEmailAndPassword(auth, email, password);
      const user = cred.user;

      if (!user.emailVerified) {
        toast.dismiss();
        toast.error("Verify email first");
        return;
      }

      const snap = await getDoc(doc(db, "users", user.uid));
      if (!snap.exists()) {
        toast.error("User data missing");
        return;
      }

      const data = snap.data();

      toast.success("Login successful!");

      if (data.role === "student") navigate("/student");
      else navigate("/admin");

    } catch (err: unknown) {
  if (err && typeof err === "object" && "code" in err) {
    const firebaseError = err as { code: string };

    switch (firebaseError.code) {
      case "auth/email-already-in-use":
        toast.error("Email already registered");
        break;
      case "auth/user-not-found":
        toast.error("User not found");
        break;
      case "auth/wrong-password":
        toast.error("Wrong password");
        break;
      case "auth/invalid-email":
        toast.error("Invalid email");
        break;
      default:
        toast.error("Something went wrong");
    }
  } else {
    toast.error("Unexpected error occurred");
  }
}
  };

  // ================= FORGOT PASSWORD =================
  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!forgotEmail) {
      toast.error("Enter email");
      return;
    }

    try {
      await sendPasswordResetEmail(auth, forgotEmail);
      toast.success("Password reset email sent");
      setShowForgot(false);
      setForgotEmail("");
    } catch {
      toast.error("Failed to send reset email");
    }
  };

  return (
    <div className="min-h-screen bg-hero flex items-center justify-center p-6 relative">
      <button onClick={() => navigate("/")} className="absolute top-6 left-6 flex gap-2">
        <ArrowLeft className="h-4 w-4" /> Back
      </button>

      <motion.div className="w-full max-w-md">
        <div className="text-center mb-6">
          <Calendar className="mx-auto h-8 w-8 text-secondary" />
          <h1 className="text-2xl font-bold mt-2">
            {isSignUp ? "Create Account" : "Welcome Back"}
          </h1>
        </div>

        <div className="bg-card p-8 rounded-2xl shadow-xl">

          {verified && (
            <div className="bg-green-100 text-green-700 p-3 rounded-md text-sm mb-3 text-center">
              Email verified successfully ✅ <br /> Please login to continue.
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">

            {isSignUp && (
              <>
                <Label>Full Name</Label>
                <Input value={name} onChange={(e) => setName(e.target.value)} />
              </>
            )}

            <Label>Email</Label>
            <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} />

            <Label>Password</Label>
            <Input type="password" value={password} onChange={(e) => setPassword(e.target.value)} />

            {isSignUp && (
              <>
                <Label>Confirm Password</Label>
                <Input
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                />
              </>
            )}

            <Button type="submit" className="w-full bg-secondary">
              {isSignUp ? "Create Account" : "Sign In"}
            </Button>
          </form>
        </div>
      </motion.div>
    </div>
  );
};

export default Login;