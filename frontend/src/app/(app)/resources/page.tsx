"use client"

import { useEffect, useState } from "react"
import ResourceFilters from "@/components/resources/ResourceFilters"
import ResourceList from "@/components/resources/ResourceList"
import { getResources } from "@/lib/resources/api"

export default function ResourceManagementPage() {
  const [resources, setResources] = useState([])
  const [filters, setFilters] = useState({})

useEffect(() => {
  getResources(filters).then(setResources)
}, [filters])

  return (
    <div style={{ padding: "20px" }}>
      <h1>Resource Management</h1>

      <ResourceFilters onFilterChange={setFilters} />

      <ResourceList resources={resources} />
    </div>
  )
}