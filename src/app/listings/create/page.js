"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import styles from "./styles.module.css";

export default function CreateListingPage() {
  const router = useRouter();
  const [categories, setCategories] = useState([]);
  const [form, setForm] = useState({
    name: "",
    price: "",
    detail: "",
    priceInterval: "",
    auction_start: "",
    auction_end: "",
    categoryId: "",
    images: "",
  });
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [successMsg, setSuccessMsg] = useState("");

  useEffect(() => {
    const token = localStorage.getItem("token");
    const role = localStorage.getItem("type");

    if (!token) {
      router.push("/login");
      return;
    }

    if (role !== "SELLER" && role !== "ADMIN") {
      router.push("/");
      return;
    }

    // Fetch categories to populate drop-down selector
    const fetchCategories = async () => {
      try {
        const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/pre-auth/categories/all`);
        if (res.ok) {
          const data = await res.json();
          setCategories(data);
          if (data.length > 0) {
            setForm((prev) => ({ ...prev, categoryId: data[0].category_id.toString() }));
          }
        }
      } catch (err) {
        console.error("Failed to load categories:", err);
      }
    };

    fetchCategories();
  }, [router]);

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
    setErrorMsg("");
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setErrorMsg("");
    setSuccessMsg("");

    const token = localStorage.getItem("token");
    const username = localStorage.getItem("username");

    // Standard date checks
    const start = new Date(form.auction_start);
    const end = new Date(form.auction_end);

    if (start >= end) {
      setErrorMsg("Auction end time must be after the start time.");
      setLoading(false);
      return;
    }

    try {
      const selectedCategory = categories.find((c) => c.category_id.toString() === form.categoryId);

      const requestBody = {
        id: 0,
        name: form.name,
        price: parseFloat(form.price),
        detail: form.detail,
        priceInterval: parseFloat(form.priceInterval),
        auction_start: form.auction_start,
        auction_end: form.auction_end,
        createdby: username,
        updatedby: username,
        highestbid: 0,
        images: form.images ? form.images.split(",").map((url) => url.trim()).filter((url) => url !== "") : [],
        category: selectedCategory
          ? {
            category_id: selectedCategory.category_id,
            category_name: selectedCategory.category_name,
            category_details: selectedCategory.category_details,
            products: selectedCategory.products,
          }
          : null,
      };

      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/listing/save`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(requestBody),
      });

      const data = await response.json().catch(() => ({}));

      if (response.ok) {
        setSuccessMsg("Auction listing created successfully! Redirecting...");
        setTimeout(() => {
          router.push("/");
        }, 1500);
      } else {
        setErrorMsg(data.error || "Failed to create auction listing.");
      }
    } catch (err) {
      setErrorMsg("Failed to connect to the backend server. Please verify database connection.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={styles.container}>
      <div className={`${styles.card} glass-panel`}>
        <h1 className={`${styles.title} gradient-text`}>List a New Item</h1>
        <p className={styles.subtitle}>Specify the parameters to start a bidding auction</p>

        {errorMsg && <div className={styles.errorAlert}>{errorMsg}</div>}
        {successMsg && <div className={styles.successAlert}>{successMsg}</div>}

        <form onSubmit={handleSubmit} className={styles.form}>
          <div className={styles.formGroup}>
            <label className={styles.label}>Product Name</label>
            <input
              type="text"
              name="name"
              value={form.name}
              onChange={handleChange}
              className={styles.input}
              placeholder="e.g. Vintage Mechanical Watch"
              required
            />
          </div>

          <div className={styles.row}>
            <div className={styles.formGroup}>
              <label className={styles.label}>Starting Base Price ($)</label>
              <input
                type="number"
                step="0.01"
                name="price"
                value={form.price}
                onChange={handleChange}
                className={styles.input}
                placeholder="100.00"
                required
              />
            </div>

            <div className={styles.formGroup}>
              <label className={styles.label}>Bid Increment Step ($)</label>
              <input
                type="number"
                step="0.01"
                name="priceInterval"
                value={form.priceInterval}
                onChange={handleChange}
                className={styles.input}
                placeholder="10.00"
                required
              />
            </div>
          </div>

          <div className={styles.row}>
            <div className={styles.formGroup}>
              <label className={styles.label}>Auction Start Time</label>
              <input
                type="datetime-local"
                name="auction_start"
                value={form.auction_start}
                onChange={handleChange}
                className={styles.input}
                required
              />
            </div>

            <div className={styles.formGroup}>
              <label className={styles.label}>Auction End Time</label>
              <input
                type="datetime-local"
                name="auction_end"
                value={form.auction_end}
                onChange={handleChange}
                className={styles.input}
                required
              />
            </div>
          </div>

          <div className={styles.formGroup}>
            <label className={styles.label}>Category</label>
            <select name="categoryId" value={form.categoryId} onChange={handleChange} className={styles.input}>
              {categories.map((c) => (
                <option key={c.category_id} value={c.category_id.toString()}>
                  {c.category_name}
                </option>
              ))}
            </select>
          </div>

          <div className={styles.formGroup}>
            <label className={styles.label}>Image URLs (comma-separated)</label>
            <input
              type="text"
              name="images"
              value={form.images}
              onChange={handleChange}
              className={styles.input}
              placeholder="https://example.com/image1.jpg, https://example.com/image2.jpg"
            />
          </div>

          <div className={styles.formGroup}>
            <label className={styles.label}>Item Detail Description</label>
            <textarea
              name="detail"
              value={form.detail}
              onChange={handleChange}
              className={`${styles.input} styles.textarea`}
              placeholder="Provide a detailed description of the product history, condition, and specs..."
              rows={4}
              required
            />
          </div>

          <div className={styles.btnRow}>
            <Link href="/" className={`${styles.btn} ${styles.btnSecondary}`}>
              Cancel
            </Link>
            <button type="submit" className={`${styles.btn} ${styles.btnPrimary}`} disabled={loading}>
              {loading ? "Saving listing..." : "Publish Listing"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
