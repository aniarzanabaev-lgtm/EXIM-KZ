// src/app/api/seed/route.ts
import { NextResponse } from "next/server";
import { getAdminDb } from "@/lib/firebase-admin";
import { generatePlanes } from "@/lib/seed-data";

export async function POST() {
  try {
    const db = getAdminDb();

    // Проверяем, заполнена ли уже БД
    const existing = await db.collection("planes").limit(1).get();
    if (!existing.empty) {
      const count = await db.collection("planes").count().get();
      return NextResponse.json({
        message: "База данных уже заполнена",
        count: count.data().count,
      });
    }

    const planes = generatePlanes(350);
    const BATCH_SIZE = 500;
    let added = 0;

    // Пишем батчами
    for (let i = 0; i < planes.length; i += BATCH_SIZE) {
      const batch = db.batch();
      const chunk = planes.slice(i, i + BATCH_SIZE);
      chunk.forEach((plane) => {
        const ref = db.collection("planes").doc();
        batch.set(ref, plane);
      });
      await batch.commit();
      added += chunk.length;
    }

    return NextResponse.json({
      message: `Успешно добавлено ${added} самолётов в базу данных`,
      count: added,
    });
  } catch (err: unknown) {
    console.error("Seed error:", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : String(err) },
      { status: 500 }
    );
  }
}

export async function GET() {
  try {
    const db = getAdminDb();
    const snap = await db.collection("planes").count().get();
    return NextResponse.json({ count: snap.data().count });
  } catch (err: unknown) {
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
