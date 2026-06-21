"use client";

import { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import styles from "../login/auth.module.css";

function VerifyOtpContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const initialUsername = searchParams.get("username") || "";

  const [username, setUsername] = useState(initialUsername);
  const [otp, setOtp] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);
  const [cooldown, setCooldown] = useState(0);

  useEffect(() => {
    if (initialUsername) {
      setUsername(initialUsername);
    }
  }, [initialUsername]);

  useEffect(() => {
    let timer;
    if (cooldown > 0) {
      timer = setTimeout(() => setCooldown(cooldown - 1), 1000);
    }
    return () => clearTimeout(timer);
  }, [cooldown]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    setSuccess("");

    if (otp.length !== 6 || isNaN(otp)) {
      setError("Please enter a valid 6-digit verification code.");
      setLoading(false);
      return;
    }

    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/pre-auth/user/verify-otp`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, otp }),
      });

      if (!response.ok) {
        throw new Error("Failed to connect to the server.");
      }

      const data = await response.json();

      if (data.err) {
        setError(data.err);
      } else {
        setSuccess("Account verified successfully! Redirecting to login...");
        setTimeout(() => {
          router.push("/login");
        }, 2000);
      }
    } catch (err) {
      setError(err.message || "Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    if (cooldown > 0) return;
    setResending(true);
    setError("");
    setSuccess("");

    if (!username) {
      setError("Please enter your username to resend code.");
      setResending(false);
      return;
    }

    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/pre-auth/user/resend-otp`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username }),
      });

      if (!response.ok) {
        throw new Error("Failed to connect to the server.");
      }

      const data = await response.json();

      if (data.err) {
        setError(data.err);
      } else {
        setSuccess("A new verification code has been sent to your email.");
        setCooldown(30); // 30 seconds cooldown
      }
    } catch (err) {
      setError(err.message || "Failed to resend verification code.");
    } finally {
      setResending(false);
    }
  };

  return (
    <div className={styles.wrapper}>
      <div className={`${styles.card} glass-panel`} style={{ maxWidth: "450px" }}>
        <h1 className={`${styles.title} gradient-text`}>Verify Account</h1>
        <p className={styles.subtitle}>Enter the 6-digit code sent to your email address</p>

        {error && <div className={styles.errorText}>{error}</div>}
        {success && <div style={{ color: "var(--success)", fontSize: "0.9rem", marginBottom: "1rem", textAlign: "center" }}>{success}</div>}

        <form onSubmit={handleSubmit}>
          {!initialUsername && (
            <div className={styles.formGroup}>
              <label className={styles.label}>Username</label>
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className={styles.input}
                placeholder="Enter your username"
                required
              />
            </div>
          )}

          <div className={styles.formGroup}>
            <label className={styles.label}>6-Digit OTP Code</label>
            <input
              type="text"
              maxLength="6"
              value={otp}
              onChange={(e) => setOtp(e.target.value.replace(/\D/g, ""))}
              className={styles.input}
              placeholder="e.g. 123456"
              style={{
                textAlign: "center",
                fontSize: "1.5rem",
                letterSpacing: "0.5rem",
                paddingLeft: "1.25rem"
              }}
              required
            />
          </div>

          <button type="submit" className={styles.btn} disabled={loading}>
            {loading ? "Verifying..." : "Verify Code"}
          </button>
        </form>

        <div className={styles.footer} style={{ display: "flex", flexDirection: "column", gap: "0.5rem", marginTop: "1.5rem" }}>
          <span>
            Didn't receive a code?{" "}
            <button
              onClick={handleResend}
              disabled={resending || cooldown > 0 || !username}
              className={styles.footerLink}
              style={{
                background: "none",
                border: "none",
                padding: 0,
                font: "inherit",
                cursor: "pointer",
                textDecoration: "underline"
              }}
            >
              {cooldown > 0 ? `Resend Code (${cooldown}s)` : "Resend Code"}
            </button>
          </span>

          <Link href="/login" className={styles.footerLink}>
            Back to Login
          </Link>
        </div>
      </div>
    </div>
  );
}

export default function VerifyOtpPage() {
  return (
    <Suspense fallback={<div style={{ textAlign: "center", padding: "3rem", color: "var(--text-secondary)" }}>Loading verification...</div>}>
      <VerifyOtpContent />
    </Suspense>
  );
}
