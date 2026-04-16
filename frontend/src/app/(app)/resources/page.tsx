"use client";

import { useEffect, useState } from "react";
import { getResources, deleteResource } from "@/lib/resources/api";
import { useRouter } from "next/navigation";

export default function ResourcePage() {
  const router = useRouter();

  const [resources, setResources] = useState<any[]>([]);
  const [user, setUser] = useState<any>(null);

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
      alert("Deleted 🗑️");
      loadResources();
    } catch (err: any) {
      alert(err.message);
    }
  };

  return (
    <div style={{ padding: "20px" }}>
      <h2>Resources</h2>

      {/* ✅ ADMIN ADD BUTTON */}
      {isAdmin && (
        <button
          onClick={() => router.push("/resources/add")}
          style={{ marginBottom: "15px" }}
        >
          ➕ Add Resource
        </button>
      )}

      {/* LIST */}
      {resources.length === 0 ? (
        <p>No resources found</p>
      ) : (
        resources.map((r: any) => (
          <div
            key={r.id}
            style={{
              border: "1px solid #ddd",
              padding: "15px",
              marginBottom: "12px",
              borderRadius: "8px",
            }}
          >
            <h3>{r.name} ({r.resourceCode})</h3>

            <p><b>Capacity:</b> {r.capacity}</p>
            <p>
              <b>Category:</b> {r.categoryName || "N/A"} |
              <b> Location:</b> {r.locationName || "N/A"}
            </p>

            {/* IMAGE */}
            {r.imageUrl && (
              <img
                src={r.imageUrl}
                alt={r.name}
                style={{
                  width: "120px",
                  height: "80px",
                  objectFit: "cover",
                  borderRadius: "6px",
                }}
                onError={(e) => {
                  (e.target as HTMLImageElement).src =
                    "https://via.placeholder.com/120";
                }}
              />
            )}

            <br />

            {/* ADMIN ACTIONS */}
            {isAdmin && (
              <>
                <button onClick={() => router.push(`/resources/edit/${r.id}`)}>
                  Edit ✏️
                </button>
                <button onClick={() => handleDelete(r.id)}>
                  Delete 🗑️
                </button>
              </>
            )}
          </div>
        ))
      )}
    </div>
  );
}