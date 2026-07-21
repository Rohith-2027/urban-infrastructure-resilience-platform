// Phase 3.10.1 - Infrastructure System Audit Script
// This script performs a comprehensive audit of the infrastructure system
// for Phase 3.10.1 implementation verification

const fs = require('fs');
const path = require('path');

console.log('=== INFRASTRUCTURE SYSTEM AUDIT ===');
console.log(`Audit Date: ${new Date().toISOString()}`);
console.log();

const auditResults = {
  layers: { backend: [], frontend: [], metadata: [] },
  compatibility: { backendOnly: [], frontendOnly: [], metadataOnly: [] },
  issues: {
    duplicates: [], orphans: [], unusedMetadata: [], 
    brokenImports: [], deadCode: [], cacheCompat: []
  }
};

// Helper functions
function extractJsonProperty(content, regex) {
  const match = content.match(regex);
  return match ? JSON.parse(match[1]) : null;
}

function extractFromArray(content, fieldName) {
  const pattern = new RegExp(`${fieldName}\s*=\s*\[(.*?)\]`, 's');
  const match = content.match(pattern);
  if (!match) return [];
  
  const items = match[1].split('\n').filter(line => line.trim() && !line.includes('//'));
  return items.map(item => {
    const match = item.match(/"([^"]+)"/);
    return match ? match[1] : null;
  }).filter(item => item);
}

function checkFileExists(filePath) {
  return fs.existsSync(filePath);
}

// 1. BACKEND LAYERS INSPECTION
console.log('1. BACKEND LAYERS INSPECTION:');
const infrastructureServicePath = 'backend/src/services/infrastructure.service.js';
if (checkFileExists(infrastructureServicePath)) {
  const content = fs.readFileSync(infrastructureServicePath, 'utf8');
  
  // Check SUPPORTED_LAYERS
  const supportedLayers = extractFromArray(content, 'SUPPORTED_LAYERS');
  auditResults.layers.backend.push(...supportedLayers);
  supportedLayers.forEach(layer => console.log(`   ✓ ${layer}`));
  
  // Check MANUAL_LAYER_TYPES
  const manualLayerTypes = extractJsonProperty(content, /const MANUAL_LAYER_TYPES = ({.*?});/s);
  if (manualLayerTypes) {
    const manualKeys = Object.keys(manualLayerTypes);
    console.log(`   Manual Layer Types: ${manualKeys.join(', ')}`);
  }
} else {
  console.log(`   ✗ File not found: ${infrastructureServicePath}`);
}

// 2. FRONTEND LAYERS INSPECTION  
console.log('\n2. FRONTEND LAYERS INSPECTION:');
const layerRegistryPath = 'frontend/src/gis/config/layerRegistry.js';
if (checkFileExists(layerRegistryPath)) {
  const content = fs.readFileSync(layerRegistryPath, 'utf8');
  
  // Find all layer entries
  const layerMatches = content.match(/id:\s*'([^']+)'/g);
  if (layerMatches) {
    const frontendLayers = layerMatches.map(m => m.match(/id:\s*'([^']+)'/)[1]);
    auditResults.layers.frontend.push(...frontendLayers);
    frontendLayers.forEach(layer => console.log(`   ✓ ${layer}`));
  }
} else {
  console.log(`   ✗ File not found: ${layerRegistryPath}`);
}

// 3. METADATA INSPECTION
console.log('\n3. METADATA INSPECTION:');
const metadataPath = 'backend/config/infrastructureMetadata.json';
if (checkFileExists(metadataPath)) {
  const metadata = JSON.parse(fs.readFileSync(metadataPath, 'utf8'));
  const metadataLayers = Object.keys(metadata.infrastructureTypes || {});
  auditResults.layers.metadata.push(...metadataLayers);
  metadataLayers.forEach(layer => console.log(`   ✓ ${layer}`));
  
  // Check for unused metadata
  const supportedLayersSet = new Set(auditResults.layers.backend);
  const metadataOnly = metadataLayers.filter(layer => !supportedLayersSet.has(layer));
  if (metadataOnly.length > 0) {
    console.log(`   ⚠️ Metadata-only layers (potentially unused): ${metadataOnly.join(', ')}`);
  }
} else {
  console.log(`   ✗ File not found: ${metadataPath}`);
}

