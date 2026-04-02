import { useEffect, useState } from "react";
import ResourceForm from "../components/ResourceForm";
import ResourceList from "../components/ResourceList";
import { getAllResources, createResource, deleteResource } from "../services/resourceService";
import type { Resource } from "../services/resourceService";

function ResourcePage() {
  const [resources, setResources] = useState<Resource[]>([]);
  const [editingResource, setEditingResource] = useState<Resource | null>(null);

  const loadResources = async () => {
    const data = await getAllResources();
    setResources(data);
  };

  useEffect(() => {
    loadResources();
  }, []);

  const handleAddOrUpdate = async (resource: Resource) => {
    await createResource(resource);
    await loadResources();
    setEditingResource(null);
  };

  const handleDelete = async (id: number) => {
    await deleteResource(id);
    await loadResources();
  };

  return (
    <div>
      <h1>Resources</h1>

      <ResourceForm
        onSubmit={handleAddOrUpdate}
        editingResource={editingResource}
        clearEdit={() => setEditingResource(null)}
      />

      <ResourceList
        resources={resources}
        onEdit={(r) => setEditingResource(r)}
        onDelete={handleDelete}
      />
    </div>
  );
}

export default ResourcePage;