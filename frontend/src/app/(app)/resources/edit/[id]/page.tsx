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
    const payload = {
      ...form,
      capacity: form.capacity ? Number(form.capacity) : null,
      resourceCategoryId: Number(form.categoryId),
      locationId: Number(form.locationId),
    };

    try {
      await updateResource(Number(id), payload);
      alert("Updated successfully ✅");
      router.push("/resources");
    } catch (err: any) {
      alert(err.message);
    }
  };

  return (
    <div style={{ padding: "20px" }}>
      <h2>Edit Resource</h2>

      <input name="name" value={form.name} onChange={handleChange} placeholder="Name" />
      <input name="resourceCode" value={form.resourceCode} onChange={handleChange} placeholder="Code" />
      <input name="description" value={form.description} onChange={handleChange} placeholder="Description" />
      <input name="capacity" value={form.capacity} onChange={handleChange} placeholder="Capacity" />

      <select name="categoryId" value={form.categoryId} onChange={handleChange}>
        <option value="">Category</option>
        {categories.map((c: any) => (
          <option key={c.id} value={c.id}>{c.name}</option>
        ))}
      </select>

      <select name="locationId" value={form.locationId} onChange={handleChange}>
        <option value="">Location</option>
        {locations.map((l: any) => (
          <option key={l.id} value={l.id}>{l.name}</option>
        ))}
      </select>

      <input name="notes" value={form.notes} onChange={handleChange} placeholder="Notes" />
      <input name="imageUrl" value={form.imageUrl} onChange={handleChange} placeholder="Image URL" />

      <br /><br />

      <button onClick={handleUpdate}>Update</button>
      <button onClick={() => router.push("/resources")}>Cancel</button>
    </div>
  );
}