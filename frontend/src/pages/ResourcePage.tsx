import { useEffect, useState } from "react";
import { Link } from 'react-router-dom';
import ResourceForm from "../components/ResourceForm";
import {
  getAllResources,
  createResource,
  updateResource,
  deleteResource,
} from "../services/resourceService";
import type { Resource } from "../services/resourceService";
import "../FacilitiesCatalogue.css";

function ResourcePage() {
  const [resources, setResources] = useState<any[]>([]);
  const [editingResource, setEditingResource] = useState<Resource | null>(null);

  // 🔄 Load resources
  const loadResources = async () => {
    try {
      const data = await getAllResources();
      console.log("DATA FROM BACKEND:", data); // 🔥 IMPORTANT
      setResources(data);
    } catch (error) {
      console.error("Error loading resources:", error);
    }
  };


  useEffect(() => {
    loadResources();
  }, []);


  // ✅ CREATE or UPDATE
  const handleAddOrUpdate = async (resource: Resource) => {
    try {
      if (!resource.name || resource.capacity <= 0) {
        alert("Please fill all required fields correctly!");
        return;
      }

      if (editingResource && editingResource.id) {
        await updateResource(editingResource.id, resource);
      } else {
        await createResource(resource);
      }

      await loadResources();
      setEditingResource(null);
    } catch (error) {
      console.error("Error saving resource:", error);
    }
  };

  // ❌ DELETE
  const handleDelete = async (id: number) => {
    if (!window.confirm("Are you sure you want to delete this resource?")) return;

    try {
      await deleteResource(id);
      await loadResources();
    } catch (error) {
      console.error("Error deleting resource:", error);
    }
  };

  

  return (
    <div className="container">
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
        <h1 className="page-title">Resource Management</h1>
        <Link className="secondary-button" to="/resources/catalog">
          Resource Catalog
        </Link>
      </div>

      

      {/* 🧾 FORM */}
      <div className="card">
        <ResourceForm
          onSubmit={handleAddOrUpdate}
          editingResource={editingResource}
          clearEdit={() => setEditingResource(null)}
        />
      </div>

    </div>
  );
}

export default ResourcePage;