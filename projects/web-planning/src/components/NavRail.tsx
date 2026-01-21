import Link from "next/link";
import styles from "./NavRail.module.css";

const items = [
  { label: "Dashboard", href: "/dashboard" },
  { label: "Survey", href: "/survey" },
  { label: "Builder", href: "/builder" },
  { label: "Admin", href: "/admin" },
];

export default function NavRail() {
  return (
    <nav className={styles.rail}>
      <div className={styles.brand}>PW</div>
      <div className={styles.nav}>
        {items.map((item) => (
          <Link key={item.label} className={styles.link} href={item.href}>
            <span className={styles.dot} />
            <span className={styles.label}>{item.label}</span>
          </Link>
        ))}
      </div>
      <div className={styles.footer}>Settings</div>
    </nav>
  );
}
