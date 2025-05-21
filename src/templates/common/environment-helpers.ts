import { FlowAction } from '../../models/flow-types';

/**
 * Options for creating environment-aware conditional actions
 */
export interface EnvironmentAwareOptions {
  /** Name of environment variable (default: 'prodOrDev') */
  envVariableName?: string;
  /** Production environment value (default: 'prod') */
  prodValue?: string;
  /** Development environment value (default: 'dev') */
  devValue?: string;
  /** User email for development mode testing */
  adminEmail: string;
}

/**
 * Creates a Flow action to initialize an environment variable
 * @param options Environment configuration options
 * @param isProd Whether to set to production mode (true) or development mode (false)
 * @returns A FlowAction to initialize the environment variable
 */
export function createEnvironmentVariableAction(
  options: EnvironmentAwareOptions,
  isProd: boolean = true
): FlowAction {
  const {
    envVariableName = 'prodOrDev',
    prodValue = 'prod',
    devValue = 'dev'
  } = options;

  return {
    type: 'InitializeVariable',
    inputs: {
      variables: [
        {
          name: envVariableName,
          type: 'string',
          value: isProd ? prodValue : devValue
        }
      ]
    }
  };
}

/**
 * Creates a conditional action that branches based on environment
 * @param options Environment configuration options
 * @param prodAction The action to run in production mode
 * @param devAction The action to run in development mode
 * @returns A conditional Flow action
 */
export function createEnvironmentAwareCondition(
  options: EnvironmentAwareOptions,
  prodAction: FlowAction,
  devAction: FlowAction
): FlowAction {
  const {
    envVariableName = 'prodOrDev',
    prodValue = 'prod'
  } = options;

  return {
    type: 'If',
    inputs: {
      expression: {
        and: [
          {
            equals: [
              `@variables('${envVariableName}')`,
              prodValue
            ]
          }
        ]
      },
      actions: {
        'productionAction': prodAction
      },
      else: {
        actions: {
          'developmentAction': devAction
        }
      }
    }
  };
}

/**
 * Creates a Flow action to initialize a link to item variable
 * @param variableName Name of the variable (default: 'linkToItem')
 * @param viewId Optional SharePoint view ID to append to link
 * @returns A FlowAction to initialize the link variable
 */
export function createLinkToItemVariableAction(
  variableName: string = 'linkToItem',
  viewId?: string
): FlowAction {
  let valueExpression = '@triggerBody()?[\'{Link}\']';
  
  if (viewId) {
    valueExpression = `@concat(triggerBody()?['{Link}'], '&viewid=${viewId}')`;
  }
  
  return {
    type: 'InitializeVariable',
    inputs: {
      variables: [
        {
          name: variableName,
          type: 'string',
          value: valueExpression
        }
      ]
    }
  };
} 