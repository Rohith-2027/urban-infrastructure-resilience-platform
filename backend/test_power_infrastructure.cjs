async function queryPowerLayer(layerName, query) {
  const url = "https://overpass.kumi.systems/api/interpreter";
  const body = `data=${encodeURIComponent(query)}`;
  try {
    const res = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded;charset=UTF-8",
        "User-Agent": "Urban-Infrastructure-Test/1.0"
      },
      body
    });
    return await res.json();
  } catch (err) {
    return { error: err.message };
  }
}

const polygon = "13.3329 77.097095 13.325913 77.118135 13.3202 77.12981 13.312004 77.133769 13.30965 77.139857 13.313145 77.147468 13.318241 77.146949 13.344825 77.124992 13.344645 77.115494 13.346659 77.112026 13.349673 77.10445 13.345483 77.092939 13.3329 77.097095";

const tests = [
  { name: "power-substation (node)", query: `[out:json][timeout:30];node["power"="substation"](poly:"${polygon}");out count;` },
  { name: "power transformer (node)", query: `[out:json][timeout:30];node["power"="transformer"](poly:"${polygon}");out count;` },
  { name: "power line (way)", query: `[out:json][timeout:30];way["power"="line"](poly:"${polygon}");out count;` },
  { name: "power minor_line (way)", query: `[out:json][timeout:30];way["power"="minor_line"](poly:"${polygon}");out count;` },
  { name: "power tower (node)", query: `[out:json][timeout:30];node["power"="tower"](poly:"${polygon}");out count;` },
  { name: "power pole (node)", query: `[out:json][timeout:30];node["power"="pole"](poly:"${polygon}");out count;` },
];

(async () => {
  console.log("=== POWER INFRASTRUCTURE INVESTIGATION ===\n");
  for (const test of tests) {
    const result = await queryPowerLayer(test.name, test.query);
    const elements = result.elements || [];
    const count = result.elements?.[0]?.tags?.total ?? 0;
    console.log(`${test.name}: ${count} features${elements.length > 0 && !count ? ' (elements returned)' : ''}`);
    if (count > 0 && elements.length > 0) {
      const uniqueIds = new Set(elements.map(e => e.id)).size;
      console.log(`   - ${uniqueIds} unique object(s)`);
    }
    if (result.error) {
      console.log(`   - Error: ${result.error}`);
    }
  }
})();