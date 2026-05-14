"use client";
// src/components/LogistDashboard.tsx
import { useState, useEffect } from "react";
import {
  collection, query, where,
  doc, updateDoc, serverTimestamp, onSnapshot,
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
  const [searchId, setSearchId] = useState("");

  // Реактивная подписка на заявки — обновляется автоматически при изменениях
  useEffect(() => {
    // Очищаем список при смене вкладки, чтобы не показывать старые данные
    setRequests([]);
    setLoading(true);
    
    // Запрос БЕЗ orderBy — не требует композитного индекса
    // Для pending фильтруем по статусу, для all — загружаем все
    const q = activeTab === "pending"
      ? query(collection(db, "requests"), where("status", "==", "pending"))
      : query(collection(db, "requests"));
    
    const unsub = onSnapshot(q, (snap) => {
      const data = snap.docs.map(d => ({ id: d.id, ...d.data() } as CargoRequest));
      // Сортируем на клиенте по createdAt (новые сверху)
      data.sort((a, b) => {
        const aTime = a.createdAt && typeof (a.createdAt as { toMillis?: () => number }).toMillis === "function"
          ? (a.createdAt as { toMillis: () => number }).toMillis()
          : 0;
        const bTime = b.createdAt && typeof (b.createdAt as { toMillis?: () => number }).toMillis === "function"
          ? (b.createdAt as { toMillis: () => number }).toMillis()
          : 0;
        return bTime - aTime;
      });
      setRequests(data);
      setLoading(false);
    }, (error) => {
      console.error("Ошибка подписки на заявки:", error);
      setLoading(false);
    });
    
    return () => unsub();
  }, [activeTab]);

  const handleTabChange = (tab: string) => {
    setActiveTab(tab);
  };

  const handleApprove = async (requestId: string, planeData: object, logistComment?: string) => {
    try {
      await updateDoc(doc(db, "requests", requestId), {
        status: "approved",
        assignedPlane: planeData,
        logistName: profile?.name,
        logistComment: logistComment || `Одобрено логистом ${profile?.name}`,
        updatedAt: serverTimestamp(),
      });
      showToast("✅ Заявка одобрена и самолёт назначен!", "success");
    } catch (err) {
      console.error("Ошибка при одобрении заявки:", err);
      showToast("Ошибка при одобрении заявки", "error");
    } finally {
      // Всегда закрываем модалку — список обновится через onSnapshot
      setSelected(null);
    }
  };

  const handleReject = async (requestId: string, reason: string) => {
    try {
      await updateDoc(doc(db, "requests", requestId), {
        status: "rejected",
        // Важно: сбрасываем назначенный самолёт при отклонении,
        // чтобы не оставался след от предыдущего выбора
        assignedPlane: null,
        logistComment: reason || `Отклонено логистом ${profile?.name}`,
        logistName: profile?.name,
        updatedAt: serverTimestamp(),
      });
      showToast("Заявка отклонена", "error");
    } catch (err) {
      console.error("Ошибка при отклонении заявки:", err);
      showToast("Ошибка при отклонении заявки", "error");
    } finally {
      // Всегда закрываем модалку — список обновится через onSnapshot
      setSelected(null);
    }
  };

  return (
    <div className={styles.layout}>
      <Sidebar activeTab={activeTab} tabs={TABS} onTabChange={handleTabChange} />

      <main className={styles.main}>
        <div className={styles.pageHeader}>
          <h1>{activeTab === "pending" ? "Заявки в ожидании" : "Все заявки"}</h1>
          <p>{activeTab === "pending" ? "Выберите заявку для обработки" : "Полная история всех заявок системы"}</p>
        </div>

        {/* Поиск по ID — только для вкладки "Все заявки" */}
        {activeTab === "all" && (
          <div className={styles.searchBox}>
            <input
              type="text"
              placeholder="🔍 Поиск по ID заявки (например, REQ-M5X8K)"
              value={searchId}
              onChange={(e) => setSearchId(e.target.value)}
              className={styles.searchInput}
            />
            {searchId && (
              <button className={styles.clearBtn} onClick={() => setSearchId("")}>
                ✕
              </button>
            )}
          </div>
        )}

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
            {requests
              .filter(r => {
                // Фильтрация по поиску ID (только для вкладки "all")
                if (activeTab === "all" && searchId.trim()) {
                  const search = searchId.trim().toLowerCase();
                  return (
                    r.requestId?.toLowerCase().includes(search) ||
                    r.id?.toLowerCase().includes(search)
                  );
                }
                return true;
              })
              .map(r => (
                <RequestCard
                  key={r.id}
                  request={r}
                  viewer="logist"
                  onClick={() => setSelected(r)}
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
