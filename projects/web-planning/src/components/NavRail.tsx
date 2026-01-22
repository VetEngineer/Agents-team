import Link from "next/link";
import Image from "next/image";
import styles from "./NavRail.module.css";

const items = [
  { label: "대시보드", href: "/dashboard" },
  { label: "설문", href: "/survey" },
  { label: "빌더", href: "/builder" },
  { label: "관리자", href: "/admin" },
];

export default function NavRail() {
  return (
    <nav className={styles.rail}>
      <div className={styles.brand}>
        <Image
          src="/brand/logo-mark.png"
          alt="하감솔루션 로고"
          width={28}
          height={28}
          className={styles.brandImage}
          priority
        />
      </div>
      <div className={styles.nav}>
        {items.map((item) => (
          <Link key={item.label} className={styles.link} href={item.href}>
            <span className={styles.dot} />
            <span className={styles.label}>{item.label}</span>
          </Link>
        ))}
      </div>
      <div className={styles.footer}>설정</div>
    </nav>
  );
}
