import { ImageResponse } from "next/og";
import { getPipzLogoDataUrl } from "@/lib/pipz-logo";

export const size = {
  width: 512,
  height: 512,
};

export const contentType = "image/png";

export default async function Icon() {
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
          width={512}
          height={512}
          alt=""
          style={{
            width: 512,
            height: 512,
          }}
        />
      </div>
    ),
    size,
  );
}
