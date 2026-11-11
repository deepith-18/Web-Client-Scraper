"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { loginJson, googleAuth } from "@/lib/api-client";
import { useAuth } from "@/lib/auth-context";

interface LoginFormProps {
  role: "admin" | "caller";
}

export default function LoginForm({ role }: LoginFormProps) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();
  const { setActiveUser } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    try {
      const resp = await loginJson({ email, password });
      localStorage.setItem("prospectiq_token", resp.access_token);
      setActiveUser(resp.user);
      if (resp.user.role === "admin") router.push("/");
      else router.push("/calling");
    } catch (err: any) {
      setError(err.message);
    }
  };

  const handleGoogle = async () => {
    setError(null);
    try {
      const resp = await googleAuth({ credential: "mock-google-credential", email: "" });
      localStorage.setItem("prospectiq_token", resp.access_token);
      setActiveUser(resp.user);
      if (resp.user.role === "admin") router.push("/");
      else router.push("/calling");
    } catch (err: any) {
      setError(err.message);
    }
  };

  return (
    <div className="max-w-md mx-auto p-4 bg-white rounded shadow">
      <h2 className="text-2xl font-bold mb-4 text-center">
        {role === "admin" ? "Admin" : "Caller"} Login
      </h2>
      {error && (
        <div className="bg-red-100 text-red-800 p-2 rounded mb-4">{error}</div>
      )}
      <form onSubmit={handleSubmit} className="space-y-4">
        <input
          type="email"
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          className="w-full p-2 border rounded"
        />
        <input
          type="password"
          placeholder="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
          className="w-full p-2 border rounded"
        />
        <button
          type="submit"
          className="w-full bg-blue-600 text-white py-2 rounded"
        >
          Sign In
        </button>
      </form>
      <div className="mt-4 text-center">
        <button
          onClick={handleGoogle}
          className="bg-red-600 text-white py-2 px-4 rounded"
        >
          Sign in with Google
        </button>
      </div>
    </div>
  );
}
