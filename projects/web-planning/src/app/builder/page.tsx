import AppShell from "@/components/AppShell";
import styles from "../styles.module.css";

export default function BuilderPage() {
  return (
    <AppShell title="페이지 빌더" subtitle="페이지와 섹션을 구성하세요">
      <section className={styles.sectionGrid}>
        <div className={styles.card}>
          <h3 className={styles.cardTitle}>페이지</h3>
          <div className={styles.list}>
            {["홈", "서비스", "소개", "문의"].map((page) => (
              <div key={page} className={styles.dragItem}>
                <span>{page}</span>
                <span className={styles.badge}>섹션 3개</span>
              </div>
            ))}
          </div>
          <button className={styles.linkButton}>+ 페이지 추가</button>
        </div>
        <div className={styles.card}>
          <h3 className={styles.cardTitle}>선택된 페이지: 홈</h3>
          <div className={styles.list}>
            {["히어로", "서비스", "후기", "CTA"].map((section) => (
              <div key={section} className={styles.dragItem}>
                <span>{section}</span>
                <span className={styles.chip}>드래그</span>
              </div>
            ))}
          </div>
          <button className={styles.linkButton}>+ 섹션 추가</button>
        </div>
      </section>
      <section className={styles.card}>
        <h3 className={styles.cardTitle}>섹션 편집기</h3>
        <div className={styles.stack}>
          <label>
            섹션 헤드라인
            <input className={styles.input} placeholder="프리미엄 케어를 더 단순하게" />
          </label>
          <label>
            본문 카피
            <textarea
              className={`${styles.input} ${styles.textarea}`}
              placeholder="원하는 톤으로 섹션 내용을 설명해 주세요."
            />
          </label>
          <div className={styles.row}>
            <span className={styles.chip}>CTA: 상담 예약</span>
            <span className={styles.chip}>링크: 카카오</span>
          </div>
        </div>
      </section>
    </AppShell>
  );
}
