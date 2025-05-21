import { FlowGenerator } from '../../generators/flow-generator';
import { createSharePointItemTrigger } from '../../templates/triggers/sharepoint/createSharePointItemTrigger';
import { createSharePointCreateItemAction } from '../../templates/actions/sharepoint/createSharePointCreateItemAction';
import { createSendEmailAction } from '../../templates/actions/outlook/createSendEmailAction';
import { createComposeAction, createConditionAction } from '../../templates/actions/core';

/**
 * Configuration options for the Advanced SharePoint Document Approval flow
 */
interface AdvancedApprovalConfig {
  documentLibraryUrl: string;
  documentLibraryId: string;
  approvalListId: string;
  primaryApproverEmail: string;
  secondaryApproverEmail: string;
  escalationEmail: string;
  notificationList: string;
  connectionSharePoint: string;
  connectionOutlook: string;
  escalationDelayHours: number;
  departmentTagColumn: string;
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
  documentLibraryUrl?: string;
  documentLibraryId?: string;
  approvalListId?: string;
  departmentTagColumn?: string;
  escalationDelayHours?: number;
}

/**
 * Interface for return configuration
 */
interface AdvancedApprovalFlowConfig {
  flowGeneratorConfig: FlowGeneratorConfig;
  addSteps: (flowGenerator: FlowGenerator) => void;
}

/**
 * Configures an Advanced SharePoint Document Approval flow with escalation and status monitoring
 * 
 * @param generalConfig The general configuration containing user settings
 * @param dynamicInputs Optional dynamic inputs for the flow
 * @returns Configuration object for the Advanced SharePoint Document Approval flow
 */
