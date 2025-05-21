# Power Automate Compatibility Guidelines

This document outlines known compatibility issues between modern JavaScript/TypeScript features and Power Automate expressions.

## Expression Language Limitations

Power Automate uses its own expression language for workflow definitions which has some limitations compared to JavaScript/TypeScript.

### Unsupported JavaScript Operators

The following JavaScript operators are **not supported** in Power Automate expressions:

| Operator | JavaScript Example | Power Automate Alternative |
|----------|-------------------|----------------------------|
| Nullish coalescing (`??`) | `value ?? 'default'` | `if(equals(value, null), 'default', value)` |
| Optional chaining with nullish coalescing | `obj?.prop ?? 'default'` | `if(equals(obj?['prop'], null), 'default', obj?['prop'])` |

### Best Practices

1. **Use `if()` instead of `??`**: Always use the `if(equals(value, null), defaultValue, value)` pattern instead of nullish coalescing.

2. **Use `coalesce()` for simpler cases**: For simple null checks, the `coalesce()` function can be used: `coalesce(value, 'default')`.

3. **Always test expressions**: Before deploying, ensure all expressions are tested and compatible with Power Automate.

### Example: Safe Null Handling

```
// INCORRECT - Will cause a validation error in Power Automate
"previousStatus": @{triggerOutputs()?['body/properties']?['Status@odata.oldValue'] ?? 'None'},

// CORRECT - Using if() function for conditional null handling
"previousStatus": @{if(equals(triggerOutputs()?['body/properties']?['Status@odata.oldValue'], null), 'None', triggerOutputs()?['body/properties']?['Status@odata.oldValue'])},

// ALTERNATIVE - Using coalesce when appropriate
"to": @{coalesce(emailAddress, defaultEmail)}
```

## Other Compatibility Considerations

### Naming Conventions

1. **Avoid spaces and special characters** in flow, action, and trigger names.
2. **Use PascalCase or camelCase** for naming.

### Date and Time Formatting

Always use Power Automate's `formatDateTime()` function for date formatting rather than JavaScript date methods.

### JSON Handling

Be careful with nested JSON in expressions. Consider using intermediate compose actions to simplify complex data operations. 