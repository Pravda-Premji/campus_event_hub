import { useState } from "react";
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

  // ================= SIGNUP / LOGIN =================
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!email || !password) {
      toast.error("Fill all fields");
      return;
    }

    try {
      // ---------- SIGN UP ----------
      if (isSignUp) {
        if (password !== confirmPassword) {
          toast.error("Passwords do not match");
          return;
        }

        // Check allowed_users
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

        toast.success(
          "Verification email sent. Please verify and then login.",
          { duration: 5000 }
        );

        return;
      }

      // ---------- LOGIN ----------
      const cred = await signInWithEmailAndPassword(auth, email, password);
      const user = cred.user;

      // Ensure latest verification state
      await user.reload();

      if (!user.emailVerified) {
        toast.dismiss();
        toast.error("Please verify your email first");
        return;
      }

      const snap = await getDoc(doc(db, "users", user.uid));
      if (!snap.exists()) {
        toast.error("User data missing");
        return;
      }

      const data = snap.data();


console.log("ROLE FROM FIRESTORE:", data.role);

      // Role‑based redirect
      if (data.role === "student") {
        navigate("/student", { replace: true });
      } else if (data.role === "admin" || data.role === "club_admin") {
        console.log("Navigating to ADMIN...");
        navigate("/admin?test=1", { replace: true });
      } else {
        console.log("UNKNOWN ROLE:", data.role);
        toast.error("Role not assigned");
      }
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

          {!isSignUp && (
            <button
              onClick={() => setShowForgot(true)}
              className="text-sm mt-3 w-full text-muted-foreground"
            >
              Forgot password?
            </button>
          )}

          <div className="mt-4 text-center">
            <button
              onClick={() => setIsSignUp(!isSignUp)}
              className="text-secondary text-sm font-semibold"
            >
              {isSignUp
                ? "Already have an account? Sign In"
                : "Don't have an account? Sign Up"}
            </button>
          </div>
        </div>
      </motion.div>

      {/* Forgot Password Popup */}
      <AnimatePresence>
        {showForgot && (
          <motion.div className="fixed inset-0 bg-black/40 flex items-center justify-center">
            <div className="bg-card p-6 rounded-xl w-full max-w-sm">
              <form onSubmit={handleForgotPassword}>
                <Label>Email</Label>
                <Input
                  type="email"
                  value={forgotEmail}
                  onChange={(e) => setForgotEmail(e.target.value)}
                />
                <Button type="submit" className="w-full bg-secondary">
  Send Reset Link
</Button>
              </form>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

    </div>
  );
};

export default Login;