import * as fs from 'fs';
import * as path from 'path';
import archiver from 'archiver';
import { v4 as uuidv4 } from 'uuid';

// Interface for flow definition input
export interface FlowDefinition {
  id: string; // The unique GUID for the workflow entity (used in customizations.xml and solution.xml)
  name: string; // The display name of the flow
  jsonContent: any; // The parsed JSON object of the flow definition
  connectors: Record<string, string>; // Connectors used { connectionName: apiId }
}

// Interface for publisher details
export interface PublisherInfo {
  uniqueName: string;
  localizedName: string;
  prefix: string;
  optionValuePrefix: number; // Typically a 5-digit number
  // Add other publisher fields if needed (email, description etc.)
}

// Interface for solution details
export interface SolutionInfo {
  uniqueName: string;
  localizedName: string;
  version: string; // e.g., "1.0.0.0"
  description?: string;
  managed: boolean; // Whether to export as Managed (true) or Unmanaged (false)
}

/**
 * Exports a Power Platform Solution package (.zip) containing the provided flows.
 * Generates solution.xml, customizations.xml, [Content_Types].xml and Workflows directory.
 */
export async function exportSolutionPackage(
  solutionInfo: SolutionInfo,
  publisherInfo: PublisherInfo,
  flowDefinitions: FlowDefinition[],
  outputDir: string = 'output'
): Promise<void> {
  
  console.log(`Starting solution export for: ${solutionInfo.uniqueName} v${solutionInfo.version}`);

  // --- 1. Prepare Directories ---
  const workflowsDir = path.join(outputDir, 'Workflows');
  fs.mkdirSync(workflowsDir, { recursive: true }); 
  
  // --- 2. Write Flow JSON files ---
  const flowFilePaths: { [id: string]: string } = {}; 
  for (const flowDef of flowDefinitions) {
    // Improved sanitization: replace spaces with underscores, then keep only safe characters
    let sanitizedName = flowDef.name.replace(/\s+/g, '_'); // Replace spaces with underscores
    sanitizedName = sanitizedName.replace(/[^a-zA-Z0-9_-]/g, ''); // Remove any remaining unsafe characters
    
    // Ensure name is not empty after sanitization, use a default if it is
    if (!sanitizedName) {
        sanitizedName = 'flow';
    }

    const guidSuffix = flowDef.id.replace(/[{}]/g, '').toUpperCase(); 
    const filename = `${sanitizedName}-${guidSuffix}.json`;
    const filePath = path.join(workflowsDir, filename);
    fs.writeFileSync(filePath, JSON.stringify(flowDef.jsonContent, null, 2));
    
    // Ensure forward slashes AND leading slash for the path in XML
    flowFilePaths[flowDef.id] = `/Workflows/${filename}`; // Added leading slash
    console.log(`  -> Wrote workflow: ${filename} (path in package: ${flowFilePaths[flowDef.id]})`);
  }

  // --- 3. Generate [Content_Types].xml ---
  const contentTypesXmlContent = `<?xml version="1.0" encoding="utf-8"?>\n<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">\n  <Default Extension="xml" ContentType="application/xml" />\n  <Default Extension="json" ContentType="application/json" />\n</Types>\n`;
  const contentTypesPath = path.join(outputDir, '[Content_Types].xml');
  fs.writeFileSync(contentTypesPath, contentTypesXmlContent);
  console.log(`  -> Wrote [Content_Types].xml`);

  // --- 4. Generate solution.xml ---
  const escapeXml = (unsafe: string): string => 
    unsafe.replace(/[<>&'"]/g, (c) => {
      switch (c) {
        case '<': return '&lt;';
        case '>': return '&gt;';
        case '&': return '&amp;';
        case '\'': return '&apos;';
        case '"': return '&quot;';
        default: return c;
      }
    });

  let rootComponentsXml = '';
  for (const flowDef of flowDefinitions) {
    rootComponentsXml += `      <RootComponent type="29" id="{${flowDef.id.replace(/[{}]/g, '')}}" behavior="0" />\n`;
  }

  const solutionXmlContent = `<?xml version="1.0" encoding="utf-8"?>\n<ImportExportXml version="9.2.0.0" SolutionPackageVersion="9.2" languagecode="1033" generatedBy="FlowCreator" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance">\n  <SolutionManifest>\n    <UniqueName>${escapeXml(solutionInfo.uniqueName)}</UniqueName>\n    <LocalizedNames>\n      <LocalizedName description="${escapeXml(solutionInfo.localizedName)}" languagecode="1033" />\n    </LocalizedNames>\n    <Descriptions>\n      ${solutionInfo.description ? `<Description description="${escapeXml(solutionInfo.description)}" languagecode="1033" />` : ''}\n    </Descriptions>\n    <Version>${escapeXml(solutionInfo.version)}</Version>\n    <Managed>${solutionInfo.managed ? '1' : '0'}</Managed>\n    <Publisher>\n      <UniqueName>${escapeXml(publisherInfo.uniqueName)}</UniqueName>\n      <LocalizedNames>\n        <LocalizedName description="${escapeXml(publisherInfo.localizedName)}" languagecode="1033" />\n      </LocalizedNames>\n      <Descriptions /> \n      <EMailAddress xsi:nil="true"></EMailAddress>\n      <SupportingWebsiteUrl xsi:nil="true"></SupportingWebsiteUrl>\n      <CustomizationPrefix>${escapeXml(publisherInfo.prefix)}</CustomizationPrefix>\n      <CustomizationOptionValuePrefix>${publisherInfo.optionValuePrefix}</CustomizationOptionValuePrefix>\n      <Addresses>\n        <Address>\n          <AddressNumber>1</AddressNumber>\n          <AddressTypeCode>1</AddressTypeCode>\n          <City xsi:nil="true"></City>\n          <County xsi:nil="true"></County>\n          <Country xsi:nil="true"></Country>\n          <Fax xsi:nil="true"></Fax>\n          <FreightTermsCode xsi:nil="true"></FreightTermsCode>\n          <ImportSequenceNumber xsi:nil="true"></ImportSequenceNumber>\n          <Latitude xsi:nil="true"></Latitude>\n          <Line1 xsi:nil="true"></Line1>\n          <Line2 xsi:nil="true"></Line2>\n          <Line3 xsi:nil="true"></Line3>\n          <Longitude xsi:nil="true"></Longitude>\n          <Name xsi:nil="true"></Name>\n          <PostalCode xsi:nil="true"></PostalCode>\n          <PostOfficeBox xsi:nil="true"></PostOfficeBox>\n          <PrimaryContactName xsi:nil="true"></PrimaryContactName>\n          <ShippingMethodCode>1</ShippingMethodCode>\n          <StateOrProvince xsi:nil="true"></StateOrProvince>\n          <Telephone1 xsi:nil="true"></Telephone1>\n          <Telephone2 xsi:nil="true"></Telephone2>\n          <Telephone3 xsi:nil="true"></Telephone3>\n          <TimeZoneRuleVersionNumber xsi:nil="true"></TimeZoneRuleVersionNumber>\n          <UPSZone xsi:nil="true"></UPSZone>\n          <UTCOffset xsi:nil="true"></UTCOffset>\n          <UTCConversionTimeZoneCode xsi:nil="true"></UTCConversionTimeZoneCode>\n        </Address>\n        <Address>\n          <AddressNumber>2</AddressNumber>\n          <AddressTypeCode>1</AddressTypeCode>\n          <City xsi:nil="true"></City>\n          <County xsi:nil="true"></County>\n          <Country xsi:nil="true"></Country>\n          <Fax xsi:nil="true"></Fax>\n          <FreightTermsCode xsi:nil="true"></FreightTermsCode>\n          <ImportSequenceNumber xsi:nil="true"></ImportSequenceNumber>\n          <Latitude xsi:nil="true"></Latitude>\n          <Line1 xsi:nil="true"></Line1>\n          <Line2 xsi:nil="true"></Line2>\n          <Line3 xsi:nil="true"></Line3>\n          <Longitude xsi:nil="true"></Longitude>\n          <Name xsi:nil="true"></Name>\n          <PostalCode xsi:nil="true"></PostalCode>\n          <PostOfficeBox xsi:nil="true"></PostOfficeBox>\n          <PrimaryContactName xsi:nil="true"></PrimaryContactName>\n          <ShippingMethodCode>1</ShippingMethodCode>\n          <StateOrProvince xsi:nil="true"></StateOrProvince>\n          <Telephone1 xsi:nil="true"></Telephone1>\n          <Telephone2 xsi:nil="true"></Telephone2>\n          <Telephone3 xsi:nil="true"></Telephone3>\n          <TimeZoneRuleVersionNumber xsi:nil="true"></TimeZoneRuleVersionNumber>\n          <UPSZone xsi:nil="true"></UPSZone>\n          <UTCOffset xsi:nil="true"></UTCOffset>\n          <UTCConversionTimeZoneCode xsi:nil="true"></UTCConversionTimeZoneCode>\n        </Address>\n      </Addresses>\n    </Publisher>\n    <RootComponents>\n${rootComponentsXml}    </RootComponents>\n    <MissingDependencies />\n  </SolutionManifest>\n</ImportExportXml>\n`;

  const solutionXmlPath = path.join(outputDir, 'solution.xml');
  fs.writeFileSync(solutionXmlPath, solutionXmlContent);
  console.log(`  -> Wrote solution.xml`);

  // --- 5. Generate customizations.xml ---
  const uniqueConnectors: { [connRefLogicalName: string]: { apiId: string, connectorDisplayName: string } } = {};
  const connectorDisplayNameMap: Record<string, string> = {
    'shared_sharepointonline': 'SharePoint',
    'shared_office365': 'Office 365 Outlook' 
  };

  for (const flowDef of flowDefinitions) {
    for (const [connName, apiId] of Object.entries(flowDef.connectors)) {
      const shortName = connName.split('_').pop()?.substring(0, 8) || 'conn'; 
      const logicalName = `${publisherInfo.prefix}_${connName}_${shortName}`.toLowerCase(); 
      
      if (!uniqueConnectors[logicalName]) {
        uniqueConnectors[logicalName] = {
          apiId: apiId,
          connectorDisplayName: connectorDisplayNameMap[connName] || connName
        };
      }
    }
  }

  let connectionReferencesXml = '';
  if (Object.keys(uniqueConnectors).length > 0) {
    connectionReferencesXml += '  <connectionreferences>\n';
    for (const [logicalName, connInfo] of Object.entries(uniqueConnectors)) {
      connectionReferencesXml += 
`    <connectionreference connectionreferencelogicalname="${escapeXml(logicalName)}">\n      <connectionreferencedisplayname>${escapeXml(connInfo.connectorDisplayName)} ${escapeXml(solutionInfo.localizedName)}</connectionreferencedisplayname>\n      <connectorid>${escapeXml(connInfo.apiId)}</connectorid>\n      <iscustomizable>1</iscustomizable>\n      <promptingbehavior>0</promptingbehavior> \n      <statecode>0</statecode>\n      <statuscode>1</statuscode>\n    </connectionreference>\n`;
    }
    connectionReferencesXml += '  </connectionreferences>\n';
  }

  let workflowsXml = '';
  if (flowDefinitions.length > 0) {
    workflowsXml += '  <Workflows>\n';
    for (const flowDef of flowDefinitions) {
      const flowId = flowDef.id.replace(/[{}]/g, '');
      // Use the correctly formatted path from flowFilePaths
      const jsonFileName = flowFilePaths[flowDef.id]; 

      workflowsXml += 
`    <Workflow WorkflowId="{${flowId}}" Name="${escapeXml(flowDef.name)}">\n      <JsonFileName>${escapeXml(jsonFileName)}</JsonFileName>\n      <Type>1</Type>\n      <Subprocess>0</Subprocess>\n      <Category>5</Category>\n      <Mode>0</Mode> \n      <Scope>4</Scope>\n      <OnDemand>0</OnDemand>\n      <TriggerOnCreate>0</TriggerOnCreate>\n      <TriggerOnDelete>0</TriggerOnDelete>\n      <AsyncAutodelete>0</AsyncAutodelete>\n      <SyncWorkflowLogOnFailure>0</SyncWorkflowLogOnFailure>\n      <StateCode>1</StateCode>\n      <StatusCode>2</StatusCode>\n      <RunAs>1</RunAs>\n      <IsTransacted>1</IsTransacted>\n      <IntroducedVersion>${escapeXml(solutionInfo.version)}</IntroducedVersion>\n      <IsCustomizable>1</IsCustomizable>\n      <BusinessProcessType>0</BusinessProcessType>\n      <IsCustomProcessingStepAllowedForOtherPublishers>1</IsCustomProcessingStepAllowedForOtherPublishers>\n      <ModernFlowType>0</ModernFlowType> \n      <PrimaryEntity>none</PrimaryEntity>\n      <LocalizedNames>\n        <LocalizedName languagecode="1033" description="${escapeXml(flowDef.name)}" />\n      </LocalizedNames>\n    </Workflow>\n`;
    }
    workflowsXml += '  </Workflows>\n';
  }

  const customizationsXmlContent = `<?xml version="1.0" encoding="utf-8"?>\n<ImportExportXml xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance">\n  <Entities />\n  <Roles />\n${workflowsXml}  <FieldSecurityProfiles />\n  <Templates />\n  <EntityMaps />\n  <EntityRelationships />\n  <OrganizationSettings />\n  <optionsets />\n  <CustomControls />\n  <EntityDataProviders />\n${connectionReferencesXml}  <Languages>\n    <Language>1033</Language>\n  </Languages>\n</ImportExportXml>\n`;

  const customizationsXmlPath = path.join(outputDir, 'customizations.xml');
  fs.writeFileSync(customizationsXmlPath, customizationsXmlContent);
  console.log(`  -> Wrote customizations.xml`);

  // --- 6. Create Zip Archive ---
  const zipFileName = `${solutionInfo.uniqueName}.zip`;
  const zipFilePath = path.join(outputDir, zipFileName);
  const output = fs.createWriteStream(zipFilePath);
  const archive = archiver('zip', { zlib: { level: 9 } });

  return new Promise<void>((resolve, reject) => {
    output.on('close', () => {
      console.log(`  -> Created archive: ${zipFileName} (${archive.pointer()} total bytes)`);
      try {
        fs.unlinkSync(solutionXmlPath);
        fs.unlinkSync(customizationsXmlPath);
        fs.unlinkSync(contentTypesPath);
        fs.rmSync(workflowsDir, { recursive: true, force: true });
        console.log(`  -> Cleaned up temporary files.`);
      } catch (cleanupErr) {
        console.warn(`  -> Warning: Failed to cleanup temporary files:`, cleanupErr);
      }
      resolve();
    });

    archive.on('warning', (err: archiver.ArchiverError) => {
      if (err.code === 'ENOENT') {
        console.warn('Archiver warning: ', err);
      } else {
        reject(err);
      }
    });

    archive.on('error', (err: Error) => {
      reject(err);
    });

    archive.pipe(output);

    archive.file(solutionXmlPath, { name: 'solution.xml' });
    archive.file(customizationsXmlPath, { name: 'customizations.xml' });
    archive.file(contentTypesPath, { name: '[Content_Types].xml' });
    archive.directory(workflowsDir, 'Workflows');

    archive.finalize();
  }).then(() => {
      console.log(`Solution export for ${solutionInfo.uniqueName} completed successfully.`);
  }).catch((err) => {
      console.error(`Error during solution export for ${solutionInfo.uniqueName}:`, err);
      throw err; 
  });

} 