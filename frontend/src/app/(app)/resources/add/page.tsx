"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  createResource,
  getCategories,
  getLocations,
} from "@/lib/resources/api";

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
    loadDropdowns();
  }, []);

  const loadDropdowns = async () => {
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

  const handleSubmit = async () => {
    try {
      await createResource({
        ...form,
        capacity: Number(form.capacity),
        resourceCategoryId: Number(form.categoryId),
        locationId: Number(form.locationId),
        status: "ACTIVE",
        requiresApproval: true,
      });

      alert("Resource Added ✅");
      router.push("/resources"); // 🔥 go back
    } catch (err: any) {
      alert(err.message);
    }
  };

  return (
    <div style={{ padding: "20px" }}>
      <h2>Add Resource</h2>

      <input name="name" placeholder="Name" onChange={handleChange} />
      <input name="resourceCode" placeholder="Code" onChange={handleChange} />
      <input name="description" placeholder="Description" onChange={handleChange} />
      <input name="capacity" placeholder="Capacity" onChange={handleChange} />

      <select name="categoryId" onChange={handleChange}>
        <option value="">Category</option>
        {categories.map((c) => (
          <option key={c.id} value={c.id}>{c.name}</option>
        ))}
      </select>

      <select name="locationId" onChange={handleChange}>
        <option value="">Location</option>
        {locations.map((l) => (
          <option key={l.id} value={l.id}>{l.name}</option>
        ))}
      </select>

      <input name="notes" placeholder="Notes" onChange={handleChange} />
      <input name="imageUrl" placeholder="Image URL" onChange={handleChange} />

      <br /><br />
      <button onClick={handleSubmit}>Save</button>
      <button onClick={() => router.push("/resources")}>Cancel</button>
    </div>
  );
}