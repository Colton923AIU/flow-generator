import { FlowGenerator } from '../../generators/flow-generator';
import { createSharePointItemTrigger } from '../../templates/triggers/sharepoint/createSharePointItemTrigger';
import { createSharePointCreateItemAction } from '../../templates/actions/sharepoint/createSharePointCreateItemAction';
import { createSendEmailAction } from '../../templates/actions/outlook/createSendEmailAction';
import { createComposeAction, createConditionAction } from '../../templates/actions/core';

/**
 * Configuration options for the SharePoint Document Approval flow
 */
interface SharePointApprovalConfig {
  documentLibraryUrl: string;
  documentLibraryId: string;
  approvalListId: string;
  approverEmail: string;
  notificationList: string;
  connectionSharePoint: string;
  connectionOutlook: string;
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
}

/**
 * Interface for return configuration
 */
interface SharePointApprovalFlowConfig {
  flowGeneratorConfig: FlowGeneratorConfig;
  addSteps: (flowGenerator: FlowGenerator) => void;
}

/**
 * Configures a SharePoint Document Approval flow
 * 
 * @param generalConfig The general configuration containing user settings
 * @param dynamicInputs Optional dynamic inputs for the flow
 * @returns Configuration object for the SharePoint Document Approval flow
 */
export function configureFlow(
  generalConfig: any,
  dynamicInputs?: DynamicInputsConfig
): SharePointApprovalFlowConfig {
  
  // Prepare configuration using general config and dynamic inputs
  const spConfig: SharePointApprovalConfig = {
    documentLibraryUrl: dynamicInputs?.documentLibraryUrl || generalConfig.userConfig.sharePoint?.rorEvaluation?.siteUrl || '',
    documentLibraryId: dynamicInputs?.documentLibraryId || generalConfig.sharePointListMap?.['RorEvaluationList'] || '',
    approvalListId: dynamicInputs?.approvalListId || generalConfig.sharePointListMap?.['RorEvaluationList'] || '',
    approverEmail: generalConfig.userConfig.teamMembers?.averyLambert || generalConfig.userConfig.adminEmail,
    notificationList: generalConfig.userConfig.distributionLists?.workflowNotifications || generalConfig.userConfig.adminEmail,
    connectionSharePoint: generalConfig.connections?.sharePoint || 'shared_sharepointonline',
    connectionOutlook: generalConfig.connections?.outlook || 'shared_office365'
  };

  // Flow generator configuration
  const flowGeneratorConfig: FlowGeneratorConfig = {
    displayName: 'Document Approval Workflow',
    description: 'Automatically routes documents for approval when added to a document library'
  };

  /**
   * Function to add steps to the flow generator
   */
  const addSteps = (flowGenerator: FlowGenerator): void => {
    
    // Add trigger when a document is added to a SharePoint document library
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

    // Create a variable with document details
    flowGenerator.addAction(
      'formatDocumentDetails',
      createComposeAction(`{
        "fileName": @{triggerBody()?['DisplayName']},
        "fileUrl": @{triggerBody()?['Path']},
        "author": @{triggerBody()?['Author']?['DisplayName']},
        "createdDate": @{formatDateTime(triggerBody()?['TimeCreated'], 'yyyy-MM-dd')},
        "documentType": @{if(contains(triggerBody()?['DisplayName'], '.pdf'), 'PDF', 
                         if(contains(triggerBody()?['DisplayName'], '.docx'), 'Word',
                         if(contains(triggerBody()?['DisplayName'], '.xlsx'), 'Excel', 'Other')))}
      }`)
    );
    
    // Send notification to the approver
    flowGenerator.addAction(
      'sendApprovalRequest',
      createSendEmailAction(
        `Document Approval Request: @{outputs('formatDocumentDetails')?['fileName']}`,
        `<p>A new document has been uploaded and requires your approval:</p>
        <p><strong>Document Name:</strong> @{outputs('formatDocumentDetails')?['fileName']}</p>
        <p><strong>Document Type:</strong> @{outputs('formatDocumentDetails')?['documentType']}</p>
        <p><strong>Uploaded By:</strong> @{outputs('formatDocumentDetails')?['author']}</p>
        <p><strong>Upload Date:</strong> @{outputs('formatDocumentDetails')?['createdDate']}</p>
        <p><strong>Document Link:</strong> <a href="@{outputs('formatDocumentDetails')?['fileUrl']}">View Document</a></p>
        <p>Please review and approve this document by adding an approval entry to the approval list.</p>`,
        spConfig.approverEmail,
        spConfig.connectionOutlook,
        '/providers/Microsoft.PowerApps/apis/shared_office365'
      )
    );
    
    // Create an entry in the approval tracking list
    flowGenerator.addAction(
      'createApprovalEntry',
      createSharePointCreateItemAction(
        spConfig.documentLibraryUrl,
        spConfig.approvalListId,
        {
          "Title": `@{outputs('formatDocumentDetails')?['fileName']}`,
          "DocumentLink": `@{outputs('formatDocumentDetails')?['fileUrl']}`,
          "RequestedBy": `@{outputs('formatDocumentDetails')?['author']}`,
          "RequestDate": `@{utcNow()}`,
          "ApprovalStatus": "Pending",
          "DocumentType": `@{outputs('formatDocumentDetails')?['documentType']}`
        },
        spConfig.connectionSharePoint,
        '/providers/Microsoft.PowerApps/apis/shared_sharepointonline'
      )
    );
    
    // Check file type and perform conditional processing
    flowGenerator.addAction(
      'checkFileType',
      createConditionAction(
        `@equals(outputs('formatDocumentDetails')?['documentType'], 'PDF')`,
        {
          // If the file is a PDF, add additional metadata
          'addPdfMetadata': createSharePointCreateItemAction(
            spConfig.documentLibraryUrl,
            spConfig.documentLibraryId,
            {
              "id": `@{triggerBody()?['ID']}`,
              "ContentType": "Document",
              "IsConfidential": true,
              "ReviewDueDate": `@{addDays(utcNow(), 14)}`
            },
            spConfig.connectionSharePoint,
            '/providers/Microsoft.PowerApps/apis/shared_sharepointonline'
          )
        },
        {
          // If not a PDF, notify team about non-standard document
          'notifyAboutNonStandardDoc': createSendEmailAction(
            `Non-Standard Document Uploaded: @{outputs('formatDocumentDetails')?['fileName']}`,
            `<p>A non-standard document has been uploaded and is pending approval:</p>
            <p><strong>Document Name:</strong> @{outputs('formatDocumentDetails')?['fileName']}</p>
            <p><strong>Document Type:</strong> @{outputs('formatDocumentDetails')?['documentType']}</p>
            <p><strong>Uploaded By:</strong> @{outputs('formatDocumentDetails')?['author']}</p>
            <p>This document may require special handling.</p>`,
            spConfig.notificationList,
            spConfig.connectionOutlook,
            '/providers/Microsoft.PowerApps/apis/shared_office365'
          )
        }
      )
    );
  };

  return {
    flowGeneratorConfig,
    addSteps
  };
} 