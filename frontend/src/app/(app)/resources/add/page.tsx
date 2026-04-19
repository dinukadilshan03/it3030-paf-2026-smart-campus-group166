"use client";

import { useEffect, useState } from "react";
import {
  createResource,
  getResources,
  getCategories,
  getLocations,
  createResourceCategory,
  createLocation,
} from "@/lib/resources/api";
import { useRouter } from "next/navigation";
import FormMessages from "../../../components/ui/FormMessages";

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
  const [errors, setErrors] = useState<string[]>([]);
  const [success, setSuccess] = useState<string | null>(null);
  const [newCategoryName, setNewCategoryName] = useState("");
  const [newCategoryCode, setNewCategoryCode] = useState("");
  const [newLocationName, setNewLocationName] = useState("");
  const [newLocationCode, setNewLocationCode] = useState("");

  useEffect(() => {
    loadData();
  }, []);

  // auto-generate codes when name typed and code empty
  useEffect(() => {
    if (newCategoryName && !newCategoryCode) {
      setNewCategoryCode(
        newCategoryName
          .toLowerCase()
          .replace(/[^a-z0-9\s-]/g, "")
          .trim()
          .replace(/\s+/g, "-")
      );
    }
  }, [newCategoryName]);

  useEffect(() => {
    if (newLocationName && !newLocationCode) {
      setNewLocationCode(
        newLocationName
          .toLowerCase()
          .replace(/[^a-z0-9\s-]/g, "")
          .trim()
          .replace(/\s+/g, "-")
      );
    }
  }, [newLocationName]);

  const loadData = async () => {
    const [cat, loc] = await Promise.all([
      getCategories(),
      getLocations(),
    ]);

    setCategories(cat || []);

    const uniqueLocations = Array.from(
      new Map((loc || []).map((l: any) => [l.name, l])).values()
    );

    setLocations(uniqueLocations);
  };

  const handleCreateCategory = async () => {
    setErrors([]);
    setSuccess(null);
    if (!newCategoryName.trim()) {
      setErrors(["Enter category name"]);
      return;
    }
    if (!newCategoryCode.trim()) {
      setErrors(["Enter category code"]);
      return;
    }
    try {
      await createResourceCategory({ name: newCategoryName.trim(), code: newCategoryCode.trim() });
      setNewCategoryName('');
      setNewCategoryCode('');
      await loadData();
      setSuccess('Category added');
      setTimeout(() => setSuccess(null), 2500);
    } catch (e: any) {
      try {
        const parsed = JSON.parse(e.message || e || '{}');
        if (parsed.validationErrors) {
          const arr = Object.entries(parsed.validationErrors).map(([k, v]: any) => `${k}: ${v}`);
          setErrors(arr as string[]);
        } else if (parsed.message) {
          setErrors([parsed.message]);
        } else {
          setErrors([e.message || 'Failed to add category']);
        }
      } catch (_) {
        setErrors([e.message || 'Failed to add category']);
      }
    }
  };

  const handleCreateLocation = async () => {
    setErrors([]);
    setSuccess(null);
    if (!newLocationName.trim()) {
      setErrors(["Enter location name"]);
      return;
    }
    if (!newLocationCode.trim()) {
      setErrors(["Enter location code"]);
      return;
    }
    try {
      await createLocation({ name: newLocationName.trim(), code: newLocationCode.trim() });
      setNewLocationName('');
      setNewLocationCode('');
      await loadData();
      setSuccess('Location added');
      setTimeout(() => setSuccess(null), 2500);
    } catch (e: any) {
      try {
        const parsed = JSON.parse(e.message || e || '{}');
        if (parsed.validationErrors) {
          const arr = Object.entries(parsed.validationErrors).map(([k, v]: any) => `${k}: ${v}`);
          setErrors(arr as string[]);
        } else if (parsed.message) {
          setErrors([parsed.message]);
        } else {
          setErrors([e.message || 'Failed to add location']);
        }
      } catch (_) {
        setErrors([e.message || 'Failed to add location']);
      }
    }
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

      const createdResource = await createResource(payload);

      const resources = await getResources();
      const latest = resources[resources.length - 1];

      if (tempImage && latest) {
        localStorage.setItem(
          "resource_image_" + latest.id,
          tempImage
        );
      }

      // show success briefly then navigate
      setSuccess('Added ✅');
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
          setErrors([err.message || 'Save failed']);
        }
      } catch (_) {
        setErrors([err.message || 'Save failed']);
      }
    }
  };

  return (
    <div style={styles.container}>
      <div style={styles.card}>
        <h2 style={styles.title}>➕ Add Resource</h2>

        

        <FormMessages errors={errors} success={success} onClose={() => { setErrors([]); setSuccess(null); }} />

        <div style={styles.grid}>
          <input
            name="name"
            placeholder="Resource Name"
            onChange={handleChange}
            style={styles.input}
          />

          <input
            name="resourceCode"
            placeholder="Resource Code"
            onChange={handleChange}
            style={styles.input}
          />

          <input
            name="capacity"
            type="number"
            placeholder="Capacity"
            onChange={handleChange}
            style={styles.input}
          />

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
            <option value="OUT_OF_SERVICE">OUT_OF_SERVICE</option>
          </select>

          <div style={styles.checkboxRow}>
            <input
              type="checkbox"
              name="requiresApproval"
              onChange={handleChange}
            />
            <label>Requires Approval</label>
          </div>

          {/* FILE UPLOAD */}
          <div style={styles.uploadBox}>
            <input type="file" accept="image/*" onChange={handleImageUpload} />
          </div>
        </div>

        {/* IMAGE PREVIEW */}
        {preview && (
          <img src={preview} style={styles.image} />
        )}

        

        {/* BUTTONS */}
        <div style={styles.buttons}>
          <button onClick={handleSave} style={styles.saveBtn}>
            💾 Save
          </button>

          <button
            onClick={() => router.push("/resources")}
            style={styles.cancelBtn}
          >
            Cancel
          </button>
        </div>

        {/* --- Quick add category / location (moved under Save/Cancel) --- */}
        <div style={{ display: 'flex', gap: 12, marginTop: 18 }}>
          <div style={{ flex: 1, minWidth: 0, background: '#fbfafb', padding: 12, borderRadius: 10 }}>
            <div style={{ fontSize: 13, color: '#374151', fontWeight: 700, marginBottom: 8 }}>Add Category</div>
            <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
              <input value={newCategoryName} onChange={(e) => setNewCategoryName(e.target.value)} placeholder="Category name" style={{ ...styles.input, padding: '10px', flex: 1, minWidth: 0 }} />
              <input value={newCategoryCode} onChange={(e) => setNewCategoryCode(e.target.value)} placeholder="Code" style={{ ...styles.input, padding: '10px', width: 140, minWidth: 0 }} />
              <button onClick={handleCreateCategory} style={{ width: 64, padding: '10px 8px', borderRadius: 8, background: '#10b981', color: '#fff', border: 'none', cursor: 'pointer' }}>Add</button>
            </div>
          </div>

          <div style={{ flex: 1, minWidth: 0, background: '#fbfafb', padding: 12, borderRadius: 10 }}>
            <div style={{ fontSize: 13, color: '#374151', fontWeight: 700, marginBottom: 8 }}>Add Location</div>
            <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
              <input value={newLocationName} onChange={(e) => setNewLocationName(e.target.value)} placeholder="Location name" style={{ ...styles.input, padding: '10px', flex: 1, minWidth: 0 }} />
              <input value={newLocationCode} onChange={(e) => setNewLocationCode(e.target.value)} placeholder="Code" style={{ ...styles.input, padding: '10px', width: 140, minWidth: 0 }} />
              <button onClick={handleCreateLocation} style={{ width: 64, padding: '10px 8px', borderRadius: 8, background: '#2563eb', color: '#fff', border: 'none', cursor: 'pointer' }}>Add</button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

/* 🎨 MODERN STYLES */
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
    background: "#ffffff",
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
    fontSize: "14px",
    outline: "none",
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
    cursor: "pointer",
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

  saveBtn: {
    background: "#2563eb",
    color: "#fff",
    padding: "10px 22px",
    borderRadius: "8px",
    border: "none",
    cursor: "pointer",
    fontWeight: "500",
  },

  cancelBtn: {
    background: "#e5e7eb",
    padding: "10px 22px",
    borderRadius: "8px",
    border: "none",
    cursor: "pointer",
  },
};
