"use client";
// src/components/RequestDetailModal.tsx
import { useState, useEffect } from "react";
import { collection, getDocs, query, where } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { CargoRequest, Plane } from "@/types";
import styles from "./RequestDetailModal.module.css";

interface Props {
  request: CargoRequest;
  onClose: () => void;
  onApprove: (requestId: string, planeData: object) => Promise<void>;
  onReject: (requestId: string, reason: string) => Promise<void>;
}

const STATUS_LABELS: Record<string, string> = {
  pending: "Ожидает", approved: "Одобрена", rejected: "Отклонена", processing: "В обработке",
};
const PRIORITY_LABELS: Record<string, string> = {
  normal: "Стандартный", express: "🚀 Экспресс", economy: "💰 Эконом",
};

export default function RequestDetailModal({ request: r, onClose, onApprove, onReject }: Props) {
  const [planes, setPlanes] = useState<Plane[]>([]);
  const [loadingPlanes, setLoadingPlanes] = useState(true);
  const [selectedPlane, setSelectedPlane] = useState<Plane | null>(null);
  const [aiLoading, setAiLoading] = useState(false);
  const [aiResult, setAiResult] = useState<{ analysis: string; bestFitPlane?: Plane; bestFitReason?: string; cheapestPlane?: Plane; cheapestReason?: string; noSuitableFlights?: boolean } | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [rejectReason, setRejectReason] = useState("");
  const [showRejectInput, setShowRejectInput] = useState(false);

  const isPending = r.status === "pending";

  useEffect(() => {
    if (!isPending) return;
    (async () => {
      setLoadingPlanes(true);
      try {
        const q = query(
          collection(db, "planes"),
          where("availableCapacityKg", ">=", r.weightKg),
          where("status", "==", "available")
        );
        const snap = await getDocs(q);
        const all = snap.docs.map(d => ({ id: d.id, ...d.data() } as Plane));
        // Sort by price
        all.sort((a, b) => (a.pricePerKg || 0) - (b.pricePerKg || 0));
        setPlanes(all.slice(0, 30));
      } catch {
        // fallback: get any available
        const snap = await getDocs(query(collection(db, "planes"), where("status", "==", "available")));
        const all = snap.docs.map(d => ({ id: d.id, ...d.data() } as Plane));
        setPlanes(all.slice(0, 30));
      } finally {
        setLoadingPlanes(false);
      }
    })();
  }, [r.weightKg, isPending]);

  const runAI = async () => {
    setAiLoading(true);
    setAiResult(null);
    try {
      const res = await fetch("/api/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ request: r }),
      });
      const data = await res.json();
      setAiResult(data);
      // Auto-select recommended plane
      if (data.recommendedPlane) {
        setSelectedPlane(data.recommendedPlane);
      } else if (data.recommendedPlaneId) {
        const found = planes.find(p => p.id === data.recommendedPlaneId);
        if (found) setSelectedPlane(found);
      }
    } catch (e) {
      setAiResult({ analysis: "Ошибка запроса к ИИ. Выберите самолёт вручную." });
    } finally {
      setAiLoading(false);
    }
  };

  const handleApprove = async () => {
    if (!selectedPlane) return;
    setSubmitting(true);
    try {
      // Пересчитываем итоговую стоимость для конкретного веса груза
      const calculatedCost = Math.round(r.weightKg * selectedPlane.pricePerKg);
      await onApprove(r.id!, {
        id: selectedPlane.id,
        model: selectedPlane.model,
        airline: selectedPlane.airline,
        flightNumber: selectedPlane.flightNumber,
        totalCostUSD: calculatedCost,
        departureTime: selectedPlane.departureTime,
        flightDurationHours: selectedPlane.flightDurationHours,
        pricePerKg: selectedPlane.pricePerKg,
      });
    } finally {
      setSubmitting(false);
    }
  };

  const handleReject = async () => {
    if (!showRejectInput) { 
      setShowRejectInput(true); 
      // Сбрасываем выбранный самолёт при начале отклонения,
      // чтобы избежать случайного одобрения
      setSelectedPlane(null);
      return; 
    }
    setSubmitting(true);
    try { await onReject(r.id!, rejectReason); }
    finally { setSubmitting(false); }
  };

  const createdDate = r.createdAt && typeof (r.createdAt as { toDate?: () => Date }).toDate === "function"
    ? (r.createdAt as { toDate: () => Date }).toDate().toLocaleString("ru-RU")
    : "—";

  return (
    <div className={styles.overlay}>
      <div className={styles.backdrop} onClick={onClose} />
      <div className={styles.box}>
        <button className={styles.close} onClick={onClose}>✕</button>

        {/* Header */}
        <div className={styles.modalHeader}>
          <div>
            <div className={styles.reqId}>{r.requestId || r.id?.slice(0, 8).toUpperCase()}</div>
            <h2 className={styles.cargoTitle}>{r.cargoType}</h2>
            <div className={styles.route}>{r.fromAirport} → {r.toAirport} · {r.desiredDate}</div>
          </div>
          <span className={`badge badge-${r.status}`}>{STATUS_LABELS[r.status]}</span>
        </div>

        {/* Cargo Details */}
        <div className={styles.section}>
          <div className="section-title">Детали груза</div>
          <div className={styles.detailGrid}>
            {[
              ["Тип груза", r.cargoType],
              ["Вес", `${r.weightKg?.toLocaleString()} кг`],
              ["Объём", r.volumeM3 ? `${r.volumeM3} м³` : "—"],
              ["Приоритет", PRIORITY_LABELS[r.priority] || r.priority],
              ["Бюджет", r.budgetUSD ? `$${r.budgetUSD.toLocaleString()}` : "—"],
              ["Клиент", r.clientName],
              ["Email", r.clientEmail],
              ["Создана", createdDate],
            ].map(([label, value]) => (
              <div key={label} className={styles.detailItem}>
                <label>{label}</label>
                <span>{value}</span>
              </div>
            ))}
          </div>
          {r.notes && (
            <div className={styles.notes}>
              <strong>Примечания:</strong> {r.notes}
            </div>
          )}
        </div>

        {/* Assigned plane (non-pending) */}
        {r.assignedPlane && !isPending && (
          <div className={styles.section}>
            <div className="section-title">Назначенный самолёт</div>
            <div className={styles.detailGrid}>
              {[
                ["Модель", r.assignedPlane.model],
                ["Авиакомпания", r.assignedPlane.airline],
                ["Рейс", r.assignedPlane.flightNumber],
                ["Стоимость", `$${r.assignedPlane.totalCostUSD?.toLocaleString()}`],
                ["Цена/кг", `$${r.assignedPlane.pricePerKg}`],
                ["Время в пути", `${r.assignedPlane.flightDurationHours} ч`],
              ].map(([label, value]) => (
                <div key={label} className={styles.detailItem}>
                  <label>{label}</label>
                  <span>{value}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {r.logistComment && !isPending && (
          <div className={styles.commentBox}>
            <strong>Комментарий логиста:</strong> {r.logistComment}
          </div>
        )}

        {/* PENDING: plane selection + AI */}
        {isPending && (
          <>
            {/* AI Section */}
            <div className={styles.section}>
              <div className="section-title">ИИ-анализ</div>
              <button className={styles.btnAI} onClick={runAI} disabled={aiLoading}>
                {aiLoading ? "🤖 Анализируем рейсы..." : "🤖 Запустить ИИ-анализ"}
              </button>

              {aiLoading && (
                <div className="ai-thinking" style={{ marginTop: 12 }}>
                  GPT-4o-mini анализирует {planes.length} самолётов...
                </div>
              )}

              {aiResult && !aiLoading && (
                <div className="ai-result" style={{ marginTop: 12 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 12 }}>
                    <span style={{ fontSize: 20 }}>🤖</span>
                    <strong style={{ fontSize: 16 }}>Рекомендации ИИ</strong>
                    <span className="ai-badge">GPT-4o-mini</span>
                  </div>
                  <p style={{ fontSize: 13, color: aiResult.noSuitableFlights ? "var(--red)" : "var(--text2)", marginBottom: 16, fontWeight: aiResult.noSuitableFlights ? 500 : 400 }}>
                    {aiResult.noSuitableFlights && "⚠️ "}{aiResult.analysis}
                  </p>
                  
                  {aiResult.noSuitableFlights && (
                    <div style={{ padding: 16, background: "#fef2f2", border: "1px solid #fecaca", borderRadius: 8, marginBottom: 16 }}>
                      <div style={{ fontSize: 13, color: "var(--red)", fontWeight: 500 }}>Нет подходящих рейсов</div>
                      <div style={{ fontSize: 12, color: "var(--text2)", marginTop: 4 }}>Попробуйте изменить дату отправки или дождитесь появления новых рейсов в системе.</div>
                    </div>
                  )}
                  
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                    {/* Самый подходящий */}
                    {aiResult.bestFitPlane && (
                      <div 
                        className={styles.aiOptionCard}
                        onClick={() => setSelectedPlane(aiResult.bestFitPlane!)}
                        style={{ cursor: "pointer", border: selectedPlane?.id === aiResult.bestFitPlane.id ? "2px solid var(--accent)" : "1px solid var(--border)" }}
                      >
                        <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 8 }}>
                          <span style={{ fontSize: 18 }}>⭐</span>
                          <strong style={{ color: "var(--accent)", fontSize: 13, textTransform: "uppercase" }}>По требованиям</strong>
                        </div>
                        <div style={{ fontSize: 15, fontWeight: 600, marginBottom: 4 }}>{aiResult.bestFitPlane.model}</div>
                        <div style={{ fontSize: 12, color: "var(--text2)", marginBottom: 8 }}>{aiResult.bestFitPlane.airline} · {aiResult.bestFitPlane.flightNumber}</div>
                        <div style={{ fontSize: 18, fontWeight: 700, color: "var(--text)", marginBottom: 6 }}>${(r.weightKg * aiResult.bestFitPlane.pricePerKg).toLocaleString()}</div>
                        <div style={{ fontSize: 11, color: "var(--text3)" }}>⏱ {aiResult.bestFitPlane.flightDurationHours} ч · ${aiResult.bestFitPlane.pricePerKg}/кг</div>
                        {aiResult.bestFitReason && (
                          <div style={{ marginTop: 8, fontSize: 11, color: "var(--blue2)", lineHeight: 1.4 }}>💡 {aiResult.bestFitReason}</div>
                        )}
                      </div>
                    )}
                    
                    {/* Самый дешёвый */}
                    {aiResult.cheapestPlane && (
                      <div 
                        className={styles.aiOptionCard}
                        onClick={() => setSelectedPlane(aiResult.cheapestPlane!)}
                        style={{ cursor: "pointer", border: selectedPlane?.id === aiResult.cheapestPlane.id ? "2px solid var(--green)" : "1px solid var(--border)" }}
                      >
                        <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 8 }}>
                          <span style={{ fontSize: 18 }}>💰</span>
                          <strong style={{ color: "var(--green)", fontSize: 13, textTransform: "uppercase" }}>Самый дешёвый</strong>
                        </div>
                        <div style={{ fontSize: 15, fontWeight: 600, marginBottom: 4 }}>{aiResult.cheapestPlane.model}</div>
                        <div style={{ fontSize: 12, color: "var(--text2)", marginBottom: 8 }}>{aiResult.cheapestPlane.airline} · {aiResult.cheapestPlane.flightNumber}</div>
                        <div style={{ fontSize: 18, fontWeight: 700, color: "var(--green)", marginBottom: 6 }}>${(r.weightKg * aiResult.cheapestPlane.pricePerKg).toLocaleString()}</div>
                        <div style={{ fontSize: 11, color: "var(--text3)" }}>⏱ {aiResult.cheapestPlane.flightDurationHours} ч · ${aiResult.cheapestPlane.pricePerKg}/кг</div>
                        {aiResult.cheapestReason && (
                          <div style={{ marginTop: 8, fontSize: 11, color: "var(--green)", lineHeight: 1.4 }}>💡 {aiResult.cheapestReason}</div>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Plane List */}
            <div className={styles.section}>
              <div className="section-title">
                Доступные самолёты
                {selectedPlane && (
                  <span style={{ fontSize: 13, color: "var(--accent)", fontFamily: "var(--font-body)", fontWeight: 500 }}>
                    · Выбран: {selectedPlane.model}
                  </span>
                )}
              </div>

              {loadingPlanes ? (
                <div className="loading-spinner">Загрузка самолётов...</div>
              ) : planes.length === 0 ? (
                <div style={{ color: "var(--text3)", padding: "16px", textAlign: "center" }}>
                  Нет подходящих самолётов для данного веса груза
                </div>
              ) : (
                <div className={styles.planesList}>
                  {planes.map(plane => {
                    const isSelected = selectedPlane?.id === plane.id;
                    const isBestFit = aiResult?.bestFitPlane?.id === plane.id;
                    const isCheapest = aiResult?.cheapestPlane?.id === plane.id;
                    const dep = plane.departureTime
                      ? new Date(plane.departureTime).toLocaleString("ru-RU", {
                          day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit",
                        })
                      : "—";
                    return (
                      <div
                        key={plane.id}
                        className={`${styles.planeCard} ${isSelected ? styles.planeSelected : ""} ${isBestFit ? styles.planeAI : ""} ${isCheapest ? styles.planeCheap : ""}`}
                        onClick={() => setSelectedPlane(plane)}
                      >
                        <div className={styles.planeHeader}>
                          <div>
                            <div className={styles.planeName}>
                              {plane.model}
                              {isBestFit && <span className="recommended-badge" style={{ marginLeft: 8 }}>⭐ Подходящий</span>}
                              {isCheapest && !isBestFit && <span style={{ marginLeft: 8, background: "var(--green)", color: "#fff", fontSize: 10, fontWeight: 600, padding: "2px 6px", borderRadius: 4 }}>💰 Дешёвый</span>}
                            </div>
                            <div className={styles.planeAirline}>{plane.airline} · {plane.flightNumber}</div>
                          </div>
                          <div className={styles.planePrice}>${(r.weightKg * plane.pricePerKg).toLocaleString()}</div>
                        </div>
                        <div className={styles.planeMeta}>
                          <span>⚖️ {plane.availableCapacityKg?.toLocaleString()} кг</span>
                          <span>⚡ {plane.speedKmh} км/ч</span>
                          <span>⏱ {plane.flightDurationHours} ч</span>
                          <span>💲 ${plane.pricePerKg}/кг</span>
                          <span>📅 {dep}</span>
                          {plane.temperatureControlled && <span>🌡️ Термо</span>}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Reject reason input */}
            {showRejectInput && (
              <div className={styles.section}>
                <div className="field">
                  <label>Причина отклонения</label>
                  <textarea
                    rows={2}
                    placeholder="Укажите причину..."
                    value={rejectReason}
                    onChange={e => setRejectReason(e.target.value)}
                  />
                </div>
              </div>
            )}

            {/* Action Buttons */}
            <div className={styles.actions}>
              <button
                className={styles.btnApprove}
                onClick={handleApprove}
                disabled={!selectedPlane || submitting}
              >
                {submitting ? "Сохраняем..." : "✅ Одобрить заявку"}
              </button>
              <button
                className={styles.btnReject}
                onClick={handleReject}
                disabled={submitting}
              >
                {showRejectInput ? "Подтвердить отклонение" : "✕ Отклонить"}
              </button>
              {!selectedPlane && (
                <span className={styles.hint}>← Выберите самолёт</span>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
