"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import {
  getResources,
  updateResource,
  getCategories,
  getLocations,
  uploadResourceImage,
  resolveResourceImageUrl,
} from "@/lib/resources/api";
import FormMessages from "../../../../components/ui/FormMessages";

export default function EditResourcePage() {
  const { id } = useParams();
  const router = useRouter();

  // ✅ FIX: Proper initial form (VERY IMPORTANT)
  const [form, setForm] = useState({
    name: "",
    resourceCode: "",
    capacity: "",
    categoryId: "",
    locationId: "",
    status: "ACTIVE",
    requiresApproval: true,
  });

  const [categories, setCategories] = useState<any[]>([]);
  const [locations, setLocations] = useState<any[]>([]);
  const [preview, setPreview] = useState("");
  const [selectedImageFile, setSelectedImageFile] = useState<File | null>(null);
  const [errors, setErrors] = useState<string[]>([]);
  const [success, setSuccess] = useState<string | null>(null);

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

    // ✅ REMOVE DUPLICATES
    const uniqueLocations = Array.from(
      new Map((loc || []).map((l: any) => [l.name, l])).values()
    );
    setLocations(uniqueLocations);

    const resource = resources.find((r: any) => r.id == id);

    if (!resource) return; // ✅ SAFE GUARD

    setForm({
      name: resource.name || "",
      resourceCode: resource.resourceCode || "",
      capacity: resource.capacity || "",
      categoryId: resource.categoryId || "",
      locationId: resource.locationId || "",
      status: resource.status || "ACTIVE",
      requiresApproval: resource.requiresApproval ?? true,
    });

    setPreview(resolveResourceImageUrl(resource.imageUrl) || "");
  };

  const handleChange = (e: any) => {
    const { name, value, type, checked } = e.target;

    setForm({
      ...form,
      [name]: type === "checkbox" ? checked : value,
    });
  };

  // IMAGE UPLOAD
  const handleImageUpload = (e: any) => {
    const file = e.target.files[0];
    if (!file) return;

    setSelectedImageFile(file);

    const reader = new FileReader();

    reader.onloadend = () => {
      const base64 = reader.result as string;
      setPreview(base64);
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

      if (selectedImageFile) {
        await uploadResourceImage(Number(id), selectedImageFile);
      }

      setSuccess('Updated successfully ✅');
      setTimeout(() => router.push("/resources"), 400);
    } catch (err: any) {
      try {
        const parsed = JSON.parse(err.message || err || '{}');
        if (parsed.validationErrors) {
          const arr = Object.entries(parsed.validationErrors).map(([k, v]: any) => `${k}: ${v}`);
          setErrors(arr as string[]);
        } else if (parsed.message) {
          setErrors([parsed.message]);
        } else {
          setErrors([err.message || 'Update failed']);
        }
      } catch (_) {
        setErrors([err.message || 'Update failed']);
      }
    }
  };

  return (
    <div style={styles.container}>
      <div style={styles.card}>
        <h2 style={styles.title}>✏️ Edit Resource</h2>

        <FormMessages errors={errors} success={success} onClose={() => { setErrors([]); setSuccess(null); }} />

        <div style={styles.grid}>
          <input
            name="name"
            value={form.name}
            onChange={handleChange}
            placeholder="Resource Name"
            style={styles.input}
          />

          <input
            name="resourceCode"
            value={form.resourceCode}
            onChange={handleChange}
            placeholder="Resource Code"
            style={styles.input}
          />

          <input
            name="capacity"
            value={form.capacity}
            onChange={handleChange}
            placeholder="Capacity"
            style={styles.input}
          />

          <select
            name="categoryId"
            value={form.categoryId || ""}
            onChange={handleChange}
            style={styles.input}
          >
            <option value="">Select Category</option>
            {categories.map((c: any) => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </select>

          <select
            name="locationId"
            value={form.locationId || ""}
            onChange={handleChange}
            style={styles.input}
          >
            <option value="">Select Location</option>
            {locations.map((l: any) => (
              <option key={l.id} value={l.id}>{l.name}</option>
            ))}
          </select>

          <select
            name="status"
            value={form.status || "ACTIVE"}
            onChange={handleChange}
            style={styles.input}
          >
            <option value="ACTIVE">ACTIVE</option>
            <option value="OUT_OF_SERVICE">OUT_OF_SERVICE</option>
          </select>

          <div style={styles.checkboxRow}>
            <input
              type="checkbox"
              name="requiresApproval"
              checked={form.requiresApproval ?? false}
              onChange={handleChange}
            />
            <label>Requires Approval</label>
          </div>

          <div style={styles.uploadBox}>
            <input type="file" accept="image/*" onChange={handleImageUpload} />
          </div>
        </div>

        {preview && <img src={preview} style={styles.image} />}

        <div style={styles.buttons}>
          <button onClick={handleUpdate} style={styles.updateBtn}>
            💾 Update
          </button>

          <button
            onClick={() => router.push("/resources")}
            style={styles.cancelBtn}
          >
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
    background: "#f3f4f6",
    minHeight: "100vh",
  },

  card: {
    width: "850px",
    background: "#fff",
    padding: "30px",
    borderRadius: "16px",
    boxShadow: "0 8px 25px rgba(0,0,0,0.08)",
  },

  title: {
    marginBottom: "20px",
    fontWeight: "600",
    fontSize: "22px",
  },

  grid: {
    display: "grid",
    gridTemplateColumns: "1fr 1fr",
    gap: "15px",
  },

  input: {
    padding: "12px",
    borderRadius: "10px",
    border: "1px solid #ddd",
  },

  checkboxRow: {
    display: "flex",
    alignItems: "center",
    gap: "8px",
  },

  uploadBox: {
    gridColumn: "span 2",
    border: "2px dashed #ccc",
    padding: "15px",
    borderRadius: "10px",
    textAlign: "center",
  },

  image: {
    width: "180px",
    height: "120px",
    objectFit: "cover",
    borderRadius: "10px",
    marginTop: "15px",
  },

  buttons: {
    marginTop: "20px",
    display: "flex",
    gap: "12px",
  },

  updateBtn: {
    background: "#f59e0b",
    color: "#fff",
    padding: "10px 22px",
    borderRadius: "8px",
    border: "none",
  },

  cancelBtn: {
    background: "#e5e7eb",
    padding: "10px 22px",
    borderRadius: "8px",
    border: "none",
  },
};
