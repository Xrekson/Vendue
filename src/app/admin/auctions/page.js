"use client";

import { useEffect, useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import { Client } from "@stomp/stompjs";
import { Search, Filter, Activity, Eye } from "lucide-react";
import Link from "next/link";
import styles from "./styles.module.css";

export default function AdminLiveAuctionsPage() {
  const router = useRouter();
  const [listings, setListings] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("ALL");
  const [recentBids, setRecentBids] = useState({}); // track recent bid updates for animation
  const [stompClient, setStompClient] = useState(null);

  useEffect(() => {
    const token = localStorage.getItem("token");
    const type = localStorage.getItem("type");

    if (!token || type !== "ADMIN") {
      router.push("/");
      return;
    }

    const fetchData = async () => {
      try {
        const [listingsRes, categoriesRes] = await Promise.all([
          fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/listing/all`, {
            headers: {
              Authorization: `Bearer ${token}`
            }
          }),
          fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/categories/all`, {
            headers: {
              Authorization: `Bearer ${token}`
            }
          }),
        ]);

        if (listingsRes.ok && categoriesRes.ok) {
          const listingsData = await listingsRes.json();
          const categoriesData = await categoriesRes.json();
          setListings(listingsData);
          setCategories(categoriesData);
        }
      } catch (err) {
        console.error("Failed to fetch dashboard data:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [router]);

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token || listings.length === 0) return;

    const client = new Client({
      brokerURL: `${process.env.NEXT_PUBLIC_WS_URL}/websoc`,
      connectHeaders: {
        Authorization: `Bearer ${token}`,
      },
      reconnectDelay: 5000,
      heartbeatIncoming: 4000,
      heartbeatOutgoing: 4000,
    });

    client.onConnect = () => {
      console.log("Admin STOMP connection established");

      client.subscribe("/main/admin/bids", (message) => {
        const incomingBid = JSON.parse(message.body);
        
        setListings((prev) => 
          prev.map((listing) => {
            if (listing.id === incomingBid.auctionItemId) {
              return { ...listing, highestbid: incomingBid.bidAmount };
            }
            return listing;
          })
        );

        // Highlight the row temporarily
        setRecentBids((prev) => ({ ...prev, [incomingBid.auctionItemId]: true }));
        setTimeout(() => {
          setRecentBids((prev) => ({ ...prev, [incomingBid.auctionItemId]: false }));
        }, 2000);
      });
    };

    client.onStompError = (frame) => {
      console.error("STOMP broker error:", frame.headers["message"]);
    };

    client.activate();
    setStompClient(client);

    return () => {
      client.deactivate();
    };
  }, [listings.length]); // re-run only when we successfully fetched listings initially

  const filteredListings = useMemo(() => {
    return listings.filter((listing) => {
      const matchesCategory = selectedCategory === "ALL" || (listing.category && listing.category.category_id.toString() === selectedCategory);
      
      const searchLower = searchQuery.toLowerCase();
      const matchesSearch = 
        listing.name.toLowerCase().includes(searchLower) ||
        (listing.detail && listing.detail.toLowerCase().includes(searchLower)) ||
        (listing.category && listing.category.category_name.toLowerCase().includes(searchLower)) ||
        listing.id.toString().includes(searchLower);

      return matchesCategory && matchesSearch;
    });
  }, [listings, searchQuery, selectedCategory]);

  const getStatus = (listing) => {
    const now = new Date().getTime();
    const start = new Date(listing.auction_start).getTime();
    const end = new Date(listing.auction_end).getTime();

    if (now < start) return { label: "Upcoming", className: styles.statusUpcoming };
    if (now >= start && now <= end) return { label: "Live", className: styles.statusLive };
    return { label: "Closed", className: styles.statusClosed };
  };

  if (loading) {
    return <div className={styles.loadingContainer}>Loading Live Dashboard...</div>;
  }

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h1 className={styles.title}>
          <Activity className={styles.icon} size={28} />
          Live Auctions Dashboard
        </h1>
        <p className={styles.subtitle}>Monitor and manage all global auction activity in real-time.</p>
      </div>

      <div className={`${styles.controls} glass-panel`}>
        <div className={styles.searchBox}>
          <Search size={18} className={styles.searchIcon} />
          <input
            type="text"
            className={styles.searchInput}
            placeholder="Global search by ID, name, description, or category..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>

        <div className={styles.filterBox}>
          <Filter size={18} className={styles.filterIcon} />
          <select
            className={styles.filterSelect}
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
          >
            <option value="ALL">All Categories</option>
            {categories.map((cat) => (
              <option key={cat.category_id} value={cat.category_id}>
                {cat.category_name}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className={`${styles.tableContainer} glass-panel`}>
        <table className={styles.table}>
          <thead>
            <tr>
              <th>ID</th>
              <th>Item Name</th>
              <th>Category</th>
              <th>Base Price</th>
              <th>Current Bid</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredListings.length === 0 ? (
              <tr>
                <td colSpan="7" className={styles.emptyState}>No auctions match your filters.</td>
              </tr>
            ) : (
              filteredListings.map((listing) => {
                const status = getStatus(listing);
                const isUpdated = recentBids[listing.id];

                return (
                  <tr key={listing.id} className={isUpdated ? styles.rowHighlight : ""}>
                    <td className={styles.idCell}>#{listing.id}</td>
                    <td className={styles.nameCell}>{listing.name}</td>
                    <td>{listing.category ? listing.category.category_name : "General"}</td>
                    <td>${listing.price.toFixed(2)}</td>
                    <td className={`${styles.bidCell} ${isUpdated ? styles.bidPulse : ""}`}>
                      {listing.highestbid ? `$${listing.highestbid.toFixed(2)}` : "No Bids"}
                    </td>
                    <td>
                      <span className={`${styles.statusBadge} ${status.className}`}>
                        {status.label}
                      </span>
                    </td>
                    <td>
                      <Link href={`/listings/${listing.id}`} className={styles.viewBtn}>
                        <Eye size={16} />
                        View
                      </Link>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
