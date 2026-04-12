import React, { useEffect, useState, type FormEvent } from 'react';
import type { Resource } from '../services/resourceService';

interface ResourceFormProps {
  onSubmit: (resource: Resource) => Promise<void>;
  editingResource: Resource | null;
  clearEdit: () => void;
}

const emptyForm: Resource = {
  name: '',
  type: '',
  capacity: 0,
  location: '',
  status: '',
  description: '',
};

function ResourceForm({ onSubmit, editingResource, clearEdit }: ResourceFormProps) {
  const [formData, setFormData] = useState<Resource>(editingResource || emptyForm);

    useEffect(() => {
    if (editingResource) {
      setFormData(editingResource);
    } else {
      setFormData(emptyForm);
    }
  }, [editingResource]);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: name === 'capacity' ? Number(value) : value,
    }));
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    await onSubmit(formData);
    setFormData(emptyForm);
  };

  return (
    <div className="form-card">
      <h2>{editingResource ? 'Edit Resource' : 'Add Resource'}</h2>

      <form onSubmit={handleSubmit} className="resource-form">
        <input
          type="text"
          name="name"
          placeholder="Resource Name"
          value={formData.name}
          onChange={handleChange}
          required
        />

        <input
          type="text"
          name="type"
          placeholder="Type"
          value={formData.type}
          onChange={handleChange}
          required
        />

        <input
          type="number"
          name="capacity"
          placeholder="Capacity"
          value={formData.capacity}
          onChange={handleChange}
          required
        />

        <input
          type="text"
          name="location"
          placeholder="Location"
          value={formData.location}
          onChange={handleChange}
          required
        />

        <input
          type="text"
          name="status"
          placeholder="Status"
          value={formData.status}
          onChange={handleChange}
          required
        />

        <textarea
          name="description"
          placeholder="Description"
          value={formData.description}
          onChange={handleChange}
        />

        <div className="form-buttons">
          <button type="submit">
            {editingResource ? 'Update Resource' : 'Add Resource'}
          </button>

          {editingResource && (
            <button type="button" onClick={clearEdit}>
              Cancel
            </button>
          )}
        </div>
      </form>
    </div>
  );
}

export default ResourceForm;