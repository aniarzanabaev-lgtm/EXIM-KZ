"use client";
// src/components/Sidebar.tsx
import { signOut } from "firebase/auth";
import { useRouter } from "next/navigation";
import { auth } from "@/lib/firebase";
import { useAuth } from "@/lib/auth-context";
import styles from "./Sidebar.module.css";

interface SidebarProps {
  activeTab: string;
  tabs: { id: string; label: string; icon: string }[];
  onTabChange: (tab: string) => void;
}

export default function Sidebar({ activeTab, tabs, onTabChange }: SidebarProps) {
  const { profile } = useAuth();
  const router = useRouter();

  const handleLogout = async () => {
    await signOut(auth);
    router.push("/");
  };

  return (
    <aside className={styles.sidebar}>
      <div className={styles.logo}>
        EXIM <span>KZ</span>
      </div>

      <nav className={styles.nav}>
        {tabs.map((tab) => (
          <button
            key={tab.id}
            className={`${styles.navItem} ${activeTab === tab.id ? styles.active : ""}`}
            onClick={() => onTabChange(tab.id)}
          >
            <span className={styles.icon}>{tab.icon}</span>
            {tab.label}
          </button>
        ))}
      </nav>

      <div className={styles.userBlock}>
        <div className={styles.userCard}>
          <div className={styles.userName}>{profile?.name}</div>
          <div className={`${styles.userRole} ${profile?.role === "client" ? styles.client : profile?.role === "logist" ? styles.logist : styles.admin}`}>
            {profile?.role === "client" ? "Клиент" : profile?.role === "logist" ? "Логист" : "Админ"}
          </div>
          <div className={styles.userEmail}>{profile?.email}</div>
        </div>

        <button className={styles.logoutBtn} onClick={handleLogout}>
          Выйти
        </button>
      </div>
    </aside>
  );
}
