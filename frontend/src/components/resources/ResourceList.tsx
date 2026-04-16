export default function ResourceList({ resources }: any) {
  return (
    <div>
      {resources.map((r: any) => (
        <div
          key={r.id}
          style={{
            border: "1px solid #ddd",
            padding: "15px",
            marginBottom: "10px",
            borderRadius: "10px"
          }}
        >
          <h3>{r.name}</h3>
          <p>Code: {r.resourceCode}</p>
          <p>Category: {r.categoryName}</p>
          <p>Location: {r.locationName}</p>
          <p>Capacity: {r.capacity}</p>
          <p>Status: {r.status}</p>
        </div>
      ))}
    </div>
  )
}