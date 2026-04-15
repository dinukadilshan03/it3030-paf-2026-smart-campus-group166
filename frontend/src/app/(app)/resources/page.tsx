"use client";

import { useEffect, useState } from "react";
import {
  getResources,
  createResource,
  updateResource,
  deleteResource,
  getCategories,
  getLocations,
} from "@/lib/resources/api";

export default function ResourcePage() {
  const [resources, setResources] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [locations, setLocations] = useState<any[]>([]);
  const [editingId, setEditingId] = useState<number | null>(null);

  const [form, setForm] = useState({
    name: "",
    resourceCode: "",
    capacity: "",
    categoryId: "",
    locationId: "",
  });

  // ✅ LOAD DATA
  useEffect(() => {
    loadAll();
  }, []);

  const loadAll = async () => {
    const [res, cat, loc] = await Promise.all([
      getResources(),
      getCategories(),
      getLocations(),
    ]);

    setResources(res || []);
    setCategories(cat || []);
    setLocations(loc || []);
  };

  // ✅ INPUT CHANGE
  const handleChange = (e: any) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  // ✅ EDIT CLICK
  const handleEdit = (r: any) => {
    setForm({
      name: r.name,
      resourceCode: r.resourceCode,
      capacity: r.capacity,
      categoryId: r.category?.id || r.resourceCategory?.id,
      locationId: r.location?.id,
    });

    setEditingId(r.id);
  };

  // ✅ SAVE (ADD + UPDATE)
  const handleSave = async () => {
    if (!form.name || !form.resourceCode) {
      alert("Name & Code required ❌");
      return;
    }

    const payload = {
      name: form.name,
      resourceCode: form.resourceCode,
      capacity: form.capacity ? Number(form.capacity) : null,
      status: "ACTIVE",
      requiresApproval: true,
      resourceCategoryId: Number(form.categoryId),
      locationId: Number(form.locationId),
    };

    try {
      if (editingId) {
        await updateResource(editingId, payload);
        alert("Updated ✏️");
      } else {
        await createResource(payload);
        alert("Added ✅");
      }

      setForm({
        name: "",
        resourceCode: "",
        capacity: "",
        categoryId: "",
        locationId: "",
      });

      setEditingId(null);
      loadAll();
    } catch (err: any) {
      alert(err.message);
    }
  };

  // ✅ DELETE
  const handleDelete = async (id: number) => {
    if (!confirm("Delete this resource?")) return;

    try {
      await deleteResource(id);
      alert("Deleted 🗑️");
      loadAll();
    } catch (err: any) {
      alert(err.message);
    }
  };

  return (
    <div style={{ padding: "20px" }}>
      <h2>Resources</h2>

      {/* 🔥 FORM */}
      <div style={{ display: "flex", gap: "10px", marginBottom: "20px" }}>
        <input
          name="name"
          placeholder="Name"
          value={form.name}
          onChange={handleChange}
        />

        <input
          name="resourceCode"
          placeholder="Code"
          value={form.resourceCode}
          onChange={handleChange}
        />

        <input
          name="capacity"
          placeholder="Capacity"
          type="number"
          value={form.capacity}
          onChange={handleChange}
        />

        <select
          name="categoryId"
          value={form.categoryId}
          onChange={handleChange}
        >
          <option value="">Category</option>
          {categories.map((c: any) => (
            <option key={c.id} value={c.id}>
              {c.name}
            </option>
          ))}
        </select>

        <select
          name="locationId"
          value={form.locationId}
          onChange={handleChange}
        >
          <option value="">Location</option>
          {locations.map((l: any) => (
            <option key={l.id} value={l.id}>
              {l.name}
            </option>
          ))}
        </select>

        <button onClick={handleSave}>
          {editingId ? "Update" : "Add"}
        </button>
      </div>

      {/* 🔥 LIST */}
      {resources.length === 0 ? (
        <p>No resources found</p>
      ) : (
        <div>
          {resources.map((r: any) => (
            <div
              key={r.id}
              style={{
                border: "1px solid #ddd",
                padding: "10px",
                marginBottom: "10px",
                borderRadius: "8px",
              }}
            >
              <h3>
                {r.name} ({r.resourceCode})
              </h3>

              <p>Capacity: {r.capacity}</p>

              <p>
                Category: {r.categoryName || "N/A"} |
Location: {r.locationName || "N/A"}
              </p>

              <button onClick={() => handleEdit(r)}>Edit ✏️</button>
              <button onClick={() => handleDelete(r.id)}>Delete 🗑️</button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}