"use client";

import { useActionState, useEffect } from "react";
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

  useEffect(() => {
    if (state.success) {
      toast.success(t.login.successMessage);

      // New session → drop prior tab's locations catalog so we reload from API.
      void import("@/lib/locations/invalidate-locations-catalog.client").then(
        (m) => {
          m.clearLocationsCatalogSessionStorage();
        }
      );

      const destination = state.clientId ? `/${state.clientId}/dashboard` : '/dashboard';
      // Single navigation: avoids triple dashboard loads (major perf win).
      setTimeout(() => {
        window.location.assign(destination);
      }, 350);
    } else if (state.success === false) {
      toast.error(state.message || t.login.errorMessage);
    }
  }, [state.success, state.message, state.clientId, t]);

  return (
    <form action={action} className="space-y-3">
      <div>
        <label
          htmlFor="email"
          className="block text-sm font-medium text-gray-700 mb-1"
        >
          {t.login.usernameLabel}
        </label>
        <input
          id="email"
          name="email"
          type="email"
          autoComplete="username"
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
          name="password"
          type="password"
          autoComplete="current-password"
          required
          className="w-full px-4 py-2 rounded-lg border bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition"
          placeholder={t.login.passwordPlaceholder}
        />
      </div>

      <button
        type="submit"
        disabled={pending}
        className="w-full flex cursor-pointer justify-center py-2 px-4 border border-transparent rounded-lg text-sm font-medium text-white bg-primary hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-primary transition-all duration-200 disabled:opacity-70"
      >
        {pending ? <Loader2 className="animate-spin" /> : t.login.signInButton}
      </button>
    </form>
  );
}