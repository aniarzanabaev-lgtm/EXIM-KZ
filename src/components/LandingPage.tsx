"use client";
// src/components/LandingPage.tsx
import { useState } from "react";
import AuthModal from "./AuthModal";
import styles from "./LandingPage.module.css";

export default function LandingPage() {
  const [modal, setModal] = useState<"login" | "register" | null>(null);

  return (
    <div className={styles.page}>
      {/* NAV */}
      <nav className={styles.nav}>
        <div className={styles.logo}>AIR<span>CARGO</span>KZ</div>
        <div className={styles.navActions}>
          <button className="btn-ghost" onClick={() => setModal("login")}>Войти</button>
          <button className="btn-primary" onClick={() => setModal("register")}>Регистрация</button>
        </div>
      </nav>

      {/* HERO */}
      <section className={styles.hero}>
        <div className={styles.heroBg}>
          <div className={styles.grid} />
          <div className={styles.trail} />
        </div>

        <div className={styles.heroContent}>
          <div className={styles.badge}>🇰🇿 Казахстан · Авиалогистика</div>
          <h1 className={styles.title}>
            АВИАГРУЗЫ<br />
            <span className={styles.accent}>БЕЗ ГРАНИЦ</span>
          </h1>
          <p className={styles.sub}>
            Интеллектуальная платформа для управления авиаперевозками. Клиенты создают заявки — логисты находят оптимальный рейс с помощью ИИ.
          </p>
          <div className={styles.herobtns}>
            <button className={styles.btnXl} onClick={() => setModal("register")}>
              Начать работу →
            </button>
            <button className={styles.btnXlGhost} onClick={() => setModal("login")}>
              Войти в систему
            </button>
          </div>
        </div>

        <div className={styles.stats}>
          <div className={styles.stat}><span className={styles.statN}>350+</span><span className={styles.statL}>Самолётов</span></div>
          <div className={styles.stat}><span className={styles.statN}>24/7</span><span className={styles.statL}>Поддержка</span></div>
          <div className={styles.stat}><span className={styles.statN}>ИИ</span><span className={styles.statL}>Оптимизация</span></div>
          <div className={styles.stat}><span className={styles.statN}>6</span><span className={styles.statL}>Аэропортов КЗ</span></div>
        </div>
      </section>

      {/* FEATURES */}
      <section className={styles.features}>
        <div className={styles.featuresGrid}>
          {[
            { icon: "✈", title: "Быстрые заявки", desc: "Заполните форму за 2 минуты. Выберите груз, маршрут и приоритет доставки." },
            { icon: "🤖", title: "ИИ-анализ", desc: "GPT-4o анализирует все рейсы в БД и подбирает самый дешёвый или быстрый вариант." },
            { icon: "📊", title: "История заявок", desc: "Отслеживайте статус каждой заявки в реальном времени с Firebase." },
            { icon: "👷", title: "Роли", desc: "Клиенты создают заявки, логисты их обрабатывают и назначают рейсы." },
          ].map((f) => (
            <div key={f.title} className={styles.featureCard}>
              <div className={styles.featureIcon}>{f.icon}</div>
              <h3>{f.title}</h3>
              <p>{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {modal && (
        <AuthModal
          initialMode={modal}
          onClose={() => setModal(null)}
        />
      )}
    </div>
  );
}