// 4. API MAPPING INSPECTION
console.log('\n4. API MAPPING INSPECTION:');
const apiPath = 'frontend/src/config/api.js';
if (checkFileExists(apiPath)) {
  const content = fs.readFileSync(apiPath, 'utf8');
  const mappingMatches = content.match(/'([^']+)':\s*'([^']+)'/g);
  if (mappingMatches) {
    mappingMatches.forEach(mapping => {
      const [_, key, value] = mapping.match(/'([^']+)':\s*'([^']+)'/);
      console.log(`   ✓ ${key} -> ${value}`);
    });
  }
} else {
  console.log(`   ✗ File not found: ${apiPath}`);
}

// 5. OVERPASS QUERIES INSPECTION
console.log('\n5. OVERPASS QUERIES INSPECTION:');
const overpassServicePath = 'backend/src/services/overpass.service.js';
if (checkFileExists(overpassServicePath)) {
  const content = fs.readFileSync(overpassServicePath, 'utf8');
  
  const queryRegex = /'([^']+)':\s*\(function.*?\);/g;
  const queries = content.match(queryRegex);
  if (queries) {
    const queryLayers = queries.map(q => {
      const match = q.match(/'([^']+)':/);
      return match ? match[1] : null;
    });
    queryLayers.forEach(layer => {
      if (layer) console.log(`   ✓ ${layer}`);
    });
  }
} else {
  console.log(`   ✗ File not found: ${overpassServicePath}`);
}

