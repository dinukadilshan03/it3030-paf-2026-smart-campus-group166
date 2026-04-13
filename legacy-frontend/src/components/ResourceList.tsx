import type { Resource } from '../services/resourceService';

interface ResourceListProps {
  resources: Resource[];
  onEdit: (resource: Resource) => void;
  onDelete: (id: number) => Promise<void>;
  showActions?: boolean;
}

function ResourceList({ resources, onEdit, onDelete, showActions = false }: ResourceListProps) {
  return (
    <div className="list-card">
      <h2>Resource List</h2>

      {resources.length === 0 ? (
        <p>No resources found.</p>
      ) : (
        <table className="resource-table">
          <thead>
            <tr>
              <th>Name</th>
              <th>Type</th>
              <th>Capacity</th>
              <th>Location</th>
              <th>Status</th>
              <th>Description</th>
              {showActions ? <th>Actions</th> : null}
            </tr>
          </thead>

          <tbody>
            {resources.map((resource) => (
              <tr key={resource.id}>
                <td>{resource.name}</td>
                <td>{resource.type}</td>
                <td>{resource.capacity}</td>
                <td>{resource.location}</td>
                <td>{resource.status}</td>
                <td>{resource.description}</td>
                {showActions ? (
                  <td>
                    <button onClick={() => onEdit(resource)}>Edit</button>
                    <button
                      onClick={() => resource.id && onDelete(resource.id)}
                      style={{ marginLeft: '8px' }}
                    >
                      Delete
                    </button>
                  </td>
                ) : null}
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}

export default ResourceList;