"use client";

import { useEffect, useState, use } from "react";
import Link from "next/link";
import { ArrowLeft, Gavel, History, ShieldAlert } from "lucide-react";
import { Client } from "@stomp/stompjs";
import styles from "./styles.module.css";

export default function ListingDetailsPage({ params: paramsPromise }) {
  const params = use(paramsPromise);
  const id = params.id;

  const [listing, setListing] = useState(null);
  const [bids, setBids] = useState([]);
  const [bidInput, setBidInput] = useState("");
  const [errorMsg, setErrorMsg] = useState("");
  const [stompClient, setStompClient] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [auctionStatus, setAuctionStatus] = useState("loading");
  const [timeRemaining, setTimeRemaining] = useState("");

  useEffect(() => {
    const token = localStorage.getItem("token");
    const type = localStorage.getItem("type");
    setIsAuthenticated(!!token);
    setIsAdmin(type === "ADMIN");

    const fetchData = async () => {
      try {
        // Fetch listing (Pre-auth public route)
        const listingRes = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/pre-auth/listing/${id}`);
        if (!listingRes.ok) {
          throw new Error("Listing not found");
        }
        const listingData = await listingRes.json();
        setListing(listingData);

        // Fetch initial bids (Requires JWT auth)
        if (token) {
          const bidsRes = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/bid/auction/${id}`, {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          });
          if (bidsRes.ok) {
            const bidsData = await bidsRes.json();
            // Sort bids by timestamp descending
            const sortedBids = bidsData.sort((a, b) => new Date(b.bidTimestamp) - new Date(a.bidTimestamp));
            setBids(sortedBids);
          }
        }
      } catch (err) {
        setError(err.message || "Failed to load listing details");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [id]);

  useEffect(() => {
    if (!listing) return;

    const start = new Date(listing.auction_start).getTime();
    const end = new Date(listing.auction_end).getTime();

    const updateTimer = () => {
      const now = new Date().getTime();

      const formatTime = (ms) => {
        const totalSeconds = Math.floor(ms / 1000);
        const days = Math.floor(totalSeconds / (3600 * 24));
        const hours = Math.floor((totalSeconds % (3600 * 24)) / 3600);
        const minutes = Math.floor((totalSeconds % 3600) / 60);
        const seconds = totalSeconds % 60;

        if (days > 0) return `${days}d ${hours}h ${minutes}m ${seconds}s`;
        if (hours > 0) return `${hours}h ${minutes}m ${seconds}s`;
        return `${minutes}m ${seconds}s`;
      };

      if (now < start) {
        setAuctionStatus("upcoming");
        setTimeRemaining(`Starts in: ${formatTime(start - now)}`);
      } else if (now < end) {
        setAuctionStatus("live");
        setTimeRemaining(`Ends in: ${formatTime(end - now)}`);
      } else {
        setAuctionStatus("closed");
        setTimeRemaining("Closed");
      }
    };

    updateTimer();
    const timer = setInterval(updateTimer, 1000);

    return () => clearInterval(timer);
  }, [listing]);

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token || !listing || auctionStatus === "closed") return;

    // Initialize STOMP client over native WebSocket connection
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
      console.log("STOMP connection established");

      // Subscribe to real-time bid updates
      client.subscribe("/main/bid/response", (message) => {
        const incomingBid = JSON.parse(message.body);
        if (incomingBid.auctionItemId === parseInt(id)) {
          setBids((prev) => [incomingBid, ...prev]);
          setListing((prev) => ({ ...prev, highestbid: incomingBid.bidAmount }));
        }
      });

      // Subscribe to private, user-specific bid error feedback
      client.subscribe("/user/queue/errors", (message) => {
        const errorDetails = JSON.parse(message.body);
        setErrorMsg(errorDetails.message || "Bid processing error");
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
  }, [listing, id, auctionStatus]);

  const handlePlaceBid = (e) => {
    e.preventDefault();
    setErrorMsg("");

    if (!stompClient || !stompClient.connected) {
      setErrorMsg("Real-time bidding server disconnected. Retrying...");
      return;
    }

    const amount = parseFloat(bidInput);
    const minIncrement = listing.priceInterval || 0;
    const currentHighest = listing.highestbid || 0;
    const basePrice = listing.price;
    const minRequired = currentHighest <= 0 ? basePrice : currentHighest + minIncrement;

    if (isNaN(amount) || amount < minRequired) {
      setErrorMsg(`Bid must be at least $${minRequired.toFixed(2)}`);
      return;
    }

    // Publish bid request to websocket topic
    stompClient.publish({
      destination: "/auc/websoc/biding",
      body: JSON.stringify({
        auctionItemId: parseInt(id),
        bidAmount: amount,
      }),
    });

    setBidInput("");
  };

  if (loading) {
    return (
      <div className={styles.loadingWrapper}>
        <div>Loading auction product details...</div>
      </div>
    );
  }

  if (error || !listing) {
    return (
      <div className={styles.container}>
        <div style={{ color: "var(--danger)", textAlign: "center", padding: "3rem" }}>
          {error || "Listing not found"}
        </div>
      </div>
    );
  }

  const minRequiredBid =
    (listing.highestbid || 0) <= 0
      ? listing.price
      : (listing.highestbid || 0) + (listing.priceInterval || 0);

  return (
    <div className={styles.container}>
      <Link href="/" className={styles.backLink}>
        <ArrowLeft size={16} />
        Back to Marketplace
      </Link>

      <div className={styles.layout}>
        {/* Main Item Specs */}
        <div className={`${styles.mainCard} glass-panel`}>
          <div>
            <div className={styles.category}>{listing.category ? listing.category.category_name : "General"}</div>
            <h1 className={styles.title}>{listing.name}</h1>
          </div>

          <div className={styles.metadataGrid}>
            <div className={styles.metaItem}>
              <span className={styles.metaLabel}>Base Starting Price</span>
              <span className={styles.metaVal}>${listing.price.toFixed(2)}</span>
            </div>
            <div className={styles.metaItem}>
              <span className={styles.metaLabel}>Price Bid Increment</span>
              <span className={styles.metaVal}>${(listing.priceInterval || 0).toFixed(2)}</span>
            </div>
            <div className={styles.metaItem}>
              <span className={styles.metaLabel}>Current Highest Bid</span>
              <span className={`${styles.metaVal} ${styles.accentVal}`}>
                ${listing.highestbid && listing.highestbid > 0 ? listing.highestbid.toFixed(2) : "No Bids"}
              </span>
            </div>
            <div className={styles.metaItem}>
              <span className={styles.metaLabel}>Auction Status</span>
              <span className={styles.metaVal} style={auctionStatus === "closed" ? { color: "var(--danger)", fontWeight: "bold" } : { color: "var(--accent-color)", fontWeight: "bold" }}>
                {timeRemaining}
              </span>
            </div>
          </div>

          <div>
            <h3 className={styles.descTitle}>Description / Details</h3>
            <p className={styles.descText}>{listing.detail || "No details provided for this listing."}</p>
          </div>
        </div>

        {/* Bidding Area Column */}
        <div className={styles.sideColumn}>
          {/* Bidding Box */}
          <div className={`${styles.bidBox} glass-panel`}>
            <h2 className={styles.bidTitle}>
              <Gavel size={18} style={{ color: "var(--accent-color)" }} />
              Bidding Dashboard
            </h2>

            {errorMsg && <div className={styles.bidErrorAlert}>{errorMsg}</div>}

            {auctionStatus === "closed" ? (
              <div className={styles.guestMessage}>
                This auction is closed. Bidding has ended.
              </div>
            ) : auctionStatus === "upcoming" ? (
              <div className={styles.guestMessage}>
                This auction has not started yet. Please wait.
              </div>
            ) : isAdmin ? (
              <div className={styles.guestMessage}>
                Administrators are not permitted to place bids on auctions.
              </div>
            ) : isAuthenticated ? (
              <form onSubmit={handlePlaceBid} className={styles.bidInputGroup}>
                <label className={styles.metaLabel}>Your Offer Amount</label>
                <div className={styles.bidInputWrapper}>
                  <span className={styles.currencySign}>$</span>
                  <input
                    type="number"
                    step="0.01"
                    className={styles.bidInput}
                    value={bidInput}
                    onChange={(e) => setBidInput(e.target.value)}
                    placeholder={minRequiredBid.toFixed(2)}
                    required
                  />
                </div>
                <div className={styles.bidMinText}>
                  Minimum acceptable next bid: <strong>${minRequiredBid.toFixed(2)}</strong>
                </div>
                <button type="submit" className={styles.bidBtn}>
                  Submit Asynchronous Bid
                </button>
              </form>
            ) : (
              <div className={styles.guestMessage}>
                Please{" "}
                <Link href="/login" className={styles.guestLink}>
                  log in
                </Link>{" "}
                to participate in this live auction and place bids.
              </div>
            )}
          </div>

          {/* Bid History */}
          <div className={`${styles.historyBox} glass-panel`}>
            <h2 className={styles.historyTitle}>
              <History size={16} style={{ display: "inline", marginRight: "0.5rem", verticalAlign: "middle" }} />
              Live Bid History ({bids.length})
            </h2>

            <div className={styles.historyList}>
              {bids.length === 0 ? (
                <div style={{ color: "var(--text-secondary)", fontSize: "0.85rem", textAlign: "center" }}>
                  No bids have been submitted yet. Be the first to place a bid!
                </div>
              ) : (
                bids.map((bid) => (
                  <div key={bid.bid_id || Math.random()} className={styles.historyItem}>
                    <div>
                      <div className={styles.historyUser}>{bid.userName}</div>
                      <div className={styles.historyTime}>
                        {new Date(bid.bidTimestamp).toLocaleTimeString(undefined, {
                          hour: "2-digit",
                          minute: "2-digit",
                          second: "2-digit",
                        })}
                      </div>
                    </div>
                    <div className={styles.historyAmount}>${bid.bidAmount.toFixed(2)}</div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
