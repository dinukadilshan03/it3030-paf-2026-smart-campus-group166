"use client";

import React from "react";

type Props = {
  errors?: string[];
  success?: string | null;
  onClose?: () => void;
};

export default function FormMessages({ errors, success, onClose }: Props) {
  if ((!errors || errors.length === 0) && !success) return null;

  return (
    <div style={{ marginBottom: 16 }}>
      {success && (
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#ecfdf5', border: '1px solid #34d399', color: '#065f46', padding: 12, borderRadius: 10 }}>
          <div style={{ fontWeight: 600 }}>{success}</div>
          <button onClick={onClose} style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: '#065f46' }}>✕</button>
        </div>
      )}

      {errors && errors.length > 0 && (
        <div style={{ background: '#fff1f2', border: '1px solid #fecaca', color: '#7f1d1d', padding: 12, borderRadius: 10 }}>
          <div style={{ fontWeight: 700, marginBottom: 8 }}>Please fix the following</div>
          <ul style={{ margin: 0, paddingLeft: 18 }}>
            {errors.map((e, i) => (
              <li key={i} style={{ marginBottom: 6 }}>{e}</li>
            ))}
          </ul>
          <div style={{ textAlign: 'right', marginTop: 8 }}>
            <button onClick={onClose} style={{ background: '#7f1d1d', color: '#fff', border: 'none', padding: '6px 10px', borderRadius: 8, cursor: 'pointer' }}>Close</button>
          </div>
        </div>
      )}
    </div>
  );
}