export function configureFlow(
  generalConfig: any,
  dynamicInputs?: DynamicInputsConfig
): AdvancedApprovalFlowConfig {
  
  // Prepare configuration using general config and dynamic inputs
  const spConfig: AdvancedApprovalConfig = {
    documentLibraryUrl: dynamicInputs?.documentLibraryUrl || generalConfig.userConfig.sharePoint?.rorEvaluation?.siteUrl || '',
    documentLibraryId: dynamicInputs?.documentLibraryId || generalConfig.sharePointListMap?.['RorEvaluationList'] || '',
    approvalListId: dynamicInputs?.approvalListId || generalConfig.sharePointListMap?.['RorEvaluationList'] || '',
    primaryApproverEmail: generalConfig.userConfig.teamMembers?.averyLambert || generalConfig.userConfig.adminEmail,
    secondaryApproverEmail: generalConfig.userConfig.teamMembers?.melindaYoung || generalConfig.userConfig.adminEmail,
    escalationEmail: generalConfig.userConfig.teamMembers?.julieCantrell || generalConfig.userConfig.adminEmail,
    notificationList: generalConfig.userConfig.distributionLists?.workflowNotifications || generalConfig.userConfig.adminEmail,
    connectionSharePoint: generalConfig.connections?.sharePoint || 'shared_sharepointonline',
    connectionOutlook: generalConfig.connections?.outlook || 'shared_office365',
    escalationDelayHours: dynamicInputs?.escalationDelayHours || 24,
    departmentTagColumn: dynamicInputs?.departmentTagColumn || 'Department'
  };

  // Flow generator configuration
  const flowGeneratorConfig: FlowGeneratorConfig = {
    displayName: 'Advanced Document Approval Workflow',
    description: 'Comprehensive document approval system with escalation, monitoring, and departmental routing'
  };

  /**
   * Function to add steps to the flow generator
   */
  const addSteps = (flowGenerator: FlowGenerator): void => {
    
    // TRIGGER: When a new document is added to a SharePoint document library
    flowGenerator.addTrigger(
      'whenNewDocumentAdded',
      createSharePointItemTrigger(
        spConfig.documentLibraryUrl,
        spConfig.documentLibraryId,
        'onItemCreated',
        spConfig.connectionSharePoint,
        '/providers/Microsoft.PowerApps/apis/shared_sharepointonline'
      )
    );

    // ACTION 1: Create document details variable with enhanced metadata
    flowGenerator.addAction(
      'formatDocumentDetails',
      createComposeAction(`{
        "fileName": @{triggerBody()?['DisplayName']},
        "fileUrl": @{triggerBody()?['Path']},
        "fileId": @{triggerBody()?['ID']},
        "author": @{triggerBody()?['Author']?['DisplayName']},
        "authorEmail": @{triggerBody()?['Author']?['Email']},
        "createdDate": @{formatDateTime(triggerBody()?['TimeCreated'], 'yyyy-MM-dd')},
        "department": @{triggerBody()?['${spConfig.departmentTagColumn}'] ?? 'General'},
        "documentType": @{if(contains(triggerBody()?['DisplayName'], '.pdf'), 'PDF', 
                         if(contains(triggerBody()?['DisplayName'], '.docx'), 'Word',
                         if(contains(triggerBody()?['DisplayName'], '.xlsx'), 'Excel', 'Other')))},
        "reviewDueDate": @{formatDateTime(addDays(utcNow(), 7), 'yyyy-MM-dd')},
        "escalationDateTime": @{formatDateTime(addHours(utcNow(), ${spConfig.escalationDelayHours}), 'yyyy-MM-dd HH:mm:ss')}
      }`)
    );
    
    // ACTION 2: Determine approver based on department
    flowGenerator.addAction(
      'determineApprover',
      createConditionAction(
        `@equals(outputs('formatDocumentDetails')?['department'], 'Finance')`,
        {
          // If Finance department document
          'setFinanceApprover': createComposeAction(`{
            "approverEmail": "${generalConfig.userConfig.teamMembers?.julieCantrell || generalConfig.userConfig.adminEmail}",
            "approverName": "Julie Cantrell",
            "approvalPriority": "High"
          }`)
        },
        {
          // If not Finance, check if it's HR
          'checkIfHR': createConditionAction(
            `@equals(outputs('formatDocumentDetails')?['department'], 'HR')`,
            {
              // If HR department document
              'setHRApprover': createComposeAction(`{
                "approverEmail": "${generalConfig.userConfig.teamMembers?.melindaYoung || generalConfig.userConfig.adminEmail}",
                "approverName": "Melinda Young",
                "approvalPriority": "Medium"
              }`)
            },
            {
              // Default approver for other departments
              'setDefaultApprover': createComposeAction(`{
                "approverEmail": "${spConfig.primaryApproverEmail}",
                "approverName": "Avery Lambert",
                "approvalPriority": "Normal"
              }`)
            }
          )
        }
      )
    );
    
    // ACTION 3: Create approval tracking entry with rich metadata
    flowGenerator.addAction(
      'createApprovalEntry',
      createSharePointCreateItemAction(
        spConfig.documentLibraryUrl,
        spConfig.approvalListId,
        {
          "Title": `@{outputs('formatDocumentDetails')?['fileName']}`,
          "DocumentLink": `@{outputs('formatDocumentDetails')?['fileUrl']}`,
          "RequestedBy": `@{outputs('formatDocumentDetails')?['author']}`,
          "ApproverEmail": `@{if(equals(outputs('formatDocumentDetails')?['department'], 'Finance'), 
                               outputs('setFinanceApprover')?['approverEmail'],
                             if(equals(outputs('formatDocumentDetails')?['department'], 'HR'),
                               outputs('setHRApprover')?['approverEmail'],
                               outputs('setDefaultApprover')?['approverEmail']))}`,
          "RequestDate": `@{utcNow()}`,
          "DueDate": `@{outputs('formatDocumentDetails')?['reviewDueDate']}`,
          "ApprovalStatus": "Pending",
          "Department": `@{outputs('formatDocumentDetails')?['department']}`,
          "DocumentType": `@{outputs('formatDocumentDetails')?['documentType']}`,
          "Priority": `@{if(equals(outputs('formatDocumentDetails')?['department'], 'Finance'), 
                          outputs('setFinanceApprover')?['approvalPriority'],
                        if(equals(outputs('formatDocumentDetails')?['department'], 'HR'),
                          outputs('setHRApprover')?['approvalPriority'],
                          outputs('setDefaultApprover')?['approvalPriority']))}`,
          "EscalationDate": `@{outputs('formatDocumentDetails')?['escalationDateTime']}`
        },
        spConfig.connectionSharePoint,
        '/providers/Microsoft.PowerApps/apis/shared_sharepointonline'
      )
    );
    
    // ACTION 4: Send custom approval request based on department
    flowGenerator.addAction(
      'sendApprovalRequest',
      createSendEmailAction(
        `@{if(equals(outputs('formatDocumentDetails')?['department'], 'Finance'), 
            concat('[Finance] Document Approval: ', outputs('formatDocumentDetails')?['fileName']),
          if(equals(outputs('formatDocumentDetails')?['department'], 'HR'),
            concat('[HR] Document Approval: ', outputs('formatDocumentDetails')?['fileName']),
            concat('Document Approval Request: ', outputs('formatDocumentDetails')?['fileName'])))}`,
        `<p>A new @{outputs('formatDocumentDetails')?['department']} document has been uploaded and requires your approval:</p>
        <p><strong>Document Name:</strong> @{outputs('formatDocumentDetails')?['fileName']}</p>
        <p><strong>Document Type:</strong> @{outputs('formatDocumentDetails')?['documentType']}</p>
        <p><strong>Department:</strong> @{outputs('formatDocumentDetails')?['department']}</p>
        <p><strong>Uploaded By:</strong> @{outputs('formatDocumentDetails')?['author']} (@{outputs('formatDocumentDetails')?['authorEmail']})</p>
        <p><strong>Upload Date:</strong> @{outputs('formatDocumentDetails')?['createdDate']}</p>
        <p><strong>Priority:</strong> @{if(equals(outputs('formatDocumentDetails')?['department'], 'Finance'), 
                                          outputs('setFinanceApprover')?['approvalPriority'],
                                       if(equals(outputs('formatDocumentDetails')?['department'], 'HR'),
                                          outputs('setHRApprover')?['approvalPriority'],
                                          outputs('setDefaultApprover')?['approvalPriority']))}</p>
        <p><strong>Review Due By:</strong> @{outputs('formatDocumentDetails')?['reviewDueDate']}</p>
        <p><strong>Document Link:</strong> <a href="@{outputs('formatDocumentDetails')?['fileUrl']}">View Document</a></p>
        <p>Please review and approve this document by updating the approval status in the approval tracking list.</p>
        <p><em>Note: If not approved within @{spConfig.escalationDelayHours} hours, this request will be automatically escalated.</em></p>`,
        `@{if(equals(outputs('formatDocumentDetails')?['department'], 'Finance'), 
            outputs('setFinanceApprover')?['approverEmail'],
          if(equals(outputs('formatDocumentDetails')?['department'], 'HR'),
            outputs('setHRApprover')?['approverEmail'],
            outputs('setDefaultApprover')?['approverEmail']))}`,
        spConfig.connectionOutlook,
        '/providers/Microsoft.PowerApps/apis/shared_office365'
      )
    );
    
    // ACTION 5: Add appropriate metadata to the document based on type
    flowGenerator.addAction(
      'updateDocumentMetadata',
      createSharePointCreateItemAction(
        spConfig.documentLibraryUrl,
        spConfig.documentLibraryId,
        {
          "id": `@{triggerBody()?['ID']}`,
          "ContentType": "Document",
          "Department": `@{outputs('formatDocumentDetails')?['department']}`,
          "ApprovalStatus": "Pending",
          "RequiresReview": true,
          "ReviewDueDate": `@{outputs('formatDocumentDetails')?['reviewDueDate']}`,
          "IsConfidential": `@{equals(outputs('formatDocumentDetails')?['documentType'], 'PDF')}`
        },
        spConfig.connectionSharePoint,
        '/providers/Microsoft.PowerApps/apis/shared_sharepointonline'
      )
    );
    
    // ACTION 6: Notify document owner that approval process has started
    flowGenerator.addAction(
      'notifyDocumentOwner',
      createSendEmailAction(
        `Document Approval Process Started: @{outputs('formatDocumentDetails')?['fileName']}`,
        `<p>Your document has been submitted for approval:</p>
        <p><strong>Document Name:</strong> @{outputs('formatDocumentDetails')?['fileName']}</p>
        <p><strong>Document Type:</strong> @{outputs('formatDocumentDetails')?['documentType']}</p>
        <p><strong>Department:</strong> @{outputs('formatDocumentDetails')?['department']}</p>
        <p><strong>Status:</strong> Pending Approval</p>
        <p><strong>Approver:</strong> @{if(equals(outputs('formatDocumentDetails')?['department'], 'Finance'), 
                                         outputs('setFinanceApprover')?['approverName'],
                                       if(equals(outputs('formatDocumentDetails')?['department'], 'HR'),
                                         outputs('setHRApprover')?['approverName'],
                                         outputs('setDefaultApprover')?['approverName']))}</p>
        <p><strong>Expected Review By:</strong> @{outputs('formatDocumentDetails')?['reviewDueDate']}</p>
        <p>You will be notified when the document has been reviewed.</p>`,
        `@{outputs('formatDocumentDetails')?['authorEmail']}`,
        spConfig.connectionOutlook,
        '/providers/Microsoft.PowerApps/apis/shared_office365'
      )
    );
    
    // ACTION 7: Notify department admin about the new document
    flowGenerator.addAction(
      'notifyDepartmentAdmin',
      createConditionAction(
        `@not(equals(outputs('formatDocumentDetails')?['department'], 'General'))`,
        {
          // If it belongs to a specific department, notify the admin
          'sendDepartmentNotification': createSendEmailAction(
            `New @{outputs('formatDocumentDetails')?['department']} Document Added: @{outputs('formatDocumentDetails')?['fileName']}`,
            `<p>A new document has been added to the @{outputs('formatDocumentDetails')?['department']} department:</p>
            <p><strong>Document Name:</strong> @{outputs('formatDocumentDetails')?['fileName']}</p>
            <p><strong>Document Type:</strong> @{outputs('formatDocumentDetails')?['documentType']}</p>
            <p><strong>Uploaded By:</strong> @{outputs('formatDocumentDetails')?['author']}</p>
            <p><strong>Status:</strong> Pending Approval</p>
            <p><strong>Document Link:</strong> <a href="@{outputs('formatDocumentDetails')?['fileUrl']}">View Document</a></p>`,
            spConfig.notificationList,
            spConfig.connectionOutlook,
            '/providers/Microsoft.PowerApps/apis/shared_office365'
          )
        },
        {
          // No action needed for General department
        }
      )
    );
  };

  return {
    flowGeneratorConfig,
    addSteps
  };
} 