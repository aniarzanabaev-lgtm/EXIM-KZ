"use client";
// src/app/client/page.tsx
import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth-context";
import ClientDashboard from "@/components/ClientDashboard";

export default function ClientPage() {
  const { user, profile, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading) {
      if (!user) router.push("/");
      else if (profile?.role === "logist") router.push("/logist");
      else if (profile?.role === "admin") router.push("/admin");
    }
  }, [user, profile, loading, router]);

  if (loading || !profile) {
    return (
      <div style={{ display:"flex", alignItems:"center", justifyContent:"center", height:"100vh" }}>
        <div className="loading-spinner">Загрузка...</div>
      </div>
    );
  }

  return <ClientDashboard />;
}
