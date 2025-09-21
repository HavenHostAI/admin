"use client";

import React, { useState } from "react";
import { api } from "~/trpc/react";
import type { LoginRequest } from "../../types/api";

interface LoginFormProps {
  onSuccess?: () => void;
  onError?: (error: string) => void;
}

export const LoginForm: React.FC<LoginFormProps> = ({ onSuccess, onError }) => {
  const [formData, setFormData] = useState<LoginRequest>({
    email: "",
    password: "",
  });

  const login = api.auth.login.useMutation({
    onSuccess: () => {
      onSuccess?.();
      setFormData({ email: "", password: "" });
    },
    onError: (error) => {
      onError?.(error.message);
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    login.mutate(formData);
  };

  return (
    <div className="mx-auto w-full max-w-md">
      <form onSubmit={handleSubmit} className="space-y-6">
        <div>
          <label
            htmlFor="email"
            className="block text-sm font-medium text-gray-700"
          >
            Email
          </label>
          <input
            id="email"
            type="email"
            required
            value={formData.email}
            onChange={(e) =>
              setFormData({ ...formData, email: e.target.value })
            }
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
            placeholder="Enter your email"
          />
        </div>

        <div>
          <label
            htmlFor="password"
            className="block text-sm font-medium text-gray-700"
          >
            Password
          </label>
          <input
            id="password"
            type="password"
            required
            value={formData.password}
            onChange={(e) =>
              setFormData({ ...formData, password: e.target.value })
            }
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
            placeholder="Enter your password"
          />
        </div>

        <button
          type="submit"
          disabled={login.isPending}
          className="flex w-full justify-center rounded-md border border-transparent bg-indigo-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-indigo-700 focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 focus:outline-none disabled:opacity-50"
        >
          {login.isPending ? "Signing in..." : "Sign in"}
        </button>

        {login.error && (
          <div className="text-center text-sm text-red-600">
            {login.error.message}
          </div>
        )}
      </form>
    </div>
  );
};
