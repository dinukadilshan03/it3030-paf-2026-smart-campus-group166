"use client";

import { useEffect, useState } from "react";
import {
  createResource,
  getCategories,
  getLocations,
  createResourceCategory,
  createLocation,
  uploadResourceImage,
} from "@/lib/resources/api";
import { useRouter } from "next/navigation";

type NoticeTone = "success" | "error" | "info";

type NoticeState = {
  tone: NoticeTone;
  title: string;
  message: string;
} | null;

export default function AddResourcePage() {
  const router = useRouter();

  const [categories, setCategories] = useState<any[]>([]);
  const [locations, setLocations] = useState<any[]>([]);
  const [notice, setNotice] = useState<NoticeState>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [isCreatingCategory, setIsCreatingCategory] = useState(false);
  const [isCreatingLocation, setIsCreatingLocation] = useState(false);

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
  const [selectedImageFile, setSelectedImageFile] = useState<File | null>(null);
  const [newCategoryName, setNewCategoryName] = useState("");
  const [newCategoryCode, setNewCategoryCode] = useState("");
  const [newLocationName, setNewLocationName] = useState("");
  const [newLocationCode, setNewLocationCode] = useState("");

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    if (!notice || notice.tone === "error") return;

    const timeout = window.setTimeout(() => {
      setNotice((current) => (current?.tone === "error" ? current : null));
    }, 3000);

    return () => window.clearTimeout(timeout);
  }, [notice]);

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

  const showNotice = (tone: NoticeTone, title: string, message: string) => {
    setNotice({ tone, title, message });
  };

  const validateResourceForm = () => {
    if (!form.name.trim()) {
      showNotice("error", "Resource name is required", "Enter a clear name so people can identify this resource.");
      return false;
    }

    if (!form.resourceCode.trim()) {
      showNotice("error", "Resource code is required", "Add a unique code such as LAB-101 or HALL-A.");
      return false;
    }

    if (!form.categoryId) {
      showNotice("error", "Choose a category", "Select the resource category before saving.");
      return false;
    }

    if (!form.locationId) {
      showNotice("error", "Choose a location", "Select where this resource is located before saving.");
      return false;
    }

    if (form.capacity && Number(form.capacity) < 0) {
      showNotice("error", "Capacity is invalid", "Capacity cannot be a negative number.");
      return false;
    }

    return true;
  };

  const handleCreateCategory = async () => {
    if (!newCategoryName.trim()) {
      showNotice("error", "Category name is required", "Enter a category name before adding it.");
      return;
    }

    if (!newCategoryCode.trim()) {
      showNotice("error", "Category code is required", "Enter a short code for the new category.");
      return;
    }

    try {
      setIsCreatingCategory(true);
      await createResourceCategory({ name: newCategoryName.trim(), code: newCategoryCode.trim() });
      setNewCategoryName('');
      setNewCategoryCode('');
      await loadData();
      showNotice("success", "Category added", `"${newCategoryName.trim()}" is now available in the category list.`);
    } catch (e: any) {
      showNotice("error", "Could not add category", e.message || "Please try again.");
    } finally {
      setIsCreatingCategory(false);
    }
  };

  const handleCreateLocation = async () => {
    if (!newLocationName.trim()) {
      showNotice("error", "Location name is required", "Enter a location name before adding it.");
      return;
    }

    if (!newLocationCode.trim()) {
      showNotice("error", "Location code is required", "Enter a short code for the new location.");
      return;
    }

    try {
      setIsCreatingLocation(true);
      await createLocation({ name: newLocationName.trim(), code: newLocationCode.trim() });
      setNewLocationName('');
      setNewLocationCode('');
      await loadData();
      showNotice("success", "Location added", `"${newLocationName.trim()}" is now available in the location list.`);
    } catch (e: any) {
      showNotice("error", "Could not add location", e.message || "Please try again.");
    } finally {
      setIsCreatingLocation(false);
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

    setSelectedImageFile(file);

    const reader = new FileReader();

    reader.onloadend = () => {
      const base64 = reader.result as string;
      setPreview(base64);
    };

    reader.readAsDataURL(file);
  };

  const handleSave = async () => {
    if (!validateResourceForm()) return;

    try {
      setIsSaving(true);
      const payload = {
        name: form.name.trim(),
        resourceCode: form.resourceCode.trim(),
        capacity: form.capacity ? Number(form.capacity) : null,
        resourceCategoryId: Number(form.categoryId),
        locationId: Number(form.locationId),
        status: form.status,
        requiresApproval: form.requiresApproval,
      };

      const createdResource = await createResource(payload);

      if (selectedImageFile && createdResource?.id) {
        await uploadResourceImage(createdResource.id, selectedImageFile);
      }

      showNotice("success", "Resource created", `"${form.name.trim()}" was added successfully. Redirecting to resources...`);
      router.push("/resources");
    } catch (err: any) {
      showNotice("error", "Could not save resource", err.message || "Please review the form and try again.");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div style={styles.container}>
      <div style={styles.card}>
        <h2 style={styles.title}>➕ Add Resource</h2>

        {notice ? (
          <div
            style={{
              ...styles.notice,
              ...(notice.tone === "success"
                ? styles.noticeSuccess
                : notice.tone === "error"
                ? styles.noticeError
                : styles.noticeInfo),
            }}
          >
            <div>
              <div style={styles.noticeTitle}>{notice.title}</div>
              <div style={styles.noticeMessage}>{notice.message}</div>
            </div>

            <button
              type="button"
              onClick={() => setNotice(null)}
              style={styles.noticeDismiss}
              aria-label="Dismiss alert"
            >
              ×
            </button>
          </div>
        ) : null}

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
          <button onClick={handleSave} style={styles.saveBtn} disabled={isSaving}>
            {isSaving ? "Saving..." : "💾 Save"}
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
              <button onClick={handleCreateCategory} style={{ ...styles.quickAddBtn, background: '#10b981' }} disabled={isCreatingCategory}>
                {isCreatingCategory ? "..." : "Add"}
              </button>
            </div>
          </div>

          <div style={{ flex: 1, minWidth: 0, background: '#fbfafb', padding: 12, borderRadius: 10 }}>
            <div style={{ fontSize: 13, color: '#374151', fontWeight: 700, marginBottom: 8 }}>Add Location</div>
            <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
              <input value={newLocationName} onChange={(e) => setNewLocationName(e.target.value)} placeholder="Location name" style={{ ...styles.input, padding: '10px', flex: 1, minWidth: 0 }} />
              <input value={newLocationCode} onChange={(e) => setNewLocationCode(e.target.value)} placeholder="Code" style={{ ...styles.input, padding: '10px', width: 140, minWidth: 0 }} />
              <button onClick={handleCreateLocation} style={{ ...styles.quickAddBtn, background: '#2563eb' }} disabled={isCreatingLocation}>
                {isCreatingLocation ? "..." : "Add"}
              </button>
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

  notice: {
    marginBottom: "18px",
    borderRadius: "14px",
    padding: "14px 16px",
    display: "flex",
    alignItems: "flex-start",
    justifyContent: "space-between",
    gap: "12px",
    border: "1px solid transparent",
  },

  noticeSuccess: {
    background: "#ecfdf5",
    borderColor: "#a7f3d0",
    color: "#065f46",
  },

  noticeError: {
    background: "#fef2f2",
    borderColor: "#fecaca",
    color: "#991b1b",
  },

  noticeInfo: {
    background: "#eff6ff",
    borderColor: "#bfdbfe",
    color: "#1d4ed8",
  },

  noticeTitle: {
    fontSize: "14px",
    fontWeight: "700",
    marginBottom: "4px",
  },

  noticeMessage: {
    fontSize: "13px",
    lineHeight: 1.45,
  },

  noticeDismiss: {
    border: "none",
    background: "transparent",
    color: "inherit",
    cursor: "pointer",
    fontSize: "20px",
    lineHeight: 1,
    padding: "0",
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

  quickAddBtn: {
    width: 64,
    padding: "10px 8px",
    borderRadius: 8,
    color: "#fff",
    border: "none",
    cursor: "pointer",
    fontWeight: 600,
  },

  cancelBtn: {
    background: "#e5e7eb",
    padding: "10px 22px",
    borderRadius: "8px",
    border: "none",
    cursor: "pointer",
  },
};
