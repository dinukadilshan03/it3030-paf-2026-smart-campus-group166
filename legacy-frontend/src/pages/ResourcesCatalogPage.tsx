import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
  getAllResources,
  deleteResource,
} from "../services/resourceService";
import "../FacilitiesCatalogue.css";

function ResourcesCatalogPage() {
  const [allResources, setAllResources] = useState<any[]>([]);
  const [resources, setResources] = useState<any[]>([]);
  const [search, setSearch] = useState("");

  // 🔄 Load data
  const load = async () => {
    try {
      const data = await getAllResources();
      setAllResources(data);
      setResources(data);
    } catch (err) {
      console.error("Failed to load resources:", err);
    }
  };

  useEffect(() => {
    load();
  }, []);

  // 🔍 Search filter
  useEffect(() => {
    const id = setTimeout(() => {
      const q = (search || "").toLowerCase().trim();

      if (!q) {
        setResources(allResources);
        return;
      }

      const tokens = q.split(/\s+/).filter(Boolean);

      const filtered = allResources.filter((r: any) => {
        const name = (r.name || "").toLowerCase();
        const type = (r.type || "").toLowerCase();
        const location = (r.location || "").toLowerCase();
        const description = (r.description || "").toLowerCase();
        const status = (r.status || "").toLowerCase();

        return tokens.some((token) =>
          name.includes(token) ||
          type.includes(token) ||
          location.includes(token) ||
          description.includes(token) ||
          status.includes(token)
        );
      });

      setResources(filtered);
    }, 200);

    return () => clearTimeout(id);
  }, [search, allResources]);

  // ❌ Delete
  const handleDelete = async (id: number) => {
    if (!window.confirm("Are you sure you want to delete this resource?")) return;
    try {
      await deleteResource(id);
      await load();
    } catch (err) {
      console.error("Failed to delete resource:", err);
    }
  };

  return (
    <div className="container">
      <h1 className="page-title">Available Resources</h1>

      {/* 🔝 TOP BAR */}
      <div className="top-bar">
        <input
          type="text"
          placeholder="Search by name, type, or location..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="search-input"
        />

        <div className="top-buttons">
          <Link to="/" className="secondary-button">
            Dashboard
          </Link>

          <Link to="/resources" className="primary-button">
            Add Resource
          </Link>
        </div>
      </div>

      {/* 🔥 CARDS */}
      {resources.length === 0 ? (
        <p className="empty-message">No matching resources found.</p>
      ) : (
        <div className="resource-grid">
          {resources.map((r: any) => (
            <div className="resource-card" key={r.id}>
              
              {/* Header */}
              <div className="card-header">
                <span className="badge">
                  {r.location || "Location"}
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

              {/* Footer */}
              <div className="card-footer">
                <div className="actions">
                  <Link
                    to={`/resources/edit/${r.id}`}
                    className="btn-edit"
                  >
                    ✏️ Edit
                  </Link>

                  <button
                    className="btn-delete"
                    onClick={() => handleDelete(r.id)}
                  >
                    🗑️ Delete
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default ResourcesCatalogPage;