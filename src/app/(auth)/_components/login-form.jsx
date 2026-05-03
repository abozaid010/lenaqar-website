"use client";

import { useState, useActionState, useEffect } from "react";
import { loginAction } from "../_actions/actions";
import { Loader2 } from "lucide-react";
import { toast } from "react-hot-toast";
import { useI18n } from "@/context/translate-api";

const initialState = {
  success: null,
  message: "",
};

export default function LoginForm() {
  const { t } = useI18n();
  const [state, action, pending] = useActionState(loginAction, initialState);
  const [formData, setFormData] = useState({
    email: "",
    password: "",
  });

  useEffect(() => {
    if (state.success) {
      toast.success(t.login.successMessage);

      const destination = state.clientId ? `/${state.clientId}/dashboard` : '/dashboard';
      // Single navigation: avoids triple dashboard loads (major perf win).
      setTimeout(() => {
        window.location.assign(destination);
      }, 350);
    } else if (state.success === false) {
      toast.error(t.login.errorMessage);
    }
  }, [state]);

  return (
    <form action={action} className="space-y-3">
      <div>
        <label
          htmlFor="username"
          className="block text-sm font-medium text-gray-700 mb-1"
        >
          {t.login.usernameLabel}
        </label>
        <input
          id="email"
          name="email"
          type="email"
          value={formData.email}
          onChange={(e) =>
            setFormData({ ...formData, email: e.target.value })
          }
          required
          className="w-full px-4 py-2 rounded-lg border bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition"
          placeholder={t.login.usernamePlaceholder}
        />
      </div>

      <div>
        <label
          htmlFor="password"
          className="block text-sm font-medium text-gray-700 mb-1"
        >
          {t.login.passwordLabel}
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
          className="w-full px-4 py-2 rounded-lg border bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition"
          placeholder={t.login.passwordPlaceholder}
        />
      </div>

      <button
        disabled={pending}
        className="w-full flex cursor-pointer justify-center py-2 px-4 border border-transparent rounded-lg text-sm font-medium text-white bg-primary hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-primary transition-all duration-200"
      >
        {pending ? <Loader2 className="animate-spin" /> : t.login.signInButton}
      </button>
    </form>
  );
}