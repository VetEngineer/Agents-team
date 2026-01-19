import styles from "./BottomBar.module.css";

const items = [
  { label: "Home", href: "/dashboard" },
  { label: "Survey", href: "/survey" },
  { label: "Builder", href: "/builder" },
  { label: "Admin", href: "/admin" },
];

export default function BottomBar() {
  return (
    <nav className={styles.bar}>
      {items.map((item) => (
        <a key={item.label} href={item.href} className={styles.item}>
          <span className={styles.icon} />
          <span>{item.label}</span>
        </a>
      ))}
    </nav>
  );
}
