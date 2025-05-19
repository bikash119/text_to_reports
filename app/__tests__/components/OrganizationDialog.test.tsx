import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { OrganizationDialog } from '../../components/OrganizationDialog';
import * as organizationContext from '../../contexts/organizationContext';

// Mock useOrganization hook
vi.mock('../../contexts/organizationContext', () => ({
  useOrganization: vi.fn()
}));

// Mock router hooks
vi.mock('react-router', async () => {
  const actual = await vi.importActual('react-router');
  return {
    ...actual,
    useNavigate: () => mockNavigate
  };
});

// Create a wrapper component that simulates the router context
function RouterWrapper({ children }: { children: React.ReactNode }) {
  return <div>{children}</div>;
}

const mockNavigate = vi.fn();

describe('OrganizationDialog', () => {
  // Common props
  const mockProps = {
    isOpen: true,
    onClose: vi.fn()
  };

  // Mock implementation of useOrganization
  const mockCreateNewOrganization = vi.fn();
  
  beforeEach(() => {
    vi.resetAllMocks();
    
    // Default mock implementation
    vi.mocked(organizationContext.useOrganization).mockReturnValue({
      createNewOrganization: mockCreateNewOrganization,
      organizations: [],
      currentOrganization: null,
      isLoading: false,
      error: null,
      switchToOrganization: vi.fn(),
      loadOrganizations: vi.fn()
    });
  });

  // Happy path tests
  it('renders the dialog when isOpen is true', () => {
    render(
      <RouterWrapper>
        <OrganizationDialog {...mockProps} />
      </RouterWrapper>
    );
    
    expect(screen.getByText('Create Your First Organization')).toBeInTheDocument();
    expect(screen.getByLabelText('Organization Name')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Create Organization' })).toBeInTheDocument();
  });

  it('submits the form and creates a new organization', async () => {
    mockCreateNewOrganization.mockResolvedValue({ id: 'new-org', name: 'New Org' });
    
    render(
      <RouterWrapper>
        <OrganizationDialog {...mockProps} />
      </RouterWrapper>
    );
    
    // Fill out the form
    await userEvent.type(screen.getByLabelText('Organization Name'), 'New Org');
    
    // Submit the form
    await userEvent.click(screen.getByRole('button', { name: 'Create Organization' }));
    
    // Assert organization creation was called
    expect(mockCreateNewOrganization).toHaveBeenCalledWith('New Org');
    
    // Should call onClose
    await waitFor(() => {
      expect(mockProps.onClose).toHaveBeenCalled();
    });
    
    // Should navigate to home
    expect(mockNavigate).toHaveBeenCalledWith('/');
  });

  it('renders with existing organizations', () => {
    vi.mocked(organizationContext.useOrganization).mockReturnValue({
      createNewOrganization: mockCreateNewOrganization,
      organizations: [{ id: 'org-1', name: 'Existing Org', user_id: 'user-1' }],
      currentOrganization: null,
      isLoading: false,
      error: null,
      switchToOrganization: vi.fn(),
      loadOrganizations: vi.fn()
    });
    
    render(
      <RouterWrapper>
        <OrganizationDialog {...mockProps} />
      </RouterWrapper>
    );
    
    // Should show different heading with existing orgs
    expect(screen.getByText('Create New Organization')).toBeInTheDocument();
    
    // Should have cancel button when there are existing orgs
    expect(screen.getByRole('button', { name: 'Cancel' })).toBeInTheDocument();
  });

  it('closes the dialog when cancel is clicked with existing orgs', async () => {
    vi.mocked(organizationContext.useOrganization).mockReturnValue({
      createNewOrganization: mockCreateNewOrganization,
      organizations: [{ id: 'org-1', name: 'Existing Org', user_id: 'user-1' }],
      currentOrganization: null,
      isLoading: false,
      error: null,
      switchToOrganization: vi.fn(),
      loadOrganizations: vi.fn()
    });
    
    render(
      <RouterWrapper>
        <OrganizationDialog {...mockProps} />
      </RouterWrapper>
    );
    
    // Click the X button
    await userEvent.click(screen.getByRole('button', { name: '' }));
    
    expect(mockProps.onClose).toHaveBeenCalled();
  });

  // Failure path tests
  it('shows validation error for empty organization name', async () => {
    render(
      <RouterWrapper>
        <OrganizationDialog {...mockProps} />
      </RouterWrapper>
    );
    
    // Get the form and submit button
    const form = screen.getByRole('button', { name: 'Create Organization' }).closest('form');
    
    // Submit the form directly
    await act(async () => {
      if (form) fireEvent.submit(form);
    });
    
    // Create function should not be called
    expect(mockCreateNewOrganization).not.toHaveBeenCalled();
  });

  it('handles API error when creating organization', async () => {
    mockCreateNewOrganization.mockRejectedValue(new Error('Failed to create organization'));
    
    render(
      <RouterWrapper>
        <OrganizationDialog {...mockProps} />
      </RouterWrapper>
    );
    
    // Fill and submit form
    await userEvent.type(screen.getByLabelText('Organization Name'), 'Test Org');
    await userEvent.click(screen.getByRole('button', { name: 'Create Organization' }));
    
    // Should show error message
    await waitFor(() => {
      expect(screen.getByText('Failed to create organization')).toBeInTheDocument();
    });
    
    // Should not navigate or close
    expect(mockNavigate).not.toHaveBeenCalled();
    expect(mockProps.onClose).not.toHaveBeenCalled();
  });

  // Edge cases
  it('renders nothing when isOpen is false', () => {
    render(
      <RouterWrapper>
        <OrganizationDialog isOpen={false} onClose={mockProps.onClose} />
      </RouterWrapper>
    );
    
    // Dialog should not be in document - specifically the organization dialog content
    expect(screen.queryByText('Create Your First Organization')).not.toBeInTheDocument();
    expect(screen.queryByText('Create New Organization')).not.toBeInTheDocument();
  });

  it('trims whitespace from organization name', async () => {
    mockCreateNewOrganization.mockResolvedValue({ id: 'new-org', name: 'Trimmed Org' });
    
    render(
      <RouterWrapper>
        <OrganizationDialog {...mockProps} />
      </RouterWrapper>
    );
    
    // Enter name with whitespace
    await userEvent.type(screen.getByLabelText('Organization Name'), '  Trimmed Org  ');
    await userEvent.click(screen.getByRole('button', { name: 'Create Organization' }));
    
    // Should call with trimmed value
    expect(mockCreateNewOrganization).toHaveBeenCalledWith('Trimmed Org');
  });

  it('disables buttons during submission', async () => {
    // Create a mock that doesn't resolve immediately
    mockCreateNewOrganization.mockImplementation(() => new Promise(resolve => {
      setTimeout(() => resolve({ id: 'new-org', name: 'New Org' }), 100);
    }));
    
    vi.mocked(organizationContext.useOrganization).mockReturnValue({
      createNewOrganization: mockCreateNewOrganization,
      organizations: [{ id: 'org-1', name: 'Existing Org', user_id: 'user-1' }],
      currentOrganization: null,
      isLoading: false,
      error: null,
      switchToOrganization: vi.fn(),
      loadOrganizations: vi.fn()
    });
    
    render(
      <RouterWrapper>
        <OrganizationDialog {...mockProps} />
      </RouterWrapper>
    );
    
    // Fill and submit form
    await userEvent.type(screen.getByLabelText('Organization Name'), 'New Org');
    fireEvent.click(screen.getByRole('button', { name: 'Create Organization' }));
    
    // Button should change text and be disabled
    const submitButton = screen.getByRole('button', { name: 'Creating...' });
    expect(submitButton).toBeInTheDocument();
    expect(submitButton).toBeDisabled();
    
    // Cancel button should also be disabled
    expect(screen.getByRole('button', { name: 'Cancel' })).toBeDisabled();
  });
});