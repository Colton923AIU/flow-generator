import * as fs from 'fs';
import * as path from 'path';
import archiver from 'archiver';
import { FlowManifest } from '../models/flow-types';

/**
 * Creates a zip file containing the Power Automate flow definition
 */
export async function createFlowZip(
  flowManifest: FlowManifest,
  outputPath: string
): Promise<string> {
  const outputFilePath = path.resolve(outputPath);
  const outputDir = path.dirname(outputFilePath);
  
  // Create the output directory if it doesn't exist
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }
  
  // Create a write stream for the output zip file
  const output = fs.createWriteStream(outputFilePath);
  const archive = archiver('zip', {
    zlib: { level: 9 } // Maximum compression
  });
  
  // Set up the archiver
  archive.pipe(output);
  
  // Add the manifest.json file
  archive.append(JSON.stringify(flowManifest, null, 2), { name: 'manifest.json' });
  
  // Add the definition.json file (extracted from the manifest)
  archive.append(
    JSON.stringify(flowManifest.properties.definition, null, 2), 
    { name: 'definition.json' }
  );
  
  // Add connections.json if there are connection references
  if (flowManifest.properties.connectionReferences) {
    archive.append(
      JSON.stringify(flowManifest.properties.connectionReferences, null, 2),
      { name: 'connections.json' }
    );
  }
  
  // Finalize the archive
  await archive.finalize();
  
  // Return a promise that resolves when the archive is finalized
  return new Promise((resolve, reject) => {
    output.on('close', () => {
      resolve(outputFilePath);
    });
    
    archive.on('error', (err: Error) => {
      reject(err);
    });
  });
} 