import styles from "./AppBar.module.css";

interface AppBarProps {
  title: string;
  subtitle?: string;
}

export default function AppBar({ title, subtitle }: AppBarProps) {
  return (
    <header className={styles.bar}>
      <div>
        <p className={styles.eyebrow}>Planner Workspace</p>
        <h1 className={styles.title}>{title}</h1>
        {subtitle ? <p className={styles.subtitle}>{subtitle}</p> : null}
      </div>
      <div className={styles.actions}>
        <span className={styles.status}>Auto-saved</span>
        <button type="button" className={styles.secondary}>
          Preview
        </button>
        <button type="button" className={styles.primary}>
          Submit
        </button>
      </div>
    </header>
  );
}
