const BASE_URL = "http://localhost:8080/api/v1"

export const getResources = async (filters = {}) => {
  const query = new URLSearchParams(filters).toString()

  const res = await fetch(`${BASE_URL}/resources?${query}`)
  const data = await res.json()

  return Array.isArray(data) ? data : data.data || data.content || []
}

export const getCategories = async () => {
  const res = await fetch(`${BASE_URL}/resource-categories`)
  const data = await res.json()
  return Array.isArray(data) ? data : data.data || data.content || []
}

export const getLocations = async () => {
  const res = await fetch(`${BASE_URL}/locations`)
  return res.json()
}