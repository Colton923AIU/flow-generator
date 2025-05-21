import { FlowGenerator } from '../../generators/flow-generator';
import { createSharePointItemTrigger } from '../../templates/triggers/sharepoint/createSharePointItemTrigger';
import { createSharePointCreateItemAction, createSharePointGetItemsAction } from '../../templates/actions/sharepoint';
import { createSendEmailAction } from '../../templates/actions/outlook/createSendEmailAction';
import { createComposeAction, createConditionAction } from '../../templates/actions/core';
import { 
  EMAIL_PLACEHOLDERS, 
  SHAREPOINT_CONFIG, 
  EMAIL_CONFIG, 
  generateDefaultEmailConfig 
} from './config';

/**
 * Configuration options for the Status Notification Flow
 */
interface StatusNotificationConfig {
  listUrl: string; 
  listId: string;
  notificationMappingListUrl: string;
  notificationMappingListId: string;
  statusFieldName: string;
  connectionSharePoint: string;
  connectionOutlook: string;
  defaultCcEmail: string;
}

/**
 * Flow Generator configuration
 */
interface FlowGeneratorConfig {
  displayName: string;
  description: string;
}

/**
 * Dynamic inputs specific to this flow
 */
interface DynamicInputsConfig {
  listUrl?: string;
  listId?: string;
  notificationMappingListUrl?: string;
  notificationMappingListId?: string;
  statusFieldName?: string;
}

/**
 * Interface for return configuration
 */
interface StatusNotificationFlowConfig {
  flowGeneratorConfig: FlowGeneratorConfig;
  addSteps: (flowGenerator: FlowGenerator) => void;
}

/**
 * Configures a Status Notification flow that sends emails when an item's status changes
 * based on mappings from a configuration list
 * 
 * @param generalConfig The general configuration containing user settings
 * @param dynamicInputs Optional dynamic inputs for the flow
 * @returns Configuration object for the Status Notification flow
 */
