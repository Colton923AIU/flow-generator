import * as fs from 'fs';
import * as path from 'path';
import archiver from 'archiver';
import { v4 as uuidv4 } from 'uuid';

const CONTENT_TYPES_XML = `<?xml version="1.0" encoding="utf-8"?>
<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">
  <Default Extension="json" ContentType="application/json" />
  <Default Extension="xml" ContentType="application/xml" />
</Types>
`;

// Define friendly display names for known connectors
const connectorDisplayNames: Record<string, string> = {
  'shared_sharepointonline': 'SharePoint',
  'shared_sendmail': 'Mail'
};

/**
 * Export a flow package compatible with Power Automate import.
 * Generates a root manifest with resource entries, apisMap.json, connectionsMap.json,
 * [Content_Types].xml, and places the definition.json under Microsoft.Flow/flows/<flowGUID>/definition.json
 */
export async function exportFlowPackage(
  flowName: string,
  description: string,
  jsonFilePath: string,
  outputDir: string = 'output'
) {
  // Read the exported flow manifest JSON
  const flowManifest = JSON.parse(fs.readFileSync(jsonFilePath, 'utf8'));
  const flowPackagingGuid = flowManifest.id.split('/').pop() as string;
  const flowDisplayName = flowManifest.properties.displayName;
  const flowDescription = flowManifest.properties.description || '';

  // Enhance the flow definition with parameters and authentication
  const defObj = flowManifest.properties.definition;
  // Add required parameters for connections and authentication
  defObj.parameters = {
    "$connections": { defaultValue: {}, type: "Object" },
    "$authentication": { defaultValue: {}, type: "SecureObject" }
  };
  // Update each trigger to use OpenApiConnection and inject authentication
  for (const [trigName, trig] of Object.entries(defObj.triggers || {})) {
    const t: any = trig;
    if (t.type === 'ApiConnection') {
      t.type = 'OpenApiConnection';
    }
    t.inputs = t.inputs || {};
    t.inputs.authentication = "@parameters('$authentication')";
  }
  // Update each action to use OpenApiConnection and inject authentication
  for (const [actName, act] of Object.entries(defObj.actions || {})) {
    const a: any = act;
    if (a.type === 'ApiConnection') {
      a.type = 'OpenApiConnection';
    }
    a.inputs = a.inputs || {};
    a.inputs.authentication = "@parameters('$authentication')";
  }

  // Build folder structure
  const flowDir = path.join(outputDir, 'Microsoft.Flow', 'flows', flowPackagingGuid);
  fs.mkdirSync(flowDir, { recursive: true });

  // Prepare connector lists by scanning triggers and actions
  const def = flowManifest.properties.definition;
  const connectors: Record<string, string> = {};

  // Helper: collect from a host object
  const collectHost = (host: any) => {
    if (host && host.connectionName && host.apiId) {
      connectors[host.connectionName] = host.apiId;
    }
  };

  // Collect from triggers
  for (const trig of Object.values(def.triggers || {})) {
    collectHost((trig as any).inputs?.host);
  }

  // Collect from actions (including nested in switch/cases)
  for (const act of Object.values(def.actions || {})) {
    const a: any = act;
    collectHost(a.inputs?.host);
    // If Switch
    if (a.type === 'Switch') {
      // Type cast cases and default cases for Switch actions
      const casesObj = (a.inputs?.cases as Record<string, { actions: any }>) || {};
      for (const c of Object.values(casesObj)) {
        const actionsObj = c.actions as Record<string, any>;
        for (const nested of Object.values(actionsObj)) {
          collectHost((nested as any).inputs?.host);
        }
      }
      const defaultObj = a.inputs?.default as { actions: Record<string, any> } | undefined;
      const defaultActions = defaultObj?.actions || {};
      for (const nested of Object.values(defaultActions)) {
        collectHost((nested as any).inputs?.host);
      }
    }
  }

  // Prepare mapping files and manifest resources
  const apisMap: Record<string,string> = {};
  const connectionsMap: Record<string,string> = {};

  // Root manifest structure
  const rootManifest: any = {
    schema: '1.0',
    details: {
      displayName: flowDisplayName,
      description: flowDescription,
      createdTime: new Date().toISOString(),
      packageTelemetryId: uuidv4(),
      creator: 'N/A',
      sourceEnvironment: ''
    },
    resources: {} as Record<string, any>
  };

  // Add connector API and connection resources
  for (const [connName, apiId] of Object.entries(connectors)) {
    const apiGuid = uuidv4();
    const connGuid = uuidv4();
    apisMap[connName] = apiGuid;
    connectionsMap[connName] = connGuid;
    // API resource
    const friendlyName = connectorDisplayNames[connName] || connName;
    // Placeholder Icon URI - Ideally find the real ones
    const placeholderIconUri = 'https://connectoricons-prod.azureedge.net/releases/v1.0.1611/1.0.1611.3105/default/icon.png';
    rootManifest.resources[apiGuid] = {
      id: apiId,
      name: connName,
      type: 'Microsoft.PowerApps/apis',
      suggestedCreationType: 'Existing',
      details: { 
        displayName: friendlyName,
        iconUri: placeholderIconUri
      },
      configurableBy: 'System',
      hierarchy: 'Child',
      dependsOn: []
    };
    // Connection resource
    rootManifest.resources[connGuid] = {
      type: 'Microsoft.PowerApps/apis/connections',
      suggestedCreationType: 'Existing',
      creationType: 'Existing',
      details: { 
        displayName: friendlyName,
        iconUri: placeholderIconUri
      },
      configurableBy: 'User',
      hierarchy: 'Child',
      dependsOn: [apiGuid]
    };
  }

  // Add flow resource
  const allDeps = [ ...Object.values(apisMap), ...Object.values(connectionsMap) ];
  rootManifest.resources[flowPackagingGuid] = {
    type: 'Microsoft.Flow/flows',
    suggestedCreationType: 'New',
    creationType: 'Existing, New, Update',
    details: { displayName: flowDisplayName },
    configurableBy: 'User',
    hierarchy: 'Root',
    dependsOn: allDeps
  };

  // Write root manifest
  const manifestPath = path.join(outputDir, 'manifest.json');
  fs.writeFileSync(manifestPath, JSON.stringify(rootManifest, null, 2));

  // Write [Content_Types].xml
  const contentTypesPath = path.join(outputDir, '[Content_Types].xml');
  fs.writeFileSync(contentTypesPath, CONTENT_TYPES_XML);

  // Write apisMap.json and connectionsMap.json in flow folder
  const apisMapPath = path.join(flowDir, 'apisMap.json');
  const connectionsMapPath = path.join(flowDir, 'connectionsMap.json');
  fs.writeFileSync(apisMapPath, JSON.stringify(apisMap, null, 2));
  fs.writeFileSync(connectionsMapPath, JSON.stringify(connectionsMap, null, 2));

  // Write the flow manifest (with connectionReferences) as definition.json
  const definitionPath = path.join(flowDir, 'definition.json');
  // Add connectionReferences to the flow manifest
  flowManifest.properties.connectionReferences = {};
  for (const [connName, apiId] of Object.entries(connectors)) {
    flowManifest.properties.connectionReferences[connName] = {
      connection: { id: connectionsMap[connName] },
      api: { id: apiId }
    };
  }
  fs.writeFileSync(definitionPath, JSON.stringify(flowManifest, null, 2));

  // Copy manifest.json into Microsoft.Flow folder for import
  const msFlowRoot = path.join(outputDir, 'Microsoft.Flow');
  fs.copyFileSync(manifestPath, path.join(msFlowRoot, 'manifest.json'));

  // Create zip
  const zipPath = path.join(outputDir, `${flowPackagingGuid}.zip`);
  const output = fs.createWriteStream(zipPath);
  const archive = archiver('zip', { zlib: { level: 9 } });

  return new Promise<void>((resolve, reject) => {
    output.on('close', () => {
      // Cleanup temp files and folders except zip
      fs.rmSync(path.join(outputDir, 'Microsoft.Flow'), { recursive: true, force: true });
      fs.unlinkSync(manifestPath);
      fs.unlinkSync(contentTypesPath);
      resolve();
    });
    archive.on('error', (err: Error) => reject(err));

    archive.pipe(output);
    // Include root manifest and content types
    archive.file(manifestPath, { name: 'manifest.json' });
    archive.file(contentTypesPath, { name: '[Content_Types].xml' });
    
    // Explicitly add the manifest inside Microsoft.Flow
    archive.file(path.join(outputDir, 'Microsoft.Flow', 'manifest.json'), { name: 'Microsoft.Flow/manifest.json' });
    
    // Add the flows subdirectory using directory method
    archive.directory(path.join(outputDir, 'Microsoft.Flow', 'flows'), 'Microsoft.Flow/flows');

    archive.finalize();
  });
} 