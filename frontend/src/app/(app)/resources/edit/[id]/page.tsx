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

  const [form, setForm] = useState<any>({});
  const [categories, setCategories] = useState<any[]>([]);
  const [locations, setLocations] = useState<any[]>([]);
  const [preview, setPreview] = useState("");

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

    const localImg = localStorage.getItem("resource_image_" + id);

    setForm({
      ...resource,
      categoryId: resource?.categoryId,
      locationId: resource?.locationId,
    });

    setPreview(localImg || resource?.imageUrl || "");
  };

  const handleChange = (e: any) => {
    const { name, value, type, checked } = e.target;

    setForm({
      ...form,
      [name]: type === "checkbox" ? checked : value,
    });
  };

  const handleImageUpload = (e: any) => {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();

    reader.onloadend = () => {
      const base64 = reader.result as string;
      setPreview(base64);
      localStorage.setItem("resource_image_" + id, base64);
    };

    reader.readAsDataURL(file);
  };

  const handleUpdate = async () => {
    try {
      const payload = {
        name: form.name,
        resourceCode: form.resourceCode,
        capacity: form.capacity ? Number(form.capacity) : null,
        resourceCategoryId: Number(form.categoryId),
        locationId: Number(form.locationId),
        status: form.status,
        requiresApproval: form.requiresApproval,
        imageUrl: "",
      };

      await updateResource(Number(id), payload);

      alert("Updated successfully ✅");
      router.push("/resources");
    } catch (err: any) {
      alert(err.message);
    }
  };

  return (
    <div style={styles.page}>
      <div style={styles.card}>
        <h2 style={styles.title}>✏️ Edit Resource</h2>

        <div style={styles.grid}>
          <input name="name" value={form.name || ""} onChange={handleChange} placeholder="Resource Name" style={styles.input} />
          <input name="resourceCode" value={form.resourceCode || ""} onChange={handleChange} placeholder="Resource Code" style={styles.input} />

          <input name="capacity" value={form.capacity || ""} onChange={handleChange} placeholder="Capacity" style={styles.input} />

          <select name="categoryId" value={form.categoryId || ""} onChange={handleChange} style={styles.input}>
            <option value="">Select Category</option>
            {categories.map((c: any) => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </select>

          <select name="locationId" value={form.locationId || ""} onChange={handleChange} style={styles.input}>
            <option value="">Select Location</option>
            {locations.map((l: any) => (
              <option key={l.id} value={l.id}>{l.name}</option>
            ))}
          </select>

          <select name="status" value={form.status || "ACTIVE"} onChange={handleChange} style={styles.input}>
            <option value="ACTIVE">ACTIVE</option>
            <option value="OUT_OF_SERVICE">OUT OF SERVICE</option>
          </select>

          <div style={styles.checkbox}>
            <input type="checkbox" name="requiresApproval" checked={form.requiresApproval || false} onChange={handleChange} />
            <span>Requires Approval</span>
          </div>

          <div style={styles.uploadBox}>
            <input type="file" accept="image/*" onChange={handleImageUpload} />
          </div>
        </div>

        {preview && (
          <div style={styles.previewBox}>
            <img src={preview} style={styles.image} />
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

/* 🔥 PREMIUM STYLES */
const styles: any = {
  page: {
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    minHeight: "100vh",
    background: "linear-gradient(135deg, #eef2ff, #f8fafc)",
  },
  card: {
    width: "850px",
    padding: "30px",
    borderRadius: "18px",
    background: "rgba(255,255,255,0.9)",
    backdropFilter: "blur(10px)",
    boxShadow: "0 10px 40px rgba(0,0,0,0.1)",
  },
  title: {
    fontSize: "24px",
    marginBottom: "20px",
    fontWeight: "700",
  },
  grid: {
    display: "grid",
    gridTemplateColumns: "1fr 1fr",
    gap: "16px",
  },
  input: {
    padding: "12px",
    borderRadius: "10px",
    border: "1px solid #ddd",
    fontSize: "14px",
    transition: "0.2s",
  },
  checkbox: {
    display: "flex",
    alignItems: "center",
    gap: "8px",
  },
  uploadBox: {
    gridColumn: "span 2",
    border: "2px dashed #cbd5e1",
    padding: "15px",
    borderRadius: "12px",
    textAlign: "center",
  },
  previewBox: {
    marginTop: "20px",
    textAlign: "center",
  },
  image: {
    width: "220px",
    borderRadius: "12px",
    boxShadow: "0 4px 15px rgba(0,0,0,0.1)",
  },
  buttonRow: {
    marginTop: "25px",
    display: "flex",
    justifyContent: "flex-end",
    gap: "12px",
  },
  updateBtn: {
    background: "linear-gradient(135deg, #f59e0b, #f97316)",
    color: "#fff",
    padding: "12px 22px",
    borderRadius: "10px",
    border: "none",
    cursor: "pointer",
    fontWeight: "600",
  },
  cancelBtn: {
    background: "#e5e7eb",
    padding: "12px 22px",
    borderRadius: "10px",
    border: "none",
    cursor: "pointer",
  },
};