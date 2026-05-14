"use client";
// src/components/ClientDashboard.tsx
import { useState, useEffect, useCallback } from "react";
import {
  collection, addDoc, query,
  where, serverTimestamp, onSnapshot,
} from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useAuth } from "@/lib/auth-context";
import { CargoRequest } from "@/types";
import Sidebar from "./Sidebar";
import RequestCard from "./RequestCard";
import { useToast } from "./Toast";
import styles from "./Dashboard.module.css";

const TABS = [
  { id: "new", label: "Новая заявка", icon: "✈" },
  { id: "history", label: "Мои заявки", icon: "📋" },
];

const AIRPORTS_FROM = [
  "Алматы (ALA)", "Астана (NQZ)", "Шымкент (CIT)",
  "Атырау (GUW)", "Актобе (AKX)", "Усть-Каменогорск (UKK)",
];
const AIRPORTS_TO = [
  "Москва (SVO)", "Дубай (DXB)", "Стамбул (IST)", "Пекин (PEK)",
  "Франкфурт (FRA)", "Лондон (LHR)", "Нью-Йорк (JFK)", "Сеул (ICN)",
  "Гонконг (HKG)", "Сингапур (SIN)", "Париж (CDG)", "Амстердам (AMS)",
];
const CARGO_TYPES = [
  "Электроника", "Медикаменты", "Продукты питания",
  "Промышленное оборудование", "Текстиль", "Химикаты", "Ценные грузы", "Прочее",
];

