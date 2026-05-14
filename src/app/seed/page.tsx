"use client";
// src/app/seed/page.tsx  — одноразовая страница для заполнения БД
import { useState } from "react";

export default function SeedPage() {
  const [status, setStatus] = useState("");
  const [loading, setLoading] = useState(false);
  const [count, setCount] = useState<number | null>(null);

  const checkCount = async () => {
    const res = await fetch("/api/seed");
    const data = await res.json();
    setCount(data.count ?? 0);
  };

  const runSeed = async () => {
    setLoading(true);
    setStatus("Добавляем 350 самолётов...");
    try {
      const res = await fetch("/api/seed", { method: "POST" });
      const data = await res.json();
      setStatus(data.message || JSON.stringify(data));
      setCount(data.count);
    } catch (e) {
      setStatus("Ошибка: " + String(e));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{
      minHeight: "100vh", background: "var(--bg)", display: "flex",
      alignItems: "center", justifyContent: "center", padding: 20,
    }}>
      <div style={{
        background: "var(--surface)", border: "1px solid var(--border2)",
        borderRadius: 16, padding: 40, maxWidth: 480, width: "100%",
        textAlign: "center",
      }}>
        <div style={{ fontFamily: "var(--font-head)", fontSize: 28, letterSpacing: 3, marginBottom: 8 }}>
          AIR<span style={{ color: "var(--accent)" }}>CARGO</span>KZ
        </div>
        <h2 style={{ marginBottom: 8, fontSize: 22 }}>Инициализация базы данных</h2>
        <p style={{ color: "var(--text2)", fontSize: 14, marginBottom: 28 }}>
          Добавляет 350 тестовых самолётов в Firestore. Запустить один раз.
        </p>

        <div style={{ display: "flex", gap: 12, justifyContent: "center", marginBottom: 20 }}>
          <button
            onClick={checkCount}
            style={{
              background: "transparent", border: "1px solid var(--border2)",
              color: "var(--text2)", padding: "10px 20px", borderRadius: 8,
              cursor: "pointer", fontFamily: "var(--font-body)", fontSize: 14,
            }}
          >
            Проверить БД
          </button>
          <button
            onClick={runSeed}
            disabled={loading}
            style={{
              background: "var(--accent)", color: "#000", border: "none",
              padding: "10px 24px", borderRadius: 8, fontWeight: 700,
              cursor: loading ? "not-allowed" : "pointer", opacity: loading ? 0.6 : 1,
              fontFamily: "var(--font-body)", fontSize: 14,
            }}
          >
            {loading ? "Загружаем..." : "✈ Запустить сидинг"}
          </button>
        </div>

        {count !== null && (
          <div style={{
            background: "rgba(34,197,94,0.1)", border: "1px solid rgba(34,197,94,0.3)",
            borderRadius: 8, padding: "10px 16px", color: "var(--green)", fontSize: 14, marginBottom: 12,
          }}>
            📊 Самолётов в БД: <strong>{count}</strong>
          </div>
        )}

        {status && (
          <div style={{
            background: "var(--bg2)", border: "1px solid var(--border)",
            borderRadius: 8, padding: "12px 16px", color: "var(--text2)",
            fontSize: 13, textAlign: "left",
          }}>
            {status}
          </div>
        )}

        <p style={{ marginTop: 20, fontSize: 12, color: "var(--text3)" }}>
          После успешного сидинга перейдите на <a href="/" style={{ color: "var(--accent)" }}>главную страницу</a>
        </p>
      </div>
    </div>
  );
}
