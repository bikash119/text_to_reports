import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, waitFor, act } from '@testing-library/react';
import { OrganizationProvider, useOrganization } from '../../contexts/organizationContext';
import * as supabaseModule from '../../lib/supabase';

// Mock the supabase functions
vi.mock('../../lib/supabase', () => ({
  getUserOrganizations: vi.fn(),
  createOrganization: vi.fn(),
  switchOrganization: vi.fn()
}));

// Test component to expose context values
function TestComponent() {
  const context = useOrganization();
  return (
    <div>
      <div data-testid="loading">{context.isLoading.toString()}</div>
      <div data-testid="error">{context.error || 'no-error'}</div>
      <div data-testid="current-org">{context.currentOrganization?.name || 'no-current-org'}</div>
      <div data-testid="orgs-count">{context.organizations.length}</div>
      <button 
        data-testid="create-org-btn" 
        onClick={() => context.createNewOrganization('Test Org')}
      >
        Create
      </button>
      <button 
        data-testid="switch-org-btn" 
        onClick={() => context.switchToOrganization('org-id-2')}
      >
        Switch
      </button>
      <button 
        data-testid="load-orgs-btn" 
        onClick={() => context.loadOrganizations()}
      >
        Load
      </button>
    </div>
  );
}

describe('OrganizationContext', () => {
  const mockOrgs = [
    { id: 'org-id-1', name: 'Org 1', user_id: 'temp-user-id' },
    { id: 'org-id-2', name: 'Org 2', user_id: 'temp-user-id' }
  ];

  beforeEach(() => {
    // Reset localStorage mock
    localStorage.getItem.mockReset();
    localStorage.setItem.mockReset();

    // Reset all mocks
    vi.clearAllMocks();
    
    // Mock getUserOrganizations to return organizations
    vi.mocked(supabaseModule.getUserOrganizations).mockResolvedValue(mockOrgs);
  });

  afterEach(() => {
    vi.resetAllMocks();
  });

  // Happy path tests
  it('should load organizations on mount', async () => {
    render(
      <OrganizationProvider>
        <TestComponent />
      </OrganizationProvider>
    );

    // Initially loading
    expect(screen.getByTestId('loading').textContent).toBe('true');

    // Wait for organizations to load
    await waitFor(() => {
      expect(screen.getByTestId('loading').textContent).toBe('false');
      expect(screen.getByTestId('orgs-count').textContent).toBe('2');
    });

    // Should set first org as current if no saved org
    expect(screen.getByTestId('current-org').textContent).toBe('Org 1');
    expect(localStorage.setItem).toHaveBeenCalledWith('currentOrganizationId', 'org-id-1');
  });

  it('should use saved organization from localStorage if available', async () => {
    // Mock localStorage to return a saved organization
    localStorage.getItem.mockReturnValue('org-id-2');

    render(
      <OrganizationProvider>
        <TestComponent />
      </OrganizationProvider>
    );

    // Wait for organizations to load
    await waitFor(() => {
      expect(screen.getByTestId('loading').textContent).toBe('false');
      expect(screen.getByTestId('current-org').textContent).toBe('Org 2');
    });
  });

  it('should create a new organization', async () => {
    // Setup test with empty initial orgs for clean slate
    vi.mocked(supabaseModule.getUserOrganizations).mockResolvedValue([]);
    
    const newOrg = { id: 'new-org-id', name: 'Test Org', user_id: 'temp-user-id' };
    vi.mocked(supabaseModule.createOrganization).mockResolvedValue(newOrg);

    render(
      <OrganizationProvider>
        <TestComponent />
      </OrganizationProvider>
    );

    // Wait for initial load with empty orgs
    await waitFor(() => {
      expect(screen.getByTestId('loading').textContent).toBe('false');
      expect(screen.getByTestId('orgs-count').textContent).toBe('0');
    });

    // Create new organization
    await act(async () => {
      screen.getByTestId('create-org-btn').click();
    });

    // Wait for new org to be set as current
    await waitFor(() => {
      expect(screen.getByTestId('current-org').textContent).toBe('Test Org');
    });
    
    // Should update localStorage and call API
    expect(localStorage.setItem).toHaveBeenCalledWith('currentOrganizationId', 'new-org-id');
    expect(supabaseModule.createOrganization).toHaveBeenCalledWith('Test Org', 'temp-user-id');
  });

  it('should switch to a different organization', async () => {
    render(
      <OrganizationProvider>
        <TestComponent />
      </OrganizationProvider>
    );

    // Wait for initial load
    await waitFor(() => {
      expect(screen.getByTestId('loading').textContent).toBe('false');
    });

    // Switch to different organization
    act(() => {
      screen.getByTestId('switch-org-btn').click();
    });

    // Should update current organization and localStorage
    expect(screen.getByTestId('current-org').textContent).toBe('Org 2');
    expect(localStorage.setItem).toHaveBeenCalledWith('currentOrganizationId', 'org-id-2');
    expect(supabaseModule.switchOrganization).toHaveBeenCalledWith('org-id-2');
  });

  // Failure path tests
  it('should handle errors when loading organizations', async () => {
    vi.mocked(supabaseModule.getUserOrganizations).mockRejectedValue(new Error('Failed to load'));

    render(
      <OrganizationProvider>
        <TestComponent />
      </OrganizationProvider>
    );

    // Wait for error to be set
    await waitFor(() => {
      expect(screen.getByTestId('loading').textContent).toBe('false');
      expect(screen.getByTestId('error').textContent).toBe('Failed to load');
    });
  });

  it('should handle errors when creating an organization', async () => {
    vi.mocked(supabaseModule.getUserOrganizations).mockResolvedValue(mockOrgs);
    vi.mocked(supabaseModule.createOrganization).mockRejectedValue(new Error('Failed to create'));

    render(
      <OrganizationProvider>
        <TestComponent />
      </OrganizationProvider>
    );

    // Wait for initial load
    await waitFor(() => {
      expect(screen.getByTestId('loading').textContent).toBe('false');
    });

    // Attempt to create organization
    await act(async () => {
      screen.getByTestId('create-org-btn').click();
    });

    // Should show error
    expect(screen.getByTestId('error').textContent).toBe('Failed to create');
  });

  it('should handle when switching to a non-existent organization', async () => {
    // Mock switching to non-existent org
    localStorage.getItem.mockReturnValue('non-existent-id');

    render(
      <OrganizationProvider>
        <TestComponent />
      </OrganizationProvider>
    );

    // Should fall back to first organization
    await waitFor(() => {
      expect(screen.getByTestId('current-org').textContent).toBe('Org 1');
    });
  });

  // Edge case tests
  it('should handle empty organization list', async () => {
    vi.mocked(supabaseModule.getUserOrganizations).mockResolvedValue([]);

    render(
      <OrganizationProvider>
        <TestComponent />
      </OrganizationProvider>
    );

    await waitFor(() => {
      expect(screen.getByTestId('loading').textContent).toBe('false');
      expect(screen.getByTestId('orgs-count').textContent).toBe('0');
      expect(screen.getByTestId('current-org').textContent).toBe('no-current-org');
    });
  });

  it('should throw error when using context outside provider', () => {
    // Mock console.error to prevent it from cluttering test output
    const originalConsoleError = console.error;
    console.error = vi.fn();

    // Attempt to render component without provider should throw
    expect(() => {
      render(<TestComponent />);
    }).toThrow('useOrganization must be used within an OrganizationProvider');

    // Restore console.error
    console.error = originalConsoleError;
  });
});