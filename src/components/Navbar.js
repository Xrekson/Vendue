"use client";

import Link from "next/link";
import { useRouter, usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { LogIn, LogOut, Gavel, User } from "lucide-react";
import styles from "./Navbar.module.css";

export default function Navbar() {
  const router = useRouter();
  const pathname = usePathname();
  const [user, setUser] = useState(null);

  useEffect(() => {
    // Check local storage for authenticated user context
    const token = localStorage.getItem("token");
    const username = localStorage.getItem("username");
    const type = localStorage.getItem("type");
    
    if (token && username) {
      setUser({ token, username, type });
    } else {
      setUser(null);
    }
  }, [pathname]);

  const handleLogout = () => {
    localStorage.clear();
    setUser(null);
    router.push("/login");
  };

  return (
    <header className={styles.header}>
      <div className={styles.container}>
        <Link href="/" className={styles.logo}>
          <Gavel size={22} style={{ color: "var(--accent-color)" }} />
          <span className="gradient-text">Vendue</span>
        </Link>

        <nav className={styles.navLinks}>
          <Link href="/" className={`${styles.link} ${pathname === "/" ? styles.activeLink : ""}`}>
            Marketplace
          </Link>
          {user && (user.type === "SELLER" || user.type === "ADMIN") && (
            <Link href="/listings/create" className={`${styles.link} ${pathname === "/listings/create" ? styles.activeLink : ""}`}>
              Create Listing
            </Link>
          )}
          {user && user.type === "ADMIN" && (
            <>
              <Link href="/admin/auctions" className={`${styles.link} ${pathname === "/admin/auctions" ? styles.activeLink : ""}`}>
                Live Auctions
              </Link>
              <Link href="/admin/categories" className={`${styles.link} ${pathname === "/admin/categories" ? styles.activeLink : ""}`}>
                Manage Categories
              </Link>
              <Link href="/admin/create-admin" className={`${styles.link} ${pathname === "/admin/create-admin" ? styles.activeLink : ""}`}>
                Create Admin
              </Link>
            </>
          )}
        </nav>

        <div className={styles.authSection}>
          {user ? (
            <>
              <div className={styles.username}>
                <User size={14} style={{ display: "inline", marginRight: "0.25rem", verticalAlign: "middle" }} />
                <span>{user.username} <span style={{ fontSize: "0.75rem", opacity: 0.6 }}>({user.type})</span></span>
              </div>
              <button onClick={handleLogout} className={`${styles.btn} ${styles.btnDanger}`}>
                <LogOut size={14} />
                Logout
              </button>
            </>
          ) : (
            <>
              <Link href="/login" className={`${styles.btn} ${styles.btnSecondary}`}>
                <LogIn size={14} />
                Login
              </Link>
              <Link href="/register" className={`${styles.btn} ${styles.btnPrimary}`}>
                Sign Up
              </Link>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
