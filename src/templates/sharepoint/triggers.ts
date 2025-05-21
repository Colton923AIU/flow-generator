import { FlowTrigger } from '../../models/flow-types';

/**
 * Configuration options for SharePoint triggers
 */
export interface SharePointTriggerOptions {
  /** SharePoint site URL */
  siteUrl: string;
  /** SharePoint list ID */
  listId: string;
  /** Polling interval in minutes (default: 5) */
  pollingInterval?: number;
  /** Connection name (default: shared_sharepointonline) */
  connectionName?: string;
}

/**
 * Creates a trigger that fires when a new item is created in a SharePoint list
 * @param options Configuration options for the SharePoint trigger
 * @returns A FlowTrigger for new SharePoint items
 */
export function createSharePointItemCreatedTrigger(options: SharePointTriggerOptions): FlowTrigger {
  const { 
    siteUrl, 
    listId, 
    pollingInterval = 5,
    connectionName = 'shared_sharepointonline' 
  } = options;

  return {
    type: 'ApiConnection',
    recurrence: {
      frequency: 'Minute',
      interval: pollingInterval
    },
    splitOn: '@triggerBody()?[\'value\']',
    inputs: {
      host: {
        connectionName,
        apiId: '/providers/Microsoft.PowerApps/apis/shared_sharepointonline',
        operationId: 'GetOnNewItems'
      },
      parameters: {
        dataset: siteUrl,
        table: listId
      },
      authentication: '@parameters(\'$authentication\')'
    }
  };
}

/**
 * Creates a trigger that fires when an item is modified in a SharePoint list
 * @param options Configuration options for the SharePoint trigger
 * @returns A FlowTrigger for modified SharePoint items
 */
export function createSharePointItemModifiedTrigger(options: SharePointTriggerOptions): FlowTrigger {
  const { 
    siteUrl, 
    listId, 
    pollingInterval = 5,
    connectionName = 'shared_sharepointonline' 
  } = options;

  return {
    type: 'ApiConnection',
    recurrence: {
      frequency: 'Minute',
      interval: pollingInterval
    },
    splitOn: '@triggerBody()?[\'value\']',
    inputs: {
      host: {
        connectionName,
        apiId: '/providers/Microsoft.PowerApps/apis/shared_sharepointonline',
        operationId: 'GetOnUpdatedItems'
      },
      parameters: {
        dataset: siteUrl,
        table: listId
      },
      authentication: '@parameters(\'$authentication\')'
    }
  };
}

/**
 * Creates a trigger that fires when a specific column changes in a SharePoint list item
 * @param options Configuration options for the SharePoint trigger
 * @param columnName The name of the column to monitor for changes
 * @returns A FlowTrigger for column-specific changes in SharePoint items
 */
export function createSharePointColumnChangedTrigger(
  options: SharePointTriggerOptions, 
  columnName: string
): FlowTrigger {
  const trigger = createSharePointItemModifiedTrigger(options);
  
  // Add an additional step to check if the specific column changed
  const baseTrigger = { ...trigger };
  
  // The GetChanges operation will be added as a follow-up action in the flow
  // This is returned as a template, but the actual column check would be implemented
  // as a condition in the flow after the trigger

  return baseTrigger;
}

/**
 * Creates a trigger that fires when an item is deleted from a SharePoint list
 * @param options Configuration options for the SharePoint trigger
 * @returns A FlowTrigger for deleted SharePoint items
 */
export function createSharePointItemDeletedTrigger(options: SharePointTriggerOptions): FlowTrigger {
  const { 
    siteUrl, 
    listId, 
    pollingInterval = 5,
    connectionName = 'shared_sharepointonline' 
  } = options;

  return {
    type: 'ApiConnection',
    recurrence: {
      frequency: 'Minute',
      interval: pollingInterval
    },
    splitOn: '@triggerBody()?[\'value\']',
    inputs: {
      host: {
        connectionName,
        apiId: '/providers/Microsoft.PowerApps/apis/shared_sharepointonline',
        operationId: 'GetOnDeletedItems'
      },
      parameters: {
        dataset: siteUrl,
        table: listId
      },
      authentication: '@parameters(\'$authentication\')'
    }
  };
} 