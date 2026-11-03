import { ImageResponse } from "next/og";

export const alt = "CodAbhi SEO — automated SEO audit tool and weekly Google rank reports";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function OpenGraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          padding: 64,
          background: "linear-gradient(135deg, #0b1117 0%, #15202b 50%, #1a1030 100%)",
          color: "#f4f7fb",
          fontFamily: "system-ui, sans-serif",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
          <div
            style={{
              width: 56,
              height: 56,
              borderRadius: 12,
              border: "2px solid rgba(34,211,238,0.5)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: 22,
              fontWeight: 700,
            }}
          >
            <span style={{ display: "flex", color: "#22d3ee" }}>C</span>
            <span style={{ display: "flex", color: "#a78bfa" }}>A</span>
          </div>
          <div style={{ display: "flex", fontSize: 28, fontWeight: 700 }}>
            <span style={{ color: "#22d3ee" }}>Cod</span>
            <span>Abhi SEO</span>
          </div>
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          <div
            style={{
              display: "flex",
              fontSize: 52,
              fontWeight: 800,
              lineHeight: 1.15,
              maxWidth: 980,
            }}
          >
            Weekly reports. Live Google rank. Continuous SEO monitoring.
          </div>
          <div style={{ display: "flex", fontSize: 24, color: "#8b9bb0", maxWidth: 900 }}>
            Automated SEO audit tool for agencies — white label client reports and SERP rank
            improvement.
          </div>
        </div>
      </div>
    ),
    { ...size }
  );
}
