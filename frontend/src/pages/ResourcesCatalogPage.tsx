import { useEffect, useState } from "react";
import { Link } from 'react-router-dom';
import ResourceList from "../components/ResourceList";
import ResourceForm from "../components/ResourceForm";
import {
  getAllResources,
  createResource,
  updateResource,
  deleteResource,
} from "../services/resourceService";
import type { Resource } from "../services/resourceService";
import "../FacilitiesCatalogue.css";

function ResourcesCatalogPage() {
  const [allResources, setAllResources] = useState<any[]>([]);
  const [resources, setResources] = useState<any[]>([]);
  const [search, setSearch] = useState("");

  const load = async () => {
    try {
      const data = await getAllResources();
      setAllResources(data);
      setResources(data);
    } catch (err) {
      console.error("Failed to load resources:", err);
    }
  };

  const [editingResource, setEditingResource] = useState<Resource | null>(null);

  const handleAddOrUpdate = async (resource: Resource) => {
    try {
      if (editingResource && editingResource.id) {
        await updateResource(editingResource.id, resource);
      } else {
        await createResource(resource);
      }

      setEditingResource(null);
      await load();
    } catch (err) {
      console.error('Failed to save resource:', err);
    }
  };

  const handleDelete = async (id: number) => {
    if (!window.confirm('Are you sure you want to delete this resource?')) return;
    try {
      await deleteResource(id);
      await load();
    } catch (err) {
      console.error('Failed to delete resource:', err);
    }
  };

  useEffect(() => {
    load();
  }, []);

  useEffect(() => {
    const id = setTimeout(() => {
      const q = (search || "").toLowerCase().trim();
      if (!q) {
        setResources(allResources);
        return;
      }

      const tokens = q.split(/\s+/).filter((t) => t.length > 0);

      const filtered = (allResources || []).filter((r: any) => {
        const name = (r.name || r.resourceName || "").toLowerCase();
        const type = (r.type || r.resourceType || "").toLowerCase();
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

  return (
    <div className="container">
      <h1 className="page-title">Resources Catalog</h1>

      <div style={{ marginBottom: "20px", display: 'flex', gap: '12px', alignItems: 'center' }}>
        <input
          type="text"
          placeholder="Search resources (any word)..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          style={{ padding: "10px", width: "360px", borderRadius: "8px", border: "1px solid #ccc" }}
        />
        <Link to="/resources" className="secondary-button">
          Add Resource
        </Link>
      </div>

      {/* Edit form appears only when editing a resource; no direct "Add" in catalog */}
      {editingResource ? (
        <div className="card">
          <ResourceForm
            onSubmit={handleAddOrUpdate}
            editingResource={editingResource}
            clearEdit={() => setEditingResource(null)}
          />
        </div>
      ) : null}

      <div className="card">
        {resources.length === 0 ? (
          <p style={{ padding: "10px" }}>No matching resources found.</p>
        ) : (
          <ResourceList
            resources={resources}
            onEdit={(r) => setEditingResource(r)}
            onDelete={handleDelete}
            showActions={true}
          />
        )}
      </div>
    </div>
  );
}

export default ResourcesCatalogPage;
