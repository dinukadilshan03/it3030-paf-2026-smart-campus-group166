import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import ResourceForm from "../components/ResourceForm";

import {
  getAllResources,
  updateResource,
} from "../services/resourceService";
import type { Resource } from "../services/resourceService";
import "../FacilitiesCatalogue.css";

function EditResourcePage() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [resource, setResource] = useState<Resource | null>(null);
  const [loading, setLoading] = useState(true);

  // 🔄 Load selected resource
  useEffect(() => {
    const load = async () => {
      try {
        const data = await getAllResources();

        const found = data.find((r: any) => r.id === Number(id));

        setResource(found || null); // ✅ FIXED (no TypeScript error)
      } catch (err) {
        console.error("Failed to load resource:", err);
      } finally {
        setLoading(false);
      }
    };

    load();
  }, [id]);

  // ✏️ Update handler
  const handleUpdate = async (updated: Resource) => {
    if (!id) return;

    try {
      await updateResource(Number(id), updated);
      navigate("/resources/catalog"); // go back after update
    } catch (err) {
      console.error("Failed to update resource:", err);
    }
  };

  // ⏳ Loading state
  if (loading) {
    return (
      <div className="container">
        <h2>Loading...</h2>
      </div>
    );
  }

  // ❌ Not found state
  if (!resource) {
    return (
      <div className="container">
        <h2>Resource not found</h2>
        <button
          className="secondary-button"
          onClick={() => navigate("/resources/catalog")}
        >
          Back to Catalog
        </button>
      </div>
    );
  }

  // ✅ Main UI
  return (
    <div className="container">
      <h1 className="page-title">Edit Resource</h1>

      <div className="card">
        <ResourceForm
          onSubmit={handleUpdate}
          editingResource={resource}
          clearEdit={() => navigate("/resources/catalog")}
        />
      </div>
    </div>
  );
}

export default EditResourcePage;