const polygon = "13.3329 77.097095 13.325913 77.118135 13.3202 77.12981 13.312004 77.133769 13.30965 77.139857 13.313145 77.147468 13.318241 77.146949 13.344825 77.124992 13.344645 77.115494 13.346659 77.112026 13.349673 77.10445 13.345483 77.092939 13.3329 77.097095";

const waterTags = [
  { name: "Water Treatment Plants", query: `[out:json][timeout:30];node["amenity"="water_treatment_plant"](poly:"${polygon}");out count;` },
  { name: "Water Treatment Plants (alt)", query: `[out:json][timeout:30];node["amenity"="treatment_plant"](poly:"${polygon}");out count;` },
  { name: "Water Reservoirs (natural water)", query: `[out:json][timeout:30];way["natural"="water"](poly:"${polygon}");out count;` },
  { name: "Water Storage Tanks", query: `[out:json][timeout:30];node["amenity"="water_tank"](poly:"${polygon}");out count;` },
  { name: "Water Pumping Stations", query: `[out:json][timeout:30];node["power"="pumping_station"](poly:"${polygon}");out count;` },
  { name: "Drinking Water Supply", query: `[out:json][timeout:30];node["amenity"="drinking_water"](poly:"${polygon}");out count;` },
  { name: "Water Distribution", query: `[out:json][timeout:30];node["waterway"="distributor"](poly:"${polygon}");out count;` }
];

async function testOverpass(queryName, query) {
  try {
    const res = await fetch("https://overpass.kumi.systems/api/interpreter", {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded;charset=UTF-8",
        "User-Agent": "Urban-Infrastructure-Test/1.0"
      },
      body: `data=${encodeURIComponent(query)}`,
      signal: AbortSignal.timeout(25000)
    });
    if (!res.ok) return { error: `HTTP ${res.status}` };
    const data = await res.json();
    const count = data.elements?.[0]?.tags?.total || 0;
    return { success: true, count, fullData: data };
  } catch (e) {
    return { error: e.message };
  }
}

(async () => {
  console.log("=== WATER INFRASTRUCTURE INVESTIGATION ===\n");
  
  for (const tag of waterTags) {
    const result = await testOverpass(tag.name, tag.query);
    console.log(`${tag.name}:`);
    if (result.error) {
      console.log(`  Missing - ${result.error}`);
    } else if (result.count > 0) {
      console.log(`  ${result.count} feature(s) found`);
      if (result.fullData?.elements?.length > 0 && !result.count) {
        console.log(`    - Elements returned: ${result.fullData.elements.length}`);
        result.fullData.elements.forEach((el, i) => {
          if (el.tags) {
            console.log(`      ${i+1}: ${el.type}/${el.id} ${JSON.stringify(el.tags)}`);
          }
        });
      }
    } else {
      console.log(`  No features found");"
  }
})();