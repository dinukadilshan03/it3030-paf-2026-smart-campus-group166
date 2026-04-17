"use client";

import { useEffect, useState } from "react";
import {
  createResource,
  getCategories,
  getLocations,
  getResources,
} from "@/lib/resources/api";
import { useRouter } from "next/navigation";

export default function AddResourcePage() {
  const router = useRouter();

  const [categories, setCategories] = useState<any[]>([]);
  const [locations, setLocations] = useState<any[]>([]);

  const [form, setForm] = useState({
    name: "",
    resourceCode: "",
    capacity: "",
    categoryId: "",
    locationId: "",
    imageUrl: "",
    status: "ACTIVE",
    requiresApproval: true,
  });

  const [preview, setPreview] = useState("");
  const [tempImage, setTempImage] = useState("");

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

  const handleImageUpload = (e: any) => {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();

    reader.onloadend = () => {
      const base64 = reader.result as string;
      setPreview(base64);
      setTempImage(base64);
    };

    reader.readAsDataURL(file);
  };

  const handleSave = async () => {
    try {
      const payload = {
        name: form.name,
        resourceCode: form.resourceCode,
        capacity: form.capacity ? Number(form.capacity) : null,
        resourceCategoryId: Number(form.categoryId),
        locationId: Number(form.locationId),
        imageUrl: "",
        status: form.status,
        requiresApproval: form.requiresApproval,
      };

      await createResource(payload);

      const resources = await getResources();
      const latest = resources[resources.length - 1];

      if (tempImage && latest) {
        localStorage.setItem("resource_image_" + latest.id, tempImage);
      }

      alert("Resource Added ✅");
      router.push("/resources");
    } catch (err: any) {
      alert(err.message);
    }
  };

  return (
    <div style={styles.page}>
      <div style={styles.card}>
        <h2 style={styles.title}>➕ Add Resource</h2>

        <div style={styles.grid}>
          <input name="name" placeholder="Resource Name" onChange={handleChange} style={styles.input} />
          <input name="resourceCode" placeholder="Resource Code" onChange={handleChange} style={styles.input} />

          <input name="capacity" type="number" placeholder="Capacity" onChange={handleChange} style={styles.input} />

          <select name="categoryId" onChange={handleChange} style={styles.input}>
            <option value="">Select Category</option>
            {categories.map((c: any) => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </select>

          <select name="locationId" onChange={handleChange} style={styles.input}>
            <option value="">Select Location</option>
            {locations.map((l: any) => (
              <option key={l.id} value={l.id}>{l.name}</option>
            ))}
          </select>

          <select name="status" onChange={handleChange} style={styles.input}>
            <option value="ACTIVE">ACTIVE</option>
            <option value="OUT_OF_SERVICE">OUT OF SERVICE</option>
          </select>

          <div style={styles.checkbox}>
            <input type="checkbox" name="requiresApproval" onChange={handleChange} />
            <span>Requires Approval</span>
          </div>

          {/* Upload */}
          <div style={styles.uploadBox}>
            <input type="file" accept="image/*" onChange={handleImageUpload} />
          </div>
        </div>

        {/* Preview */}
        {preview && (
          <div style={styles.previewBox}>
            <img src={preview} style={styles.image} />
          </div>
        )}

        {/* Buttons */}
        <div style={styles.buttonRow}>
          <button onClick={handleSave} style={styles.saveBtn}>
            💾 Save
          </button>
          <button onClick={() => router.push("/resources")} style={styles.cancelBtn}>
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}

const styles: any = {
  page: {
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    padding: "40px",
    background: "#f4f6f9",
    minHeight: "100vh",
  },
  card: {
    width: "800px",
    background: "#fff",
    padding: "25px",
    borderRadius: "16px",
    boxShadow: "0 8px 25px rgba(0,0,0,0.08)",
  },
  title: {
    marginBottom: "20px",
    fontSize: "22px",
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
    border: "1px solid #ddd",
    fontSize: "14px",
  },
  checkbox: {
    display: "flex",
    alignItems: "center",
    gap: "8px",
  },
  uploadBox: {
    gridColumn: "span 2",
    padding: "10px",
    border: "2px dashed #ccc",
    borderRadius: "10px",
    textAlign: "center",
  },
  previewBox: {
    marginTop: "15px",
    textAlign: "center",
  },
  image: {
    width: "200px",
    height: "130px",
    objectFit: "cover",
    borderRadius: "10px",
  },
  buttonRow: {
    marginTop: "20px",
    display: "flex",
    gap: "10px",
    justifyContent: "flex-end",
  },
  saveBtn: {
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