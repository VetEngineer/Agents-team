import AppShell from "@/components/AppShell";
import styles from "../styles.module.css";

export default function DashboardPage() {
  return (
    <AppShell title="대시보드" subtitle="진행 중인 프로젝트와 빠른 작업">
      <section className={styles.stack}>
        <div>
          <h2 className={styles.sectionTitle}>진행 중 브리프</h2>
          <p className={styles.sectionSubtitle}>
            클라이언트 요청과 산출물 진행 상황을 한눈에 확인하세요.
          </p>
        </div>
        <div className={styles.sectionGrid}>
          {["루멘 클리닉", "코너스톤 로펌", "슬로우 포어 카페"].map(
            (name) => (
              <div key={name} className={styles.card}>
                <p className={styles.badge}>초안</p>
                <h3 className={styles.cardTitle}>{name}</h3>
                <p className={styles.cardMeta}>
                  3시간 전 업데이트 • 섹션 12개
                </p>
              </div>
            )
          )}
        </div>
      </section>
      <section className={styles.sectionGrid}>
        <div className={styles.card}>
          <h3 className={styles.cardTitle}>새 프로젝트</h3>
          <p className={styles.cardMeta}>
            설문을 시작하고 맞춤형 페이지를 생성하세요.
          </p>
        </div>
        <div className={styles.card}>
          <h3 className={styles.cardTitle}>제출 검토</h3>
          <p className={styles.cardMeta}>
            Airtable 동기화 상태와 에셋 준비 현황을 확인하세요.
          </p>
        </div>
      </section>
    </AppShell>
  );
}
