import { Context, Env, MiddlewareHandler, Next } from 'hono';
import { z } from 'zod';
import { ErrorResponseSchema } from '../schemas/base';

// Options for response validator middleware
export type ResponseValidatorOptions = {
  // Status code for validation errors
  errorStatus?: number;
  // Flag to validate error responses
  validateErrorResponses?: boolean;
};

// Create response validator middleware
export const validateResponse = <
  T extends z.ZodTypeAny,
  E extends Env = Env,
  P extends string = string,
  I = {},
  O = I
>(
  schema: T,
  options: ResponseValidatorOptions = {}
): MiddlewareHandler<E, P, I, O> => {
  const { errorStatus = 500, validateErrorResponses = true } = options;

  return async (c: Context<E, P, I>, next: Next) => {
    // Store the original json method
    const originalJson = c.json.bind(c);

    // Override the json method to validate responses before sending
    c.json = (data: any, status?: number, headers?: HeadersInit) => {
      // Skip validation for error responses if not required
      const isErrorResponse = status !== undefined && status >= 400;
      
      if (isErrorResponse && !validateErrorResponses) {
        return originalJson(data, status, headers);
      }

      // Choose the schema based on whether it's an error response
      const validationSchema = isErrorResponse ? ErrorResponseSchema : schema;

      // Validate the response data
      const result = validationSchema.safeParse(data);

      if (!result.success) {
        console.error('Response validation failed:', result.error);
        
        return originalJson(
          {
            error: {
              message: 'Internal Server Error: Response validation failed',
              code: 'RESPONSE_VALIDATION_ERROR',
              details: result.error.errors.map(
                (err) => `${err.path.join('.')}: ${err.message}`
              ),
            },
          },
          errorStatus,
          headers
        );
      }

      // Send the validated response
      return originalJson(data, status, headers);
    };

    await next();
  };
};

// Create a typesafe handler with validated request and response
export const createZodHandler = <
  ParamsSchema extends z.ZodTypeAny,
  QuerySchema extends z.ZodTypeAny,
  BodySchema extends z.ZodTypeAny,
  ResponseSchema extends z.ZodTypeAny,
  E extends Env = Env
>(
  paramsSchema: ParamsSchema,
  querySchema: QuerySchema,
  bodySchema: BodySchema,
  responseSchema: ResponseSchema,
  handler: (
    c: Context<E> & {
      validParams: z.infer<ParamsSchema>;
      validQuery: z.infer<QuerySchema>;
      validBody: z.infer<BodySchema>;
    }
  ) => Promise<z.infer<ResponseSchema> | Response>
) => {
  return [
    validateParams(paramsSchema),
    validateQuery(querySchema),
    validateBody(bodySchema),
    validateResponse(responseSchema),
    async (c: Context<E>) => {
      // Cast the context to include the validated data
      const context = c as Context<E> & {
        validParams: z.infer<ParamsSchema>;
        validQuery: z.infer<QuerySchema>;
        validBody: z.infer<BodySchema>;
      };

      const result = await handler(context);
      
      // If the handler returns a Response directly, return it
      if (result instanceof Response) {
        return result;
      }
      
      // Otherwise, return a JSON response
      return c.json(result);
    },
  ];
};