/**
 * This file is auto-generated from the workflowdefinition.json schema.
 * Manual edits might be overwritten.
 */

export type ExpressionString = string;
export type SchemaObject = any; // For properties that are JSON schema definitions

export type FlowStatus =
  | "Aborted"
  | "Cancelled"
  | "Failed"
  | "Faulted"
  | "Ignored"
  | "Paused"
  | "Running"
  | "Skipped"
  | "Succeeded"
  | "Suspended"
  | "TimedOut"
  | "Waiting";

export type ActionType =
  | "ApiConnection"
  | "ApiConnectionWebhook"
  | "ApiManagement"
  | "AppendToArrayVariable"
  | "AppendToStringVariable"
  | "Batch"
  | "Compose"
  | "DecrementVariable"
  | "Expression"
  | "FlatFileDecoding"
  | "FlatFileEncoding"
  | "Foreach"
  | "Function"
  | "Http"
  | "HttpWebhook"
  | "If"
  | "IncrementVariable"
  | "InitializeVariable"
  | "IntegrationAccountArtifactLookup"
  | "Join"
  | "Liquid"
  | "ParseJson"
  | "Query"
  | "Recurrence" // Note: Recurrence is usually a trigger, but listed in action types in schema
  | "Request"    // Note: Request is usually a trigger
  | "Response"
  | "Scope"
  | "Select"
  | "SendToBatch"
  | "SetVariable"
  | "SlidingWindow" // Note: SlidingWindow is usually a trigger
  | "Switch"
  | "Table"
  | "Terminate"
  | "Until"
  | "Wait"
  | "Workflow"
  | "XmlValidation"
  | "Xslt";

export type TriggerType =
  | "ApiConnection"
  | "ApiConnectionWebhook" // Explicitly mentioned for Triggers
  | "ApiManagement"
  | "Batch"
  | "Http"
  | "HttpWebhook"
  | "Recurrence"
  | "Request"
  | "SlidingWindow";


export type ActionKind =
  | "AddToTime"
  | "Alert"
  | "ApiConnection"
  | "AzureMonitorAlert"
  | "Button"
  | "ConvertTimeZone"
  | "CurrentTime"
  | "EventGrid"
  | "Geofence"
  | "GetFutureTime"
  | "GetPastTime"
  | "Http"
  | "JsonToJson"
  | "JsonToText"
  | "PowerApp"
  | "SecurityCenterAlert"
  | "SubtractFromTime"
  | "XmlToJson"
  | "XmlToText";

export type TriggerKind =
  | "Alert"
  | "AzureMonitorAlert"
  | "Button"
  | "EventGrid"
  | "Geofence"
  | "Http" // from Request trigger kind
  | "PowerApp"
  | "SecurityCenterAlert";


export type ParameterDataType =
  | "Array"
  | "Bool" // Boolean in schema for InitializeVariable
  | "Float"
  | "Int"  // Integer in schema for InitializeVariable
  | "Object"
  | "SecureObject"
  | "SecureString"
  | "String";

export interface WorkflowParameterDefinition {
  type: ParameterDataType;
  value?: any;
  defaultValue?: any;
  allowedValues?: any[];
  metadata?: any;
  description?: string;
}

export interface WorkflowOutputParameterDefinition extends WorkflowParameterDefinition {
  error?: any;
}

export interface HttpHeaders extends Record<string, any> {}
export interface HttpQueries extends Record<string, string | number | boolean | null> {}


export interface RetryPolicy {
  type: "None" | "Fixed" | "Exponential";
  interval?: string; // e.g., PT1M for 1 minute
  count?: number;
  minimumInterval?: string;
  maximumInterval?: string;
}

export interface HttpAuthentication {
  type: "None" | "Basic" | "ClientCertificate" | "ActiveDirectoryOAuth" | "Raw";
  username?: string;
  password?: string;
  pfx?: string; // Base64 encoded
  authority?: string;
  tenant?: string;
  audience?: string;
  clientId?: string;
  secret?: string;
  scheme?: string;
  parameter?: string;
  value?: string; // for Raw
}

// Base for Actions and Triggers
interface BaseOperation {
  metadata?: any;
  description?: string;
  operationOptions?: string; // e.g. "EnableConcurrency", "DisableAsyncPattern"
  runtimeConfiguration?: {
    paginationPolicy?: {
      minimumItemCount?: number;
    };
    contentTransfer?: {
      transferMode?: "Chunked";
    };
    concurrency?: {
      repetitions?: number;
      runs?: number;
      maximumWaitingRuns?: number;
    };
  };
}

// Action Specific Base
interface BaseActionOperation extends BaseOperation {
  runAfter?: Record<string, FlowStatus[]>;
  trackedProperties?: any;
}

// Trigger Specific Base
interface BaseTriggerOperation extends BaseOperation {
  conditions?: Array<{ expression: ExpressionString; dependsOn?: string }>; // Simplified from schema for clarity
  splitOn?: ExpressionString;
  splitOnConfiguration?: {
    correlation?: {
      clientTrackingId?: string;
    };
  };
  correlation?: { // Also at top level of trigger
    clientTrackingId?: string;
  };
}

