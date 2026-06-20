"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import styles from "../../login/auth.module.css";

export default function AdminCreateAdminPage() {
  const router = useRouter();
  const [form, setForm] = useState({
    username: "",
    password: "",
    name: "",
    email: "",
    mobileno: "",
    dob: "2000-01-01",
    type: "ADMIN",
    desx: "Administrator",
    about: "Admin management",
  });
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem("token");
    const role = localStorage.getItem("type");

    if (!token) {
      router.push("/login");
      return;
    }

    if (role !== "ADMIN") {
      router.push("/");
      return;
    }
  }, [router]);

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
        throw new Error("Failed to register admin. Check input data.");
      }

      const data = await response.json();

      if (data.err) {
        setError(data.err);
      } else {
        setSuccess("New administrator registered successfully!");
        setForm({
          username: "",
          password: "",
          name: "",
          email: "",
          mobileno: "",
          dob: "2000-01-01",
          type: "ADMIN",
          desx: "Administrator",
          about: "Admin management",
        });
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
        <h1 className={`${styles.title} gradient-text`}>Register New Admin</h1>
        <p className={styles.subtitle}>Provision a new administrative account</p>

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
                placeholder="Admin Full Name"
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
                placeholder="admin_username"
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
                placeholder="admin@vendue.com"
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

          <button type="submit" className={styles.btn} disabled={loading}>
            {loading ? "Registering admin..." : "Register Admin"}
          </button>
        </form>
      </div>
    </div>
  );
}
