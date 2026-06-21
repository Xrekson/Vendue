"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import styles from "../login/auth.module.css";

export default function RegisterPage() {
  const router = useRouter();
  const [form, setForm] = useState({
    username: "",
    password: "",
    name: "",
    email: "",
    mobileno: "",
    dob: "2000-01-01",
    type: "BUYER",
    desx: "Regular user",
    about: "Auction enthusiast",
  });
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
    setError("");
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    setSuccess("");

    try {
      // Form LocalDateTime pattern expected: yyyy-MM-dd'T'HH:mm:ss.SSSX
      // Let's build the full ISO date string from the user's dob input
      const formattedDob = `${form.dob}T00:00:00.000Z`;

      const requestBody = {
        ...form,
        dob: formattedDob,
      };

      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/pre-auth/user/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(requestBody),
      });

      if (!response.ok) {
        throw new Error("Failed to register. Please check your inputs.");
      }

      const data = await response.json();

      if (data.err) {
        setError(data.err);
      } else if (data.msg === "OTP Sent") {
        setSuccess("OTP sent to your email! Redirecting to verification...");
        setTimeout(() => {
          router.push(`/verify-otp?username=${encodeURIComponent(data.username)}`);
        }, 1500);
      } else {
        setSuccess("Registration successful! Redirecting to login...");
        setTimeout(() => {
          router.push("/login");
        }, 1500);
      }
    } catch (err) {
      setError(err.message || "Failed to connect to the backend server");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={styles.wrapper}>
      <div className={`${styles.card} glass-panel`} style={{ maxWidth: "550px" }}>
        <h1 className={`${styles.title} gradient-text`}>Create Account</h1>
        <p className={styles.subtitle}>Join Vendue and start bidding in seconds</p>

        {error && <div className={styles.errorText}>{error}</div>}
        {success && <div style={{ color: "var(--success)", fontSize: "0.9rem", marginBottom: "1rem", textAlign: "center" }}>{success}</div>}

        <form onSubmit={handleSubmit}>
          <div className={styles.row}>
            <div className={styles.formGroup}>
              <label className={styles.label}>Full Name</label>
              <input
                type="text"
                name="name"
                value={form.name}
                onChange={handleChange}
                className={styles.input}
                placeholder="John Doe"
                required
              />
            </div>
            <div className={styles.formGroup}>
              <label className={styles.label}>Username</label>
              <input
                type="text"
                name="username"
                value={form.username}
                onChange={handleChange}
                className={styles.input}
                placeholder="johndoe"
                required
              />
            </div>
          </div>

          <div className={styles.row}>
            <div className={styles.formGroup}>
              <label className={styles.label}>Email Address</label>
              <input
                type="email"
                name="email"
                value={form.email}
                onChange={handleChange}
                className={styles.input}
                placeholder="john@example.com"
                required
              />
            </div>
            <div className={styles.formGroup}>
              <label className={styles.label}>Phone Number</label>
              <input
                type="text"
                name="mobileno"
                value={form.mobileno}
                onChange={handleChange}
                className={styles.input}
                placeholder="1234567890"
                required
              />
            </div>
          </div>

          <div className={styles.row}>
            <div className={styles.formGroup}>
              <label className={styles.label}>Password</label>
              <input
                type="password"
                name="password"
                value={form.password}
                onChange={handleChange}
                className={styles.input}
                placeholder="••••••••"
                required
              />
            </div>
            <div className={styles.formGroup}>
              <label className={styles.label}>Date of Birth</label>
              <input
                type="date"
                name="dob"
                value={form.dob}
                onChange={handleChange}
                className={styles.input}
                required
              />
            </div>
          </div>

          <div className={styles.formGroup}>
            <label className={styles.label}>Role / Type</label>
            <select name="type" value={form.type} onChange={handleChange} className={styles.input}>
              <option value="BUYER">Buyer (Bidder)</option>
              <option value="SELLER">Seller (Publisher)</option>
            </select>
          </div>

          <button type="submit" className={styles.btn} disabled={loading}>
            {loading ? "Registering..." : "Sign Up"}
          </button>
        </form>

        <p className={styles.footer}>
          Already have an account?{" "}
          <Link href="/login" className={styles.footerLink}>
            Log in
          </Link>
        </p>
      </div>
    </div>
  );
}
