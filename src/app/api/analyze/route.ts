// src/app/api/analyze/route.ts
import { NextRequest, NextResponse } from "next/server";
import OpenAI from "openai";
import { getAdminDb } from "@/lib/firebase-admin";
import { Plane, CargoRequest } from "@/types";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { request }: { request: CargoRequest } = body;

    const db = getAdminDb();

    // Загружаем самолёты из Firestore
    const planesSnap = await db
      .collection("planes")
      .where("status", "==", "available")
      .where("availableCapacityKg", ">=", request.weightKg)
      .limit(50)
      .get();

    const planes: Plane[] = planesSnap.docs.map((d) => ({
      id: d.id,
      ...(d.data() as Omit<Plane, "id">),
    }));

    if (planes.length === 0) {
      return NextResponse.json({
        analysis: "Нет подходящих самолётов в базе данных для данного груза.",
        recommendedPlaneId: null,
      });
    }

    // Сортируем по приоритету
    let sorted = [...planes];
    if (request.priority === "express") {
      sorted.sort((a, b) => a.flightDurationHours - b.flightDurationHours);
    } else if (request.priority === "economy") {
      sorted.sort((a, b) => a.pricePerKg - b.pricePerKg);
    } else {
      sorted.sort((a, b) => a.pricePerKg * 0.6 + a.flightDurationHours * 0.4 - (b.pricePerKg * 0.6 + b.flightDurationHours * 0.4));
    }
    const top10 = sorted.slice(0, 10);

    const planesContext = top10
      .map(
        (p, i) =>
          `${i + 1}. [ID:${p.id}] ${p.model} (${p.airline}), рейс ${p.flightNumber}: ` +
          `цена $${p.pricePerKg}/кг, итого $${p.totalCostUSD?.toLocaleString()}, ` +
          `скорость ${p.speedKmh}км/ч, время в пути ${p.flightDurationHours}ч, ` +
          `вместимость ${p.availableCapacityKg?.toLocaleString()}кг` +
          `${p.temperatureControlled ? ", термоконтроль ✓" : ""}`
      )
      .join("\n");

    const prompt = `Ты — эксперт по авиалогистике Казахстана. Проанализируй заявку и выбери оптимальный самолёт.

ЗАЯВКА:
- Груз: ${request.cargoType}
- Вес: ${request.weightKg} кг
- Объём: ${request.volumeM3 ? request.volumeM3 + " м³" : "не указан"}
- Маршрут: ${request.fromAirport} → ${request.toAirport}
- Дата: ${request.desiredDate}
- Приоритет: ${request.priority}
- Бюджет: ${request.budgetUSD ? "$" + request.budgetUSD : "не указан"}
- Примечания: ${request.notes || "нет"}

ДОСТУПНЫЕ РЕЙСЫ (топ-10):
${planesContext}

Выбери ЛУЧШИЙ вариант и верни ответ строго в JSON формате:
{
  "analysis": "Краткий анализ 3-4 предложения на русском языке",
  "recommendedPlaneId": "ID самолёта из списка выше",
  "reason": "Краткое обоснование выбора"
}

Учитывай:
- express: максимальная скорость
- economy: минимальная цена  
- normal: баланс цены и скорости
- Если есть бюджет — не превышай его`;

    const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [{ role: "user", content: prompt }],
      max_tokens: 600,
      temperature: 0.2,
      response_format: { type: "json_object" },
    });

    const raw = completion.choices[0].message.content || "{}";
    const parsed = JSON.parse(raw);

    return NextResponse.json({
      analysis: parsed.analysis || "Анализ выполнен.",
      reason: parsed.reason || "",
      recommendedPlaneId: parsed.recommendedPlaneId || top10[0]?.id || null,
      recommendedPlane: planes.find((p) => p.id === parsed.recommendedPlaneId) || top10[0] || null,
    });
  } catch (err: unknown) {
    console.error("AI analyze error:", err);
    // Fallback без OpenAI
    return NextResponse.json({
      analysis: "ИИ-анализ временно недоступен. Выберите самолёт вручную.",
      recommendedPlaneId: null,
      error: err instanceof Error ? err.message : String(err),
    });
  }
}
