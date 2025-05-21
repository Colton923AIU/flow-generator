import * as fs from 'fs';
import * as path from 'path';
// Use require and the stubbed module for AdmZip
const AdmZip: typeof import('adm-zip').default = require('adm-zip');
import { exportFlowPackage } from './export-package';

describe('exportFlowPackage', () => {
  const tempDir = path.join(__dirname, 'test-output');
  const jsonFile = path.join(tempDir, 'dummy-flow.json');
  const flowId = 'dummy-guid';

  beforeAll(() => {
    // Clean and setup temporary directory
    if (fs.existsSync(tempDir)) {
      fs.rmSync(tempDir, { recursive: true, force: true });
    }
    fs.mkdirSync(tempDir, { recursive: true });

    // Create a minimal dummy flow manifest JSON
    const dummyManifest = {
      id: `/providers/Microsoft.Flow/flows/${flowId}`,
      name: 'dummy-flow',
      type: 'Microsoft.Flow/flows',
      properties: {
        apiId: '/providers/Microsoft.PowerApps/apis/shared_logicflows',
        displayName: 'Dummy Flow',
        description: 'A test flow',
        definition: {
          $schema: '',
          contentVersion: '',
          triggers: {},
          actions: {}
        }
      }
    };
    fs.writeFileSync(jsonFile, JSON.stringify(dummyManifest, null, 2));
  });

  it('includes Microsoft.Flow/manifest.json in the package zip', async () => {
    // Export the flow package into tempDir
    await exportFlowPackage('dummy-flow', 'A test flow', jsonFile, tempDir);
    const zipPath = path.join(tempDir, `${flowId}.zip`);
    expect(fs.existsSync(zipPath)).toBe(true);

    // Open the zip and inspect entries
    const zip = new AdmZip(zipPath);
    const entries = zip.getEntries().map((e: { entryName: string }) => e.entryName);

    // Root files
    expect(entries).toContain('manifest.json');
    expect(entries).toContain('[Content_Types].xml');

    // Microsoft.Flow folder manifest
    expect(entries).toContain('Microsoft.Flow/manifest.json');
    
    // Flow definition and maps
    const basePath = `Microsoft.Flow/flows/${flowId}`;
    expect(entries).toContain(`${basePath}/definition.json`);
    expect(entries).toContain(`${basePath}/apisMap.json`);
    expect(entries).toContain(`${basePath}/connectionsMap.json`);
  });
}); 