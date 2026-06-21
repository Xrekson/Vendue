"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { PlusCircle, Trash2, FolderOpen } from "lucide-react";
import styles from "./styles.module.css";

export default function AdminCategoriesPage() {
  const router = useRouter();
  const [categories, setCategories] = useState([]);
  const [form, setForm] = useState({ name: "", details: "" });
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [successMsg, setSuccessMsg] = useState("");

  const fetchCategories = async () => {
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/pre-auth/categories/all`);
      if (res.ok) {
        const data = await res.json();
        setCategories(data);
      }
    } catch (err) {
      console.error("Failed to load categories:", err);
    }
  };

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

    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/categories/create`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          category_name: form.name,
          category_details: form.details,
          products: []
        }),
      });

      const data = await response.json();

      if (response.status === 401) {
        localStorage.removeItem("token");
        localStorage.removeItem("type");
        router.push("/login");
        return;
      }

      if (response.ok && data.msg) {
        setSuccessMsg("Category created successfully!");
        setForm({ name: "", details: "" });
        fetchCategories();
      } else {
        setErrorMsg(data.error || "Failed to create category.");
      }
    } catch (err) {
      setErrorMsg("Failed to connect to the backend server.");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    if (!confirm("Are you sure you want to delete this category? All associated listings will be removed.")) return;

    const token = localStorage.getItem("token");

    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/categories/delete/${id}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const data = await response.json();

      if (response.status === 401) {
        localStorage.removeItem("token");
        localStorage.removeItem("type");
        router.push("/login");
        return;
      }

      if (response.ok && data.msg) {
        setSuccessMsg("Category deleted successfully.");
        fetchCategories();
      } else {
        setErrorMsg(data.error || "Failed to delete category.");
      }
    } catch (err) {
      setErrorMsg("Failed to connect to the backend server.");
    }
  };

  return (
    <div className={styles.container}>
      <h1 className={styles.title}>Category Settings</h1>
      <p className={styles.subtitle}>Configure product catalog divisions for listings</p>

      {errorMsg && <div className={styles.errorAlert}>{errorMsg}</div>}
      {successMsg && <div className={styles.successAlert}>{successMsg}</div>}

      <div className={styles.layout}>
        {/* Category List */}
        <div className={`${styles.listCard} glass-panel`}>
          <h2 className={styles.listTitle}>
            <FolderOpen size={16} style={{ display: "inline", marginRight: "0.5rem", verticalAlign: "middle" }} />
            Existing Categories ({categories.length})
          </h2>

          <div className={styles.list}>
            {categories.length === 0 ? (
              <div style={{ color: "var(--text-secondary)", fontSize: "0.9rem", textAlign: "center", padding: "2rem" }}>
                No categories configured yet.
              </div>
            ) : (
              categories.map((cat) => (
                <div key={cat.category_id} className={styles.listItem}>
                  <div className={styles.itemInfo}>
                    <div className={styles.itemName}>{cat.category_name}</div>
                    <div className={styles.itemDesc}>{cat.category_details || "No details specified."}</div>
                  </div>
                  <div className={styles.itemActions}>
                    <button onClick={() => handleDelete(cat.category_id)} className={styles.actionBtn} title="Delete Category">
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Category Form */}
        <div className={`${styles.card} glass-panel`}>
          <h2 className={styles.formTitle}>Add New Category</h2>
          <form onSubmit={handleSubmit} className={styles.form}>
            <div className={styles.formGroup}>
              <label className={styles.label}>Category Name</label>
              <input
                type="text"
                name="name"
                value={form.name}
                onChange={handleChange}
                className={styles.input}
                placeholder="e.g. Antiques, Tech, Fine Art"
                required
              />
            </div>

            <div className={styles.formGroup}>
              <label className={styles.label}>Description Details</label>
              <textarea
                name="details"
                value={form.details}
                onChange={handleChange}
                className={styles.input}
                placeholder="Describe what kind of listings go into this category..."
                rows={4}
                required
              />
            </div>

            <button type="submit" className={styles.btn} disabled={loading}>
              {loading ? "Saving category..." : "Create Category"}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
