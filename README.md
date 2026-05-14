# EXIM KZ — Платформа авиаперевозок грузов

![Next.js](https://img.shields.io/badge/Next.js-14-black)
![TypeScript](https://img.shields.io/badge/TypeScript-5.0-blue)
![Firebase](https://img.shields.io/badge/Firebase-10-orange)
![OpenAI](https://img.shields.io/badge/OpenAI-GPT--4o--mini-green)

Платформа для управления грузовыми авиаперевозками из Казахстана по всему миру с ИИ-подбором оптимальных рейсов.

## 🚀 Возможности

- **Клиенты**: создание заявок на перевозку, отслеживание статуса
- **Логисты**: обработка заявок, ИИ-анализ рейсов, одобрение/отклонение
- **Администраторы**: метрики системы, управление ролями пользователей
- **ИИ-подбор**: GPT-4o-mini анализирует рейсы и рекомендует оптимальные варианты

## 📋 Документация

Полная бизнес-логика системы описана в [`docs/BUSINESS_LOGIC.md`](docs/BUSINESS_LOGIC.md)

### Диаграммы

| Диаграмма | Описание |
|-----------|----------|
| [Роли и доступ](docs/diagrams/roles-diagram.svg) | Система ролей: клиент, логист, админ |
| [Жизненный цикл заявки](docs/diagrams/request-lifecycle.svg) | Статусы: pending → approved/rejected |
| [Архитектура системы](docs/diagrams/system-architecture.svg) | Frontend, API, Firebase, OpenAI |
| [Алгоритм ИИ](docs/diagrams/ai-algorithm.svg) | Процесс подбора рейсов |

## 🛠 Технологии

- **Frontend**: Next.js 14, React 18, TypeScript
- **Стили**: CSS Modules, шрифты Bebas Neue + Outfit
- **База данных**: Firebase Firestore (NoSQL, real-time)
- **Аутентификация**: Firebase Auth (email/password)
- **ИИ**: OpenAI GPT-4o-mini
- **Деплой**: Vercel

## 📦 Установка

```bash
# Клонирование
git clone <repo-url>
cd aircargo-kz

# Установка зависимостей
npm install

# Настройка переменных окружения
cp .env.example .env.local
# Заполните .env.local своими ключами Firebase и OpenAI

# Запуск в режиме разработки
npm run dev
```

## ⚙️ Переменные окружения

```env
# Firebase (Client)
NEXT_PUBLIC_FIREBASE_API_KEY=
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=
NEXT_PUBLIC_FIREBASE_PROJECT_ID=
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=
NEXT_PUBLIC_FIREBASE_APP_ID=

# Firebase Admin (Server)
FIREBASE_ADMIN_PROJECT_ID=
FIREBASE_ADMIN_CLIENT_EMAIL=
FIREBASE_ADMIN_PRIVATE_KEY=

# OpenAI
OPENAI_API_KEY=
```

## 🗂 Структура проекта

```
src/
├── app/
│   ├── page.tsx              # Главная (LandingPage)
│   ├── client/page.tsx       # Кабинет клиента
│   ├── logist/page.tsx       # Кабинет логиста
│   ├── admin/page.tsx        # Админ-панель
│   └── api/
│       ├── analyze/route.ts  # ИИ-анализ рейсов
│       └── seed/route.ts     # Генерация тестовых данных
├── components/
│   ├── AuthModal.tsx         # Авторизация/регистрация
│   ├── ClientDashboard.tsx   # Дашборд клиента
│   ├── LogistDashboard.tsx   # Дашборд логиста
│   ├── RequestCard.tsx       # Карточка заявки
│   ├── RequestDetailModal.tsx # Детали заявки + ИИ
│   ├── Sidebar.tsx           # Боковая навигация
│   └── LandingPage.tsx       # Главная страница
├── lib/
│   ├── firebase.ts           # Firebase Client SDK
│   ├── firebase-admin.ts     # Firebase Admin SDK
│   ├── auth-context.tsx      # Контекст авторизации
│   └── seed-data.ts          # Генератор тестовых рейсов
└── types/
    └── index.ts              # TypeScript типы
```

## 👥 Роли пользователей

| Роль | Назначение | Возможности |
|------|------------|-------------|
| **Клиент** | Автоматически при регистрации | Создание заявок, просмотр истории |
| **Логист** | Назначается админом | Обработка заявок, ИИ-анализ |
| **Админ** | Вручную в Firestore | Метрики, управление ролями |

## 📊 Статусы заявок

| Статус | Описание |
|--------|----------|
| `pending` | Новая заявка, ожидает решения логиста |
| `processing` | В обработке логистом |
| `approved` | Одобрена, самолёт назначен |
| `rejected` | Отклонена с указанием причины |

## 🤖 ИИ-анализ

Алгоритм подбора рейсов:

1. Загрузка доступных рейсов из Firestore
2. Фильтрация по вместимости (weight)
3. Фильтрация по дате (departureTime >= desiredDate)
4. Пересчёт стоимости для конкретного груза
5. Сортировка по приоритету клиента:
   - **Express**: по времени в пути ↑
   - **Economy**: по цене за кг ↑
   - **Normal**: баланс (цена × 0.6 + время × 0.4)
6. Отправка топ-10 в GPT-4o-mini
7. Возврат: `bestFitPlane` + `cheapestPlane`

## 🌍 Аэропорты

**Отправления (Казахстан):**
- ALA (Алматы), NQZ (Астана), CIT (Шымкент)
- GUW (Атырау), AKX (Актобе), UKK (Усть-Каменогорск)

**Назначения (Международные):**
- SVO (Москва), DXB (Дубай), IST (Стамбул), PEK (Пекин)
- FRA (Франкфурт), LHR (Лондон), JFK (Нью-Йорк), ICN (Сеул)
- HKG (Гонконг), SIN (Сингапур), CDG (Париж), AMS (Амстердам)

## 📝 Скрипты

```bash
npm run dev      # Запуск в режиме разработки
npm run build    # Сборка для продакшена
npm run start    # Запуск продакшен-сервера
npm run lint     # Проверка кода
```

## 🔧 Заполнение базы данных

Для генерации тестовых рейсов:

```bash
# Через браузер
GET /api/seed    # Проверить количество рейсов
POST /api/seed   # Сгенерировать 350 рейсов
```

## 📄 Лицензия

MIT

---

**EXIM KZ** © 2026
