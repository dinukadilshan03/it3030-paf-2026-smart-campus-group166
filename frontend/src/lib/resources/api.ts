const BASE_URL = "http://localhost:8080/api/v1";

// ✅ GET RESOURCES
export const getResources = async (search?: string) => {
  try {
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

    return await res.json();
  } catch (err) {
    console.error("FETCH ERROR:", err);
    return [];
  }
};

// ✅ GET CATEGORIES
export const getCategories = async () => {
  try {
    const res = await fetch(`${BASE_URL}/resource-categories`, {
      credentials: "include",
    });
    return await res.json();
  } catch (err) {
    console.error(err);
    return [];
  }
};

// ✅ GET LOCATIONS
export const getLocations = async () => {
  try {
    const res = await fetch(`${BASE_URL}/locations`, {
      credentials: "include",
    });
    return await res.json();
  } catch (err) {
    console.error(err);
    return [];
  }
};

// ✅ CREATE
export const createResource = async (data: any) => {
  const res = await fetch(`${BASE_URL}/resources`, {
    method: "POST",
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(data),
  });

  if (!res.ok) throw new Error(await res.text());
  return res.json();
};

// ✅ UPDATE
export const updateResource = async (id: number, data: any) => {
  const res = await fetch(`${BASE_URL}/resources/${id}`, {
    method: "PATCH",
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(data),
  });

  if (!res.ok) throw new Error(await res.text());
  return res.json();
};

// ✅ DELETE
export const deleteResource = async (id: number) => {
  const res = await fetch(`${BASE_URL}/resources/${id}`, {
    method: "DELETE",
    credentials: "include",
  });

  if (!res.ok) throw new Error(await res.text());
};