"use client";

import { useEffect, useState } from "react";
import { createResource, getCategories, getLocations } from "@/lib/resources/api";
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
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSave = async () => {
    try {
      const payload = {
        ...form,
        capacity: form.capacity ? Number(form.capacity) : null,
        resourceCategoryId: Number(form.categoryId),
        locationId: Number(form.locationId),
        status: "ACTIVE",
        requiresApproval: true,
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
          <input name="name" placeholder="Name" value={form.name} onChange={handleChange} style={styles.input} />
          <input name="resourceCode" placeholder="Code" value={form.resourceCode} onChange={handleChange} style={styles.input} />

          <input name="description" placeholder="Description" value={form.description} onChange={handleChange} style={styles.input} />
          <input name="capacity" type="number" placeholder="Capacity" value={form.capacity} onChange={handleChange} style={styles.input} />

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

          <input name="notes" placeholder="Notes" value={form.notes} onChange={handleChange} style={styles.input} />
          <input name="imageUrl" placeholder="Image URL" value={form.imageUrl} onChange={handleChange} style={styles.input} />
        </div>

        {/* Image Preview */}
        {form.imageUrl && (
          <div style={{ marginTop: "15px" }}>
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
  buttonRow: {
    marginTop: "20px",
    display: "flex",
    gap: "10px",
  },
  saveBtn: {
    background: "#2563eb",
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
    width: "150px",
    height: "100px",
    objectFit: "cover",
    borderRadius: "8px",
  },
};