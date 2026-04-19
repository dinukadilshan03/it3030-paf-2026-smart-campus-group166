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
      const text = await res.text().catch(() => '');
      if (res.status === 401) {
        console.warn('GET resources: authentication required');
        return [];
      }
      console.warn("GET ERROR:", text);
      return [];
    }

    return await res.json();
  } catch (err) {
    console.warn("FETCH ERROR:", err);
    return [];
  }
};

export const getCategories = async () => {
  try {
    const res = await clientApiFetch("/api/v1/resource-categories");
    if (!res.ok) {
      const text = await res.text().catch(() => '');
      console.warn('GET categories error:', res.status, text);
      return [];
    }
    return await res.json();
  } catch (err) {
    console.error(err);
    return [];
  }
};

export const getLocations = async () => {
  try {
    const res = await clientApiFetch("/api/v1/locations");
    if (!res.ok) {
      const text = await res.text().catch(() => '');
      console.warn('GET locations error:', res.status, text);
      return [];
    }
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

export const createResourceCategory = async (data: unknown) => {
  const res = await clientApiFetch("/api/v1/resource-categories", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });

  if (!res.ok) throw new Error(await res.text());
  return res.json();
};

export const createLocation = async (data: unknown) => {
  const res = await clientApiFetch("/api/v1/locations", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });

  if (!res.ok) throw new Error(await res.text());
  return res.json();
};
