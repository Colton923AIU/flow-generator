# Advanced SharePoint Document Approval Workflow

This solution demonstrates a comprehensive document approval process for SharePoint with Power Automate, featuring department-based routing, escalation, and detailed notification systems.

## Overview

The Advanced Document Approval Workflow provides a sophisticated system for document management in SharePoint. It goes beyond basic approval processes by adding:

1. **Department-based routing** - Different approvers for different departments
2. **Document metadata management** - Automatically categorizes and tags documents
3. **Rich notification system** - Custom notifications for different stakeholders
4. **Conditional processing** - Different processes for different document types
5. **Enhanced tracking** - Complete audit trail with due dates and priorities

## Use Cases

This workflow is ideal for:

- Universities processing student documentation
- Financial institutions handling compliance documents
- Healthcare organizations managing patient records
- Legal departments tracking case documents
- Manufacturing facilities with ISO documentation requirements

## Advanced Features

- **Smart department routing** - Documents are automatically routed to the right approver based on department tags
- **Stakeholder notifications** - All relevant parties are kept in the loop throughout the approval process
- **Status tracking** - Complete tracking of document status in SharePoint list
- **Document enrichment** - Automatic addition of metadata to uploaded documents
- **Configurable escalation** - Built-in escalation paths if approvals are delayed

## Configuration Options

The solution offers additional customization via dynamic inputs:

- `documentLibraryUrl` - URL of the SharePoint document library
- `documentLibraryId` - ID of the document library where uploads are monitored
- `approvalListId` - ID of the SharePoint list that tracks approval status
- `departmentTagColumn` - The name of the column used for department tagging
- `escalationDelayHours` - Number of hours before escalation (default: 24)

## Usage

Generate the solution with:

```bash
npm run generate -- --example sharepoint-approval-advanced
```

With custom configuration:

```bash
npm run generate -- --example sharepoint-approval-advanced --documentLibraryUrl "https://your-tenant.sharepoint.com/sites/YourSite" --documentLibraryId "your-library-id" --approvalListId "your-approval-list-id" --departmentTagColumn "Division" --escalationDelayHours 48
```

## SharePoint Requirements

### Document Library Columns
- Department - Choice field (HR, Finance, General, etc.)
- ApprovalStatus - Choice field (Pending, Approved, Rejected)
- RequiresReview - Yes/No field
- ReviewDueDate - Date field
- IsConfidential - Yes/No field

### Approval List Columns
- Title - Single line of text (document name)
- DocumentLink - Hyperlink
- RequestedBy - Single line of text
- ApproverEmail - Single line of text
- RequestDate - Date and Time
- DueDate - Date and Time
- ApprovalStatus - Choice (Pending, Approved, Rejected)
- Department - Single line of text
- DocumentType - Single line of text
- Priority - Choice (High, Medium, Normal)
- EscalationDate - Date and Time

## Customization Tips

- Modify the department logic in the 'determineApprover' action to match your organization's structure
- Update email templates to match your corporate style
- Add more conditional logic based on document type or other metadata 