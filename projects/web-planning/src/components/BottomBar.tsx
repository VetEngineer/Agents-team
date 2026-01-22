import Link from "next/link";
import styles from "./BottomBar.module.css";

const items = [
  { label: "홈", href: "/dashboard" },
  { label: "설문", href: "/survey" },
  { label: "빌더", href: "/builder" },
  { label: "관리자", href: "/admin" },
];

export default function BottomBar() {
  return (
    <nav className={styles.bar}>
      {items.map((item) => (
        <Link key={item.label} href={item.href} className={styles.item}>
          <span className={styles.icon} />
          <span>{item.label}</span>
        </Link>
      ))}
    </nav>
  );
}
