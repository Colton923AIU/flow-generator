import { v4 as uuidv4 } from 'uuid';
// import { FlowAction, FlowTrigger } from '../models/flow-types'; // Remove old types
import {
    ClientData,
    ClientDataProperties,
    ConnectionReferenceValue,
    FlowDefinitionLogic,
    FlowDefinitionRunParameters // Updated from FlowDefinitionParameters
} from '../models/solution-flow-types';
import {
    WorkflowActionItem,
    WorkflowTriggerItem,
    ApiConnectionInputs, // For type checking in extractConnector
    ExpressionString,
    ActionType // To check action types in extractRecursively
} from '../models/workflow-definition.schema';

import * as fs from 'fs';
import * as path from 'path';

/**
 * FlowGenerator creates Power Automate flow definitions for solution packaging
 */
export class FlowGenerator {
  private workflowId: string; // Solution Workflow ID
  private displayName: string;
  private description?: string;
  private triggers: Record<string, WorkflowTriggerItem> = {}; // Updated type
  private actions: Record<string, WorkflowActionItem> = {};  // Updated type
  private connectors: Record<string, string> = {}; // Stores { logicalConnectionName: apiId }

  /**
   * Creates a new flow generator
   * @param displayName Display name for the flow
   * @param description Optional description
   */
  constructor(displayName: string, description?: string) {
    this.workflowId = uuidv4(); // Generate GUID for the workflow entity
    this.displayName = displayName;
    this.description = description;
  }

  // Helper to extract connector from host object of ApiConnection or similar types
  private extractConnector(host: ApiConnectionInputs['host']): void {
    // Handle case where host.connection has a name string (for old format)
    if (host && host.connection && typeof host.connection === 'object') {
      // Handle new format where connection is an object with a name property
      if (host.connection.name && typeof host.connection.name === 'string') {
        const connectionNameExpression = host.connection.name as ExpressionString;
        
        // Try to match the parameter expression format
        const match = connectionNameExpression.match(/@parameters\('\$connections'\)\['([^']+)'\]\['connectionId'\]/);
        if (match && match[1]) {
          const logicalConnectionName = match[1];
          // Add the connection with its API ID
          if (!this.connectors[logicalConnectionName]) {
            this.connectors[logicalConnectionName] = '/providers/Microsoft.PowerApps/apis/' + logicalConnectionName;
            console.log(`Extracted connector: ${logicalConnectionName}`);
          }
        } else {
          console.warn(`[FlowGenerator] Could not parse logical connection name from expression: ${connectionNameExpression}. Connectors map might be incomplete.`);
        }
      }
    }
    // If host has api.id, use that
    else if (host && host.api && typeof host.api.id === 'string') {
      // Extract the logical name from the api.id
      const apiIdParts = host.api.id.split('/');
      const apiName = apiIdParts[apiIdParts.length - 1];
      if (!this.connectors[apiName]) {
        this.connectors[apiName] = host.api.id;
        console.log(`Extracted connector from api.id: ${apiName}`);
      }
    }
    
    // Ensure we always have the SharePoint connector when it's used
    if (host && host.api && host.api.id && host.api.id.includes('sharepointonline')) {
      if (!this.connectors['shared_sharepointonline']) {
        this.connectors['shared_sharepointonline'] = '/providers/Microsoft.PowerApps/apis/shared_sharepointonline';
        console.log(`Added SharePoint connector by detection: shared_sharepointonline`);
      }
    }
  }

  /**
   * Add a trigger to the flow
   * @param name Name for the trigger
   * @param trigger The trigger definition conforming to WorkflowTriggerItem
   * @returns The FlowGenerator instance for chaining
   */
  addTrigger(name: string, trigger: WorkflowTriggerItem): FlowGenerator { // Updated type
    this.triggers[name] = trigger;
    // Extract connector info if applicable
    if ((trigger.type === 'ApiConnection' || trigger.type === 'ApiConnectionWebhook') && trigger.inputs) {
      this.extractConnector((trigger.inputs as ApiConnectionInputs).host);
    }
    return this;
  }

