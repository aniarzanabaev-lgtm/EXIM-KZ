"use client";
// src/components/Toast.tsx
import { useEffect, useState, useCallback } from "react";

interface ToastProps {
  message: string;
  type?: "success" | "error" | "info";
  onClose: () => void;
}

export function Toast({ message, type = "info", onClose }: ToastProps) {
  useEffect(() => {
    const t = setTimeout(onClose, 4000);
    return () => clearTimeout(t);
  }, [onClose]);

  return (
    <div className={`toast toast-${type}`} style={{ animation: "slideUp 0.3s ease" }}>
      {message}
    </div>
  );
}

// Hook
interface ToastState {
  message: string;
  type: "success" | "error" | "info";
  id: number;
}

export function useToast() {
  const [toast, setToast] = useState<ToastState | null>(null);

  const showToast = useCallback((message: string, type: "success" | "error" | "info" = "info") => {
    setToast({ message, type, id: Date.now() });
  }, []);

  const ToastComponent = toast ? (
    <Toast
      key={toast.id}
      message={toast.message}
      type={toast.type}
      onClose={() => setToast(null)}
    />
  ) : null;

  return { showToast, ToastComponent };
}
