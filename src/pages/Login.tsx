import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowLeft, Calendar } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";

import { auth } from "@/firebase";

import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  sendPasswordResetEmail,
  sendEmailVerification,
  updateProfile,
} from "firebase/auth";

const Login = () => {
  const navigate = useNavigate();

  const [isSignUp, setIsSignUp] = useState(false);
  const [showForgot, setShowForgot] = useState(false);

  const [confirmPassword, setConfirmPassword] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [forgotEmail, setForgotEmail] = useState("");

  // ===============================
  // SIGNUP / LOGIN
  // ===============================
  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    if (!email || !password) {
      toast.error("Please fill in all fields");
      return;
    }

    try {
      // =====================
      // SIGN UP
      // =====================
      if (isSignUp) {
        if (password !== confirmPassword) {
          toast.error("Passwords do not match");
          return;
        }

        if (password.length < 6) {
          toast.error("Password must be at least 6 characters");
          return;
        }

        const userCred = await createUserWithEmailAndPassword(
          auth,
          email,
          password
        );

        const user = userCred.user;

        if (name) {
          await updateProfile(user, {
            displayName: name,
          });
        }

        await sendEmailVerification(user);

        toast.success("Signup successful! Verification email sent.");

        // 🔥 Go to home page
        navigate("/student");

        return;
      }

      // =====================
      // LOGIN
      // =====================
      await signInWithEmailAndPassword(auth, email, password);

      toast.success("Login successful!");

      // 🔥 Go to home page
      navigate("/student");

    } catch (error: any) {
      switch (error.code) {
        case "auth/email-already-in-use":
          toast.error("Email already registered");
          break;
        case "auth/invalid-email":
          toast.error("Invalid email format");
          break;
        case "auth/user-not-found":
          toast.error("No account found");
          break;
        case "auth/wrong-password":
          toast.error("Incorrect password");
          break;
        default:
          toast.error("Something went wrong");
      }
    }
  };

  // ===============================
  // FORGOT PASSWORD
  // ===============================
  const handleForgotPassword = async (
    e: React.FormEvent<HTMLFormElement>
  ) => {
    e.preventDefault();

    if (!forgotEmail) {
      toast.error("Enter your email");
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
      <button
        onClick={() => navigate("/")}
        className="absolute top-6 left-6 flex items-center gap-2"
      >
        <ArrowLeft className="h-4 w-4" />
        Back
      </button>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md"
      >
        <div className="text-center mb-8">
          <Calendar className="h-8 w-8 mx-auto text-secondary" />
          <h1 className="text-2xl font-bold mt-2 text-white">
            {isSignUp ? "Create Account" : "Welcome Back"}
          </h1>
        </div>

        <div className="bg-card rounded-2xl p-8 shadow-hero">
          <form onSubmit={handleSubmit} className="space-y-4">

            {isSignUp && (
              <div>
                <Label>Full Name</Label>
                <Input
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                />
              </div>
            )}

            <div>
              <Label>Email</Label>
              <Input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>

            <div>
              <Label>Password</Label>
              <Input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>

            {isSignUp && (
              <div>
                <Label>Confirm Password</Label>
                <Input
                  type="password"
                  value={confirmPassword}
                  onChange={(e) =>
                    setConfirmPassword(e.target.value)
                  }
                />
              </div>
            )}

            <Button type="submit" className="w-full bg-secondary">
              {isSignUp ? "Create Account" : "Sign In"}
            </Button>
          </form>

          {!isSignUp && (
            <button
              onClick={() => setShowForgot(true)}
              className="text-sm mt-3 w-full"
            >
              Forgot password?
            </button>
          )}

          <div className="mt-4 text-center">
            <button
              onClick={() => setIsSignUp(!isSignUp)}
              className="text-secondary text-sm"
            >
              {isSignUp
                ? "Already have an account? Sign In"
                : "Don't have an account? Sign Up"}
            </button>
          </div>
        </div>
      </motion.div>

      <AnimatePresence>
        {showForgot && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center">
            <div className="bg-card p-6 rounded-xl w-full max-w-sm">
              <form onSubmit={handleForgotPassword}>
                <Label>Email</Label>
                <Input
                  type="email"
                  value={forgotEmail}
                  onChange={(e) =>
                    setForgotEmail(e.target.value)
                  }
                />
                <Button type="submit" className="w-full mt-4 bg-secondary">
                  Send Reset Link
                </Button>
              </form>
            </div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default Login;