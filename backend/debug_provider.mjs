import { readFileSync } from "fs";
import { fileURLToPath } from "url";
import { dirname, join } from "path";

const __dirname = dirname(fileURLToPath(import.meta.url));
const src = readFileSync(join(__dirname, "..", "frontend", "src", "gis", "config", "layerRegistry.js"), "utf-8");

const layers = ["hospitals","fireStations","policeStations","powerSubstations","waterInfrastructure","education","emergencyServices","roads"];

for (const l of layers) {
  const re = new RegExp(`\\bid: "${l}"[,}]`);
  const m = re.exec(src);
  console.log(`${l}: match=${!!m} idx=${m ? m.index : -1}`);
  if (m) {
    const slice = src.slice(m.index, m.index + 500);
    console.log(`  first 100: ${JSON.stringify(slice.slice(0, 100))}`);
    console.log(`  has provider: ${/provider:/.test(slice)}`);
  } else {
    // Try alternative pattern
    const re2 = new RegExp(`id: "${l}"`);
    const m2 = re2.exec(src);
    console.log(`  (alt) match idx=${m2 ? m2.index : -1}`);
  }
}
