"use client";

import { useEffect, useState } from "react";
import { getResources, deleteResource } from "@/lib/resources/api";
import { useRouter } from "next/navigation";

export default function ResourcePage() {
  const router = useRouter();

  const [resources, setResources] = useState<any[]>([]);
  const [user, setUser] = useState<any>(null);

  // ✅ ADDED SEARCH STATE
  const [search, setSearch] = useState("");
  const getDescription = (r: any) => {
  if (r.description) return r.description;

  return `${r.categoryName || "Resource"} in ${
    r.locationName || "Unknown Location"
  } with capacity ${r.capacity ?? "N/A"}`;
};
  const isAdmin = user?.role === "ADMIN";

  useEffect(() => {
    loadResources();

    fetch("http://localhost:8080/api/v1/auth/me", {
      credentials: "include",
    })
      .then((res) => res.json())
      .then((data) => setUser(data));
  }, []);

  const loadResources = async () => {
    const res = await getResources();
    setResources(res || []);
  };

  const handleDelete = async (id: number) => {
    if (!isAdmin) return alert("Only admin can delete ❌");

    if (!confirm("Delete this resource?")) return;

    try {
      await deleteResource(id);
      loadResources();
    } catch (err: any) {
      alert(err.message);
    }
  };

  // ✅ ADDED FILTER LOGIC
  const filteredResources = resources.filter((r: any) => {
    const text = search.toLowerCase();

    return (
      r.name?.toLowerCase().includes(text) ||
      r.resourceCode?.toLowerCase().includes(text) ||
      r.categoryName?.toLowerCase().includes(text) ||
      r.locationName?.toLowerCase().includes(text)
    );
  });

  return (
    <div style={styles.container}>
      {/* HEADER */}
      <div style={styles.header}>
        <h2 style={styles.title}>📦 Resources</h2>

        {isAdmin && (
          <button
            onClick={() => router.push("/resources/add")}
            style={styles.addBtn}
          >
            ➕ Add Resource
          </button>
        )}
      </div>

      {/* ✅ ADDED SEARCH BAR */}
      <input
        type="text"
        placeholder="🔍 Search..."
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        style={styles.search}
      />

      {/* LIST */}
      {filteredResources.length === 0 ? (
        <p style={{ marginTop: "20px" }}>No resources found</p>
      ) : (
        <div style={styles.grid}>
          {filteredResources.map((r: any) => {
            const localImg = localStorage.getItem(
              "resource_image_" + r.id
            );

            const imageSrc =
              localImg ||
              r.imageUrl ||
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
                  <p><b>Status:</b> {r.status}</p>
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

  // ✅ ADDED SEARCH STYLE
  search: {
    width: "100%",
    padding: "10px",
    borderRadius: "8px",
    border: "1px solid #ccc",
    marginBottom: "15px",
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