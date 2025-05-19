import { z } from 'zod';
import { createPaginatedResponseSchema } from './base';

// Report types enum
export const ReportTypeEnum = z.enum([
  'financial',
  'operational',
  'marketing',
  'sales',
  'custom',
]);

export type ReportType = z.infer<typeof ReportTypeEnum>;

// Report status enum
export const ReportStatusEnum = z.enum([
  'draft',
  'pending',
  'processing',
  'completed',
  'failed',
]);

export type ReportStatus = z.infer<typeof ReportStatusEnum>;

// Report schema
export const ReportSchema = z.object({
  id: z.string().uuid(),
  title: z.string().min(1).max(100),
  description: z.string().max(500).optional(),
  type: ReportTypeEnum,
  status: ReportStatusEnum,
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
  completedAt: z.string().datetime().optional(),
  userId: z.string().uuid(),
  metadata: z.record(z.string(), z.unknown()).optional(),
});

export type Report = z.infer<typeof ReportSchema>;

// Create report request schema
export const CreateReportRequestSchema = z.object({
  title: z.string().min(1).max(100),
  description: z.string().max(500).optional(),
  type: ReportTypeEnum,
  metadata: z.record(z.string(), z.unknown()).optional(),
});

export type CreateReportRequest = z.infer<typeof CreateReportRequestSchema>;

// Create report response schema
export const CreateReportResponseSchema = z.object({
  data: ReportSchema,
});

export type CreateReportResponse = z.infer<typeof CreateReportResponseSchema>;

// Get report params schema
export const GetReportParamsSchema = z.object({
  id: z.string().uuid(),
});

export type GetReportParams = z.infer<typeof GetReportParamsSchema>;

// Get report response schema
export const GetReportResponseSchema = z.object({
  data: ReportSchema,
});

export type GetReportResponse = z.infer<typeof GetReportResponseSchema>;

// List reports query schema
export const ListReportsQuerySchema = z.object({
  page: z.string().transform(Number).pipe(z.number().int().positive()).optional().default('1'),
  pageSize: z.string().transform(Number).pipe(z.number().int().positive().max(100)).optional().default('20'),
  type: ReportTypeEnum.optional(),
  status: ReportStatusEnum.optional(),
});

export type ListReportsQuery = z.infer<typeof ListReportsQuerySchema>;

// List reports response schema
export const ListReportsResponseSchema = createPaginatedResponseSchema(ReportSchema);

export type ListReportsResponse = z.infer<typeof ListReportsResponseSchema>;