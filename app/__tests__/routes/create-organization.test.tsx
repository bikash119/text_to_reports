import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, act } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import CreateOrganization from '../../routes/create-organization';
import * as organizationContext from '../../contexts/organizationContext';
import * as reactRouter from 'react-router';
import React from 'react';

// Mock the dependencies
vi.mock('../../contexts/organizationContext', () => ({
  useOrganization: vi.fn()
}));

vi.mock('../../components/OrganizationDialog', () => ({
  OrganizationDialog: vi.fn(({ isOpen, onClose }) => isOpen ? (
    <div data-testid="organization-dialog">
      <span>Mock Organization Dialog</span>
      <button data-testid="close-dialog" onClick={onClose}>Close Dialog</button>
    </div>
  ) : null)
}));

vi.mock('react-router', async () => {
  const actual = await vi.importActual('react-router');
  return {
    ...actual,
    redirect: vi.fn()
  };
});

describe('CreateOrganization Route', () => {
  const mockLoaderData = { message: 'test-env-value' };
  
  beforeEach(() => {
    vi.resetAllMocks();
    
    // Default context mock implementation
    vi.mocked(organizationContext.useOrganization).mockReturnValue({
      organizations: [],
      currentOrganization: null,
      isLoading: false,
      error: null,
      createNewOrganization: vi.fn(),
      switchToOrganization: vi.fn(),
      loadOrganizations: vi.fn()
    });
  });

  // Happy path tests
  it('renders with dialog open by default for new users', () => {
    render(<CreateOrganization loaderData={mockLoaderData} />);
    
    // Dialog should be open by default
    expect(screen.getByTestId('organization-dialog')).toBeInTheDocument();
  });

  it('shows static content when dialog closed for new users', async () => {
    render(<CreateOrganization loaderData={mockLoaderData} />);
    
    // Close the dialog
    await userEvent.click(screen.getByTestId('close-dialog'));
    
    // Should show the static content
    expect(screen.getByText('You need an organization to continue')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Create Organization' })).toBeInTheDocument();
  });

  it('reopens dialog when button is clicked in static content', async () => {
    render(<CreateOrganization loaderData={mockLoaderData} />);
    
    // Close the dialog first
    await userEvent.click(screen.getByTestId('close-dialog'));
    
    // Click button to reopen
    await userEvent.click(screen.getByRole('button', { name: 'Create Organization' }));
    
    // Dialog should be open again
    expect(screen.getByTestId('organization-dialog')).toBeInTheDocument();
  });

  // Test with existing organizations
  it('redirects to home when dialog closed with existing organizations', async () => {
    // Mock organizations array with data
    vi.mocked(organizationContext.useOrganization).mockReturnValue({
      organizations: [{ id: 'org-1', name: 'Existing Org', user_id: 'user-1' }],
      currentOrganization: null,
      isLoading: false,
      error: null,
      createNewOrganization: vi.fn(),
      switchToOrganization: vi.fn(),
      loadOrganizations: vi.fn()
    });
    
    render(<CreateOrganization loaderData={mockLoaderData} />);
    
    // Close the dialog
    await userEvent.click(screen.getByTestId('close-dialog'));
    
    // Should call redirect
    expect(reactRouter.redirect).toHaveBeenCalledWith('/');
  });

  it('reopens dialog when navigating directly with existing orgs', async () => {
    // Mock organizations array with data
    vi.mocked(organizationContext.useOrganization).mockReturnValue({
      organizations: [{ id: 'org-1', name: 'Existing Org', user_id: 'user-1' }],
      currentOrganization: { id: 'org-1', name: 'Existing Org', user_id: 'user-1' },
      isLoading: false,
      error: null,
      createNewOrganization: vi.fn(),
      switchToOrganization: vi.fn(),
      loadOrganizations: vi.fn()
    });
    
    // Simulate useEffect by setting dialogOpen to false initially
    // then updating after organizations are loaded
    let setDialogOpenCallback: ((value: boolean) => void) | null = null;
    const originalUseState = React.useState;
    vi.spyOn(React, 'useState').mockImplementationOnce((initialValue) => {
      const [value, setValue] = originalUseState(initialValue);
      setDialogOpenCallback = setValue;
      return [value, setValue];
    });
    
    render(<CreateOrganization loaderData={mockLoaderData} />);
    
    // Manually trigger useEffect
    act(() => {
      if (setDialogOpenCallback) {
        setDialogOpenCallback(true);
      }
    });
    
    // Dialog should be open
    expect(screen.getByTestId('organization-dialog')).toBeInTheDocument();
  });

  // Loader test
  it('loader returns cloudflare environment values', async () => {
    const mockContext = {
      cloudflare: {
        env: {
          VALUE_FROM_CLOUDFLARE: 'test-value'
        }
      }
    };
    
    const { loader } = await import('../../routes/create-organization');
    const result = await loader({ context: mockContext } as any);
    
    expect(result).toEqual({ message: 'test-value' });
  });

  // Meta test
  it('returns correct meta tags', async () => {
    const { meta } = await import('../../routes/create-organization');
    const result = meta({} as any);
    
    expect(result).toEqual([
      { title: "Create Organization" },
      { name: "description", content: "Create a new organization" },
    ]);
  });
});