import { useState } from 'react';
import { Link } from 'react-router';
import { useOrganization } from '../contexts/organizationContext';

export function NavigationBar() {
  const { 
    currentOrganization,
    organizations,
    switchToOrganization
  } = useOrganization();
  
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);

  const toggleDropdown = () => {
    setIsDropdownOpen(prev => !prev);
  };

  const handleOrganizationSelect = (orgId: string) => {
    switchToOrganization(orgId);
    setIsDropdownOpen(false);
  };

  return (
    <nav className="bg-white dark:bg-gray-800 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex">
            <div className="flex-shrink-0 flex items-center">
              <span className="font-bold text-lg text-gray-900 dark:text-white">
                Text-to-Reports
              </span>
            </div>
            <div className="hidden sm:ml-6 sm:flex sm:space-x-8">
              {/* Main navigation links */}
              <Link
                to="/"
                className="inline-flex items-center px-1 pt-1 border-b-2 border-indigo-500 text-sm font-medium text-gray-900 dark:text-white"
              >
                Dashboard
              </Link>
              {/* Add more navigation items here */}
            </div>
          </div>
          
          {/* Right-side content: Organization selector */}
          <div className="flex items-center">
            <div className="ml-3 relative">
              <div>
                <button
                  type="button"
                  className="bg-white dark:bg-gray-800 flex text-sm rounded-full focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 items-center gap-2 px-3 py-2 border border-gray-300 dark:border-gray-600"
                  id="org-menu-button"
                  aria-expanded="false"
                  aria-haspopup="true"
                  onClick={toggleDropdown}
                >
                  <span>{currentOrganization?.name || 'Select Organization'}</span>
                  <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </button>
              </div>

              {/* Dropdown menu */}
              {isDropdownOpen && organizations.length > 0 && (
                <div
                  className="origin-top-right absolute right-0 mt-2 w-56 rounded-md shadow-lg bg-white dark:bg-gray-700 ring-1 ring-black ring-opacity-5 focus:outline-none z-50"
                  role="menu"
                  aria-orientation="vertical"
                  aria-labelledby="org-menu-button"
                  tabIndex={-1}
                >
                  <div className="py-1" role="none">
                    {organizations.map((org) => (
                      <button
                        key={org.id}
                        className={`${
                          currentOrganization?.id === org.id
                            ? 'bg-gray-100 dark:bg-gray-600 text-gray-900 dark:text-white'
                            : 'text-gray-700 dark:text-gray-200'
                        } block w-full text-left px-4 py-2 text-sm hover:bg-gray-100 dark:hover:bg-gray-600`}
                        role="menuitem"
                        onClick={() => handleOrganizationSelect(org.id!)}
                      >
                        {org.name}
                      </button>
                    ))}
                    
                    {/* Create new organization link - this will be enhanced with a modal dialog */}
                    <Link
                      to="/create-organization"
                      className="border-t border-gray-200 dark:border-gray-600 text-gray-700 dark:text-gray-200 block px-4 py-2 text-sm hover:bg-gray-100 dark:hover:bg-gray-600"
                      role="menuitem"
                      onClick={() => setIsDropdownOpen(false)}
                    >
                      + Create new organization
                    </Link>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </nav>
  );
}