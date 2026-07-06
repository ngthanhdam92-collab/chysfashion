import { ImageResponse } from "next/og";

export const size = { width: 180, height: 180 };
export const contentType = "image/png";

export default function AppleIcon() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          backgroundColor: "#1a1814",
          borderRadius: 40,
        }}
      >
        <span
          style={{
            fontSize: 110,
            color: "#e8e4dc",
            fontWeight: 700,
            lineHeight: 1,
            marginBottom: -8,
          }}
        >
          C
        </span>
        <span
          style={{
            fontSize: 22,
            color: "#9a9691",
            letterSpacing: 8,
            marginTop: 4,
          }}
        >
          ADMIN
        </span>
      </div>
    ),
    { ...size }
  );
}
