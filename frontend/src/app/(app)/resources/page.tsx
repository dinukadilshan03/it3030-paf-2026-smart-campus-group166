"use client";

import { useEffect, useState } from "react";
import {
  getResources,
  createResource,
  getCategories,
  getLocations,
} from "@/lib/resources/api";

export default function ResourcePage() {
  const [resources, setResources] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [locations, setLocations] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  const [form, setForm] = useState({
    name: "",
    resourceCode: "",
    capacity: "",
    categoryId: "",
    locationId: "",
  });

  // ✅ LOAD ALL DATA
  useEffect(() => {
    loadAll();
  }, []);

  const loadAll = async () => {
    try {
      setLoading(true);

      const [res, cat, loc] = await Promise.all([
        getResources(),
        getCategories(),
        getLocations(),
      ]);

      setResources(res || []);
      setCategories(cat || []);
      setLocations(loc || []);
    } catch (err) {
      console.error("LOAD ERROR:", err);
    } finally {
      setLoading(false);
    }
  };

  // ✅ HANDLE INPUT CHANGE
  const handleChange = (e: any) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  // ✅ ADD RESOURCE
  const handleAdd = async () => {
    console.log("FORM DATA:", form);

    // 🔥 VALIDATION
    if (!form.name.trim() || !form.resourceCode.trim()) {
      alert("Name and Code are required ❌");
      return;
    }

    if (!form.categoryId || !form.locationId) {
      alert("Select Category and Location ❌");
      return;
    }

    try {
      await createResource({
        name: form.name.trim(),
        resourceCode: form.resourceCode.trim(),
        capacity: form.capacity ? Number(form.capacity) : null,
        status: "ACTIVE",
        requiresApproval: true,
        resourceCategoryId: Number(form.categoryId),
        locationId: Number(form.locationId),
      });

      alert("Added successfully ✅");

      // ✅ RESET FORM
      setForm({
        name: "",
        resourceCode: "",
        capacity: "",
        categoryId: "",
        locationId: "",
      });

      // ✅ RELOAD LIST
      await loadAll();
    } catch (err: any) {
      console.error(err);
      alert(err?.message || "Failed to add resource ❌");
    }
  };

  return (
    <div style={{ padding: "20px" }}>
      <h2>Resources</h2>

      {/* 🔥 FORM */}
      <div style={{ marginBottom: "20px" }}>
        <input
          name="name"
          placeholder="Resource Name"
          value={form.name}
          onChange={handleChange}
        />

        <input
          name="resourceCode"
          placeholder="Code (R001)"
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

        {/* CATEGORY */}
        <select
          name="categoryId"
          value={form.categoryId}
          onChange={handleChange}
        >
          <option value="">Select Category</option>
          {categories.map((c: any) => (
            <option key={c.id} value={c.id}>
              {c.name}
            </option>
          ))}
        </select>

        {/* LOCATION */}
        <select
          name="locationId"
          value={form.locationId}
          onChange={handleChange}
        >
          <option value="">Select Location</option>
          {locations.map((l: any) => (
            <option key={l.id} value={l.id}>
              {l.name}
            </option>
          ))}
        </select>

        <button onClick={handleAdd}>Add</button>
      </div>

      {/* 🔥 LIST */}
      {loading ? (
        <p>Loading...</p>
      ) : resources.length === 0 ? (
        <p>No resources found</p>
      ) : (
        <ul>
          {resources.map((r: any) => (
            <li key={r.id}>
              <strong>{r.name}</strong> ({r.resourceCode}) - Capacity:{" "}
              {r.capacity || 0}
              <br />
              Category: {r.category?.name} | Location:{" "}
              {r.location?.name}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}