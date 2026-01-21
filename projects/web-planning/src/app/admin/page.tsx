import AppShell from "@/components/AppShell";
import styles from "../styles.module.css";

export default function AdminPage() {
  return (
    <AppShell title="Admin" subtitle="Templates and asset requirements">
      <section className={styles.sectionGrid}>
        <div className={styles.card}>
          <h3 className={styles.cardTitle}>Question templates</h3>
          <div className={styles.list}>
            {[
              "Brand intro",
              "Target audience",
              "Page structure",
              "Style guide",
            ].map((item) => (
              <div key={item} className={styles.dragItem}>
                <span>{item}</span>
                <span className={styles.chip}>Required</span>
              </div>
            ))}
          </div>
          <button className={styles.linkButton}>+ New question</button>
        </div>
        <div className={styles.card}>
          <h3 className={styles.cardTitle}>File requirements</h3>
          <div className={styles.list}>
            {[
              "Logo (AI/SVG)",
              "Hero banner 1920px",
              "Service images",
              "Testimonials",
            ].map((item) => (
              <div key={item} className={styles.dragItem}>
                <span>{item}</span>
                <span className={styles.badge}>Required</span>
              </div>
            ))}
          </div>
          <button className={styles.linkButton}>+ Add requirement</button>
        </div>
      </section>
      <section className={styles.card}>
        <h3 className={styles.cardTitle}>Upload status preview</h3>
        <div className={styles.row}>
          <span className={styles.badge}>Logo: Pass</span>
          <span className={styles.chip}>Banner: Missing</span>
          <span className={styles.chip}>Services: 2/3</span>
        </div>
      </section>
    </AppShell>
  );
}
