"use client";

import { useState, useActionState, useEffect } from "react";
import { loginAction } from "../_actions/actions";
import { Loader2 } from "lucide-react";
import { toast } from "react-hot-toast";
import { useRouter } from "next/navigation";

const initialState = {
  success: null,
  message: "",
};

export default function LoginForm() {
  const router = useRouter();
  const [state, action, pending] = useActionState(loginAction, initialState);
  const [formData, setFormData] = useState({
    user_name: "",
    password: "",
  });

  useEffect(() => {
    if (state.success) {
      toast.success("Login successful");
      router.replace("/dashbord"); // Use replace to prevent going back to the login page
    } else if (state.success === false) {
      toast.error(state.message);
    }
  }, [state]);

  return (
    <form action={action} className="space-y-3">
      <div>
        <label
          htmlFor="username"
          className="block text-sm font-medium text-gray-700 mb-1"
        >
          Username
        </label>
        <input
          id="username"
          name="email"
          type="text"
          value={formData.user_name}
          onChange={(e) =>
            setFormData({ ...formData, user_name: e.target.value })
          }
          required
          className="w-full px-4 py-2 rounded-lg border focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition"
          placeholder="Enter your username"
        />
      </div>

      <div>
        <label
          htmlFor="password"
          className="block text-sm font-medium text-gray-700 mb-1"
        >
          Password
        </label>
        <input
          id="password"
          type="password"
          value={formData.password}
          name="password"
          onChange={(e) =>
            setFormData({ ...formData, password: e.target.value })
          }
          required
          className="w-full px-4 py-2 rounded-lg border focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition"
          placeholder="Enter your password"
        />
      </div>

      <button
        disabled={pending}
        className="w-full flex cursor-pointer justify-center py-2 px-4 border border-transparent rounded-lg text-sm font-medium text-white bg-primary hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-primary transition-all duration-200"
      >
        {pending ? <Loader2 className="animate-spin" /> : "Sign in"}
      </button>
    </form>
  );
}
