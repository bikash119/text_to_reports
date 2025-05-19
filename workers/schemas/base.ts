import { z } from 'zod';

// Base error response schema
export const ErrorResponseSchema = z.object({
  error: z.object({
    message: z.string(),
    code: z.string().optional(),
    details: z.array(z.string()).optional(),
  }),
});

export type ErrorResponse = z.infer<typeof ErrorResponseSchema>;

// Base success response schema with pagination
export const PaginationSchema = z.object({
  page: z.number().int().positive(),
  pageSize: z.number().int().positive(),
  totalItems: z.number().int().nonnegative(),
  totalPages: z.number().int().positive(),
});

export type Pagination = z.infer<typeof PaginationSchema>;

// Helper function to create a paginated response schema
export function createPaginatedResponseSchema<T extends z.ZodTypeAny>(
  schema: T,
) {
  return z.object({
    data: z.array(schema),
    pagination: PaginationSchema,
  });
}