// Specific Action Inputs (Illustrative examples, many more in schema)

export interface ApiConnectionInputs {
  host: {
    connection: {
      name: ExpressionString; // e.g. "@parameters('$connections')['shared_office365']['connectionId']"
    };
    api: { // From schema for ApiManagement, but often similar for ApiConnection
        id?: string; // e.g. "/subscriptions/.../providers/Microsoft.Web/connections/office365"
        name?: string;
        type?: string; // e.g. "Microsoft.Web/connections"
    };
  };
  method: "GET" | "POST" | "PUT" | "PATCH" | "DELETE"; // Simplified
  path: ExpressionString; // e.g. "/v2/codeless/sendemail"
  queries?: HttpQueries;
  body?: any;
  headers?: HttpHeaders;
  authentication?: HttpAuthentication | ExpressionString;
  retryPolicy?: RetryPolicy;
  operationOptions?: string; // Can also be here for retryable actions
}

export interface HttpInputs {
  method: "GET" | "POST" | "PUT" | "PATCH" | "DELETE" | "HEAD" | "OPTIONS" | "TRACE";
  uri: ExpressionString;
  queries?: HttpQueries;
  body?: any;
  headers?: HttpHeaders;
  authentication?: HttpAuthentication | ExpressionString;
  retryPolicy?: RetryPolicy;
  cookie?: string; // Specific to HTTP Trigger
  schema?: SchemaObject; // Specific to Request Trigger with kind Http
  relativePath?: string; // Specific to Request Trigger with kind Http
}

export interface ComposeActionInputs {
  inputs: any;
}

export interface InitializeVariableActionInputs {
  variables: Array<{
    name: string;
    type: "Array" | "Boolean" | "Float" | "Integer" | "Object" | "String"; // More specific than ParameterDataType
    value?: any;
  }>;
}

export interface SetVariableActionInputs {
  name: string;
  value: any;
}
export interface AppendToArrayVariableActionInputs extends SetVariableActionInputs {}
export interface AppendToStringVariableActionInputs extends SetVariableActionInputs {}
export interface IncrementVariableActionInputs { name: string; value: number; }
export interface DecrementVariableActionInputs { name: string; value: number; }


export interface ExpressionInputs {
  // For AddToTime, SubtractFromTime
  baseTime?: ExpressionString;
  interval?: number;
  timeUnit?: "Second" | "Minute" | "Hour" | "Day" | "Week" | "Month" | "Year";
  // For ConvertTimeZone
  sourceTimeZone?: ExpressionString;
  destinationTimeZone?: ExpressionString;
  formatString?: ExpressionString;
  // For GetFutureTime, GetPastTime
  // interval, timeUnit already defined
}

export interface IfActionInputs {
  actions?: Record<string, WorkflowActionItem>;
  else?: {
    actions?: Record<string, WorkflowActionItem>;
  };
  expression: { // Simplified, can also be a string
    and?: IfActionInputs['expression'][];
    or?: IfActionInputs['expression'][];
    not?: IfActionInputs['expression'];
    equals?: [ExpressionString, ExpressionString];
    greater?: [ExpressionString, ExpressionString];
    less?: [ExpressionString, ExpressionString];
    // ... many more operators
  } | ExpressionString;
}

export interface ForeachActionInputs {
  actions: Record<string, WorkflowActionItem>;
  foreach: ExpressionString; // Expression evaluating to an array
}

export interface ScopeActionInputs {
  actions: Record<string, WorkflowActionItem>;
}

export interface SwitchActionInputs {
  expression: ExpressionString;
  cases: Record<string, {
    case: any; // The value to match
    actions: Record<string, WorkflowActionItem>;
  }>;
  default?: {
    actions: Record<string, WorkflowActionItem>;
  };
}

export interface TerminateActionInputs {
  runStatus: "Cancelled" | "Failed" | "Succeeded";
  runError?: {
    code: string | number;
    message: string;
  };
}

export interface Recurrence {
  frequency: "Second" | "Minute" | "Hour" | "Day" | "Week" | "Month" | "Year";
  interval: number;
  count?: number;
  startTime?: string; // ISO 8601
  endTime?: string; // ISO 8601
  timeZone?: string;
  schedule?: {
    minutes?: Array<number | string>;
    hours?: Array<number | string>;
    weekDays?: Array<"Monday" | "Tuesday" | "Wednesday" | "Thursday" | "Friday" | "Saturday" | "Sunday">;
    monthDays?: number[];
    monthlyOccurrences?: Array<{
      dayOfWeek: "Monday" | "Tuesday" | "Wednesday" | "Thursday" | "Friday" | "Saturday" | "Sunday";
      occurrence: number; // e.g. 1 for first, -1 for last
    }>;
  };
}

export interface RecurrenceTriggerInputs {
   // Recurrence properties are usually directly under the trigger, not inputs.
   // But the schema shows recurrence within inputs for ApiConnection/ApiManagement triggers
}


