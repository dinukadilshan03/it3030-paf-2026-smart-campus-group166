import { clientApiFetch } from "@/lib/api/client";

export const getResources = async (search?: string) => {
  try {
    const params = new URLSearchParams();
    if (search && search.trim() !== "") {
      params.set("search", search);
    }

    const query = params.toString();
    const res = await clientApiFetch(`/api/v1/resources${query ? `?${query}` : ""}`);

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

export const getCategories = async () => {
  try {
    const res = await clientApiFetch("/api/v1/resource-categories");
    return await res.json();
  } catch (err) {
    console.error(err);
    return [];
  }
};

export const getLocations = async () => {
  try {
    const res = await clientApiFetch("/api/v1/locations");
    return await res.json();
  } catch (err) {
    console.error(err);
    return [];
  }
};

export const createResource = async (data: unknown) => {
  const res = await clientApiFetch("/api/v1/resources", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(data),
  });

  if (!res.ok) throw new Error(await res.text());
  return res.json();
};

export const updateResource = async (id: number, data: unknown) => {
  const res = await clientApiFetch(`/api/v1/resources/${id}`, {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(data),
  });

  if (!res.ok) throw new Error(await res.text());
  return res.json();
};

export const deleteResource = async (id: number) => {
  const res = await clientApiFetch(`/api/v1/resources/${id}`, {
    method: "DELETE",
  });

  if (!res.ok) throw new Error(await res.text());
};
