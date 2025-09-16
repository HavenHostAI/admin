"use client";

import React from "react";
import { api } from "~/trpc/react";

interface LogoutButtonProps {
  onSuccess?: () => void;
  onError?: (error: string) => void;
  className?: string;
}

export const LogoutButton: React.FC<LogoutButtonProps> = ({
  onSuccess,
  onError,
  className = "rounded-md bg-red-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-red-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-red-600",
}) => {
  const logout = api.auth.logout.useMutation({
    onSuccess: () => {
      onSuccess?.();
    },
    onError: (error) => {
      onError?.(error.message);
    },
  });

  const handleLogout = () => {
    logout.mutate();
  };

  return (
    <button
      onClick={handleLogout}
      disabled={logout.isPending}
      className={className}
    >
      {logout.isPending ? "Signing out..." : "Sign out"}
    </button>
  );
};
