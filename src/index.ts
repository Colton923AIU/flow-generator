import yargs from 'yargs';
import { hideBin } from 'yargs/helpers';
import * as path from 'path';
import * as process from 'process';
import * as fs from 'fs';
import { SolutionInfo, FlowDefinition, exportSolutionPackage } from './utils/export-solution';
import { userConfig, commonPublisherInfo, sharePointListMap, config } from './config/user-config';
import { FlowGenerator } from './generators/flow-generator';

/**
 * Defines the shape of the general config passed to example modules.
 */
interface ExampleGeneralConfig {
  userConfig: typeof userConfig;
  sharePointListMap: typeof sharePointListMap;
  connections: {
    sharePoint: string;
    outlook: string;
  };
}

/**
 * Defines the expected shape of a flow configuration object returned by an example module.
 */
interface ExampleFlowConfig {
  flowGeneratorConfig: {
    displayName: string;
    description: string;
  };
  addSteps: (flowGenerator: FlowGenerator) => void;
}

/**
 * Defines the expected structure for dynamically imported example modules.
 */
interface ExampleModule {
    configureFlow: (generalConfig: ExampleGeneralConfig, dynamicInputs?: DynamicInputsConfig) => ExampleFlowConfig;
}

// Define interface for dynamic inputs, matching ProtocolDynamicInputs
interface DynamicInputsConfig {
    // Protocol-flow-test parameters
    sharepointSiteUrl?: string;
    listName?: string;
    monitoredFieldName?: string;
    
    // PIP notification flow parameters
    listUrl?: string;
    listId?: string;
    notificationMappingListUrl?: string;
    notificationMappingListId?: string;
    statusFieldName?: string;
}

