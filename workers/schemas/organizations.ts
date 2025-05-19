import { z } from 'zod';

// Define the organization schema
export const organizationSchema = z.object({
  id: z.string().uuid().optional(), // Generated UUID for the organization
  name: z.string().min(1, 'Organization name is required').max(100, 'Organization name must be less than 100 characters'),
  created_at: z.string().datetime().optional(), // Automatically set by Supabase
  updated_at: z.string().datetime().optional(), // Automatically set by Supabase
  user_id: z.string().uuid(), // ID of the user who created the organization
});

// Define the schema for creating a new organization
export const createOrganizationSchema = organizationSchema.omit({ 
  id: true,
  created_at: true,
  updated_at: true
});

// Define the schema for returning an organization
export const returnOrganizationSchema = organizationSchema;

// Define the schema for a user's organizations
export const userOrganizationsSchema = z.array(organizationSchema);

// Define types based on the schemas
export type Organization = z.infer<typeof organizationSchema>;
export type CreateOrganizationInput = z.infer<typeof createOrganizationSchema>;
export type UserOrganizations = z.infer<typeof userOrganizationsSchema>;