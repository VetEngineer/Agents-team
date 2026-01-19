import AppShell from "@/components/AppShell";
import styles from "../styles.module.css";

export default function SurveyPage() {
  return (
    <AppShell title="Survey" subtitle="Project basics and brand inputs">
      <section className={styles.stack}>
        <div>
          <h2 className={styles.sectionTitle}>Step 1 · Brand essentials</h2>
          <p className={styles.sectionSubtitle}>
            Fill in the foundational details to shape the website structure.
          </p>
        </div>
        <div className={styles.card}>
          <div className={styles.stack}>
            <label>
              Brand name
              <input className={styles.input} placeholder="Lumen Clinic" />
            </label>
            <label>
              Business summary
              <textarea
                className={`${styles.input} ${styles.textarea}`}
                placeholder="Describe your services and core strengths."
              />
            </label>
            <div className={styles.row}>
              <label style={{ flex: 1 }}>
                Primary goal
                <input
                  className={styles.input}
                  placeholder="Consultation booking"
                />
              </label>
              <label style={{ flex: 1 }}>
                Target audience
                <input
                  className={styles.input}
                  placeholder="Local professionals 30-45"
                />
              </label>
            </div>
            <button className={styles.linkButton}>+ Add custom question</button>
          </div>
        </div>
      </section>
      <section className={styles.card}>
        <h3 className={styles.cardTitle}>Progress</h3>
        <p className={styles.cardMeta}>3 of 8 sections completed</p>
      </section>
    </AppShell>
  );
}
