"use client";

import { useEffect, useState } from "react";
import AIChat from "./AIChat";
import { getResources, deleteResource, resolveResourceImageUrl } from "@/lib/resources/api";
import FormMessages from "../../components/ui/FormMessages";
import { useRouter } from "next/navigation";
import { clientApiFetch } from "@/lib/api/client";

export default function ResourcePage() {
  const router = useRouter();

  const [resources, setResources] = useState<any[]>([]);
  const [user, setUser] = useState<any>(null);
  const [errors, setErrors] = useState<string[]>([]);
  const [success, setSuccess] = useState<string | null>(null);
  const [selectedCategory, setSelectedCategory] = useState("");
const [selectedLocation, setSelectedLocation] = useState("");

  // ✅ ADDED SEARCH STATE
  const [search, setSearch] = useState("");
  // AI recommendation state
  const [aiQuery, setAiQuery] = useState("");
  const [aiLoading, setAiLoading] = useState(false);
  const [aiSuggestions, setAiSuggestions] = useState<any[]>([]);
  const getDescription = (r: any) => {
  if (r.description) return r.description;

  return `${r.categoryName || "Resource"} in ${
    r.locationName || "Unknown Location"
  } with capacity ${r.capacity ?? "N/A"}`;
};
  const isAdmin = user?.role === "ADMIN";

  useEffect(() => {
    loadResources();

    clientApiFetch("/api/v1/auth/me")
      .then((res) => res.json())
      .then((data) => setUser(data));
  }, []);

  const loadResources = async () => {
    const res = await getResources();
    setResources(res || []);
  };

  const handleDelete = async (id: number) => {
    setErrors([]);
    setSuccess(null);
    if (!isAdmin) {
      setErrors(["Only admin can delete ❌"]);
      return;
    }

    if (!confirm("Delete this resource?")) return;

    try {
      await deleteResource(id);
      setSuccess('Deleted');
      setTimeout(() => setSuccess(null), 2000);
      loadResources();
    } catch (err: any) {
      setErrors([err.message || 'Delete failed']);
    }
  };


   const sortedResources = [...resources].sort(
  (a, b) => a.id - b.id
);
  // ✅ ADDED FILTER LOGIC
  const filteredResources = sortedResources.filter((r: any) => {
  const text = search.toLowerCase();

  const matchesSearch =
    r.name?.toLowerCase().includes(text) ||
    r.resourceCode?.toLowerCase().includes(text) ||
    r.categoryName?.toLowerCase().includes(text) ||
    r.locationName?.toLowerCase().includes(text);

  const matchesCategory =
    selectedCategory === "" || r.categoryName === selectedCategory;

  const matchesLocation =
    selectedLocation === "" || r.locationName === selectedLocation;

  return matchesSearch && matchesCategory && matchesLocation;
});

  return (
    <div style={styles.container}>
      {/* HEADER - match ticketing style */}
      <div style={styles.headerCard}>
        <div>
          <div style={styles.headerLabel}>RESOURCES BROWSER</div>
          <h1 style={styles.headerTitle}> Resources</h1>
          <p style={styles.headerDesc}>
            Browse and manage campus rooms, labs, and equipment. Use filters or
            the AI recommender to find suitable spaces quickly.
          </p>
        </div>

        <div style={styles.headerActions}>
          {isAdmin && (
            <button
              onClick={() => router.push("/resources/add")}
              style={styles.addBtn}
            >
              ➕ Add Resource
            </button>
          )}
        </div>
      </div>

      {/* ✅ ADDED SEARCH BAR */}
      <FormMessages errors={errors} success={success} onClose={() => { setErrors([]); setSuccess(null); }} />
      <input
        type="text"
        placeholder="🔍 Search..."
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        style={styles.search}
      />

      {/* AI Chat Component */}
      <div style={styles.aiBox}>
        <div style={styles.aiHeader}>
          <div style={styles.aiTitle}>🤖 AI Recommender</div>
          <div style={styles.aiSub}>Get quick resource suggestions — type a request and press Send</div>
        </div>
        <div style={styles.aiContent}>
          <AIChat
            isAdmin={isAdmin}
            onUse={(name: string) => {
              setSearch(name);
              window.scrollTo({ top: 400, behavior: "smooth" });
            }}
          />
        </div>
      </div>
      <div style={styles.filterRow}>
        <div style={styles.filterLeft}>
          {/* CATEGORY FILTER */}
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            style={styles.filter}
          >
            <option value="">All Categories</option>
            {[...new Set(resources.map((r: any) => r.categoryName))].map(
              (cat, i) => (
                <option key={i} value={cat}>{cat}</option>
              )
            )}
          </select>

          {/* LOCATION FILTER */}
          <select
            value={selectedLocation}
            onChange={(e) => setSelectedLocation(e.target.value)}
            style={styles.filter}
          >
            <option value="">All Locations</option>
            {[...new Set(resources.map((r: any) => r.locationName))].map(
              (loc, i) => (
                <option key={i} value={loc}>{loc}</option>
              )
            )}
          </select>
        </div>

        <div style={styles.filterRight}>
          <button
            style={styles.analysisBtn}
            onClick={() => router.push("/resources/analysis")}
          >
            Resource Analysis
          </button>
        </div>
      </div>

      {/* LIST */}
      {filteredResources.length === 0 ? (
        <p style={{ marginTop: "20px" }}>No resources found</p>
      ) : (
        <div style={styles.grid}>
          {filteredResources.map((r: any) => {
            const imageSrc =
              resolveResourceImageUrl(r.imageUrl) ||
              "https://via.placeholder.com/300x200";

            return (
              <div key={r.id} style={styles.card}>
                {/* IMAGE */}
                <img
                  src={imageSrc}
                  alt={r.name}
                  style={styles.image}
                />

                <div style={styles.cardContent}>
                  <h3 style={styles.name}>
                    {r.name} ({r.resourceCode})
                  </h3>

                  <p><b>ID:</b> {r.id}</p>
                  <p><b>Capacity:</b> {r.capacity ?? "N/A"}</p>
                  <p>
                    <b>Category:</b> {r.categoryName || "N/A"}
                  </p>
                  <p>
                    <b>Location:</b> {r.locationName || "N/A"}
                  </p>
                  <p>
  <b>Description:</b> {getDescription(r)}
</p>
                  <p>
                    <b>Status:</b>{" "}
                    {(() => {
                      const badgeStyle =
                        r.status === "ACTIVE"
                          ? styles.statusActive
                          : r.status === "OUT_OF_SERVICE"
                          ? styles.statusOut
                          : styles.statusUnknown;
                      const raw = r.status || "UNKNOWN";
                      const display = raw
                        .toString()
                        .replace(/[_-]+/g, " ")
                        .toLowerCase()
                        .replace(/(^|\s)\w/g, (c: string) => c.toUpperCase());
                      return <span style={badgeStyle}>{display}</span>;
                    })()}
                  </p>
                  <p>
                    <b>Approval:</b>{" "}
                    {r.requiresApproval ? "Yes" : "No"}
                  </p>

                  {/* ACTIONS */}
                  {isAdmin && (
                    <div style={styles.actions}>
                      <button
                        onClick={() =>
                          router.push(`/resources/edit/${r.id}`)
                        }
                        style={styles.editBtn}
                      >
                        ✏️ Edit
                      </button>

                      <button
                        onClick={() => handleDelete(r.id)}
                        style={styles.deleteBtn}
                      >
                        🗑️ Delete
                      </button>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

/* 🎨 STYLES */
const styles: any = {
  container: {
    padding: "30px",
  },
  header: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: "20px",
  },
  title: {
    fontSize: "22px",
    fontWeight: "600",
  },
  addBtn: {
    background: "#2563eb",
    color: "#fff",
    padding: "10px 18px",
    borderRadius: "8px",
    border: "none",
    cursor: "pointer",
    fontWeight: "500",
  },

  headerCard: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "flex-start",
    gap: 20,
    padding: "22px",
    background: "#fff",
    borderRadius: 12,
    boxShadow: "0 6px 20px rgba(15,23,42,0.04)",
    marginBottom: 18,
  },
  headerLabel: {
    fontSize: 12,
    letterSpacing: 2,
    color: "#6b7280",
    fontWeight: 700,
    marginBottom: 8,
  },
  headerTitle: {
    margin: 0,
    fontSize: 28,
    fontWeight: 700,
    color: "#0f172a",
  },
  headerDesc: {
    marginTop: 8,
    color: "#6b7280",
    maxWidth: 680,
  },
  headerActions: {
    display: "flex",
    alignItems: "center",
    gap: 12,
  },

  // ✅ ADDED SEARCH STYLE
  search: {
    width: "100%",
    padding: "10px",
    borderRadius: "8px",
    border: "1px solid #ccc",
    marginBottom: "15px",
  },

  /* AI box styles */
  aiBox: {
    borderRadius: 12,
    border: "1px solid #e6e9ee",
    padding: 12,
    marginBottom: 16,
    background: "#ffffff",
    boxShadow: "0 6px 18px rgba(15,23,42,0.04)",
  },
  aiHeader: {
    display: "flex",
    flexDirection: "column",
    gap: 4,
    marginBottom: 10,
  },
  aiTitle: {
    fontWeight: 600,
  },
  aiSub: {
    fontSize: 13,
    color: "#6b7280",
  },
  aiContent: {
    display: "block",
  },

  filterRow: {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
  gap: "10px",
  marginBottom: "15px",
},

  filterLeft: {
    display: "flex",
    gap: "10px",
    alignItems: "center",
  },

  filterRight: {
    display: "flex",
    gap: "10px",
    alignItems: "center",
  },

  analysisBtn: {
    background: "#7c3aed",
    color: "#fff",
    padding: "10px 14px",
    borderRadius: 8,
    border: "none",
    cursor: "pointer",
    fontWeight: 600,
  },

filter: {
  padding: "10px",
  borderRadius: "8px",
  border: "1px solid #ccc",
},
  grid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))",
    gap: "20px",
  },
  card: {
    background: "#fff",
    borderRadius: "12px",
    overflow: "hidden",
    boxShadow: "0 4px 15px rgba(0,0,0,0.08)",
  },
    statusActive: {
      display: "inline-block",
      background: "#ecfdf5",
      color: "#065f46",
      padding: "4px 8px",
      borderRadius: 8,
      fontWeight: 600,
      fontSize: 13,
    },

    statusOut: {
      display: "inline-block",
      background: "#fff1f2",
      color: "#991b1b",
      padding: "4px 8px",
      borderRadius: 8,
      fontWeight: 600,
      fontSize: 13,
    },

    statusUnknown: {
      display: "inline-block",
      background: "#f3f4f6",
      color: "#374151",
      padding: "4px 8px",
      borderRadius: 8,
      fontWeight: 600,
      fontSize: 13,
    },
  image: {
    width: "100%",
    height: "180px",
    objectFit: "cover",
  },
  cardContent: {
    padding: "15px",
  },
  name: {
    marginBottom: "10px",
  },
  actions: {
    marginTop: "10px",
    display: "flex",
    gap: "10px",
  },
  editBtn: {
    background: "#f59e0b",
    border: "none",
    padding: "8px 12px",
    borderRadius: "6px",
    cursor: "pointer",
  },
  deleteBtn: {
    background: "#ef4444",
    color: "#fff",
    border: "none",
    padding: "8px 12px",
    borderRadius: "6px",
    cursor: "pointer",
  },
};
