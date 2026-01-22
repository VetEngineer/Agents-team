"use client";

import { Suspense, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Image from "next/image";
import AppShell from "@/components/AppShell";
import { getSupabaseBrowserClient } from "@/lib/supabaseBrowser";
import { applyKeepLoginWindow, clearKeepLoginWindow } from "@/lib/authRetention";
import styles from "../../styles.module.css";

function AuthCallbackContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [status, setStatus] = useState("로그인 처리 중입니다...");

  useEffect(() => {
    const errorDescription =
      searchParams.get("error_description") || searchParams.get("error");
    if (errorDescription) {
      setStatus(`로그인 실패: ${errorDescription}`);
      return;
    }

    const code = searchParams.get("code");
    if (!code) {
      clearKeepLoginWindow();
      setStatus("인증 코드가 없습니다. 다시 시도해 주세요.");
      return;
    }

    const exchange = async () => {
      try {
        const supabase = getSupabaseBrowserClient();
        const { error } = await supabase.auth.exchangeCodeForSession(code);
        if (error) {
          throw error;
        }
        applyKeepLoginWindow();
        setStatus("로그인 완료. 이동 중입니다...");
        router.replace("/survey?step=2");
      } catch (err) {
        clearKeepLoginWindow();
        const message =
          err instanceof Error && err.message ? err.message : "다시 시도해 주세요.";
        setStatus(`로그인 실패. ${message}`);
      }
    };

    exchange();
  }, [router, searchParams]);

  return (
    <AppShell title="인증" subtitle="로그인 완료 중">
      <section className={styles.card}>
        <div className={styles.stack}>
          <div className={styles.brandHeader}>
            <Image
              src="/brand/logo-mark.png"
              alt="하감솔루션 로고"
              width={44}
              height={44}
              className={styles.brandLogo}
              priority
            />
            <div className={styles.brandWordmark}>
              <span className={styles.brandName}>하감솔루션</span>
              <span className={styles.brandNameEn}>HAKHAM SOLUTION</span>
            </div>
          </div>
          <h2 className={styles.sectionTitle}>카카오 로그인</h2>
          <p className={styles.sectionSubtitle}>{status}</p>
        </div>
      </section>
    </AppShell>
  );
}

export default function AuthCallbackPage() {
  return (
    <Suspense
      fallback={
        <AppShell title="인증" subtitle="로그인 완료 중">
          <section className={styles.card}>
            <div className={styles.stack}>
              <div className={styles.brandHeader}>
                <Image
                  src="/brand/logo-mark.png"
                  alt="하감솔루션 로고"
                  width={44}
                  height={44}
                  className={styles.brandLogo}
                  priority
                />
                <div className={styles.brandWordmark}>
                  <span className={styles.brandName}>하감솔루션</span>
                  <span className={styles.brandNameEn}>HAKHAM SOLUTION</span>
                </div>
              </div>
              <h2 className={styles.sectionTitle}>카카오 로그인</h2>
              <p className={styles.sectionSubtitle}>로그인 처리 중입니다...</p>
            </div>
          </section>
        </AppShell>
      }
    >
      <AuthCallbackContent />
    </Suspense>
  );
}