// 6. ADAPTER INSPECTION
console.log('\n6. ADAPTER INSPECTION:');
const adapterPath = 'frontend/src/infrastructure/services/infrastructureService.js';
if (checkFileExists(adapterPath)) {
  const content = fs.readFileSync(adapterPath, 'utf8');
  
  const adapterRegex = /const standardizationAdapter = \s*({[^}]+});/s;
  const adapterMatch = content.match(adapterRegex);
  if (adapterMatch) {
    const adapterText = adapterMatch[1];
    const adapterLayers = adapterText.match(/\"([^\"]+)\"/g);
    if (adapterLayers) {
      adapterLayers.forEach(layer => {
        const key = layer.replace(/\"/g, '');
        console.log(`   ✓ ${key}`);
      });
    }
  }
} else {
  console.log(`   ✗ File not found: ${adapterPath}`);
}

// 7. COMPATIBILITY ANALYSIS
console.log('\n7. COMPATIBILITY ANALYSIS:');
const allLayers = [...new Set([...auditResults.layers.backend, ...auditResults.layers.frontend, ...auditResults.layers.metadata])];
const expectedLayers = [
  'roads', 'hospitals', 'fireStations', 'policeStations', 
  'powerSubstations', 'waterInfrastructure', 
  'education', 'communication', 'trafficManagement'
];

const backendOnly = auditResults.layers.backend.filter(l => 
  !auditResults.layers.frontend.includes(l) && !auditResults.layers.metadata.includes(l)
);
const frontendOnly = auditResults.layers.frontend.filter(l => 
  !auditResults.layers.backend.includes(l) && !auditResults.layers.metadata.includes(l)
);
const metadataOnly = auditResults.layers.metadata.filter(l => 
  !auditResults.layers.backend.includes(l) && !auditResults.layers.frontend.includes(l)
);

auditResults.compatibility.backendOnly = backendOnly;
auditResults.compatibility.frontendOnly = frontendOnly;
auditResults.compatibility.metadataOnly = metadataOnly;

if (backendOnly.length > 0) {
  console.log(`   ⚠️ Backend-only layers: ${backendOnly.join(', ')}`);
}
if (frontendOnly.length > 0) {
  console.log(`   ⚠️ Frontend-only layers: ${frontendOnly.join(', ')}`);
}
if (metadataOnly.length > 0) {
  console.log(`   ⚠️ Metadata-only layers: ${metadataOnly.join(', ')}`);
}

// 8. DUPLICATE DETECTION
console.log('\n8. DUPLICATE DETECTION:');
const duplicateLayers = allLayers.filter((layer, index) => allLayers.indexOf(layer) !== index);
const uniqueDuplicates = [...new Set(duplicateLayers)];
if (uniqueDuplicates.length > 0) {
  console.log(`   ⚠️ Duplicate layer IDs: ${uniqueDuplicates.join(', ')}`);
  auditResults.issues.duplicates = uniqueDuplicates;
} else {
  console.log('   ✓ No duplicate layer IDs found');
}

// 9. MISSING LAYERS REPORT
console.log('\n9. MISSING LAYERS REPORT:');
const missingInBackend = expectedLayers.filter(l => !allLayers.includes(l));
if (missingInBackend.length > 0) {
  console.log(`   ⚠️ Missing expected layers: ${missingInBackend.join(', ')}`);
} else {
  console.log('   ✓ All expected layers present');
}

// 10. INTEGRATION VERIFICATION
console.log('\n10. INTEGRATION VERIFICATION:');
const integrationResults = {};
expectedLayers.forEach(layer => {
  const backendIntegrated = auditResults.layers.backend.includes(layer);
  const frontendIntegrated = auditResults.layers.frontend.includes(layer);
  const metadataIntegrated = auditResults.layers.metadata.includes(layer);
  
  integrationResults[layer] = {
    backend: backendIntegrated,
    frontend: frontendIntegrated,
    metadata: metadataIntegrated,
    fullyIntegrated: backendIntegrated && frontendIntegrated && metadataIntegrated
  };
  
  const status = integrationResults[layer].fullyIntegrated ? '✓' : '✗';
  console.log(`   ${status} ${layer}: Backend=${backendIntegrated}, Frontend=${frontendIntegrated}, Metadata=${metadataIntegrated}`);
});

// FINAL SUMMARY
console.log('\n' + '='.repeat(60));
console.log('AUDIT SUMMARY:');
console.log('='.repeat(60));

const fullyIntegratedLayers = Object.entries(integrationResults)
  .filter(([_, status]) => status.fullyIntegrated)
  .map(([layer, _]) => layer);

const integrationRate = (fullyIntegratedLayers.length / expectedLayers.length * 100).toFixed(1);

console.log(`Total expected layers: ${expectedLayers.length}`);
console.log(`Fully integrated layers: ${fullyIntegratedLayers.length}`);
console.log(`Integration rate: ${integrationRate}%`);

// Save audit results
try {
  const auditJsonPath = 'backend/audit-results.json';
  fs.writeFileSync(auditJsonPath, JSON.stringify({
    timestamp: new Date().toISOString(),
    summary: {
      totalLayers: expectedLayers.length,
      integratedLayers: fullyIntegratedLayers.length,
      integrationRate: `${integrationRate}%"
    },
    layers: integrationResults,
    issues: auditResults.issues,
    compatibility: auditResults.compatibility
  }, null, 2));
  console.log(`\nAudit results saved to: ${auditJsonPath}`);
} catch (error) {
  console.log(`\nFailed to save audit results: ${error.message}`);
}

if (fullyIntegratedLayers.length === expectedLayers.length) {
  console.log('\n' + '='.repeat(60));
  console.log('INFRASTRUCTURE SYSTEM STATUS:');
  console.log('✓ Ready for Dependency Graph Modeling');
  console.log('='.repeat(60));
  console.log('\nAll infrastructure layers are fully integrated and ready for use.');
} else {
  console.log('\n' + '='.repeat(60));
  console.log('INFRASTRUCTURE SYSTEM STATUS:');
  console.log('✗ Issues Remaining');
  console.log('='.repeat(60));
  
  console.log('\nISSUES IDENTIFIED:');
  
  if (backendOnly.length > 0) {
    console.log(`- Backend-only layers: ${backendOnly.join(', ')}`);
  }
  if (frontendOnly.length > 0) {
    console.log(`- Frontend-only layers: ${frontendOnly.join(', ')}`);
  }
  if (metadataOnly.length > 0) {
    console.log(`- Metadata-only layers: ${metadataOnly.join(', ')}`);
  }
  if (missingInBackend.length > 0) {
    console.log(`- Missing expected layers: ${missingInBackend.join(', ')}`);
  }
  if (uniqueDuplicates.length > 0) {
    console.log(`- Duplicate layer IDs: ${uniqueDuplicates.join(', ')}`);
  }
}
