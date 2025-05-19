import { useState, useEffect } from 'react';
import { useOrganization } from '../contexts/organizationContext';
import { OrganizationDialog } from '../components/OrganizationDialog';
import { redirect } from 'react-router';
import type { Route } from './+types/create-organization';

export function meta({}: Route.MetaArgs) {
  return [
    { title: "Create Organization" },
    { name: "description", content: "Create a new organization" },
  ];
}

export async function loader({ context }: Route.LoaderArgs) {
  return { message: context.cloudflare.env.VALUE_FROM_CLOUDFLARE };
}

export default function CreateOrganization({ loaderData }: Route.ComponentProps) {
  const [dialogOpen, setDialogOpen] = useState(true);
  const { organizations } = useOrganization();

  // If the user cancels organization creation and has existing orgs, redirect to home
  function handleCloseDialog() {
    setDialogOpen(false);
    if (organizations.length > 0) {
      redirect('/');
    }
  }

  // If the user already has organizations and navigates here directly, show the dialog
  useEffect(() => {
    if (organizations.length > 0) {
      setDialogOpen(true);
    }
  }, [organizations]);

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <OrganizationDialog isOpen={dialogOpen} onClose={handleCloseDialog} />
      
      {/* If dialog is closed and user has no organizations, show static content */}
      {!dialogOpen && organizations.length === 0 && (
        <div className="flex items-center justify-center h-screen">
          <div className="text-center p-8">
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">
              You need an organization to continue
            </h1>
            <p className="text-gray-600 dark:text-gray-300 mb-8">
              Please create an organization to start using the application.
            </p>
            <button
              onClick={() => setDialogOpen(true)}
              className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
            >
              Create Organization
            </button>
          </div>
        </div>
      )}
    </div>
  );
}