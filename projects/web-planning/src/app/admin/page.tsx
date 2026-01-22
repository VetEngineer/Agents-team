import AppShell from "@/components/AppShell";
import styles from "../styles.module.css";

export default function AdminPage() {
  return (
    <AppShell title="관리자" subtitle="템플릿과 에셋 요구사항 관리">
      <section className={styles.sectionGrid}>
        <div className={styles.card}>
          <h3 className={styles.cardTitle}>질문 템플릿</h3>
          <div className={styles.list}>
            {[
              "브랜드 소개",
              "타겟 고객",
              "페이지 구조",
              "스타일 가이드",
            ].map((item) => (
              <div key={item} className={styles.dragItem}>
                <span>{item}</span>
                <span className={styles.chip}>필수</span>
              </div>
            ))}
          </div>
          <button className={styles.linkButton}>+ 질문 추가</button>
        </div>
        <div className={styles.card}>
          <h3 className={styles.cardTitle}>파일 요구사항</h3>
          <div className={styles.list}>
            {[
              "로고 (AI/SVG)",
              "히어로 배너 1920px",
              "서비스 이미지",
              "후기",
            ].map((item) => (
              <div key={item} className={styles.dragItem}>
                <span>{item}</span>
                <span className={styles.badge}>필수</span>
              </div>
            ))}
          </div>
          <button className={styles.linkButton}>+ 요구사항 추가</button>
        </div>
      </section>
      <section className={styles.card}>
        <h3 className={styles.cardTitle}>업로드 현황 미리보기</h3>
        <div className={styles.row}>
          <span className={styles.badge}>로고: 통과</span>
          <span className={styles.chip}>배너: 없음</span>
          <span className={styles.chip}>서비스: 2/3</span>
        </div>
      </section>
    </AppShell>
  );
}
