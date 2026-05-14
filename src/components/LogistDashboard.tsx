"use client";
// src/components/LogistDashboard.tsx
import { useState, useEffect, useCallback } from "react";
import {
  collection, getDocs, query, where,
  orderBy, doc, updateDoc, serverTimestamp,
} from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useAuth } from "@/lib/auth-context";
import { CargoRequest } from "@/types";
import Sidebar from "./Sidebar";
import RequestCard from "./RequestCard";
import RequestDetailModal from "./RequestDetailModal";
import { useToast } from "./Toast";
import styles from "./Dashboard.module.css";

const TABS = [
  { id: "pending", label: "Новые заявки", icon: "⏳" },
  { id: "all", label: "Все заявки", icon: "📊" },
];

export default function LogistDashboard() {
  const { profile } = useAuth();
  const { showToast, ToastComponent } = useToast();
  const [activeTab, setActiveTab] = useState("pending");
  const [requests, setRequests] = useState<CargoRequest[]>([]);
  const [loading, setLoading] = useState(false);
  const [selected, setSelected] = useState<CargoRequest | null>(null);

  const load = useCallback(async (tab: string) => {
    setLoading(true);
    try {
      let q;
      if (tab === "pending") {
        q = query(collection(db, "requests"), where("status", "==", "pending"), orderBy("createdAt", "desc"));
      } else {
        q = query(collection(db, "requests"), orderBy("createdAt", "desc"));
      }
      const snap = await getDocs(q);
      setRequests(snap.docs.map(d => ({ id: d.id, ...d.data() } as CargoRequest)));
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { load(activeTab); }, [activeTab, load]);

  const handleTabChange = (tab: string) => {
    setActiveTab(tab);
  };

  const handleApprove = async (requestId: string, planeData: object, logistComment?: string) => {
    await updateDoc(doc(db, "requests", requestId), {
      status: "approved",
      assignedPlane: planeData,
      logistName: profile?.name,
      logistComment: logistComment || `Одобрено логистом ${profile?.name}`,
      updatedAt: serverTimestamp(),
    });
    showToast("✅ Заявка одобрена и самолёт назначен!", "success");
    setSelected(null);
    load(activeTab);
  };

  const handleReject = async (requestId: string, reason: string) => {
    await updateDoc(doc(db, "requests", requestId), {
      status: "rejected",
      logistComment: reason || `Отклонено логистом ${profile?.name}`,
      logistName: profile?.name,
      updatedAt: serverTimestamp(),
    });
    showToast("Заявка отклонена", "error");
    setSelected(null);
    load(activeTab);
  };

  return (
    <div className={styles.layout}>
      <Sidebar activeTab={activeTab} tabs={TABS} onTabChange={handleTabChange} />

      <main className={styles.main}>
        <div className={styles.pageHeader}>
          <h1>{activeTab === "pending" ? "Заявки в ожидании" : "Все заявки"}</h1>
          <p>{activeTab === "pending" ? "Выберите заявку для обработки" : "Полная история всех заявок системы"}</p>
        </div>

        {loading ? (
          <div className="loading-spinner">Загрузка заявок...</div>
        ) : requests.length === 0 ? (
          <div className="empty-state">
            <div className="icon">{activeTab === "pending" ? "🎉" : "📊"}</div>
            <h3>{activeTab === "pending" ? "Все заявки обработаны!" : "Заявок пока нет"}</h3>
            <p>{activeTab === "pending" ? "Отличная работа — новых заявок нет" : "Клиенты ещё не создавали заявок"}</p>
          </div>
        ) : (
          <div className={styles.list}>
            {requests.map(r => (
              <RequestCard
                key={r.id}
                request={r}
                viewer="logist"
                onClick={r.status === "pending" ? () => setSelected(r) : () => setSelected(r)}
              />
            ))}
          </div>
        )}
      </main>

      {selected && (
        <RequestDetailModal
          request={selected}
          onClose={() => setSelected(null)}
          onApprove={handleApprove}
          onReject={handleReject}
        />
      )}

      {ToastComponent}
    </div>
  );
}
