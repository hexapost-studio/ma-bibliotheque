"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const TABS = [
  { href: "/", label: "Bibliothèque" },
  { href: "/tendances", label: "Tendances" },
  { href: "/prix", label: "Suivi des prix" },
];

export default function Nav() {
  const path = usePathname();
  return (
    <nav style={{ display: "flex", gap: 4 }}>
      {TABS.map((t) => {
        const active = t.href === "/" ? path === "/" : path.startsWith(t.href);
        return (
          <Link
            key={t.href}
            href={t.href}
            style={{
              textDecoration: "none",
              fontWeight: 600,
              fontSize: 13,
              padding: "8px 15px",
              borderRadius: 8,
              color: active ? "#fff" : "#c6b49b",
              background: active ? "#b5623c" : "transparent",
              transition: "all .15s ease",
            }}
          >
            {t.label}
          </Link>
        );
      })}
    </nav>
  );
}
