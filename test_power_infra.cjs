const polygon = "13.3329 77.097095 13.325913 77.118135 13.3202 77.12981 13.312004 77.133769 13.30965 77.139857 13.313145 77.147468 13.318241 77.146949 13.344825 77.124992 13.344645 77.115494 13.346659 77.112026 13.349673 77.10445 13.345483 77.092939 13.3329 77.097095";

const queries = {
  "power-substation": `[out:json][timeout:30];node["power"="substation"](poly:"${polygon}");out count;`,
  "power transformer": `[out:json][timeout:30];node["power"="transformer"](poly:"${polygon}");out count;`,
  "power line": `[out:json][timeout:30];way["power"="line"](poly:"${polygon}");out count;`,
  "power minor_line": `[out:json][timeout:30];way["power"="minor_line"](poly:"${polygon}");out count;`,
  "power tower": `[out:json][timeout:30];node["power"="tower"](poly:"${polygon}");out count;`,
  "power pole": `[out:json][timeout:30];node["power"="pole"](poly:"${polygon}");out count;`
};

async function testOverpass(queryName, query) {
  try {
    const response = await fetch("https://overpass.kumi.systems/api/interpreter", {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded;charset=UTF-8",
        "User-Agent": "Urban-Infrastructure-Test/1.0"
      },
      body: `data=${encodeURIComponent(query)}`,
      signal: AbortSignal.timeout(25000)
    });
    if (!response.ok) return { error: `HTTP ${response.status}` };
    const data = await response.json();
    const count = data.elements?.[0]?.tags?.total || 0;
    return { success: true, count };
  } catch (e) {
    return { error: e.message };
  }
}

(async () => {
  console.log("=== POWER INFRASTRUCTURE INVESTIGATION ===\n");
  
  for (const [tag, query] of Object.entries(queries)) {
    const result = await testOverpass(tag, query);
    console.log(`${tag}: ${result.error ? 'Missing - ' + result.error : result.count + ' features'}`);
  }
})();