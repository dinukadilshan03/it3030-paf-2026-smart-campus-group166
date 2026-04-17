"use client";

import { useEffect, useState } from "react";
import {
  createResource,
  getCategories,
  getLocations,
} from "@/lib/resources/api";
import { useRouter } from "next/navigation";

export default function AddResourcePage() {
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
    const [cat, loc] = await Promise.all([
      getCategories(),
      getLocations(),
    ]);
    setCategories(cat || []);
    setLocations(loc || []);
  };

  const handleChange = (e: any) => {
    const { name, value, type, checked } = e.target;

    setForm({
      ...form,
      [name]: type === "checkbox" ? checked : value,
    });
  };

  const handleSave = async () => {
    if (!form.name || !form.resourceCode) {
      return alert("Name & Code are required ❌");
    }

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

      await createResource(payload);

      alert("Resource Added ✅");
      router.push("/resources");
    } catch (err: any) {
      alert(err.message);
    }
  };

  return (
    <div style={styles.container}>
      <div style={styles.card}>
        <h2 style={styles.title}>➕ Add Resource</h2>

        <div style={styles.grid}>
          <input name="name" placeholder="Name *" value={form.name} onChange={handleChange} style={styles.input} />
          <input name="resourceCode" placeholder="Code *" value={form.resourceCode} onChange={handleChange} style={styles.input} />

          <input name="description" placeholder="Description" value={form.description} onChange={handleChange} style={styles.input} />
          <input name="capacity" type="number" placeholder="Capacity" value={form.capacity} onChange={handleChange} style={styles.input} />

          {/* CATEGORY */}
          <select name="categoryId" value={form.categoryId} onChange={handleChange} style={styles.input}>
            <option value="">Select Category *</option>
            {categories.map((c: any) => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </select>

          {/* LOCATION */}
          <select name="locationId" value={form.locationId} onChange={handleChange} style={styles.input}>
            <option value="">Select Location *</option>
            {locations.map((l: any) => (
              <option key={l.id} value={l.id}>{l.name}</option>
            ))}
          </select>

          <input name="notes" placeholder="Notes" value={form.notes} onChange={handleChange} style={styles.input} />
          <input name="imageUrl" placeholder="Image URL" value={form.imageUrl} onChange={handleChange} style={styles.input} />

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
          <button onClick={handleSave} style={styles.saveBtn}>💾 Save</button>
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
    fontSize: "14px",
  },
  buttonRow: {
    marginTop: "25px",
    display: "flex",
    gap: "10px",
  },
  saveBtn: {
    background: "#16a34a",
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