  /**
   * Add an action to the flow
   * @param name Name for the action
   * @param action The action definition conforming to WorkflowActionItem
   * @returns The FlowGenerator instance for chaining
   */
  addAction(
    name: string,
    action: WorkflowActionItem,
  ): FlowGenerator {
    this.actions[name] = action;

    const extractRecursively = (currentAction: WorkflowActionItem) => {
      if ((currentAction.type === 'ApiConnection' || currentAction.type === 'ApiConnectionWebhook') && currentAction.inputs) {
        this.extractConnector((currentAction.inputs as ApiConnectionInputs).host);
      }

      switch (currentAction.type) {
        case 'Switch': { 
          const switchAction = currentAction as Extract<WorkflowActionItem, { type: 'Switch' }>; 
          if (switchAction.cases) {
            for (const caseKey in switchAction.cases) {
              const caseBranch = switchAction.cases[caseKey];
              if (caseBranch.actions) {
                for (const nestedActionName in caseBranch.actions) {
                  extractRecursively(caseBranch.actions[nestedActionName]);
                }
              }
            }
          }
          if (switchAction.default && switchAction.default.actions) {
            for (const nestedActionName in switchAction.default.actions) {
              extractRecursively(switchAction.default.actions[nestedActionName]);
            }
          }
          break;
        }
        case 'If': {
          const ifAction = currentAction as Extract<WorkflowActionItem, { type: 'If' }>; 
          if (ifAction.actions) {
            for (const nestedActionName in ifAction.actions) {
              extractRecursively(ifAction.actions[nestedActionName]);
            }
          }
          if (ifAction.else && ifAction.else.actions) {
            for (const nestedActionName in ifAction.else.actions) {
              extractRecursively(ifAction.else.actions[nestedActionName]);
            }
          }
          break;
        }
        case 'Foreach': {
          const foreachAction = currentAction as Extract<WorkflowActionItem, { type: 'Foreach' }>; 
          if (foreachAction.actions) {
            for (const nestedActionName in foreachAction.actions) {
              extractRecursively(foreachAction.actions[nestedActionName]);
            }
          }
          break;
        }
        case 'Scope': {
          const scopeAction = currentAction as Extract<WorkflowActionItem, { type: 'Scope' }>;
          if (scopeAction.inputs && (scopeAction.inputs as any).actions) { 
            const actionsToRecurse = (scopeAction.inputs as any).actions as Record<string, WorkflowActionItem>;
            for (const nestedActionName in actionsToRecurse) {
              extractRecursively(actionsToRecurse[nestedActionName]);
            }
          }
          break;
        }
      }
    };
    extractRecursively(action);

    return this;
  }

  /**
   * Get the unique Workflow ID (GUID) for this flow entity
   */
  getWorkflowId(): string {
    return this.workflowId;
  }

  /**
   * Get the display name of the flow
   */
  getDisplayName(): string {
    return this.displayName;
  }

  /**
   * Get the map of connectors used by this flow
   * @returns Record<string, string> { logicalConnectionName: apiId }
   */
  getConnectors(): Record<string, string> {
    return this.connectors;
  }

  /**
   * Generate the core flow definition JSON object (clientData)
   * @returns The clientData object for the workflow entity, strongly typed.
   */
  getFlowDefinitionJson(): ClientData {
    const connectionRefs: Record<string, ConnectionReferenceValue> = {};
    const connectionsDefaultValue: Record<string, { connectionId: string }> = {};

    // Get the actual connection ID for SharePoint from config
    let sharePointConnectionId = 'shared_sharepointonline'; // Default fallback
    const actualConnectionId = '80cc3634317c459aa3a4a5c587617484'; // The actual connection ID from Power Automate

    try {
      const config = require('../config/user-config').config; // Get the config object
      if (config?.connections?.sharePoint) {
        sharePointConnectionId = config.connections.sharePoint;
      }
    } catch (error) {
      console.warn('Error accessing SharePoint connection ID, using default:', error);
    }

    // Use the logical name directly (e.g., 'shared_sharepointonline')
    for (const [logicalName, apiId] of Object.entries(this.connectors)) {
      connectionRefs[logicalName] = {
        connectionName: actualConnectionId, // Use the actual connection ID
        id: apiId,
        source: "Invoker"
      };
      connectionsDefaultValue[logicalName] = {
        connectionId: actualConnectionId // Use the actual connection ID
      };
    }

    const definitionParams: FlowDefinitionRunParameters = {
      $connections: {
        type: 'Object',
        defaultValue: connectionsDefaultValue
      },
      $authentication: {
        type: 'SecureObject',
        defaultValue: {}
      }
    };

    const definitionLogic: FlowDefinitionLogic = {
      $schema: 'https://schema.management.azure.com/providers/Microsoft.Logic/schemas/2016-06-01/workflowdefinition.json#',
      contentVersion: '1.0.0.0',
      parameters: definitionParams,
      triggers: this.triggers,
      actions: this.actions,
    };

    const properties: ClientDataProperties = {
      connectionReferences: connectionRefs,
      definition: definitionLogic,
    };

    const clientData: ClientData = {
      schemaVersion: '1.0.0.0',
      properties: properties
    };

    return clientData;
  }

  // Removed generateFlowManifest(), addConnectionReference(), exportToJSON()
} 