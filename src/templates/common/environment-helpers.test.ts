import { createEnvironmentAwareCondition, EnvironmentAwareOptions } from './environment-helpers';
import { FlowAction } from '../../models/flow-types';

describe('createEnvironmentAwareCondition', () => {
  const options: EnvironmentAwareOptions = {
    adminEmail: 'test@example.com',
    envVariableName: 'mode',
    prodValue: 'PROD',
    devValue: 'DEV'
  };
  const prodAction: FlowAction = { type: 'ProdAction', inputs: { foo: 'bar' } };
  const devAction: FlowAction = { type: 'DevAction', inputs: { baz: 'qux' } };

  it('returns a FlowAction with inputs containing expression, actions, and else.actions', () => {
    const result = createEnvironmentAwareCondition(options, prodAction, devAction);

    expect(result.type).toBe('If');
    expect(result).toHaveProperty('inputs');

    const inputs = result.inputs!;
    // Validate expression
    expect(inputs).toHaveProperty('expression');
    expect(inputs.expression).toEqual({
      and: [
        { equals: [`@variables('${options.envVariableName}')`, options.prodValue!] }
      ]
    });

    // Validate actions
    expect(inputs).toHaveProperty('actions');
    expect(inputs.actions).toEqual({ productionAction: prodAction });

    // Validate else branch
    expect(inputs).toHaveProperty('else');
    expect(inputs.else).toHaveProperty('actions');
    expect(inputs.else.actions).toEqual({ developmentAction: devAction });
  });
}); 