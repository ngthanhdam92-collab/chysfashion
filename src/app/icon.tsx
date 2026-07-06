import { ImageResponse } from "next/og";

export const size = { width: 512, height: 512 };
export const contentType = "image/png";

export default function Icon() {
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
        }}
      >
        <span
          style={{
            fontSize: 300,
            color: "#e8e4dc",
            fontWeight: 700,
            lineHeight: 1,
            marginBottom: -20,
          }}
        >
          C
        </span>
        <span
          style={{
            fontSize: 60,
            color: "#9a9691",
            letterSpacing: 20,
          }}
        >
          ADMIN
        </span>
      </div>
    ),
    { ...size }
  );
}
