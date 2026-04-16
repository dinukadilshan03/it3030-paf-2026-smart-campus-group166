"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import {
  getResources,
  updateResource,
  getCategories,
  getLocations,
} from "@/lib/resources/api";

export default function EditResourcePage() {
  const { id } = useParams();
  const router = useRouter();

  const [form, setForm] = useState<any>({
    name: "",
    resourceCode: "",
    description: "",
    capacity: "",
    categoryId: "",
    locationId: "",
    notes: "",
    imageUrl: "",
  });

  const [categories, setCategories] = useState<any[]>([]);
  const [locations, setLocations] = useState<any[]>([]);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    const [resources, cat, loc] = await Promise.all([
      getResources(),
      getCategories(),
      getLocations(),
    ]);

    setCategories(cat || []);
    setLocations(loc || []);

    const resource = resources.find((r: any) => r.id == id);

    if (!resource) {
      alert("Resource not found ❌");
      return;
    }

    setForm({
      name: resource.name,
      resourceCode: resource.resourceCode,
      description: resource.description || "",
      capacity: resource.capacity || "",
      categoryId: resource.categoryId,
      locationId: resource.locationId,
      notes: resource.notes || "",
      imageUrl: resource.imageUrl || "",
    });
  };

  const handleChange = (e: any) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleUpdate = async () => {
    try {
      const payload = {
        ...form,
        capacity: form.capacity ? Number(form.capacity) : null,
        resourceCategoryId: Number(form.categoryId),
        locationId: Number(form.locationId),
      };

      await updateResource(Number(id), payload);
      alert("Updated successfully ✅");
      router.push("/resources");
    } catch (err: any) {
      alert(err.message);
    }
  };

  return (
    <div style={styles.container}>
      <div style={styles.card}>
        <h2 style={styles.title}>✏️ Edit Resource</h2>

        <div style={styles.grid}>
          <input name="name" value={form.name} onChange={handleChange} placeholder="Name" style={styles.input} />
          <input name="resourceCode" value={form.resourceCode} onChange={handleChange} placeholder="Code" style={styles.input} />

          <input name="description" value={form.description} onChange={handleChange} placeholder="Description" style={styles.input} />
          <input name="capacity" value={form.capacity} onChange={handleChange} placeholder="Capacity" style={styles.input} />

          <select name="categoryId" value={form.categoryId} onChange={handleChange} style={styles.input}>
            <option value="">Select Category</option>
            {categories.map((c: any) => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </select>

          <select name="locationId" value={form.locationId} onChange={handleChange} style={styles.input}>
            <option value="">Select Location</option>
            {locations.map((l: any) => (
              <option key={l.id} value={l.id}>{l.name}</option>
            ))}
          </select>

          <input name="notes" value={form.notes} onChange={handleChange} placeholder="Notes" style={styles.input} />
          <input name="imageUrl" value={form.imageUrl} onChange={handleChange} placeholder="Image URL" style={styles.input} />
        </div>

        {/* IMAGE PREVIEW */}
        {form.imageUrl && (
          <div style={{ marginTop: "20px" }}>
            <p style={{ fontSize: "14px", marginBottom: "5px" }}>Preview:</p>
            <img
              src={form.imageUrl}
              alt="preview"
              style={styles.image}
              onError={(e) => {
                (e.target as HTMLImageElement).src = "https://via.placeholder.com/150";
              }}
            />
          </div>
        )}

        {/* BUTTONS */}
        <div style={styles.actions}>
          <button onClick={handleUpdate} style={styles.updateBtn}>
            💾 Update
          </button>

          <button onClick={() => router.push("/resources")} style={styles.cancelBtn}>
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}

/* 🎨 STYLES */
const styles: any = {
  container: {
    display: "flex",
    justifyContent: "center",
    padding: "40px",
  },
  card: {
    width: "800px",
    background: "#fff",
    padding: "25px",
    borderRadius: "12px",
    boxShadow: "0 4px 20px rgba(0,0,0,0.08)",
  },
  title: {
    marginBottom: "20px",
    fontWeight: "600",
  },
  grid: {
    display: "grid",
    gridTemplateColumns: "1fr 1fr",
    gap: "15px",
  },
  input: {
    padding: "10px",
    borderRadius: "8px",
    border: "1px solid #ccc",
    fontSize: "14px",
  },
  image: {
    width: "150px",
    height: "100px",
    objectFit: "cover",
    borderRadius: "8px",
  },
  actions: {
    marginTop: "25px",
    display: "flex",
    gap: "10px",
  },
  updateBtn: {
    background: "#2563eb",
    color: "#fff",
    padding: "10px 20px",
    borderRadius: "8px",
    border: "none",
    cursor: "pointer",
  },
  cancelBtn: {
    background: "#e5e7eb",
    padding: "10px 20px",
    borderRadius: "8px",
    border: "none",
    cursor: "pointer",
  },
};