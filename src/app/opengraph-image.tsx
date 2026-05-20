import { ImageResponse } from "next/og";
import { pipzImageAlt } from "@/lib/pipz-brand";
import { getPipzLogoDataUrl } from "@/lib/pipz-logo";

export const alt = pipzImageAlt;

export const size = {
  width: 1200,
  height: 630,
};

export const contentType = "image/png";

export default async function OpenGraphImage() {
  const logoSrc = await getPipzLogoDataUrl();

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "#000",
          color: "#fff",
          padding: 72,
        }}
      >
        <div
          style={{
            width: "100%",
            height: "100%",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: 50,
            border: "6px solid #fff",
            borderRadius: 56,
            background: "#000",
            padding: "54px 60px",
          }}
        >
          <img
            src={logoSrc}
            width={370}
            height={370}
            alt=""
            style={{
              width: 370,
              height: 370,
            }}
          />
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <div
              style={{
                fontSize: 226,
                lineHeight: 0.9,
                fontWeight: 900,
                letterSpacing: -12,
              }}
            >
              PIPZ
            </div>
          </div>
        </div>
      </div>
    ),
    size,
  );
}
