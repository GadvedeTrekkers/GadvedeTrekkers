export default function ProductCardSkeleton({ count = 4 }) {
  return (
    <>
      <style>{`
        @keyframes gt-shimmer {
          0%   { background-position: -400px 0; }
          100% { background-position: 400px 0; }
        }
        .gt-skeleton {
          background: linear-gradient(90deg, #f0f0f0 25%, #e0e0e0 50%, #f0f0f0 75%);
          background-size: 800px 100%;
          animation: gt-shimmer 1.4s infinite linear;
          border-radius: 8px;
        }
      `}</style>
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} style={{
          borderRadius: 14, overflow: "hidden",
          boxShadow: "0 2px 12px rgba(0,0,0,0.07)",
          background: "#fff",
        }}>
          <div className="gt-skeleton" style={{ height: 200, width: "100%" }} />
          <div style={{ padding: "14px 16px 18px", display: "flex", flexDirection: "column", gap: 10 }}>
            <div className="gt-skeleton" style={{ height: 18, width: "70%", borderRadius: 6 }} />
            <div className="gt-skeleton" style={{ height: 13, width: "50%", borderRadius: 6 }} />
            <div className="gt-skeleton" style={{ height: 13, width: "40%", borderRadius: 6 }} />
            <div className="gt-skeleton" style={{ height: 36, width: "60%", borderRadius: 20, marginTop: 4 }} />
          </div>
        </div>
      ))}
    </>
  );
}
