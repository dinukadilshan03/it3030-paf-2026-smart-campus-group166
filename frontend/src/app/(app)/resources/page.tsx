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
  const [user, setUser] = useState<any>(null);

  const [form, setForm] = useState({
    name: "",
    resourceCode: "",
    description: "",
    capacity: "",
    categoryId: "",
    locationId: "",
    notes: "",
    imageUrl: "",
  });

  // ✅ FIXED: ROLE BASED
  const isAdmin = user?.role === "ADMIN";

  useEffect(() => {
    loadAll();

    fetch("http://localhost:8080/api/v1/auth/me", {
      credentials: "include",
    })
      .then((res) => res.json())
      .then((data) => {
        console.log("USER:", data); // debug
        setUser(data);
      });
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

  const handleChange = (e: any) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleEdit = (r: any) => {
    if (!isAdmin) return alert("Access denied ❌");

    setForm({
      name: r.name,
      resourceCode: r.resourceCode,
      description: r.description || "",
      capacity: r.capacity || "",
      categoryId: r.categoryId,
      locationId: r.locationId,
      notes: r.notes || "",
      imageUrl: r.imageUrl || "",
    });

    setEditingId(r.id);
  };

  const handleSave = async () => {
    if (!isAdmin) return alert("Only admin can perform this action ❌");

    if (!form.name || !form.resourceCode) {
      return alert("Name & Code required ❌");
    }

    const payload = {
      name: form.name,
      resourceCode: form.resourceCode,
      description: form.description,
      capacity: form.capacity ? Number(form.capacity) : null,
      status: "ACTIVE",
      requiresApproval: true,
      resourceCategoryId: Number(form.categoryId),
      locationId: Number(form.locationId),
      notes: form.notes,
      imageUrl: form.imageUrl,
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
        description: "",
        capacity: "",
        categoryId: "",
        locationId: "",
        notes: "",
        imageUrl: "",
      });

      setEditingId(null);
      loadAll();
    } catch (err: any) {
      alert(err.message);
    }
  };

  const handleDelete = async (id: number) => {
    if (!isAdmin) return alert("Only admin can delete ❌");

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

      {/* ✅ ADMIN ONLY FORM */}
      {isAdmin && (
        <div style={{ display: "flex", flexWrap: "wrap", gap: "10px" }}>
          <input name="name" placeholder="Name" value={form.name} onChange={handleChange} />
          <input name="resourceCode" placeholder="Code" value={form.resourceCode} onChange={handleChange} />
          <input name="description" placeholder="Description" value={form.description} onChange={handleChange} />
          <input name="capacity" type="number" placeholder="Capacity" value={form.capacity} onChange={handleChange} />

          <select name="categoryId" value={form.categoryId} onChange={handleChange}>
            <option value="">Category</option>
            {categories.map((c: any) => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </select>

          <select name="locationId" value={form.locationId} onChange={handleChange}>
            <option value="">Location</option>
            {locations.map((l: any) => (
              <option key={l.id} value={l.id}>{l.name}</option>
            ))}
          </select>

          <input name="notes" placeholder="Notes" value={form.notes} onChange={handleChange} />
          <input name="imageUrl" placeholder="Image URL" value={form.imageUrl} onChange={handleChange} />

          <button onClick={handleSave}>
            {editingId ? "Update" : "Add"}
          </button>
        </div>
      )}

      {/* LIST */}
      {resources.map((r: any) => (
        <div key={r.id} style={{ border: "1px solid #ddd", padding: "12px", marginTop: "10px" }}>
          <h3>{r.name} ({r.resourceCode})</h3>

          <p>Capacity: {r.capacity}</p>
          <p>Category: {r.categoryName} | Location: {r.locationName}</p>

          {r.imageUrl && (
            <img
              src={r.imageUrl}
              width={120}
              onError={(e) => {
                (e.target as HTMLImageElement).src = "https://via.placeholder.com/120";
              }}
            />
          )}

          {/* ✅ ADMIN ONLY BUTTONS */}
          {isAdmin && (
            <>
              <button onClick={() => handleEdit(r)}>Edit ✏️</button>
              <button onClick={() => handleDelete(r.id)}>Delete 🗑️</button>
            </>
          )}
        </div>
      ))}
    </div>
  );
}