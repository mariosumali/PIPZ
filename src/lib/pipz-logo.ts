import { readFile } from "node:fs/promises";
import { join } from "node:path";

export async function getPipzLogoDataUrl() {
  const logoData = await readFile(
    join(process.cwd(), "public/pipz-logo.png"),
    "base64",
  );

  return `data:image/png;base64,${logoData}`;
}
