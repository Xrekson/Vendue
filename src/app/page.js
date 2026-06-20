"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Search, Clock, ShieldAlert } from "lucide-react";
import styles from "./page.module.css";

// Countdown Timer Component
function Countdown({ startTime, endTime }) {
  const [timeLeft, setTimeLeft] = useState("");
  const [status, setStatus] = useState("loading"); // pending, active, ended

  useEffect(() => {
    const calculateTime = () => {
      const now = new Date().getTime();
      const start = new Date(startTime).getTime();
      const end = new Date(endTime).getTime();

      if (now < start) {
        setStatus("pending");
        const diff = start - now;
        setTimeLeft(formatDiff(diff));
      } else if (now < end) {
        setStatus("active");
        const diff = end - now;
        setTimeLeft(formatDiff(diff));
      } else {
        setStatus("ended");
        setTimeLeft("Ended");
      }
    };

    const formatDiff = (diff) => {
      const days = Math.floor(diff / (1000 * 60 * 60 * 24));
      const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
      const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((diff % (1000 * 60)) / 1000);

      if (days > 0) return `${days}d ${hours}h`;
      if (hours > 0) return `${hours}h ${minutes}m`;
      return `${minutes}m ${seconds}s`;
    };

    calculateTime();
    const interval = setInterval(calculateTime, 1000);
    return () => clearInterval(interval);
  }, [startTime, endTime]);

  if (status === "pending") {
    return (
      <span className={`${styles.cardTimer} ${styles.pending}`}>
        <Clock size={14} /> Starts in: {timeLeft}
      </span>
    );
  }

  if (status === "active") {
    return (
      <span className={`${styles.cardTimer} ${styles.active}`}>
        <Clock size={14} /> Ends in: {timeLeft}
      </span>
    );
  }

  return (
    <span className={`${styles.cardTimer} ${styles.ended}`}>
      <ShieldAlert size={14} /> Auction Ended
    </span>
  );
}

export default function Marketplace() {
  const [listings, setListings] = useState([]);
  const [categories, setCategories] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [listingsRes, categoriesRes] = await Promise.all([
          fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/pre-auth/listing/all`),
          fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/pre-auth/categories/all`),
        ]);

        if (!listingsRes.ok || !categoriesRes.ok) {
          throw new Error("Failed to fetch marketplace data");
        }

        const listingsData = await listingsRes.json();
        const categoriesData = await categoriesRes.json();

        setListings(listingsData);
        setCategories(categoriesData);
      } catch (err) {
        setError(err.message || "Failed to load listings");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const filteredListings = listings.filter((item) => {
    const matchesCategory =
      selectedCategory === "all" || (item.category && item.category.category_id === parseInt(selectedCategory));
    const matchesSearch = item.name.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  return (
    <div className={styles.container}>
      {/* Hero Header */}
      <section className={`${styles.hero} glass-panel`}>
        <h1 className={styles.heroTitle}>
          Discover Premium <br />
          <span className="gradient-text">Real-Time Auctions</span>
        </h1>
        <p className={styles.heroSubtitle}>
          Securely list and bid on the world's most unique items with millisecond precision tracking.
        </p>
      </section>

      {/* Filter and Search Controls */}
      <div className={styles.controls}>
        <div className={styles.searchBar}>
          <input
            type="text"
            placeholder="Search items by name..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className={styles.searchInput}
          />
        </div>

        <div className={styles.categoryList}>
          <button
            onClick={() => setSelectedCategory("all")}
            className={`${styles.categoryBtn} ${selectedCategory === "all" ? styles.categoryBtnActive : ""}`}
          >
            All Items
          </button>
          {categories.map((cat) => (
            <button
              key={cat.category_id}
              onClick={() => setSelectedCategory(cat.category_id.toString())}
              className={`${styles.categoryBtn} ${
                selectedCategory === cat.category_id.toString() ? styles.categoryBtnActive : ""
              }`}
            >
              {cat.category_name}
            </button>
          ))}
        </div>
      </div>

      {/* Listings Grid */}
      {loading ? (
        <div className={styles.loadingWrapper}>
          <div>Retrieving auction listings...</div>
        </div>
      ) : error ? (
        <div style={{ color: "var(--danger)", textAlign: "center", padding: "3rem" }}>{error}</div>
      ) : filteredListings.length === 0 ? (
        <div style={{ color: "var(--text-secondary)", textAlign: "center", padding: "3rem" }}>
          No auction listings match your filter criteria.
        </div>
      ) : (
        <div className={styles.grid}>
          {filteredListings.map((item) => (
            <div key={item.id} className={`${styles.card} glass-panel`}>
              <div className={styles.cardBody}>
                <div className={styles.cardCategory}>
                  {item.category ? item.category.category_name : "General"}
                </div>
                <h2 className={styles.cardTitle}>{item.name}</h2>
                <p className={styles.cardDesc}>{item.detail || "No description provided."}</p>

                <div className={styles.cardStats}>
                  <div className={styles.statGroup}>
                    <span className={styles.statLabel}>Starting Price</span>
                    <span className={styles.statVal}>${item.price.toFixed(2)}</span>
                  </div>
                  <div className={styles.statGroup}>
                    <span className={styles.statLabel}>Highest Bid</span>
                    <span className={`${styles.statVal} ${styles.bidVal}`}>
                      ${item.highestbid && item.highestbid > 0 ? item.highestbid.toFixed(2) : "No Bids"}
                    </span>
                  </div>
                </div>

                <div className={styles.cardFooter}>
                  <Countdown startTime={item.auction_start} endTime={item.auction_end} />
                </div>

                <Link href={`/listings/${item.id}`} className={styles.detailsBtn}>
                  Bid Now
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
