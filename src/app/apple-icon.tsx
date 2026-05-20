import { ImageResponse } from "next/og";
import { getPipzLogoDataUrl } from "@/lib/pipz-logo";

export const size = {
  width: 180,
  height: 180,
};

export const contentType = "image/png";

export default async function AppleIcon() {
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
          background: "transparent",
        }}
      >
        <img
          src={logoSrc}
          width={180}
          height={180}
          alt=""
          style={{
            width: 180,
            height: 180,
          }}
        />
      </div>
    ),
    size,
  );
}
