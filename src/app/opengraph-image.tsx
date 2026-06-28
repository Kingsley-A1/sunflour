import { ImageResponse } from "next/og";

export const alt = "Sunflour Bakery — fresh breads, cakes, and pastries";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function OpengraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          padding: "80px",
          backgroundColor: "#fff8ec",
          color: "#24150d",
          fontFamily: "sans-serif",
        }}
      >
        <div
          style={{
            fontSize: 40,
            fontWeight: 700,
            color: "#b22416",
            letterSpacing: "0.04em",
            textTransform: "uppercase",
          }}
        >
          Sunflour Bakery
        </div>
        <div
          style={{
            fontSize: 74,
            fontWeight: 800,
            lineHeight: 1.05,
            marginTop: 24,
            maxWidth: 900,
          }}
        >
          Fresh breads, celebration cakes & everyday pastries
        </div>
        <div
          style={{
            fontSize: 34,
            color: "#6f4b33",
            marginTop: 28,
          }}
        >
          Order in Calabar — pickup or delivery
        </div>
      </div>
    ),
    size,
  );
}
