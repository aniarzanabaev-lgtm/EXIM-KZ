"use client";
// src/components/RequestCard.tsx
import { CargoRequest } from "@/types";
import styles from "./RequestCard.module.css";

const STATUS_MAP = {
  pending: { label: "Ожидает", cls: "badge-pending" },
  approved: { label: "Одобрена", cls: "badge-approved" },
  rejected: { label: "Отклонена", cls: "badge-rejected" },
  processing: { label: "В обработке", cls: "badge-processing" },
};

const PRIORITY_LABELS: Record<string, string> = {
  normal: "Стандартный", express: "🚀 Экспресс", economy: "💰 Эконом",
};

interface Props {
  request: CargoRequest;
  viewer: "client" | "logist";
  onClick?: () => void;
}

export default function RequestCard({ request: r, viewer, onClick }: Props) {
  const s = STATUS_MAP[r.status] || STATUS_MAP.pending;

  const createdDate = r.createdAt && typeof (r.createdAt as { toDate?: () => Date }).toDate === "function"
    ? (r.createdAt as { toDate: () => Date }).toDate().toLocaleDateString("ru-RU", {
        day: "2-digit", month: "short", year: "numeric",
        hour: "2-digit", minute: "2-digit",
      })
    : "Только что";

  return (
    <div
      className={`${styles.card} ${styles[`status_${r.status}`]} ${onClick ? styles.clickable : ""}`}
      onClick={onClick}
    >
      <div className={styles.header}>
        <div>
          <div className={styles.id}>{r.requestId || r.id?.slice(0, 8).toUpperCase()}</div>
          <div className={styles.cargo}>{r.cargoType} — {r.weightKg?.toLocaleString()} кг</div>
          <div className={styles.route}>{r.fromAirport} → {r.toAirport}</div>
        </div>
        <span className={`badge ${s.cls}`}>{s.label}</span>
      </div>

      <div className={styles.meta}>
        <div className={styles.metaItem}><strong>Дата:</strong> {r.desiredDate || "—"}</div>
        {viewer === "logist" && <div className={styles.metaItem}><strong>Клиент:</strong> {r.clientName}</div>}
        <div className={styles.metaItem}><strong>Бюджет:</strong> {r.budgetUSD ? "$" + r.budgetUSD.toLocaleString() : "—"}</div>
        <div className={styles.metaItem}><strong>Приоритет:</strong> {PRIORITY_LABELS[r.priority] || r.priority}</div>
        <div className={styles.metaItem}><strong>Создана:</strong> {createdDate}</div>
        {r.assignedPlane && (
          <div className={styles.metaItem}><strong>Самолёт:</strong> {r.assignedPlane.model}</div>
        )}
      </div>

      {r.status === "approved" && r.assignedPlane && (
        <div className={styles.assignedBadge}>
          ✈ Рейс {r.assignedPlane.flightNumber} · {r.assignedPlane.airline} · ${r.assignedPlane.totalCostUSD?.toLocaleString()}
        </div>
      )}

      {r.status === "rejected" && r.logistComment && (
        <div className={styles.rejectedNote}>✕ {r.logistComment}</div>
      )}

      {viewer === "logist" && r.status === "pending" && (
        <div className={styles.actionHint}>Нажмите для обработки →</div>
      )}
    </div>
  );
}
