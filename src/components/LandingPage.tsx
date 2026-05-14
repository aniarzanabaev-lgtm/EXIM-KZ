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
        <div className={styles.logo}>EXIM <span>KZ</span></div>
        <div className={styles.navLinks}>
          <a href="#about">О нас</a>
          <a href="#services">Услуги</a>
          <a href="#how">Как работает</a>
        </div>
        <div className={styles.navActions}>
          <button className="btn-ghost" onClick={() => setModal("login")}>Войти</button>
          <button className="btn-primary" onClick={() => setModal("register")}>Регистрация</button>
        </div>
      </nav>

      {/* HERO */}
      <section className={styles.hero}>
        <div className={styles.heroContent}>
          <div className={styles.badge}>🇰🇿 Казахстан · Авиалогистика</div>
          <h1 className={styles.title}>
            Грузовые авиаперевозки<br />
            <span className={styles.accent}>по всему миру</span>
          </h1>
          <p className={styles.sub}>
            Надёжная доставка грузов воздушным транспортом из Казахстана в любую точку мира. 
            Оптимальные маршруты, конкурентные цены, полное сопровождение.
          </p>
          <div className={styles.herobtns}>
            <button className={styles.btnXl} onClick={() => setModal("register")}>
              Оставить заявку
            </button>
            <button className={styles.btnXlGhost} onClick={() => setModal("login")}>
              Войти в кабинет
            </button>
          </div>
        </div>

        <div className={styles.heroImage}>
          <div className={styles.planeIcon}>✈️</div>
          <div className={styles.routeLine}></div>
        </div>
      </section>

      {/* STATS */}
      <section className={styles.statsSection}>
        <div className={styles.statsGrid}>
          <div className={styles.statCard}>
            <span className={styles.statNumber}>350+</span>
            <span className={styles.statLabel}>Рейсов в базе</span>
          </div>
          <div className={styles.statCard}>
            <span className={styles.statNumber}>50+</span>
            <span className={styles.statLabel}>Направлений</span>
          </div>
          <div className={styles.statCard}>
            <span className={styles.statNumber}>24/7</span>
            <span className={styles.statLabel}>Поддержка</span>
          </div>
          <div className={styles.statCard}>
            <span className={styles.statNumber}>6</span>
            <span className={styles.statLabel}>Аэропортов КЗ</span>
          </div>
        </div>
      </section>

      {/* ABOUT */}
      <section id="about" className={styles.about}>
        <div className={styles.aboutContent}>
          <h2>О компании EXIM KZ</h2>
          <p>
            Мы специализируемся на грузовых авиаперевозках из Казахстана по всему миру. 
            Наша платформа объединяет клиентов и логистов, обеспечивая быстрый подбор 
            оптимальных рейсов с использованием современных технологий.
          </p>
          <div className={styles.aboutFeatures}>
            <div className={styles.aboutFeature}>
              <span>🛡️</span>
              <div>
                <strong>Надёжность</strong>
                <p>Гарантируем сохранность груза на всех этапах перевозки</p>
              </div>
            </div>
            <div className={styles.aboutFeature}>
              <span>⚡</span>
              <div>
                <strong>Скорость</strong>
                <p>Срочная доставка экспресс-грузов в кратчайшие сроки</p>
              </div>
            </div>
            <div className={styles.aboutFeature}>
              <span>💰</span>
              <div>
                <strong>Выгодные цены</strong>
                <p>Подбираем оптимальные тарифы под ваш бюджет</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* SERVICES */}
      <section id="services" className={styles.services}>
        <h2>Наши услуги</h2>
        <div className={styles.servicesGrid}>
          {[
            { icon: "📦", title: "Стандартная доставка", desc: "Регулярные рейсы по популярным направлениям с оптимальным соотношением цены и сроков" },
            { icon: "🚀", title: "Экспресс-доставка", desc: "Срочная перевозка грузов с приоритетной обработкой и минимальным временем в пути" },
            { icon: "🌡️", title: "Температурный режим", desc: "Перевозка грузов с соблюдением температурного режима: медикаменты, продукты" },
            { icon: "⚠️", title: "Опасные грузы", desc: "Лицензированная перевозка опасных грузов с соблюдением всех норм безопасности" },
            { icon: "💎", title: "Ценные грузы", desc: "Специальные условия для перевозки дорогостоящих и хрупких товаров" },
            { icon: "🏭", title: "Промышленные грузы", desc: "Перевозка оборудования, запчастей и промышленных товаров любого объёма" },
          ].map((s) => (
            <div key={s.title} className={styles.serviceCard}>
              <div className={styles.serviceIcon}>{s.icon}</div>
              <h3>{s.title}</h3>
              <p>{s.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* HOW IT WORKS */}
      <section id="how" className={styles.howSection}>
        <h2>Как это работает</h2>
        <div className={styles.steps}>
          <div className={styles.step}>
            <div className={styles.stepNum}>1</div>
            <h3>Оставьте заявку</h3>
            <p>Заполните форму с информацией о грузе, маршруте и сроках доставки</p>
          </div>
          <div className={styles.stepArrow}>→</div>
          <div className={styles.step}>
            <div className={styles.stepNum}>2</div>
            <h3>Подбор рейса</h3>
            <p>Наши логисты подберут оптимальный рейс с учётом ваших требований</p>
          </div>
          <div className={styles.stepArrow}>→</div>
          <div className={styles.step}>
            <div className={styles.stepNum}>3</div>
            <h3>Доставка груза</h3>
            <p>Отслеживайте статус и получите груз в пункте назначения</p>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className={styles.cta}>
        <h2>Готовы отправить груз?</h2>
        <p>Зарегистрируйтесь и создайте первую заявку прямо сейчас</p>
        <button className={styles.btnXl} onClick={() => setModal("register")}>
          Начать работу
        </button>
      </section>

      {/* FOOTER */}
      <footer className={styles.footer}>
        <div className={styles.footerContent}>
          <div className={styles.footerMain}>
            <div className={styles.footerBrand}>
              <div className={styles.footerLogo}>EXIM <span>KZ</span></div>
              <p>Грузовые авиаперевозки из Казахстана по всему миру</p>
            </div>
            <div className={styles.footerContacts}>
              <h4>Контакты</h4>
              <p>📍 Алматы, Казахстан</p>
              <p>📞 +7 (727) 123-45-67</p>
              <p>✉️ info@exim.kz</p>
            </div>
            <div className={styles.footerLinks}>
              <h4>Навигация</h4>
              <a href="#about">О нас</a>
              <a href="#services">Услуги</a>
              <a href="#how">Как работает</a>
            </div>
          </div>
          <div className={styles.footerBottom}>
            <p>© 2024 EXIM KZ. Все права защищены.</p>
          </div>
        </div>
      </footer>

      {modal && (
        <AuthModal
          initialMode={modal}
          onClose={() => setModal(null)}
        />
      )}
    </div>
  );
}
