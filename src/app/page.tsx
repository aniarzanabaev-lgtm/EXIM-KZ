"use client";
// src/app/page.tsx
import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth-context";
import LandingPage from "@/components/LandingPage";

export default function Home() {
  const { user, profile, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && user && profile) {
      if (profile.role === "client") router.push("/client");
      else if (profile.role === "logist") router.push("/logist");
      else if (profile.role === "admin") router.push("/admin");
    }
  }, [user, profile, loading, router]);

  if (loading) {
    return (
      <div style={{ display:"flex", alignItems:"center", justifyContent:"center", height:"100vh", background:"var(--bg)" }}>
        <div className="loading-spinner">Загрузка системы...</div>
      </div>
    );
  }

  if (user && profile) return null; // redirecting

  return <LandingPage />;
}
