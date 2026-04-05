import { useEffect, useState } from "react";
import ResourceForm from "../components/ResourceForm";
import ResourceList from "../components/ResourceList";
import {
  getAllResources,
  createResource,
  updateResource,
  deleteResource,
} from "../services/resourceService";
import type { Resource } from "../services/resourceService";
import "../FacilitiesCatalogue.css";

function ResourcePage() {
  const [resources, setResources] = useState<Resource[]>([]);
  const [editingResource, setEditingResource] = useState<Resource | null>(null);

  // 🔄 Load all resources
  const loadResources = async () => {
    try {
      const data = await getAllResources();
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
      if (editingResource && editingResource.id) {
        // ✏️ UPDATE
        await updateResource(editingResource.id, resource);
      } else {
        // ➕ CREATE
        await createResource(resource);
      }

      await loadResources();
      setEditingResource(null); // reset form
    } catch (error) {
      console.error("Error saving resource:", error);
    }
  };

  // ❌ DELETE
  const handleDelete = async (id: number) => {
    try {
      await deleteResource(id);
      await loadResources();
    } catch (error) {
      console.error("Error deleting resource:", error);
    }
  };

  return (
    <div className="container">
      <h1>Resources</h1>

      {/* FORM */}
      <ResourceForm
        onSubmit={handleAddOrUpdate}
        editingResource={editingResource}
        clearEdit={() => setEditingResource(null)}
      />

      {/* LIST */}
      <ResourceList
        resources={resources}
        onEdit={(resource) => setEditingResource(resource)}
        onDelete={handleDelete}
      />
    </div>
  );
}

export default ResourcePage;