import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { getUserOrganizations, createOrganization, switchOrganization } from '../lib/supabase';
import type { Organization } from '../../workers/schemas/organizations';

// Mock user ID for demonstration - in a real app, this would come from auth
const MOCK_USER_ID = 'temp-user-id';

interface OrganizationContextType {
  currentOrganization: Organization | null;
  organizations: Organization[];
  isLoading: boolean;
  error: string | null;
  createNewOrganization: (name: string) => Promise<Organization>;
  switchToOrganization: (orgId: string) => void;
  loadOrganizations: () => Promise<void>;
}

const OrganizationContext = createContext<OrganizationContextType | undefined>(undefined);

export function OrganizationProvider({ children }: { children: ReactNode }) {
  const [currentOrganization, setCurrentOrganization] = useState<Organization | null>(null);
  const [organizations, setOrganizations] = useState<Organization[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Load organizations on mount
  useEffect(() => {
    loadOrganizations();
  }, []);

  // Load saved organization from localStorage on mount
  useEffect(() => {
    const savedOrgId = localStorage.getItem('currentOrganizationId');
    if (savedOrgId && organizations.length > 0) {
      const org = organizations.find(o => o.id === savedOrgId);
      if (org) {
        setCurrentOrganization(org);
      } else if (organizations.length > 0) {
        // If saved org not found but orgs exist, use the first one
        setCurrentOrganization(organizations[0]);
        localStorage.setItem('currentOrganizationId', organizations[0].id!);
      }
    } else if (organizations.length > 0) {
      // No saved org, but orgs exist
      setCurrentOrganization(organizations[0]);
      localStorage.setItem('currentOrganizationId', organizations[0].id!);
    }
  }, [organizations]);

  // Load user's organizations from Supabase
  async function loadOrganizations() {
    setIsLoading(true);
    setError(null);
    
    try {
      const data = await getUserOrganizations(MOCK_USER_ID);
      setOrganizations(data);
      
      // If there are organizations but no current one is set, set the first one
      if (data.length > 0 && !currentOrganization) {
        setCurrentOrganization(data[0]);
        localStorage.setItem('currentOrganizationId', data[0].id!);
      }
    } catch (err: any) {
      setError(err.message || 'Failed to load organizations');
      console.error('Error loading organizations:', err);
    } finally {
      setIsLoading(false);
    }
  }

  // Create a new organization
  async function createNewOrganization(name: string) {
    setIsLoading(true);
    setError(null);
    
    try {
      const newOrg = await createOrganization(name, MOCK_USER_ID);
      
      // Update state with new organization
      setOrganizations(prev => [...prev, newOrg]);
      setCurrentOrganization(newOrg);
      localStorage.setItem('currentOrganizationId', newOrg.id!);
      
      return newOrg;
    } catch (err: any) {
      setError(err.message || 'Failed to create organization');
      console.error('Error creating organization:', err);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }

  // Switch to a different organization
  function switchToOrganization(orgId: string) {
    const org = organizations.find(o => o.id === orgId);
    if (org) {
      setCurrentOrganization(org);
      localStorage.setItem('currentOrganizationId', orgId);
      switchOrganization(orgId); // Call helper function for any additional logic
    } else {
      setError('Organization not found');
    }
  }

  const value = {
    currentOrganization,
    organizations,
    isLoading,
    error,
    createNewOrganization,
    switchToOrganization,
    loadOrganizations
  };

  return (
    <OrganizationContext.Provider value={value}>
      {children}
    </OrganizationContext.Provider>
  );
}

// Custom hook to use the organization context
export function useOrganization() {
  const context = useContext(OrganizationContext);
  if (context === undefined) {
    throw new Error('useOrganization must be used within an OrganizationProvider');
  }
  return context;
}