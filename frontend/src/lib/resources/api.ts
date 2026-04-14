const BASE_URL = "http://localhost:8080/api/v1";

// ✅ GET RESOURCES
export const getResources = async (search?: string) => {
  let url = `${BASE_URL}/resources`;

  if (search && search.trim() !== "") {
    url += `?search=${search}`;
  }

  const res = await fetch(url, {
    credentials: "include",
  });

  if (!res.ok) {
    console.error("GET ERROR:", await res.text());
    return [];
  }

  return res.json();
};

// ✅ CREATE RESOURCE
export const createResource = async (data: any) => {
  const res = await fetch(`${BASE_URL}/resources`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    credentials: "include",
    body: JSON.stringify(data),
  });

  if (!res.ok) throw new Error(await res.text());
  return res.json();
};

// ✅ GET CATEGORIES
export const getCategories = async () => {
  const res = await fetch(`${BASE_URL}/resource-categories`, {
    credentials: "include",
  });

  if (!res.ok) return [];
  return res.json();
};

// ✅ GET LOCATIONS
export const getLocations = async () => {
  const res = await fetch(`${BASE_URL}/locations`, {
    credentials: "include",
  });

  if (!res.ok) return [];
  return res.json();
};