async function main() {
    const argv = await yargs(hideBin(process.argv))
        .option('example', {
            alias: 'e',
            type: 'string',
            description: 'Specify the example name to run (e.g., basic, protocol-flow-test)',
            demandOption: true
        })
        .option('solutionName', {
            alias: 's',
            type: 'string',
            description: 'Unique name for the solution (e.g., MySolution).'
        })
        .option('solutionVersion', {
            alias: 'v',
            type: 'string',
            description: 'Version for the solution (e.g., 1.0.0.0).'
        })
        .option('output', {
            alias: 'o',
            type: 'string',
            description: 'Output directory for the generated solution package.'
        })
        .option('managed', {
            type: 'boolean',
            default: false,
            description: 'Export solution as managed (true) or unmanaged (false).'
        })
        // Options for protocol-flow-test dynamic inputs
        .option('sharepointSiteUrl', {
            type: 'string',
            description: 'SharePoint Site URL (for protocol-flow-test).'
        })
        .option('listName', {
            type: 'string',
            description: 'SharePoint List Name (for protocol-flow-test).'
        })
        .option('monitoredFieldName', {
            type: 'string',
            description: 'Field Name to monitor in the SharePoint List (for protocol-flow-test).'
        })
        // Options for pip-notification-flow dynamic inputs
        .option('listUrl', {
            type: 'string',
            description: 'SharePoint Site URL (for pip-notification-flow).'
        })
        .option('listId', {
            type: 'string',
            description: 'SharePoint List ID for the main list with status field (for pip-notification-flow).'
        })
        .option('notificationMappingListUrl', {
            type: 'string',
            description: 'SharePoint Site URL for the notification mapping list (for pip-notification-flow).'
        })
        .option('notificationMappingListId', {
            type: 'string',
            description: 'SharePoint List ID for the notification mapping list (for pip-notification-flow).'
        })
        .option('statusFieldName', {
            type: 'string',
            description: 'Name of the status field to monitor for changes (for pip-notification-flow).'
        })
        .help()
        .alias('help', 'h')
        .parseAsync();

    const exampleToRun = argv.example;
    const outputDir = path.resolve(process.cwd(), argv.output || 'output');
    const solutionFlowsDir = path.join(__dirname, 'solutions');

    // --- Prepare Configuration ---
    const generalConfig: ExampleGeneralConfig = {
        userConfig: userConfig,
        sharePointListMap: sharePointListMap,
        connections: {
            sharePoint: config.connections.sharePoint,
            outlook: config.connections.outlook
        }
    };

    // Prepare dynamicInputs, ensuring required fields for protocol-flow-test are present if that's the example
    const dynamicInputs: DynamicInputsConfig = {
        // Protocol-flow-test parameters
        sharepointSiteUrl: argv.sharepointSiteUrl,
        listName: argv.listName,
        monitoredFieldName: argv.monitoredFieldName,
        
        // PIP notification flow parameters
        listUrl: argv.listUrl,
        listId: argv.listId,
        notificationMappingListUrl: argv.notificationMappingListUrl,
        notificationMappingListId: argv.notificationMappingListId,
        statusFieldName: argv.statusFieldName
    };

    if (exampleToRun === 'protocol-flow-test') {
        if (!dynamicInputs.sharepointSiteUrl || !dynamicInputs.listName || !dynamicInputs.monitoredFieldName) {
            console.error(`Error: For example 'protocol-flow-test', you must provide --sharepointSiteUrl, --listName, and --monitoredFieldName.`);
            process.exit(1);
        }
    }
    
    // --- Dynamically Load Example Module ---
    let exampleModule;
    const exampleAsDirectFile = path.join(solutionFlowsDir, `${exampleToRun}.ts`);
    const exampleAsIndexFile = path.join(solutionFlowsDir, exampleToRun, 'index.ts');

    let fullExamplePath: string;

    if (fs.existsSync(exampleAsDirectFile)) {
        fullExamplePath = exampleAsDirectFile;
    } else if (fs.existsSync(exampleAsIndexFile)) {
        fullExamplePath = exampleAsIndexFile;
    } else {
        console.error(`Error: Solution configuration file not found.`);
        console.error(`  Attempted direct file: ${exampleAsDirectFile}`);
        console.error(`  Attempted index file:  ${exampleAsIndexFile}`);
        console.error(`  Please ensure a file named '${exampleToRun}.ts' or a directory '${exampleToRun}' containing 'index.ts' exists in '${solutionFlowsDir}'.`);
        const availableSolutions = fs.readdirSync(solutionFlowsDir)
            .map(name => {
                const directPath = path.join(solutionFlowsDir, `${name}.ts`);
                const indexPath = path.join(solutionFlowsDir, name, 'index.ts');
                if (fs.existsSync(directPath) && fs.lstatSync(directPath).isFile()) return name;
                if (fs.existsSync(indexPath) && fs.lstatSync(indexPath).isFile()) return name;
                return null;
            })
            .filter(name => name !== null && !name.endsWith('.ts')); // Filter out .ts extensions if name itself is the file
        console.error(`Available solution entry points (directories or direct .ts files): ${availableSolutions.join(', ')}`);
        process.exit(1);
    }

    console.log(`  Loading solution module from: ${fullExamplePath}`);

    try {
        exampleModule = await import(fullExamplePath);
    } catch (e: any) {
        console.error(`Error importing solution module ${fullExamplePath}:`, e.message);
        process.exit(1);
    }
    

    if (!exampleModule || typeof exampleModule.configureFlow !== 'function') {
        console.error(`Error: 'configureFlow' function not found or not exported from ${exampleToRun}.ts`);
        process.exit(1);
    }

    // --- Solution and Publisher Info ---
    const publisherInfo = commonPublisherInfo; // From common-exports.ts
    const solutionInfo: SolutionInfo = {
        uniqueName: argv.solutionName || `${publisherInfo.prefix}_${exampleToRun}_Solution`,
        localizedName: argv.solutionName ? `${argv.solutionName} Solution` : `${exampleToRun.charAt(0).toUpperCase() + exampleToRun.slice(1)} Example Solution`,
        version: argv.solutionVersion || '1.0.0.0',
        description: `Solution generated by Flow Creator for the ${exampleToRun} example.`,
        managed: argv.managed || false
    };

    // --- Initialize Flow Generator ---
    console.log(`\n🚀 Starting generation for example: '${exampleToRun}'`);
    console.log(`   Solution: ${solutionInfo.uniqueName} v${solutionInfo.version}`);
    
    const flowDefinitions: FlowDefinition[] = [];

    // 5. Configure Flow using the function from the example
    // Note: The configureFlow function from the solution module might take dynamicInputs or not.
    // We pass it, and the solution module can choose to use it.
    const flowConfig = exampleModule.configureFlow(generalConfig, dynamicInputs);

    const flowGenerator = new FlowGenerator(
        flowConfig.flowGeneratorConfig.displayName,
        flowConfig.flowGeneratorConfig.description
    );

    // 6. Add Steps using the function from the example
    console.log(`   Adding flow steps for '${flowConfig.flowGeneratorConfig.displayName}'...`);
    flowConfig.addSteps(flowGenerator);

    console.log('Connectors for this flow:', flowGenerator.getConnectors());

    // 7. Prepare Flow Definition for export
    flowDefinitions.push({
        id: flowGenerator.getWorkflowId(),
        name: flowGenerator.getDisplayName(), // Using the display name as the 'name' for the definition file
        jsonContent: flowGenerator.getFlowDefinitionJson(),
        connectors: flowGenerator.getConnectors()
    });

    // --- Common Export Logic --- 
    if (flowDefinitions.length === 0) {
        throw new Error(`No flow definitions were generated for example '${exampleToRun}'.`);
    }

    console.log(`  - Generated ${flowDefinitions.length} flow definition(s).`);
    flowDefinitions.forEach(fd => {
        console.log(`    - Flow Name: ${fd.name} (ID: ${fd.id})`);
        console.log(`    - Connectors:`, fd.connectors);
    });
    
    console.log(`\n📦 Exporting solution '${solutionInfo.uniqueName}' (Version: ${solutionInfo.version}, Managed: ${solutionInfo.managed})`);
    console.log(`   using Publisher: '${publisherInfo.uniqueName}' (Prefix: ${publisherInfo.prefix})`);
    await exportSolutionPackage(solutionInfo, publisherInfo, flowDefinitions, outputDir);

    console.log(`\n✅ Solution generation for example '${exampleToRun}' completed successfully.`);
    console.log(`   Output Directory: ${outputDir}`);

}

main().catch(error => {
    console.error(`\n❌ An error occurred: ${error.message}`);
    // console.error(error.stack); // Uncomment for more detailed stack trace
    process.exit(1);
});