import AppShell from "@/components/AppShell";
import styles from "../styles.module.css";

export default function BuilderPage() {
  return (
    <AppShell title="Page Builder" subtitle="Compose pages and sections">
      <section className={styles.sectionGrid}>
        <div className={styles.card}>
          <h3 className={styles.cardTitle}>Pages</h3>
          <div className={styles.list}>
            {["Home", "Services", "About", "Contact"].map((page) => (
              <div key={page} className={styles.dragItem}>
                <span>{page}</span>
                <span className={styles.badge}>3 sections</span>
              </div>
            ))}
          </div>
          <button className={styles.linkButton}>+ Add page</button>
        </div>
        <div className={styles.card}>
          <h3 className={styles.cardTitle}>Selected page: Home</h3>
          <div className={styles.list}>
            {["Hero", "Services", "Testimonials", "CTA"].map((section) => (
              <div key={section} className={styles.dragItem}>
                <span>{section}</span>
                <span className={styles.chip}>Drag</span>
              </div>
            ))}
          </div>
          <button className={styles.linkButton}>+ Add section</button>
        </div>
      </section>
      <section className={styles.card}>
        <h3 className={styles.cardTitle}>Section editor</h3>
        <div className={styles.stack}>
          <label>
            Section headline
            <input className={styles.input} placeholder="Premium care, simplified" />
          </label>
          <label>
            Body copy
            <textarea
              className={`${styles.input} ${styles.textarea}`}
              placeholder="Describe the section content with the voice you want."
            />
          </label>
          <div className={styles.row}>
            <span className={styles.chip}>CTA: Book a consult</span>
            <span className={styles.chip}>Link: Kakao</span>
          </div>
        </div>
      </section>
    </AppShell>
  );
}
