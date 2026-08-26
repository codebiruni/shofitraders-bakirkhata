"use client";

import { Toaster } from "react-hot-toast";

export function ToastProvider() {
  return (
    <Toaster
      position="top-right"
      toastOptions={{
        duration: 3000,
        style: {
          background: "#1f2421",
          color: "#faf7f2",
          fontSize: "14px",
          borderRadius: "8px",
          padding: "10px 14px",
        },
        success: { iconTheme: { primary: "#1f7a4d", secondary: "#faf7f2" } },
        error: { iconTheme: { primary: "#b3301f", secondary: "#faf7f2" } },
      }}
    />
  );
}
