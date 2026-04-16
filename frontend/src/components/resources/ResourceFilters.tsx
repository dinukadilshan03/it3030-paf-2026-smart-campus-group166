import { useEffect, useState } from "react"
import { getCategories, getLocations } from "@/lib/resources/api"

export default function ResourceFilters({ onFilterChange }: any) {
  const [categories, setCategories] = useState([])
  const [locations, setLocations] = useState([])
  const [filters, setFilters] = useState({
    search: "",
    categoryId: "",
    locationId: "",
    status: ""
  })

  useEffect(() => {
  getCategories().then(res => {
    console.log("CATEGORIES:", res)
    setCategories(
      Array.isArray(res) ? res : res.data || res.content || []
    )
  })

  getLocations().then(res => {
    console.log("LOCATIONS:", res)
    setLocations(
      Array.isArray(res) ? res : res.data || res.content || []
    )
  })
}, [])

  const handleChange = (e: any) => {
    const newFilters = { ...filters, [e.target.name]: e.target.value }
    setFilters(newFilters)
    onFilterChange(newFilters)
  }

  return (
    <div style={{ display: "flex", gap: "10px", marginBottom: "20px" }}>
      <input
        name="search"
        placeholder="Search..."
        onChange={handleChange}
      />

      <select name="categoryId" onChange={handleChange}>
        <option value="">All Categories</option>
        {categories.map((c: any) => (
          <option key={c.id} value={c.id}>{c.name}</option>
        ))}
      </select>

      <select name="locationId" onChange={handleChange}>
        <option value="">All Locations</option>
        {locations.map((l: any) => (
          <option key={l.id} value={l.id}>{l.name}</option>
        ))}
      </select>

      <select name="status" onChange={handleChange}>
        <option value="">All Status</option>
        <option value="ACTIVE">Active</option>
        <option value="INACTIVE">Inactive</option>
      </select>
    </div>
  )
}