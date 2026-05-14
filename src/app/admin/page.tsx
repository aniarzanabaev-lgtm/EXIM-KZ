"use client";
// src/app/admin/page.tsx
import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth-context";
import { db } from "@/lib/firebase";
import {
  collection,
  getDocs,
  orderBy,
  query,
  where,
  doc,
  updateDoc,
} from "firebase/firestore";
import Sidebar from "@/components/Sidebar";
import styles from "@/components/Dashboard.module.css";

type StatusKey = "pending" | "approved" | "rejected" | "processing";

interface ReqLite {
  status: StatusKey;
  weightKg?: number;
}

interface UserLite {
  id: string; // firestore doc id
  uid: string;
  name: string;
  email: string;
  role: "client" | "logist" | "admin";
}

export default function AdminPage() {
  const { user, profile, loading } = useAuth();
  const router = useRouter();

  const [requests, setRequests] = useState<ReqLite[]>([]);
  const [users, setUsers] = useState<UserLite[]>([]);
  const [search, setSearch] = useState("");
  const [saving, setSaving] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (loading) return;
    if (!user || !profile) return router.push("/");
    if (profile.role !== "admin") return router.push("/");
  }, [user, profile, loading, router]);

  useEffect(() => {
    const load = async () => {
      try {
        setBusy(true);
        // Заявки
        const rq = query(collection(db, "requests"), orderBy("createdAt", "desc"));
        const rsnap = await getDocs(rq);
        setRequests(
          rsnap.docs.map((d) => ({ status: (d.data().status || "pending") as StatusKey, weightKg: d.data().weightKg }))
        );
        // Пользователи (для назначения ролей)
        const usnap = await getDocs(collection(db, "users"));
        setUsers(
          usnap.docs.map((d) => ({ id: d.id, ...(d.data() as Omit<UserLite, "id">) }))
        );
      } catch (e) {
        console.error(e);
      } finally {
        setBusy(false);
      }
    };
    if (profile?.role === "admin") load();
  }, [profile?.role]);

  const byStatus = useMemo(() => {
    const base: Record<StatusKey, number> = { pending: 0, approved: 0, rejected: 0, processing: 0 };
    for (const r of requests) base[r.status] = (base[r.status] || 0) + 1;
    return base;
  }, [requests]);

  const totalWeight = useMemo(() => {
    return requests.reduce((s, r) => s + (Number(r.weightKg) || 0), 0);
  }, [requests]);

  const roleCounts = useMemo(() => {
    return users.reduce(
      (acc, u) => {
        acc[u.role] = (acc[u.role] || 0) + 1;
        return acc;
      },
      { client: 0, logist: 0, admin: 0 } as Record<"client" | "logist" | "admin", number>
    );
  }, [users]);

  const filtered = useMemo(() => {
    const s = search.trim().toLowerCase();
    if (!s) return users;
    return users.filter((u) =>
      u.email.toLowerCase().includes(s) || u.name.toLowerCase().includes(s)
    );
  }, [users, search]);

  const setRole = async (u: UserLite, role: "client" | "logist") => {
    // Защита: нельзя менять роль админам
    if (u.role === "admin") {
      alert("Нельзя изменить роль администратора");
      return;
    }
    if (!confirm(`Назначить пользователю ${u.email} роль: ${role}?`)) return;
    try {
      setSaving(u.uid);
      // Локально: обновим документ напрямую из клиента (упрощённый вариант)
      await updateDoc(doc(db, "users", u.id), { role });
      setUsers((arr) => arr.map((x) => (x.uid === u.uid ? { ...x, role } : x)));
    } catch (e) {
      console.error(e);
      alert("Не удалось изменить роль");
    } finally {
      setSaving(null);
    }
  };

  if (loading || busy) {
    return (
      <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "60vh" }}>
        <div className="loading-spinner">Загрузка админ-панели…</div>
      </div>
    );
  }

  if (!profile || profile.role !== "admin") return null;

  const total = Object.values(byStatus).reduce((a, b) => a + b, 0) || 1;
  const bar = (n: number) => `${Math.round((n / total) * 100)}%`;

  return (
    <div className={`${styles.layout} ${styles.layoutColumn}`}>
      <Sidebar activeTab="" tabs={[]} onTabChange={() => {}} />

      <main className={styles.main}>
        <div className={styles.pageHeader}>
          <h1>Админ-панель</h1>
          <p>Метрики системы и управление ролями пользователей</p>
        </div>

        {/* Метрики */}
        <div className={styles.grid2}>
          <div className="card">
            <div className="section-title">📊 Заявки по статусам</div>
            {["pending","processing","approved","rejected"].map((k) => (
              <div key={k} style={{ marginBottom: 10 }}>
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: 13, color: "var(--text2)" }}>
                  <span>{k}</span><span>{byStatus[k as StatusKey] || 0}</span>
                </div>
                <div style={{ height: 8, background: "var(--surface2)", borderRadius: 6, border: "1px solid var(--border)" }}>
                  <div style={{ width: bar(byStatus[k as StatusKey] || 0), height: 8, background: "var(--accent)", borderRadius: 6 }} />
                </div>
              </div>
            ))}
          </div>

          <div className="card">
            <div className="section-title">✈ Объём перевозок</div>
            <div style={{ fontSize: 28, fontWeight: 700 }}>{Math.round(totalWeight).toLocaleString()} кг</div>
            <div style={{ color: "var(--text3)", fontSize: 13 }}>Суммарный вес по всем заявкам</div>
          </div>

          <div className="card">
            <div className="section-title">👥 Пользователи по ролям</div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 12 }}>
              {([
                { k: "client", label: "Клиенты" },
                { k: "logist", label: "Логисты" },
                { k: "admin", label: "Админы" },
              ] as const).map(({ k, label }) => (
                <div key={k} style={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 10, padding: 14 }}>
                  <div style={{ fontSize: 12, color: "var(--text3)" }}>{label}</div>
                  <div style={{ fontSize: 22, fontWeight: 700 }}>{roleCounts[k as keyof typeof roleCounts] || 0}</div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Управление ролями */}
        <div className="card" style={{ marginTop: 20 }}>
          <div className="section-title">🔎 Найти пользователя и назначить роль логиста</div>
          <div style={{ display: "flex", gap: 12, marginBottom: 16 }}>
            <input className="field" style={{ flex: 1 }} placeholder="Поиск по email или имени" value={search} onChange={(e) => setSearch(e.target.value)} />
          </div>

          <div style={{ display: "grid", gap: 10 }}>
            {filtered.length === 0 ? (
              <div className="empty-state"><div className="icon">👤</div><h3>Нет результатов</h3><p>Измените условия поиска</p></div>
            ) : (
              filtered.map((u) => (
                <div key={u.uid} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", border: "1px solid var(--border)", padding: 12, borderRadius: 10, background: "var(--surface)" }}>
                  <div>
                    <div style={{ fontWeight: 600 }}>{u.name} <span style={{ color: "var(--text3)", fontWeight: 400 }}>({u.email})</span></div>
                    <div style={{ fontSize: 12, color: "var(--text2)" }}>Роль: {u.role}</div>
                  </div>
                  {/* Админов нельзя менять — только клиентов и логистов */}
                  {u.role === "admin" ? (
                    <span style={{ fontSize: 12, color: "var(--text3)", fontStyle: "italic" }}>Администратор (роль защищена)</span>
                  ) : (
                    <div style={{ display: "flex", gap: 8 }}>
                      <button className="btn-ghost" onClick={() => setRole(u, "client")} disabled={saving === u.uid || u.role === "client"}>Клиент</button>
                      <button className="btn-primary" onClick={() => setRole(u, "logist")} disabled={saving === u.uid || u.role === "logist"}>Назначить Логистом</button>
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
