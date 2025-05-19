import { Context, Env, MiddlewareHandler, Next } from 'hono';
import { z } from 'zod';

// Type for validatable request parts
type ValidatableRequestPart = 'params' | 'query' | 'body' | 'headers';

// Options for validator middleware
export type ValidatorOptions = {
  // Flag to return all validation errors instead of just the first
  returnAllErrors?: boolean;
};

// Create validator middleware for request parts
export const createValidator = <
  T extends z.ZodTypeAny,
  E extends Env = Env,
  P extends string = string,
  I = {},
  O = I
>(
  schema: T,
  target: ValidatableRequestPart,
  options: ValidatorOptions = {}
): MiddlewareHandler<E, P, I, O> => {
  return async (c: Context<E, P, I>, next: Next) => {
    let data: unknown;

    // Extract data based on the target
    switch (target) {
      case 'params':
        data = c.req.param();
        break;
      case 'query':
        data = c.req.query();
        break;
      case 'body':
        if (c.req.header('content-type')?.includes('application/json')) {
          try {
            data = await c.req.json();
          } catch (e) {
            return c.json(
              {
                error: {
                  message: 'Invalid JSON body',
                  code: 'INVALID_JSON',
                },
              },
              400
            );
          }
        } else {
          return c.json(
            {
              error: {
                message: 'Content-Type must be application/json',
                code: 'INVALID_CONTENT_TYPE',
              },
            },
            415
          );
        }
        break;
      case 'headers':
        data = c.req.header();
        break;
      default:
        throw new Error(`Invalid validation target: ${target}`);
    }

    // Validate the data
    const result = schema.safeParse(data);

    if (!result.success) {
      const { error } = result;
      
      // Format the error response
      const errorResponse = options.returnAllErrors
        ? {
            error: {
              message: 'Validation failed',
              code: 'VALIDATION_ERROR',
              details: error.errors.map(
                (err) => `${err.path.join('.')}: ${err.message}`
              ),
            },
          }
        : {
            error: {
              message: `${error.errors[0].path.join('.')}: ${error.errors[0].message}`,
              code: 'VALIDATION_ERROR',
            },
          };

      return c.json(errorResponse, 400);
    }

    // Add validated data to the context
    c.set(`valid${target.charAt(0).toUpperCase() + target.slice(1)}`, result.data);

    await next();
  };
};

// Convenience functions for common validations
export const validateParams = <T extends z.ZodTypeAny, E extends Env = Env>(
  schema: T,
  options?: ValidatorOptions
) => createValidator(schema, 'params', options);

export const validateQuery = <T extends z.ZodTypeAny, E extends Env = Env>(
  schema: T,
  options?: ValidatorOptions
) => createValidator(schema, 'query', options);

export const validateBody = <T extends z.ZodTypeAny, E extends Env = Env>(
  schema: T,
  options?: ValidatorOptions
) => createValidator(schema, 'body', options);

export const validateHeaders = <T extends z.ZodTypeAny, E extends Env = Env>(
  schema: T,
  options?: ValidatorOptions
) => createValidator(schema, 'headers', options);