export default function ClientDashboard() {
  const { user, profile } = useAuth();
  const { showToast, ToastComponent } = useToast();
  const [activeTab, setActiveTab] = useState("history");
  const [requests, setRequests] = useState<CargoRequest[]>([]);
  const [loadingReqs, setLoadingReqs] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // Form state
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  const [form, setForm] = useState({
    cargoType: CARGO_TYPES[0],
    weightKg: "",
    volumeM3: "",
    fromAirport: AIRPORTS_FROM[0],
    toAirport: AIRPORTS_TO[0],
    desiredDate: tomorrow.toISOString().split("T")[0],
    notes: "",
    priority: "normal" as "normal" | "express" | "economy",
    budgetUSD: "",
  });

  const subscribeRequests = useCallback(() => {
    if (!user) return () => {};
    setLoadingReqs(true);
    
    // Запрос БЕЗ orderBy — не требует композитного индекса
    // Сортировка выполняется на клиенте
    const q = query(
      collection(db, "requests"),
      where("clientUid", "==", user.uid)
    );
    
    const unsub = onSnapshot(q, (snap) => {
      const data = snap.docs.map((d) => ({ id: d.id, ...d.data() } as CargoRequest));
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
      setLoadingReqs(false);
    }, (error) => {
      console.error("Ошибка подписки на заявки:", error);
      setLoadingReqs(false);
    });
    
    return unsub;
  }, [user]);

  useEffect(() => {
    if (activeTab !== "history") return;
    const unsub = subscribeRequests();
    return () => { if (typeof unsub === "function") unsub(); };
  }, [activeTab, subscribeRequests]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.weightKg || !form.desiredDate) {
      showToast("Укажите вес и дату отправки", "error");
      return;
    }
    setSubmitting(true);
    try {
      const reqId = `REQ-${Date.now().toString(36).toUpperCase()}`;
      await addDoc(collection(db, "requests"), {
        requestId: reqId,
        clientUid: user!.uid,
        clientName: profile!.name,
        clientEmail: profile!.email,
        cargoType: form.cargoType,
        weightKg: parseFloat(form.weightKg),
        volumeM3: form.volumeM3 ? parseFloat(form.volumeM3) : null,
        fromAirport: form.fromAirport,
        toAirport: form.toAirport,
        desiredDate: form.desiredDate,
        notes: form.notes,
        priority: form.priority,
        budgetUSD: form.budgetUSD ? parseFloat(form.budgetUSD) : null,
        status: "pending",
        assignedPlane: null,
        logistComment: "",
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
      showToast(`✅ Заявка ${reqId} отправлена!`, "success");
      setForm(f => ({ ...f, weightKg: "", volumeM3: "", notes: "", budgetUSD: "" }));
      setActiveTab("history");
    } catch (e: unknown) {
      showToast("Ошибка: " + (e instanceof Error ? e.message : String(e)), "error");
    } finally {
      setSubmitting(false);
    }
  };

  const set = (k: string, v: string) => setForm(f => ({ ...f, [k]: v }));

  return (
    <div className={`${styles.layout} ${styles.layoutColumn}`}>
      <Sidebar activeTab={activeTab} tabs={TABS} onTabChange={(t) => { setActiveTab(t); }} />

      <main className={styles.main}>
        {/* NEW REQUEST TAB */}
        {activeTab === "new" && (
          <div style={{ animation: "fadeIn 0.3s ease" }}>
            <div className={styles.pageHeader}>
              <h1>Новая заявка</h1>
              <p>Заполните информацию о грузе для перевозки</p>
            </div>
            <form onSubmit={handleSubmit} className={styles.formCard}>
              <div className={styles.formGrid}>
                <div className="field">
                  <label>Тип груза</label>
                  <select value={form.cargoType} onChange={e => set("cargoType", e.target.value)}>
                    {CARGO_TYPES.map(t => <option key={t}>{t}</option>)}
                  </select>
                </div>
                <div className="field">
                  <label>Вес (кг) *</label>
                  <input type="number" placeholder="1000" min="1" value={form.weightKg} onChange={e => set("weightKg", e.target.value)} required />
                </div>
                <div className="field">
                  <label>Объём (м³)</label>
                  <input type="number" placeholder="5.5" step="0.1" value={form.volumeM3} onChange={e => set("volumeM3", e.target.value)} />
                </div>
                <div className="field">
                  <label>Приоритет</label>
                  <select value={form.priority} onChange={e => set("priority", e.target.value)}>
                    <option value="normal">Стандартный</option>
                    <option value="express">🚀 Экспресс</option>
                    <option value="economy">💰 Эконом</option>
                  </select>
                </div>
                <div className="field">
                  <label>Откуда</label>
                  <select value={form.fromAirport} onChange={e => set("fromAirport", e.target.value)}>
                    {AIRPORTS_FROM.map(a => <option key={a}>{a}</option>)}
                  </select>
                </div>
                <div className="field">
                  <label>Куда</label>
                  <select value={form.toAirport} onChange={e => set("toAirport", e.target.value)}>
                    {AIRPORTS_TO.map(a => <option key={a}>{a}</option>)}
                  </select>
                </div>
                <div className="field">
                  <label>Дата отправки *</label>
                  <input type="date" value={form.desiredDate} onChange={e => set("desiredDate", e.target.value)} required />
                </div>
                <div className="field">
                  <label>Бюджет (USD)</label>
                  <input type="number" placeholder="5000" value={form.budgetUSD} onChange={e => set("budgetUSD", e.target.value)} />
                </div>
                <div className="field" style={{ gridColumn: "1/-1" }}>
                  <label>Особые требования</label>
                  <textarea rows={3} placeholder="Хрупкий груз, температурный режим и т.д." value={form.notes} onChange={e => set("notes", e.target.value)} />
                </div>
              </div>
              <button type="submit" className={styles.submitBtn} disabled={submitting}>
                {submitting ? "Отправляем..." : "Отправить заявку ✈"}
              </button>
            </form>
          </div>
        )}

        {/* HISTORY TAB */}
        {activeTab === "history" && (
          <div style={{ animation: "fadeIn 0.3s ease" }}>
            <div className={styles.pageHeader}>
              <h1>Мои заявки</h1>
              <p>История всех ваших заявок на перевозку</p>
            </div>
            {loadingReqs ? (
              <div className="loading-spinner">Загрузка заявок...</div>
            ) : requests.length === 0 ? (
              <div className="empty-state">
                <div className="icon">📋</div>
                <h3>Нет заявок</h3>
                <p>Создайте первую заявку на перевозку</p>
              </div>
            ) : (
              <div className={styles.list}>
                {requests.map(r => (
                  <RequestCard key={r.id} request={r} viewer="client" />
                ))}
              </div>
            )}
          </div>
        )}
      </main>

      {ToastComponent}
    </div>
  );
}
