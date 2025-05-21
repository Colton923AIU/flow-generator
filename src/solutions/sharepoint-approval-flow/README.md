# SharePoint Document Approval Workflow

This solution demonstrates a common business process for document management in SharePoint with Power Automate.

## Overview

The Document Approval Workflow creates an automated approval process for documents uploaded to a SharePoint document library. When a new document is uploaded, the workflow:

1. Detects the new document
2. Extracts document details and type
3. Sends approval request to the designated approver
4. Creates a tracking entry in an approval list
5. Performs conditional actions based on document type
   - For PDFs: Adds metadata and marks as confidential
   - For other file types: Sends notification about non-standard document

## Use Cases

This workflow is useful for organizations that need:

- Document compliance management
- Regulated document approval processes
- Audit trails for document reviews
- Differentiated handling of various document types
- Notification systems for departmental document uploads

## Configuration Options

The solution can be customized through dynamic inputs:

- `documentLibraryUrl` - URL of the SharePoint document library
- `documentLibraryId` - ID of the document library where uploads are monitored
- `approvalListId` - ID of the SharePoint list that tracks approval status

If not provided, the solution uses values from your user configuration.

## Usage

Generate the solution with these commands:

```bash
npm run generate -- --example sharepoint-approval-flow
```

For custom configuration:

```bash
npm run generate -- --example sharepoint-approval-flow --documentLibraryUrl "https://your-tenant.sharepoint.com/sites/YourSite" --documentLibraryId "your-library-id" --approvalListId "your-approval-list-id"
```

## Requirements

- SharePoint document library for uploads
- SharePoint list with the following columns:
  - Title (Single line of text)
  - DocumentLink (Hyperlink)
  - RequestedBy (Single line of text)
  - RequestDate (Date and Time)
  - ApprovalStatus (Choice: Pending, Approved, Rejected)
  - DocumentType (Single line of text)
- Power Automate connections for SharePoint and Outlook 