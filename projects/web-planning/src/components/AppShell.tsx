import styles from "./AppShell.module.css";
import AppBar from "./AppBar";
import BottomBar from "./BottomBar";
import NavRail from "./NavRail";

interface AppShellProps {
  title: string;
  subtitle?: string;
  children: React.ReactNode;
}

export default function AppShell({ title, subtitle, children }: AppShellProps) {
  return (
    <div className={styles.shell}>
      <NavRail />
      <div className={styles.main}>
        <AppBar title={title} subtitle={subtitle} />
        <div className={styles.content}>{children}</div>
      </div>
      <BottomBar />
    </div>
  );
}
