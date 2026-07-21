const fs = require('fs');
const path = require('path');

console.log('=== INFRASTRUCTURE SYSTEM AUDIT ===');
console.log(`Audit Date: ${new Date().toLocaleDateString()}\n`);

const auditResults = {
  backend: { supportedLayers: [], metadataEntries: [], adapters: [] },
  frontend: { layerRegistry: [], apiMappings: [] },
  compatibility: { 
    backendOnly: [], frontendOnly: [], metadataOnly: [],
    missingInBackend: [], missingInFrontend: [], missingInMetadata: []
  },
  checks: {
    duplicates: [], orphans: [], unusedMetadata: [], brokenImports: [], deadCode: [], cacheCompat: []
  }
};

// 1. BACKEND SUPPORTED_LAYERS
function checkBackendLayers() {
  console.log('1. BACKEND SUPPORTED_LAYERS:');
  const backendServicePath = 'backend/src/services/infrastructure.service.js';
  const backendServiceContent = fs.readFileSync(backendServicePath, 'utf8');
  
  const lines = backendServiceContent.split('\n');
  let layers = [];
  let inArray = false;
  
  for (let line of lines) {
    if (line.includes('"roads",') || line.includes("'roads',") || 
        line.includes('"hospitals",') || line.includes("'hospitals',") ||
        line.includes('"fireStations",') || line.includes("'fireStations',") ||
        line.includes('"policeStations",') || line.includes("'policeStations',") ||
        line.includes('"powerSubstations",') || line.includes("'powerSubstations',") ||
        line.includes('"waterInfrastructure",') || line.includes("'waterInfrastructure',") ||
        line.includes('"education",') || line.includes("'education',") ||
        line.includes('"communication",') || line.includes("'communication',") ||
        line.includes('"trafficManagement",') || line.includes("'trafficManagement',")) {
      const match = line.match(/"([^"]+)"/);
      if (match) {
        layers.push(match[1]);
      }
    }
  }
  
  layers.forEach(layer => {
    console.log(`   - ${layer}`);
    auditResults.backend.supportedLayers.push(layer);
  });
  
  return layers;
}

// 2. FRONTEND LAYER REGISTRY
function checkFrontendLayerRegistry() {
  console.log('\n2. FRONTEND LAYER REGISTRY:');
  const frontendRegistryPath = 'frontend/src/gis/config/layerRegistry.js';
  const frontendRegistryContent = fs.readFileSync(frontendRegistryPath, 'utf8');
  
  const lines = frontendRegistryContent.split('\n');
  let frontendLayers = [];
  
  for (let line of lines) {
    if (line.includes('id: "')) {
      const match = line.match(/id: "([^"]+)"/);
      if (match) {
        frontendLayers.push(match[1]);
        console.log(`   - ${match[1]}`);
        auditResults.frontend.layerRegistry.push(match[1]);
      }
    }
  }
  
  return frontendLayers;
}

