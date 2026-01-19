import AppShell from "@/components/AppShell";
import styles from "../styles.module.css";

export default function DashboardPage() {
  return (
    <AppShell title="Dashboard" subtitle="Active projects and quick actions">
      <section className={styles.stack}>
        <div>
          <h2 className={styles.sectionTitle}>Active briefs</h2>
          <p className={styles.sectionSubtitle}>
            Track progress across client requests and deliverables.
          </p>
        </div>
        <div className={styles.sectionGrid}>
          {["Lumen Clinic", "Cornerstone Law", "Slow Pour Cafe"].map(
            (name) => (
              <div key={name} className={styles.card}>
                <p className={styles.badge}>Draft</p>
                <h3 className={styles.cardTitle}>{name}</h3>
                <p className={styles.cardMeta}>
                  Updated 3 hours ago • 12 sections
                </p>
              </div>
            )
          )}
        </div>
      </section>
      <section className={styles.sectionGrid}>
        <div className={styles.card}>
          <h3 className={styles.cardTitle}>New project</h3>
          <p className={styles.cardMeta}>
            Start a guided survey with dynamic pages.
          </p>
        </div>
        <div className={styles.card}>
          <h3 className={styles.cardTitle}>Review submissions</h3>
          <p className={styles.cardMeta}>
            Airtable sync status and asset readiness.
          </p>
        </div>
      </section>
    </AppShell>
  );
}
