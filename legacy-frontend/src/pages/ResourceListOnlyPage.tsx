import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { getAllResources } from "../services/resourceService";
import type { Resource } from "../services/resourceService";
import "../FacilitiesCatalogue.css";

export default function ResourceListOnlyPage() {
  const [resources, setResources] = useState<Resource[]>([]);
  const [search, setSearch] = useState("");

  const load = async () => {
    try {
      const data = await getAllResources();
      setResources(data);
    } catch (err) {
      console.error("Failed to load resources:", err);
    }
  };

  useEffect(() => {
    load();
  }, []);

  // 🔍 Search filter
  const filteredResources = resources.filter((r: any) => {
    const q = search.toLowerCase();
    return (
      r.name?.toLowerCase().includes(q) ||
      r.type?.toLowerCase().includes(q) ||
      r.location?.toLowerCase().includes(q) ||
      r.description?.toLowerCase().includes(q) ||
      r.status?.toLowerCase().includes(q)
    );
  });

  return (
    <div className="container">
      <h1 className="page-title">Available Resources</h1>

      {/* 🔝 TOP BAR */}
      <div className="top-bar">
        <div className="left">
          <input
            type="text"
            placeholder="Search resources..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        <div className="right">
          <Link to="/" className="secondary-button">
            Dashboard
          </Link>

        </div>
      </div>

      {/* 🔥 CARD GRID */}
      {filteredResources.length === 0 ? (
        <p className="empty-message">No matching resources found.</p>
      ) : (
        <div className="resource-grid">
          {filteredResources.map((r: any) => (
            <div className="resource-card" key={r.id}>
              
              {/* Header */}
              <div className="card-header">
                <span className="badge">
                  {r.status || "ACTIVE"}
                </span>
              </div>

              {/* Body */}
              <div className="card-body">
                <h3>{r.name}</h3>

                <p><strong>Type:</strong> {r.type}</p>
                <p><strong>Location:</strong> {r.location}</p>
                <p><strong>Capacity:</strong> {r.capacity} people</p>
                <p className="desc">{r.description}</p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}