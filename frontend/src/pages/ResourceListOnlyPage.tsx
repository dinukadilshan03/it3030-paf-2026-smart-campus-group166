import { useEffect, useState } from 'react';
import ResourceList from '../components/ResourceList';
import { getAllResources } from '../services/resourceService';
import type { Resource } from '../services/resourceService';
import '../FacilitiesCatalogue.css';

export default function ResourceListOnlyPage() {
  const [resources, setResources] = useState<Resource[]>([]);

  const load = async () => {
    try {
      const data = await getAllResources();
      setResources(data);
    } catch (err) {
      console.error('Failed to load resources:', err);
    }
  };

  useEffect(() => {
    load();
  }, []);

  return (
    <div className="container">
      <h1 className="page-title">Resource List</h1>
      <div className="card">
        <ResourceList
          resources={resources}
          onEdit={() => {}}
          onDelete={async () => {}}
          showActions={false}
        />
      </div>
    </div>
  );
}
