"use client";
// src/app/logist/page.tsx
import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth-context";
import LogistDashboard from "@/components/LogistDashboard";

export default function LogistPage() {
  const { user, profile, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading) {
      if (!user) router.push("/");
      else if (profile?.role === "client") router.push("/client");
    }
  }, [user, profile, loading, router]);

  if (loading || !profile) {
    return (
      <div style={{ display:"flex", alignItems:"center", justifyContent:"center", height:"100vh" }}>
        <div className="loading-spinner">Загрузка...</div>
      </div>
    );
  }

  return <LogistDashboard />;
}