// Discriminated Union for Actions
export type WorkflowActionItem =
  | ({ type: "ApiConnection"; inputs: ApiConnectionInputs; kind?: ActionKind; } & BaseActionOperation)
  | ({ type: "ApiConnectionWebhook"; inputs: ApiConnectionInputs & { schema?: SchemaObject; accessKeyType?: "Primary" | "Secondary" }; kind?: ActionKind; } & BaseActionOperation)
  | ({ type: "Http"; inputs: HttpInputs; kind?: "Http" | ActionKind; } & BaseActionOperation) // Http kind for action
  | ({ type: "Compose"; inputs: any; kind?: ActionKind; } & BaseActionOperation) // inputs are any for compose
  | ({ type: "InitializeVariable"; inputs: InitializeVariableActionInputs; kind?: ActionKind; } & BaseActionOperation)
  | ({ type: "SetVariable"; inputs: SetVariableActionInputs; kind?: ActionKind; } & BaseActionOperation)
  | ({ type: "AppendToArrayVariable"; inputs: AppendToArrayVariableActionInputs; kind?: ActionKind; } & BaseActionOperation)
  | ({ type: "AppendToStringVariable"; inputs: AppendToStringVariableActionInputs; kind?: ActionKind; } & BaseActionOperation)
  | ({ type: "IncrementVariable"; inputs: IncrementVariableActionInputs; kind?: ActionKind; } & BaseActionOperation)
  | ({ type: "DecrementVariable"; inputs: DecrementVariableActionInputs; kind?: ActionKind; } & BaseActionOperation)
  | ({ type: "Expression"; inputs: ExpressionInputs; kind: "AddToTime" | "ConvertTimeZone" | "CurrentTime" | "GetFutureTime" | "GetPastTime" | "SubtractFromTime"; } & BaseActionOperation)
  | ({ type: "If"; expression: IfActionInputs['expression']; actions?: IfActionInputs['actions']; else?: IfActionInputs['else']; kind?: ActionKind; } & BaseActionOperation) // inputs flattened for If
  | ({ type: "Foreach"; foreach: ForeachActionInputs['foreach']; actions: ForeachActionInputs['actions']; kind?: ActionKind; } & BaseActionOperation) // inputs flattened for Foreach
  | ({ type: "Scope"; inputs: ScopeActionInputs; kind?: ActionKind; } & BaseActionOperation)
  | ({ type: "Switch"; expression: SwitchActionInputs['expression']; cases: SwitchActionInputs['cases']; default?: SwitchActionInputs['default']; kind?: ActionKind; } & BaseActionOperation) // inputs flattened for Switch
  | ({ type: "Terminate"; inputs: TerminateActionInputs; kind?: ActionKind; } & BaseActionOperation)
  // ... Add other action types here, e.g., Response, Wait, ParseJson, Join, Select, Table etc.
  | ({ type: ActionType; inputs: any; kind?: ActionKind } & BaseActionOperation); // Fallback for other actions

// Discriminated Union for Triggers
export type WorkflowTriggerItem =
  | ({ type: "Request"; kind: "Http"; inputs: { schema?: SchemaObject; method: HttpInputs['method']; relativePath?: string; }; } & BaseTriggerOperation)
  | ({ type: "Request"; kind: "Button" | "PowerApp" | "Alert" | "AzureMonitorAlert" | "EventGrid" | "Geofence" | "SecurityCenterAlert"; inputs?: { schema?: SchemaObject; [key: string]: any; }; } & BaseTriggerOperation) // Other request kinds
  | ({ type: "Recurrence"; recurrence: Recurrence; kind?: ActionKind; } & BaseTriggerOperation) // recurrence is top-level
  | ({ type: "ApiConnection"; inputs: ApiConnectionInputs; recurrence?: Recurrence; kind?: ActionKind; } & BaseTriggerOperation)
  | ({ type: "ApiConnectionWebhook"; inputs: ApiConnectionInputs & { schema?: SchemaObject; accessKeyType?: "Primary" | "Secondary" }; kind?: ActionKind; } & BaseTriggerOperation) // No recurrence usually
  | ({ type: "Http"; inputs: HttpInputs; recurrence?: Recurrence; kind?: "Http" | ActionKind; } & BaseTriggerOperation)
  // ... Add other trigger types here, e.g., ApiManagement, Batch, SlidingWindow
  | ({ type: TriggerType; inputs: any; kind?: ActionKind | TriggerKind; recurrence?: Recurrence; } & BaseTriggerOperation); // Fallback for other triggers


export interface WorkflowDefinition {
  $schema: "https://schema.management.azure.com/providers/Microsoft.Logic/schemas/2016-06-01/workflowdefinition.json#";
  contentVersion: string; // Pattern: (^[0-9]+\\.[0-9]+\\.[0-9]+\\.[0-9]+$)
  parameters?: Record<string, WorkflowParameterDefinition>;
  triggers: Record<string, WorkflowTriggerItem>; // Must have at least one trigger
  actions?: Record<string, WorkflowActionItem>;
  outputs?: Record<string, WorkflowOutputParameterDefinition>;
  metadata?: any;
  description?: string;
} 