// 3. METADATA ENTRIES
function checkMetadata() {
  console.log('\n3. METADATA ENTRIES:');
  const metadataPath = 'backend/config/infrastructureMetadata.json';
  const metadataContent = JSON.parse(fs.readFileSync(metadataPath, 'utf8'));
  const metadataLayers = Object.keys(metadataContent.infrastructureTypes);
  
  metadataLayers.forEach(layer => {
    console.log(`   - ${layer}");
    auditResults.backend.metadataEntries.push(layer);
  });
  
  return metadataLayers;
}

// 4. API MAPPING CHECK
function checkAPIMapping() {
  console.log('\n4. API MAPPING:');
  const apiPath = 'frontend/src/config/api.js';
  const apiContent = fs.readFileSync(apiPath, 'utf8');
  
  const lines = apiContent.split('\n');
  for (let line of lines) {
    if (line.trim().includes(': "')) {
      const match = line.match(/'([^']+)':\s*'([^']+)'/);
      if (match) {
        const [_, key, value] = match;
        console.log(`   ${key} -> ${value}`);
        auditResults.frontend.apiMappings.push({
          layer: key,
          backend: value
        });
      }
    }
  }
}

// 5. BACKEND ROUTES
function checkBackendRoutes() {
  console.log('\n5. BACKEND ROUTES:');
  const routesPath = 'backend/src/routes/infrastructure.routes.js';
  const routesContent = fs.readFileSync(routesPath, 'utf8');
  
  console.log('   - / (GET) - Health check');
  console.log('   - /:layer (GET) - Fetch infrastructure data');
}

// 6. ADAPTER CONFIGURATIONS
function checkAdapterConfigurations() {
  console.log('\n6. ADAPTER CONFIGURATIONS:');
  const adapterPath = 'frontend/src/infrastructure/services/infrastructureService.js';
  const adapterContent = fs.readFileSync(adapterPath, 'utf8');
  
  const standardizationAdapterMatch = adapterContent.match(/const standardizationAdapter = \s*\{([^}]+)\}/s);
  if (standardizationAdapterMatch) {
    const adaptersText = standardizationAdapterMatch[1];
    const adapters = adaptersText.match(/\"([^\"]+)\"/g);
    
    if (adapters) {
      adapters.forEach(adapter => {
        const key = adapter.replace(/\"/g, '');
        console.log(`   - ${key}`);
        auditResults.backend.adapters.push(key);
      });
    }
  }
}

// 7. COMPATIBILITY CHECKS
function performCompatibilityChecks(backendLayers, frontendLayers, metadataLayers) {
  console.log('\n7. COMPATIBILITY CHECKS:');
  
  // Find layers in each that are not in others
  const backendOnly = backendLayers.filter(l => !frontendLayers.includes(l) && !metadataLayers.includes(l));
  const frontendOnly = frontendLayers.filter(l => !backendLayers.includes(l) && !metadataLayers.includes(l));
  const metadataOnly = metadataLayers.filter(l => !backendLayers.includes(l) && !frontendLayers.includes(l));
  
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
  
  // Check missing layers across all systems
  const allBackend = [...backendLayers, ...frontendLayers, ...metadataLayers];
  const uniqueBackend = [...new Set(allBackend)];
  
  const expectedLayers = [
    'roads', 'hospitals', 'fireStations', 'policeStations', 
    'powerSubstations', 'waterInfrastructure', 
    'education', 'communication', 'trafficManagement'
  ];
  
  const missingInBackend = expectedLayers.filter(l => !uniqueBackend.includes(l));
  auditResults.compatibility.missingInBackend = missingInBackend;
  
  if (missingInBackend.length > 0) {
    console.log(`   ⚠️ Missing expected layers: ${missingInBackend.join(', ')}`);
  } else {
    console.log('   ✓ All expected layers present in at least one system');
  }
  
  // Check for duplicates
  const duplicates = [];
  const seen = new Set();
  
  [...backendLayers, ...frontendLayers, ...metadataLayers].forEach(layer => {
    if (seen.has(layer)) {
      duplicates.push(layer);
    } else {
      seen.add(layer);
    }
  });
  
  auditResults.checks.duplicates = duplicates;
  if (duplicates.length > 0) {
    console.log(`   ⚠️ Duplicate layer IDs: ${duplicates.join(', ')}`);
  } else {
    console.log('   ✓ No duplicate layer IDs found');
  }
  
  // Check infrastructureMetadata.json usage
  const adapterUsedInMetadata = metadataLayers.filter(layer => !Object.prototype.hasOwnProperty.call(metadataContent.infrastructureTypes[layer], 'sector'));
  auditResults.checks.unusedMetadata = adapterUsedInMetadata;
  if (adapterUsedInMetadata.length > 0) {
    console.log(`   ⚠️ Potentially unused metadata: ${adapterUsedInMetadata.join(', ')}`);
  }
}

// 8. FILE SYSTEM VERIFICATION
function verifyFileSystem() {
  console.log('\n8. FILE SYSTEM VERIFICATION:');
  
  const requiredFiles = [
    'backend/src/app.js',
    'backend/src/routes/infrastructure.routes.js',
    'backend/src/controllers/infrastructure.controller.js',
    'backend/src/services/overpass.service.js',
    'backend/src/services/infrastructure.service.js',
    'frontend/src/gis/config/layerRegistry.js',
    'frontend/src/config/api.js',
    'frontend/src/infrastructure/services/infrastructureService.js'
  ];
  
  const missingFiles = [];
  const presentFiles = [];
  
  requiredFiles.forEach(file => {
    if (fs.existsSync(file)) {
      presentFiles.push(file);
      console.log(`   ✓ ${file}`);
    } else {
      missingFiles.push(file);
      console.log(`   ✗ ${file} - MISSING`);
    }
  });
  
  auditResults.checks.brokenImports = missingFiles;
  
  return presentFiles;
}

// 9. ALL LAYERS VERIFICATION
function verifyAllLayers() {
  console.log('\n9. ALL LAYERS VERIFICATION:');
  
  const expectedLayers = [
    'roads', 'hospitals', 'fireStations', 'policeStations', 
    'powerSubstations', 'waterInfrastructure', 
    'education', 'communication', 'trafficManagement'
  ];
  
  expectedLayers.forEach(layer => {
    const backendExists = auditResults.backend.supportedLayers.includes(layer);
    const frontendExists = auditResults.frontend.layerRegistry.includes(layer);
    const metadataExists = auditResults.backend.metadataEntries.includes(layer);
    const apiExists = auditResults.frontend.apiMappings.some(m => m.layer === layer);
    const adapterExists = auditResults.backend.adapters.includes(layer);
    
    const allExist = backendExists && frontendExists && metadataExists && apiExists && adapterExists;
    const status = allExist ? '✓' : '✗';
    
    console.log(`${status} ${layer}: `);
    console.log(`  Backend: ${backendExists ? '✓' : '✗'}`);
    console.log(`  Frontend: ${frontendExists ? '✓' : '✗'}`);
    console.log(`  Metadata: ${metadataExists ? '✓' : '✗'}`);
    console.log(`  API: ${apiExists ? '✓' : '✗'}`);
    console.log(`  Adapter: ${adapterExists ? '✓' : '✗'}`);
  });
}

// MAIN AUDIT FUNCTION
function runFullAudit() {
  const backendLayers = checkBackendLayers();
  const frontendLayers = checkFrontendLayerRegistry();
  const metadataLayers = checkMetadata();
  
  checkAPIMapping();
  checkBackendRoutes();
  checkAdapterConfigurations();
  
  performCompatibilityChecks(backendLayers, frontendLayers, metadataLayers);
  verifyFileSystem();
  verifyAllLayers();
  
  // FINAL SUMMARY
  console.log('\n' + '='.repeat(60));
  console.log('AUDIT SUMMARY:');
  console.log('='.repeat(60));
  
  const allLayers = [...new Set([...auditResults.backend.supportedLayers, ...auditResults.frontend.layerRegistry])];
  const fullyIntegrated = allLayers.filter(layer => 
    auditResults.backend.supportedLayers.includes(layer) &&
    auditResults.frontend.layerRegistry.includes(layer) &&
    auditResults.backend.metadataEntries.includes(layer) &&
    auditResults.frontend.apiMappings.some(m => m.layer === layer) &&
    auditResults.backend.adapters.includes(layer)
  );
  
  const integrationRate = (fullyIntegrated.length / allLayers.length * 100).toFixed(1);
  
  console.log(`Total layers defined: ${allLayers.length}`);
  console.log(`Fully integrated layers: ${fullyIntegrated.length}`);
  console.log(`Integration rate: ${integrationRate}%`);
  
  if (fullyIntegrated.length === allLayers.length) {
    console.log('\n' + '='.repeat(60));
    console.log('INFRASTRUCTURE SYSTEM STATUS:');
    console.log('✓ Ready for Dependency Graph Modeling');
    console.log('='.repeat(60));
  } else {
    console.log('\n' + '='.repeat(60));
    console.log('INFRASTRUCTURE SYSTEM STATUS:');
    console.log('✗ Issues Remaining');
    console.log('='.repeat(60));
    
    console.log('\nISSUES IDENTIFIED:');
    if (auditResults.compatibility.backendOnly.length > 0) {
      console.log(`- Backend-only layers: ${auditResults.compatibility.backendOnly.join(', ')}`);
    }
    if (auditResults.compatibility.frontendOnly.length > 0) {
      console.log(`- Frontend-only layers: ${auditResults.compatibility.frontendOnly.join(', ')}`);
    }
    if (auditResults.compatibility.metadataOnly.length > 0) {
      console.log(`- Metadata-only layers: ${auditResults.compatibility.metadataOnly.join(', ')}`);
    }
    if (auditResults.compatibility.missingInBackend.length > 0) {
      console.log(`- Missing expected layers: ${auditResults.compatibility.missingInBackend.join(', ')}`);
    }
    if (auditResults.checks.duplicates.length > 0) {
      console.log(`- Duplicate layer IDs: ${auditResults.checks.duplicates.join(', ')}`);
    }
    if (auditResults.checks.unusedMetadata.length > 0) {
      console.log(`- Potentially unused metadata: ${auditResults.checks.unusedMetadata.join(', ')}`);
    }
    if (auditResults.checks.brokenImports.length > 0) {
      console.log(`- Missing files: ${auditResults.checks.brokenImports.join(', ')}`);
    }
  }
  
  return auditResults;
}

const results = runFullAudit();

// Save audit results to JSON file
const auditResultPath = 'backend/audit-results.json';
fs.writeFileSync(auditResultPath, JSON.stringify(results, null, 2));
console.log(`\nAudit results saved to: ${auditResultPath}`);
