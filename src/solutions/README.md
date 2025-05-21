# Flow Solutions

This directory houses concrete implementations of Microsoft Power Automate flows, referred to as "Solutions".

## Philosophy

Solutions should be:

-   **Lean**: The code within a solution should primarily focus on orchestrating components and handling solution-specific configurations or inputs. Complex, reusable logic should reside within templates.
-   **Human-Readable**: The structure of a solution, particularly its main flow definition file (e.g., `index.ts`), should clearly show the sequence of steps and how they are connected.
-   **Configurable**: Solutions should be designed to accept dynamic inputs where appropriate, allowing them to be adapted to different use cases or environments without code changes.

## Available Solutions

### SharePoint Approval Flow
A basic document approval workflow that triggers when documents are uploaded, routes approval requests, and handles document processing based on file type.

### SharePoint Approval Advanced
An enhanced version of the approval flow with department-based routing, multiple approvers, rich metadata handling, and conditional processing.

### PIP Notification Flow
A robust notification system that sends configurable emails when a SharePoint list item's status changes. Features include:
- Multiple recipient targeting for a single status change
- Template-based email content with placeholder support
- Configuration storage in SharePoint lists for easy management
- Detailed activity logging

## Structure of a Solution

A typical solution subdirectory might include:

-   `index.ts`: The main file that exports a `configureFlow` function. This function usually takes configuration (general and dynamic) and returns an object containing `flowGeneratorConfig` and an `addSteps` function for use with a `FlowGenerator`.
-   `config.ts`: Configuration defaults and reusable templates for the solution.
-   `types.ts`: TypeScript interfaces specific to the inputs, outputs, or internal configuration of that particular solution.
-   `README.md`: Documentation explaining the solution's purpose, how it works and its configuration options.
