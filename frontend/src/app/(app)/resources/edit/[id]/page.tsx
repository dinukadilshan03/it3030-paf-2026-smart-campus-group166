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

  const [categories, setCategories] = useState<any[]>([]);
  const [locations, setLocations] = useState<any[]>([]);

  const [form, setForm] = useState({
    name: "",
    resourceCode: "",
    description: "",
    capacity: "",
    categoryId: "",
    locationId: "",
    notes: "",
    imageUrl: "",
    status: "ACTIVE",
    requiresApproval: true,
  });

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
      status: resource.status || "ACTIVE",
      requiresApproval: resource.requiresApproval ?? true,
    });
  };

  const handleChange = (e: any) => {
    const { name, value, type, checked } = e.target;

    setForm({
      ...form,
      [name]: type === "checkbox" ? checked : value,
    });
  };

  const handleUpdate = async () => {
    try {
      const payload = {
        name: form.name,
        resourceCode: form.resourceCode,
        description: form.description || null,
        capacity: form.capacity ? Number(form.capacity) : null,
        resourceCategoryId: Number(form.categoryId),
        locationId: Number(form.locationId),
        notes: form.notes || null,
        imageUrl: form.imageUrl || null,
        status: form.status,
        requiresApproval: form.requiresApproval,
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
          <input name="capacity" type="number" value={form.capacity} onChange={handleChange} placeholder="Capacity" style={styles.input} />

          {/* CATEGORY */}
          <select name="categoryId" value={form.categoryId} onChange={handleChange} style={styles.input}>
            <option value="">Select Category</option>
            {categories.map((c: any) => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </select>

          {/* LOCATION */}
          <select name="locationId" value={form.locationId} onChange={handleChange} style={styles.input}>
            <option value="">Select Location</option>
            {locations.map((l: any) => (
              <option key={l.id} value={l.id}>{l.name}</option>
            ))}
          </select>

          <input name="notes" value={form.notes} onChange={handleChange} placeholder="Notes" style={styles.input} />
          <input name="imageUrl" value={form.imageUrl} onChange={handleChange} placeholder="Image URL" style={styles.input} />

          {/* STATUS */}
          <select name="status" value={form.status} onChange={handleChange} style={styles.input}>
            <option value="ACTIVE">ACTIVE</option>
            <option value="INACTIVE">INACTIVE</option>
          </select>

          {/* APPROVAL */}
          <label style={styles.checkbox}>
            <input
              type="checkbox"
              name="requiresApproval"
              checked={form.requiresApproval}
              onChange={handleChange}
            />
            Requires Approval
          </label>
        </div>

        {/* IMAGE PREVIEW */}
        {form.imageUrl && (
          <div style={{ marginTop: "15px" }}>
            <img
              src={form.imageUrl}
              alt="preview"
              style={styles.image}
              onError={(e) => {
                (e.target as HTMLImageElement).src =
                  "https://via.placeholder.com/150";
              }}
            />
          </div>
        )}

        <div style={styles.buttonRow}>
          <button onClick={handleUpdate} style={styles.updateBtn}>💾 Update</button>
          <button onClick={() => router.push("/resources")} style={styles.cancelBtn}>Cancel</button>
        </div>
      </div>
    </div>
  );
}

const styles: any = {
  container: {
    display: "flex",
    justifyContent: "center",
    padding: "40px",
  },
  card: {
    width: "850px",
    background: "#fff",
    padding: "30px",
    borderRadius: "14px",
    boxShadow: "0 6px 25px rgba(0,0,0,0.1)",
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
    padding: "12px",
    borderRadius: "8px",
    border: "1px solid #ccc",
    fontSize: "14px",
  },
  checkbox: {
    display: "flex",
    alignItems: "center",
    gap: "8px",
  },
  buttonRow: {
    marginTop: "25px",
    display: "flex",
    gap: "10px",
  },
  updateBtn: {
    background: "#f59e0b",
    color: "#fff",
    padding: "10px 20px",
    border: "none",
    borderRadius: "8px",
    cursor: "pointer",
  },
  cancelBtn: {
    background: "#e5e7eb",
    padding: "10px 20px",
    border: "none",
    borderRadius: "8px",
    cursor: "pointer",
  },
  image: {
    width: "180px",
    height: "110px",
    objectFit: "cover",
    borderRadius: "8px",
  },
};