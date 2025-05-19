import { Hono } from 'hono';
import { zValidator } from '@hono/zod-validator';
import { createOrganizationSchema, organizationSchema } from '../schemas/organizations';

// Create a router for organization endpoints
const organizations = new Hono();

// Get all organizations for a user
organizations.get('/', async (c) => {
  // In a real implementation, we would extract the user ID from the authenticated session
  const userId = c.req.header('x-user-id');
  
  if (!userId) {
    return c.json({ error: 'Authentication required' }, 401);
  }
  
  try {
    // Query Supabase database
    const { supabase } = c.env;
    const { data, error } = await supabase
      .from('organizations')
      .select('*')
      .eq('user_id', userId);
      
    if (error) throw error;
    
    return c.json(data);
  } catch (error: any) {
    console.error('Error fetching organizations:', error);
    return c.json({ error: error.message || 'Failed to fetch organizations' }, 500);
  }
});

// Create a new organization
organizations.post('/', zValidator('json', createOrganizationSchema), async (c) => {
  const { name } = c.req.valid('json');
  const userId = c.req.header('x-user-id');
  
  if (!userId) {
    return c.json({ error: 'Authentication required' }, 401);
  }
  
  try {
    // Create new organization in Supabase
    const { supabase } = c.env;
    const { data, error } = await supabase
      .from('organizations')
      .insert([{ name, user_id: userId }])
      .select();
      
    if (error) throw error;
    
    return c.json(data[0], 201);
  } catch (error: any) {
    console.error('Error creating organization:', error);
    return c.json({ error: error.message || 'Failed to create organization' }, 500);
  }
});

// Get a specific organization
organizations.get('/:id', async (c) => {
  const id = c.req.param('id');
  const userId = c.req.header('x-user-id');
  
  if (!userId) {
    return c.json({ error: 'Authentication required' }, 401);
  }
  
  try {
    // Fetch the organization from Supabase
    const { supabase } = c.env;
    const { data, error } = await supabase
      .from('organizations')
      .select('*')
      .eq('id', id)
      .eq('user_id', userId)
      .single();
      
    if (error) {
      if (error.code === 'PGRST116') {
        return c.json({ error: 'Organization not found' }, 404);
      }
      throw error;
    }
    
    return c.json(data);
  } catch (error: any) {
    console.error('Error fetching organization:', error);
    return c.json({ error: error.message || 'Failed to fetch organization' }, 500);
  }
});

// Update an organization
organizations.put('/:id', zValidator('json', organizationSchema.pick({ name: true })), async (c) => {
  const id = c.req.param('id');
  const { name } = c.req.valid('json');
  const userId = c.req.header('x-user-id');
  
  if (!userId) {
    return c.json({ error: 'Authentication required' }, 401);
  }
  
  try {
    // Update the organization in Supabase
    const { supabase } = c.env;
    const { data, error } = await supabase
      .from('organizations')
      .update({ name, updated_at: new Date().toISOString() })
      .eq('id', id)
      .eq('user_id', userId)
      .select();
      
    if (error) throw error;
    
    if (data.length === 0) {
      return c.json({ error: 'Organization not found or not authorized' }, 404);
    }
    
    return c.json(data[0]);
  } catch (error: any) {
    console.error('Error updating organization:', error);
    return c.json({ error: error.message || 'Failed to update organization' }, 500);
  }
});

// Delete an organization
organizations.delete('/:id', async (c) => {
  const id = c.req.param('id');
  const userId = c.req.header('x-user-id');
  
  if (!userId) {
    return c.json({ error: 'Authentication required' }, 401);
  }
  
  try {
    // Delete the organization from Supabase
    const { supabase } = c.env;
    const { error } = await supabase
      .from('organizations')
      .delete()
      .eq('id', id)
      .eq('user_id', userId);
      
    if (error) throw error;
    
    return c.json({ success: true });
  } catch (error: any) {
    console.error('Error deleting organization:', error);
    return c.json({ error: error.message || 'Failed to delete organization' }, 500);
  }
});

export default organizations;