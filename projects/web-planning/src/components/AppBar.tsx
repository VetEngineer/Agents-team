"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { getSupabaseBrowserClient } from "@/lib/supabaseBrowser";
import {
  clearKeepLoginWindow,
  getKeepLoginUntil,
} from "@/lib/authRetention";
import styles from "./AppBar.module.css";

interface AppBarProps {
  title: string;
  subtitle?: string;
}

export default function AppBar({ title, subtitle }: AppBarProps) {
  const router = useRouter();
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    const supabase = getSupabaseBrowserClient();
    let active = true;
    let timeoutId: number | null = null;

    const clearTimer = () => {
      if (timeoutId !== null) {
        window.clearTimeout(timeoutId);
        timeoutId = null;
      }
    };

    const enforceKeepLogin = (sessionActive: boolean) => {
      clearTimer();
      if (!sessionActive) {
        return;
      }

      const until = getKeepLoginUntil();
      if (!until) {
        return;
      }

      const now = Date.now();
      if (now >= until) {
        clearKeepLoginWindow();
        supabase.auth.signOut().finally(() => {
          router.replace("/survey?step=1");
        });
        return;
      }

      timeoutId = window.setTimeout(() => {
        clearKeepLoginWindow();
        supabase.auth.signOut().finally(() => {
          router.replace("/survey?step=1");
        });
      }, until - now);
    };

    supabase.auth.getSession().then(({ data }) => {
      if (!active) {
        return;
      }
      const authed = Boolean(data.session?.user?.id);
      setIsAuthenticated(authed);
      enforceKeepLogin(authed);
    });

    const { data } = supabase.auth.onAuthStateChange((_event, session) => {
      const authed = Boolean(session?.user?.id);
      setIsAuthenticated(authed);
      enforceKeepLogin(authed);
    });

    return () => {
      active = false;
      clearTimer();
      data.subscription.unsubscribe();
    };
  }, []);

  const handleSignOut = async () => {
    const supabase = getSupabaseBrowserClient();
    await supabase.auth.signOut();
    clearKeepLoginWindow();
    localStorage.removeItem("web-planning:project-id");
    router.replace("/survey?step=1");
  };

  return (
    <header className={styles.bar}>
      <div className={styles.inner}>
        <div className={styles.titleBlock}>
          <div className={styles.brandRow}>
            <Image
              src="/brand/logo-mark.png"
              alt="하감솔루션 로고"
              width={24}
              height={24}
              className={styles.brandMark}
            />
            <span className={styles.brandName}>하감솔루션</span>
          </div>
          <p className={styles.eyebrow}>웹 플래너 워크스페이스</p>
          <h1 className={styles.title}>{title}</h1>
          {subtitle ? <p className={styles.subtitle}>{subtitle}</p> : null}
        </div>
        <div className={styles.actions}>
          <span className={styles.status}>자동 저장됨</span>
          <button type="button" className={styles.secondary}>
            미리보기
          </button>
          <button type="button" className={styles.primary}>
            제출
          </button>
          {isAuthenticated ? (
            <button
              type="button"
              className={styles.secondary}
              onClick={handleSignOut}
            >
              로그아웃
            </button>
          ) : null}
        </div>
      </div>
    </header>
  );
}
