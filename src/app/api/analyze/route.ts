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

    const allPlanes: Plane[] = planesSnap.docs.map((d) => ({
      id: d.id,
      ...(d.data() as Omit<Plane, "id">),
    }));

    // Фильтруем по дате: рейс должен вылетать в день желаемой даты или позже
    const desiredDate = new Date(request.desiredDate);
    desiredDate.setHours(0, 0, 0, 0); // Начало дня
    
    const planes = allPlanes.filter((p) => {
      if (!p.departureTime) return false;
      const depDate = new Date(p.departureTime);
      return depDate >= desiredDate;
    });

    if (planes.length === 0) {
      // Проверяем, были ли вообще самолёты по весу
      if (allPlanes.length === 0) {
        return NextResponse.json({
          analysis: "Нет подходящих самолётов в базе данных для данного веса груза.",
          bestFitPlane: null,
          cheapestPlane: null,
          noSuitableFlights: true,
        });
      }
      // Самолёты есть, но не подходят по дате
      return NextResponse.json({
        analysis: `Нет рейсов на указанную дату (${request.desiredDate}) или позже. Все доступные рейсы вылетают раньше желаемой даты. Попробуйте выбрать более раннюю дату отправки или дождитесь появления новых рейсов.`,
        bestFitPlane: null,
        cheapestPlane: null,
        noSuitableFlights: true,
      });
    }

    // Пересчитываем итоговую стоимость для конкретного веса груза клиента
    const planesWithCorrectCost = planes.map((p) => ({
      ...p,
      totalCostUSD: Math.round(request.weightKg * p.pricePerKg),
    }));

    // Находим самый дешёвый рейс
    const sortedByCost = [...planesWithCorrectCost].sort((a, b) => a.pricePerKg - b.pricePerKg);
    const cheapestPlane = sortedByCost[0];

    // Сортируем по приоритету для «подходящего»
    let sortedByFit = [...planesWithCorrectCost];
    if (request.priority === "express") {
      sortedByFit.sort((a, b) => a.flightDurationHours - b.flightDurationHours);
    } else if (request.priority === "economy") {
      sortedByFit.sort((a, b) => a.pricePerKg - b.pricePerKg);
    } else {
      // normal: баланс цены и скорости
      sortedByFit.sort((a, b) => a.pricePerKg * 0.6 + a.flightDurationHours * 0.4 - (b.pricePerKg * 0.6 + b.flightDurationHours * 0.4));
    }
    const top10 = sortedByFit.slice(0, 10);

    const planesContext = top10
      .map(
        (p, i) =>
          `${i + 1}. [ID:${p.id}] ${p.model} (${p.airline}), рейс ${p.flightNumber}: ` +
          `вылет ${p.departureTime ? new Date(p.departureTime).toLocaleDateString("ru-RU") : "—"}, ` +
          `цена $${p.pricePerKg}/кг, итого $${p.totalCostUSD?.toLocaleString()}, ` +
          `скорость ${p.speedKmh}км/ч, время в пути ${p.flightDurationHours}ч, ` +
          `вместимость ${p.availableCapacityKg?.toLocaleString()}кг` +
          `${p.temperatureControlled ? ", термоконтроль ✓" : ""}`
      )
      .join("\n");

    const prompt = `Ты — эксперт по авиалогистике Казахстана. Проанализируй заявку и выбери САМЫЙ ПОДХОДЯЩИЙ самолёт по требованиям клиента.

ЗАЯВКА:
- Груз: ${request.cargoType}
- Вес: ${request.weightKg} кг
- Объём: ${request.volumeM3 ? request.volumeM3 + " м³" : "не указан"}
- Маршрут: ${request.fromAirport} → ${request.toAirport}
- Желаемая дата отправки: ${request.desiredDate}
- Приоритет: ${request.priority}
- Бюджет: ${request.budgetUSD ? "$" + request.budgetUSD : "не указан"}
- Примечания: ${request.notes || "нет"}

ДОСТУПНЫЕ РЕЙСЫ (топ-10):
${planesContext}

Выбери САМЫЙ ПОДХОДЯЩИЙ вариант по требованиям клиента и верни ответ строго в JSON формате:
{
  "analysis": "Краткий анализ 2-3 предложения на русском языке",
  "bestFitPlaneId": "ID самолёта из списка выше",
  "bestFitReason": "Почему этот рейс лучше всего подходит (1-2 предложения)"
}

ВАЖНО:
- Все рейсы уже отфильтрованы по дате — они вылетают ${request.desiredDate} или позже
- НЕ выдумывай даты! Используй только реальные даты вылета из списка рейсов
- НЕ придумывай информацию, которой нет в данных
- express: максимальная скорость доставки
- economy: минимальная цена  
- normal: оптимальный баланс цены и скорости
- Если есть бюджет — не превышай его
- Учитывай тип груза и примечания`;

    const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [{ role: "user", content: prompt }],
      max_tokens: 400,
      temperature: 0.2,
      response_format: { type: "json_object" },
    });

    const raw = completion.choices[0].message.content || "{}";
    const parsed = JSON.parse(raw);

    const bestFitPlane = planesWithCorrectCost.find((p) => p.id === parsed.bestFitPlaneId) || top10[0] || null;

    return NextResponse.json({
      analysis: parsed.analysis || "Анализ выполнен.",
      bestFitPlane: bestFitPlane,
      bestFitReason: parsed.bestFitReason || "Оптимальный вариант по требованиям",
      cheapestPlane: cheapestPlane,
      cheapestReason: `Самая низкая цена: $${cheapestPlane.pricePerKg}/кг, итого $${cheapestPlane.totalCostUSD?.toLocaleString()}`,
    });
  } catch (err: unknown) {
    console.error("AI analyze error:", err);
    // Fallback без OpenAI — возвращаем хотя бы самый дешёвый
    return NextResponse.json({
      analysis: "ИИ-анализ временно недоступен. Показаны варианты по цене.",
      bestFitPlane: null,
      cheapestPlane: null,
      error: err instanceof Error ? err.message : String(err),
    });
  }
}
