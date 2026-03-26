import { useEffect, useState } from 'react';
import './FacilitiesCatalogue.css';
import ResourceForm from './components/ResourceForm';
import ResourceList from './components/ResourceList';
import {
  createResource,
  deleteResource,
  getAllResources,
  searchResources,
  updateResource,
  type Resource,
} from './services/resourceService';

function App() {
  const [resources, setResources] = useState<Resource[]>([]);
  const [editingResource, setEditingResource] = useState<Resource | null>(null);
  const [searchText, setSearchText] = useState('');

  const loadResources = async () => {
    try {
      const data = await getAllResources();
      setResources(data);
    } catch (error) {
      console.error('Error loading resources:', error);
    }
  };

  useEffect(() => {
    loadResources();
  }, []);

  const handleSubmit = async (resource: Resource) => {
    try {
      if (editingResource?.id) {
        await updateResource(editingResource.id, resource);
        setEditingResource(null);
      } else {
        await createResource(resource);
      }
      await loadResources();
    } catch (error) {
      console.error('Error saving resource:', error);
    }
  };

  const handleDelete = async (id: number) => {
    try {
      await deleteResource(id);
      await loadResources();
    } catch (error) {
      console.error('Error deleting resource:', error);
    }
  };

  const handleEdit = (resource: Resource) => {
    setEditingResource(resource);
  };

  const handleSearch = async () => {
    try {
      if (!searchText.trim()) {
        await loadResources();
        return;
      }
      const data = await searchResources(searchText);
      setResources(data);
    } catch (error) {
      console.error('Error searching resources:', error);
    }
  };

  const clearEdit = () => {
    setEditingResource(null);
  };

  return (
    <div className="app-container">
      <h1>Facilities & Assets Catalogue</h1>

      <div className="search-bar">
        <input
          type="text"
          placeholder="Search by type"
          value={searchText}
          onChange={(e) => setSearchText(e.target.value)}
        />
        <button onClick={handleSearch}>Search</button>
        <button onClick={loadResources}>Reset</button>
      </div>

      <ResourceForm
        onSubmit={handleSubmit}
        editingResource={editingResource}
        clearEdit={clearEdit}
      />

      <ResourceList
        resources={resources}
        onEdit={handleEdit}
        onDelete={handleDelete}
      />
    </div>
  );
}

export default App;