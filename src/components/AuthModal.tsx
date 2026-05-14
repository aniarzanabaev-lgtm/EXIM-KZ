"use client";
// src/components/AuthModal.tsx
import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  sendPasswordResetEmail,
} from "firebase/auth";
import { collection, addDoc, serverTimestamp } from "firebase/firestore";
import { auth, db } from "@/lib/firebase";
import styles from "./AuthModal.module.css";

type Mode = "login" | "register" | "reset";

interface Props {
  initialMode: Mode;
  onClose: () => void;
}

const FIREBASE_ERRORS: Record<string, string> = {
  "auth/email-already-in-use": "Этот email уже зарегистрирован",
  "auth/invalid-email": "Неверный формат email",
  "auth/weak-password": "Пароль — минимум 6 символов",
  "auth/user-not-found": "Пользователь не найден",
  "auth/wrong-password": "Неверный пароль",
  "auth/invalid-credential": "Неверный email или пароль",
  "auth/too-many-requests": "Слишком много попыток. Попробуйте позже",
  "auth/network-request-failed": "Ошибка сети",
};

export default function AuthModal({ initialMode, onClose }: Props) {
  const [mode, setMode] = useState<Mode>(initialMode);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const router = useRouter();

  // Login fields
  const [loginEmail, setLoginEmail] = useState("");
  const [loginPassword, setLoginPassword] = useState("");

  // Register fields
  const [regName, setRegName] = useState("");
  const [regEmail, setRegEmail] = useState("");
  const [regPassword, setRegPassword] = useState("");

  // Reset password fields
  const [resetEmail, setResetEmail] = useState("");
  const [resetSent, setResetSent] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (!loginEmail || !loginPassword) { setError("Заполните все поля"); return; }
    setLoading(true);
    try {
      await signInWithEmailAndPassword(auth, loginEmail, loginPassword);
      onClose();
      // redirect handled by page
    } catch (err: unknown) {
      const code = (err as { code?: string }).code || "";
      setError(FIREBASE_ERRORS[code] || "Ошибка входа");
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (!regName || !regEmail || !regPassword) { setError("Заполните все поля"); return; }
    if (regPassword.length < 6) { setError("Пароль — минимум 6 символов"); return; }
    setLoading(true);
    try {
      const cred = await createUserWithEmailAndPassword(auth, regEmail, regPassword);
      await addDoc(collection(db, "users"), {
        uid: cred.user.uid,
        name: regName,
        email: regEmail,
        role: "client", // по умолчанию клиент
        createdAt: serverTimestamp(),
      });
      onClose();
    } catch (err: unknown) {
      const code = (err as { code?: string }).code || "";
      setError(FIREBASE_ERRORS[code] || "Ошибка регистрации");
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (!resetEmail) { setError("Введите email"); return; }
    setLoading(true);
    try {
      await sendPasswordResetEmail(auth, resetEmail);
      setResetSent(true);
    } catch (err: unknown) {
      const code = (err as { code?: string }).code || "";
      setError(FIREBASE_ERRORS[code] || "Ошибка отправки письма");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={styles.overlay}>
      <div className={styles.backdrop} onClick={onClose} />
      <div className={styles.box}>
        <button className={styles.close} onClick={onClose}>✕</button>

        <div className={styles.logoText}>EXIM <span>KZ</span></div>

        {/* TABS */}
        <div className={styles.tabs}>
          <button className={`${styles.tab} ${mode === "login" ? styles.activeTab : ""}`} onClick={() => { setMode("login"); setError(""); }}>
            Войти
          </button>
          <button className={`${styles.tab} ${mode === "register" ? styles.activeTab : ""}`} onClick={() => { setMode("register"); setError(""); }}>
            Регистрация
          </button>
        </div>

        {/* LOGIN */}
        {mode === "login" && (
          <form onSubmit={handleLogin} className={styles.form}>
            <p className={styles.subtitle}>Добро пожаловать обратно</p>
            <div className="field">
              <label>Email</label>
              <input type="email" placeholder="your@email.com" value={loginEmail} onChange={e => setLoginEmail(e.target.value)} />
            </div>
            <div className="field">
              <label>Пароль</label>
              <input type="password" placeholder="••••••••" value={loginPassword} onChange={e => setLoginPassword(e.target.value)} />
            </div>
            {error && <div className={styles.error}>{error}</div>}
            <button type="submit" className={styles.submit} disabled={loading}>
              {loading ? "Входим..." : "Войти →"}
            </button>
            <button 
              type="button" 
              className={styles.forgotLink} 
              onClick={() => { setMode("reset"); setError(""); setResetSent(false); }}
            >
              Забыли пароль?
            </button>
          </form>
        )}

        {/* REGISTER */}
        {mode === "register" && (
          <form onSubmit={handleRegister} className={styles.form}>
            <p className={styles.subtitle}>Создайте аккаунт</p>
            <div className="field">
              <label>Полное имя</label>
              <input type="text" placeholder="Иван Иванов" value={regName} onChange={e => setRegName(e.target.value)} />
            </div>
            <div className="field">
              <label>Email</label>
              <input type="email" placeholder="your@email.com" value={regEmail} onChange={e => setRegEmail(e.target.value)} />
            </div>
            <div className="field">
              <label>Пароль</label>
              <input type="password" placeholder="••••••••" value={regPassword} onChange={e => setRegPassword(e.target.value)} />
            </div>
            {/* Роль назначается по умолчанию как Клиент */}
            {error && <div className={styles.error}>{error}</div>}
            <button type="submit" className={styles.submit} disabled={loading}>
              {loading ? "Создаём аккаунт..." : "Создать аккаунт ✈"}
            </button>
          </form>
        )}

        {/* RESET PASSWORD */}
        {mode === "reset" && (
          <div className={styles.form}>
            {!resetSent ? (
              <form onSubmit={handleResetPassword}>
                <p className={styles.subtitle}>Восстановление пароля</p>
                <p style={{ fontSize: 13, color: "var(--text2)", marginBottom: 16 }}>
                  Введите email, и мы отправим ссылку для сброса пароля
                </p>
                <div className="field">
                  <label>Email</label>
                  <input type="email" placeholder="your@email.com" value={resetEmail} onChange={e => setResetEmail(e.target.value)} />
                </div>
                {error && <div className={styles.error}>{error}</div>}
                <button type="submit" className={styles.submit} disabled={loading}>
                  {loading ? "Отправляем..." : "Отправить ссылку"}
                </button>
                <button 
                  type="button" 
                  className={styles.forgotLink} 
                  onClick={() => { setMode("login"); setError(""); }}
                >
                  ← Вернуться к входу
                </button>
              </form>
            ) : (
              <div style={{ textAlign: "center", padding: "20px 0" }}>
                <div style={{ fontSize: 48, marginBottom: 16 }}>✉️</div>
                <h3 style={{ fontSize: 18, marginBottom: 8 }}>Письмо отправлено!</h3>
                <p style={{ fontSize: 13, color: "var(--text2)", marginBottom: 20 }}>
                  Проверьте почту <strong>{resetEmail}</strong> и перейдите по ссылке для сброса пароля
                </p>
                <button 
                  type="button" 
                  className={styles.submit}
                  onClick={() => { setMode("login"); setError(""); setResetSent(false); }}
                >
                  Вернуться к входу
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
