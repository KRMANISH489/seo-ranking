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
          background: "linear-gradient(145deg, #f8fafc 0%, #eef4ff 55%, #e8faf6 100%)",
          color: "#0b1220",
          fontFamily: "system-ui, sans-serif",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
          <div
            style={{
              width: 56,
              height: 56,
              borderRadius: 16,
              background: "linear-gradient(145deg, #0a84ff, #00b39a)",
              display: "flex",
              alignItems: "flex-end",
              justifyContent: "center",
              gap: 4,
              paddingBottom: 14,
            }}
          >
            <div style={{ width: 7, height: 12, background: "white", borderRadius: 2, opacity: 0.55 }} />
            <div style={{ width: 7, height: 18, background: "white", borderRadius: 2, opacity: 0.8 }} />
            <div style={{ width: 7, height: 26, background: "white", borderRadius: 2 }} />
          </div>
          <div style={{ display: "flex", fontSize: 30, fontWeight: 800 }}>
            <span>CodAbhi</span>
            <span style={{ marginLeft: 10, color: "#0a84ff" }}>SEO</span>
          </div>
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          <div style={{ display: "flex", fontSize: 52, fontWeight: 800, lineHeight: 1.12, maxWidth: 980 }}>
            Rank tracking & weekly reports on autopilot
          </div>
          <div style={{ display: "flex", fontSize: 24, color: "#5b6b7c", maxWidth: 900 }}>
            Automated SEO audit tool for agencies — white label client reports and SERP rank
            improvement.
          </div>
        </div>
      </div>
    ),
    { ...size }
  );
}
