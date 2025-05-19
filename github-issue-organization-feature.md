# Organization Management Feature

## Title: Organization Management Feature

## Description:
Implement organization creation and switching functionality to allow users to create and manage multiple organizations within the application. Users should be able to create new organizations, switch between them, and see which organization they are currently working with.

## Expected Behavior:
- Users can create new organizations with a name
- Users can view a list of their organizations
- Users can switch between organizations
- The current organization is saved in localStorage for persistence
- The current organization is displayed in the navigation bar
- First-time users are prompted to create their first organization
- Organization-specific data is scoped to the selected organization

## Sub-tasks:
1. Create Zod schemas for organization data validation
2. Set up API endpoints for organization CRUD operations
3. Implement organization context for state management
4. Create organization creation dialog component
5. Add organization selector to navigation bar
6. Implement organization switching functionality
7. Add dedicated route for organization creation
8. Ensure persistence of selected organization
9. Handle error states and loading states
10. Set up appropriate redirects and navigation flows

## Additional Notes:
- For demonstration purposes, a mock user ID is used, which would be replaced with real auth in production
- The feature uses Supabase for data storage
- All organization-related components follow the design system using TailwindCSS
- Proper error handling and validation are implemented throughout