export function configureFlow(
  generalConfig: any,
  dynamicInputs?: DynamicInputsConfig
): StatusNotificationFlowConfig {
  
  // Prepare configuration using config values from config.ts
  const flowConfig: StatusNotificationConfig = {
    listUrl: SHAREPOINT_CONFIG.siteUrl,
    listId: SHAREPOINT_CONFIG.lists.mainList,
    notificationMappingListUrl: SHAREPOINT_CONFIG.siteUrl,
    notificationMappingListId: SHAREPOINT_CONFIG.lists.notificationMappingList,
    statusFieldName: SHAREPOINT_CONFIG.defaultStatusFieldName,
    connectionSharePoint: 'shared_sharepointonline', // Default fallback
    connectionOutlook: 'shared_office365', // Default fallback
    defaultCcEmail: generalConfig?.userConfig?.adminEmail || 'admin@example.com'
  };

  // Attempt to use connections from generalConfig if they exist
  try {
    if (generalConfig?.connections?.sharePoint) {
      flowConfig.connectionSharePoint = generalConfig.connections.sharePoint;
      console.log('DEBUG: Using sharePoint connection:', flowConfig.connectionSharePoint);
    }
    
    if (generalConfig?.connections?.outlook) {
      flowConfig.connectionOutlook = generalConfig.connections.outlook;
      console.log('DEBUG: Using outlook connection:', flowConfig.connectionOutlook);
    }
  } catch (error) {
    console.log('DEBUG: Error accessing connections, using defaults:', error);
  }

  // Override with dynamic inputs if provided
  if (dynamicInputs?.listUrl) flowConfig.listUrl = dynamicInputs.listUrl;
  if (dynamicInputs?.listId) flowConfig.listId = dynamicInputs.listId;
  if (dynamicInputs?.notificationMappingListUrl) flowConfig.notificationMappingListUrl = dynamicInputs.notificationMappingListUrl;
  if (dynamicInputs?.notificationMappingListId) flowConfig.notificationMappingListId = dynamicInputs.notificationMappingListId;
  if (dynamicInputs?.statusFieldName) flowConfig.statusFieldName = dynamicInputs.statusFieldName;

  // Flow generator configuration
  const flowGeneratorConfig: FlowGeneratorConfig = {
    displayName: 'Simplified Status Notification Flow',
    description: 'Automatically sends multiple notifications when status changes, using email configurations from a mapping list'
  };

  /**
   * Function to add steps to the flow generator
   */
  const addSteps = (flowGenerator: FlowGenerator): void => {
    
    // TRIGGER: When an item is modified in the main list
    flowGenerator.addTrigger(
      'whenStatusChanged',
      createSharePointItemTrigger(
        flowConfig.listUrl,
        flowConfig.listId,
        'onItemModified',
        flowConfig.connectionSharePoint,
        '/providers/Microsoft.PowerApps/apis/shared_sharepointonline'
      )
    );

    // ACTION 1: Check if the status field has changed
    flowGenerator.addAction(
      'checkIfStatusChanged',
      createConditionAction(
        `@not(equals(triggerBody()?['properties']?['${flowConfig.statusFieldName}'], triggerOutputs()?['body/properties']?['${flowConfig.statusFieldName}@odata.oldValue']))`,
        {
          // If status has changed, get the current status value
          'getCurrentStatus': createComposeAction(`@{triggerBody()?['properties']?['${flowConfig.statusFieldName}']}`)
        },
        {}
      )
    );
    
    // ACTION 2: Get basic item details for the notification
    // Manually set the runAfter property
    const formatItemDetailsAction = createComposeAction(`{
      "itemId": @{triggerBody()?['ID']},
      "studentId": @{triggerBody()?['properties']?['Title']},
      "currentStatus": @{outputs('getCurrentStatus')},
      "previousStatus": @{triggerOutputs()?['body/properties']?['${flowConfig.statusFieldName}@odata.oldValue'] ?? 'None'},
      "modifiedDate": @{formatDateTime(utcNow(), 'yyyy-MM-dd HH:mm')}
    }`);
    
    // Set the runAfter property
    formatItemDetailsAction.runAfter = {
      "checkIfStatusChanged": ["Succeeded"]
    };
    
    flowGenerator.addAction(
      'formatItemDetails',
      formatItemDetailsAction
    );
    
    // ACTION 3: Query notification mapping list to get notification configuration
    // Manually set the runAfter property
    const getNotificationMappingsAction = createSharePointGetItemsAction(
      flowConfig.notificationMappingListUrl,
      flowConfig.notificationMappingListId,
      {
        "$select": "EmailConfiguration,StatusValue",
        "$filter": `StatusValue eq '@{outputs('getCurrentStatus')}'`
      },
      flowConfig.connectionSharePoint,
      '/providers/Microsoft.PowerApps/apis/shared_sharepointonline'
    );
    
    // Set the runAfter property
    getNotificationMappingsAction.runAfter = {
      "formatItemDetails": ["Succeeded"]
    };
    
    flowGenerator.addAction(
      'getNotificationMappings',
      getNotificationMappingsAction
    );
    
    // ACTION 4: Parse and prepare the email configurations array
    // Manually set the runAfter property
    const parseEmailConfigAction = createComposeAction(`{
      "hasConfig": @{greater(length(body('getNotificationMappings')?['value']), 0)},
      "emailConfigs": @{if(greater(length(body('getNotificationMappings')?['value']), 0),
        if(startsWith(trim(first(body('getNotificationMappings')?['value'])?['EmailConfiguration']), '['),
          json(first(body('getNotificationMappings')?['value'])?['EmailConfiguration']),
          array(json(first(body('getNotificationMappings')?['value'])?['EmailConfiguration']))
        ),
        array(json('${generateDefaultEmailConfig(flowConfig.defaultCcEmail)}'))
      )}
    }`);
    
    // Set the runAfter property
    parseEmailConfigAction.runAfter = {
      "getNotificationMappings": ["Succeeded"]
    };
    
    flowGenerator.addAction(
      'parseEmailConfig',
      parseEmailConfigAction
    );
    
    // ACTION 5: Initialize a counter for processing multiple emails
    const initializeCounterAction = createComposeAction(`0`);
    
    // Set the runAfter property
    initializeCounterAction.runAfter = {
      "parseEmailConfig": ["Succeeded"]
    };
    
    flowGenerator.addAction(
      'initializeCounter',
      initializeCounterAction
    );
    
    // ACTION 6: Add an Apply to Each loop to process each email configuration
    const forEachEmailConfigAction = {
      type: 'Foreach' as const,
      foreach: `@{outputs('parseEmailConfig')?['emailConfigs']}`,
      actions: {
        // ACTION 6a: Process the current email configuration
        'processCurrentEmailConfig': {
          type: 'Compose' as const,
          inputs: `@{setProperty(
            setProperty(
              setProperty(
                setProperty(
                  setProperty(
                    setProperty(
                      items('Apply_to_Each'),
                      'inputs',
                      setProperty(
                        items('Apply_to_Each')?['inputs'],
                        'parameters',
                        setProperty(
                          setProperty(
                            setProperty(
                              items('Apply_to_Each')?['inputs']?['parameters'],
                              '${EMAIL_CONFIG.parameters.body}',
                              replace(
                                replace(
                                  items('Apply_to_Each')?['inputs']?['parameters']?['${EMAIL_CONFIG.parameters.body}'],
                                  '${EMAIL_PLACEHOLDERS.STUDENT_ID}',
                                  outputs('formatItemDetails')?['studentId']
                                ),
                                '${EMAIL_PLACEHOLDERS.STATUS}',
                                outputs('formatItemDetails')?['currentStatus']
                              )
                            ),
                            '${EMAIL_CONFIG.parameters.subject}',
                            replace(
                              items('Apply_to_Each')?['inputs']?['parameters']?['${EMAIL_CONFIG.parameters.subject}'],
                              '${EMAIL_PLACEHOLDERS.STUDENT_ID}',
                              outputs('formatItemDetails')?['studentId']
                            )
                          ),
                          '${EMAIL_CONFIG.parameters.to}',
                          coalesce(
                            items('Apply_to_Each')?['inputs']?['parameters']?['${EMAIL_CONFIG.parameters.to}'],
                            '${flowConfig.defaultCcEmail}'
                          )
                        )
                      )
                    ),
                    'type',
                    'OpenApiConnection'
                  ),
                  'runAfter',
                  json({})
                ),
                'metadata', 
                json({})
              ),
              'name', 
              concat('sendEmail_', outputs('formatItemDetails')?['currentStatus'], '_', outputs('initializeCounter'))
            ),
            'operationOptions',
            'DisableAsyncPattern'
          )}`,
          runAfter: {}
        },
        
        // ACTION 6b: Create a dynamic action using the processed email configuration
        'sendDynamicEmail': {
          type: 'Compose' as const,
          inputs: `This is a placeholder that will be replaced by the email action at runtime. The actual email will be sent using the configuration from the mapping list.`,
          runAfter: {
            "processCurrentEmailConfig": ["Succeeded"]
          },
          metadata: {
            operationMetadataId: 'DYNAMIC_ACTION_PLACEHOLDER',
            dynamicActionMetadata: {
              dynamicActionProvider: "@outputs('processCurrentEmailConfig')",
              inputsLocation: ['type', 'inputs', 'name', 'operationOptions', 'metadata', 'runAfter']
            }
          }
        },
        
        // ACTION 6c: Increment the counter
        'incrementCounter': {
          type: 'Compose' as const,
          inputs: `@{add(int(outputs('initializeCounter')), 1)}`,
          runAfter: {
            "sendDynamicEmail": ["Succeeded"]
          }
        }
      },
      runAfter: {
        "initializeCounter": ["Succeeded"]
      }
    };
    
    flowGenerator.addAction(
      'processAllEmailConfigs',
      forEachEmailConfigAction as any
    );
    
    // ACTION 7: Log the notification to an activity log
    // Manually set the runAfter property
    const logNotificationActivityAction = createSharePointCreateItemAction(
      flowConfig.listUrl,
      `${flowConfig.listId}${SHAREPOINT_CONFIG.activityLogSuffix}`,
      {
        "Title": SHAREPOINT_CONFIG.activityLog.titleField,
        "ItemId": `@{outputs('formatItemDetails')?['itemId']}`,
        "StudentId": `@{outputs('formatItemDetails')?['studentId']}`,
        "ActivityType": SHAREPOINT_CONFIG.activityLog.activityType,
        "Description": SHAREPOINT_CONFIG.activityLog.descriptionTemplate
          .replace('{previousStatus}', `@{outputs('formatItemDetails')?['previousStatus']}`)
          .replace('{currentStatus}', `@{outputs('formatItemDetails')?['currentStatus']}`)
          .replace('{emailCount}', `@{length(outputs('parseEmailConfig')?['emailConfigs'])}`),
        "ActivityDate": `@{utcNow()}`
      },
      flowConfig.connectionSharePoint,
      '/providers/Microsoft.PowerApps/apis/shared_sharepointonline'
    );
    
    // Set the runAfter property with dependencies
    logNotificationActivityAction.runAfter = {
      "processAllEmailConfigs": ["Succeeded"]
    };
    
    flowGenerator.addAction(
      'logNotificationActivity',
      logNotificationActivityAction
    );
  };

  return {
    flowGeneratorConfig,
    addSteps
  };
} 