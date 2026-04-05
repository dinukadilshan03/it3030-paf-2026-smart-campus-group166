const BASE_URL = 'http://localhost:8080/api/resources'; 

export interface Resource {
  id?: number;
  name: string;
  type: string;
  capacity: number;
  location: string;
  status: string;
  description: string;
}

export const getAllResources = async (): Promise<Resource[]> => {
  const response = await fetch(BASE_URL, {
    credentials: "include", 
  });

  if (!response.ok) {
    throw new Error('Failed to fetch resources');
  }

  return response.json();
};

export const createResource = async (resource: Resource): Promise<Resource> => {
  const response = await fetch(BASE_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    credentials: "include", // ✅ IMPORTANT
    body: JSON.stringify(resource),
  });

  if (!response.ok) {
    throw new Error('Failed to create resource');
  }

  return response.json();
};

export const updateResource = async (id: number, resource: Resource): Promise<Resource> => {
  const response = await fetch(`${BASE_URL}/${id}`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
    },
    credentials: "include",
    body: JSON.stringify(resource),
  });

  if (!response.ok) {
    throw new Error('Failed to update resource');
  }

  return response.json();
};

export const deleteResource = async (id: number): Promise<void> => {
  const response = await fetch(`${BASE_URL}/${id}`, {
    method: 'DELETE',
    credentials: "include", 
  });

  if (!response.ok) {
    throw new Error('Failed to delete resource');
  }
};

export const searchResources = async (query: string): Promise<Resource[]> => {
  const response = await fetch(`${BASE_URL}/search?type=${encodeURIComponent(query)}`, {
    credentials: "include", 
  });

  if (!response.ok) {
    throw new Error('Failed to search resources');
  }

  return response.json();
};