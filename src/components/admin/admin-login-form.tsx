"use client";

import { useActionState, useState } from "react";
import { adminSignInAction, type AdminSignInResult } from "@/actions/admin-auth.action";

export function AdminLoginForm() {
  const [showPassword, setShowPassword] = useState(false);
  const [state, formAction, isPending] = useActionState<AdminSignInResult | undefined, FormData>(
    adminSignInAction,
    undefined
  );

  return (
    <form action={formAction} className="flex flex-col gap-4">
      {/* Error */}
      {state && !state.ok && state.message && (
        <div role="alert" className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">
          {state.message}
        </div>
      )}

      {/* Email */}
      <div className="flex flex-col gap-1.5">
        <label htmlFor="admin-email" className="text-sm font-medium text-[#333]">
          Email
        </label>
        <input
          id="admin-email"
          name="email"
          type="email"
          required
          autoComplete="email"
          placeholder="admin@ayli.in"
          className="h-11 w-full rounded-lg border border-[#ddd] bg-white px-3.5 text-sm text-[#1a1a1a] placeholder:text-[#bbb] focus:border-[#6b4c3b] focus:outline-none focus:ring-1 focus:ring-[#6b4c3b]"
        />
      </div>

      {/* Password */}
      <div className="flex flex-col gap-1.5">
        <div className="flex items-center justify-between">
          <label htmlFor="admin-password" className="text-sm font-medium text-[#333]">
            Password
          </label>
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            className="text-xs text-[#888] hover:text-[#333]"
          >
            {showPassword ? "Hide" : "Show"}
          </button>
        </div>
        <input
          id="admin-password"
          name="password"
          type={showPassword ? "text" : "password"}
          required
          autoComplete="current-password"
          placeholder="••••••••"
          className="h-11 w-full rounded-lg border border-[#ddd] bg-white px-3.5 text-sm text-[#1a1a1a] placeholder:text-[#bbb] focus:border-[#6b4c3b] focus:outline-none focus:ring-1 focus:ring-[#6b4c3b]"
        />
      </div>

      {/* Submit */}
      <button
        type="submit"
        disabled={isPending}
        className="mt-1 h-11 w-full rounded-lg bg-[#6b4c3b] text-sm font-medium text-white hover:bg-[#5a3d2e] disabled:opacity-60 disabled:cursor-not-allowed"
      >
        {isPending ? "Signing in…" : "Sign In"}
      </button>
    </form>
  );
}
