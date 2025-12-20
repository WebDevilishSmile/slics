// src/app/(admin)/layout.jsx
import { getUserByEmail } from '@/utils/usersApi'; // Import your user utility
import PageContainer from '../components/layout/PageContainer'; // Adjust path if needed
import RedirectMessage from '../components/layout/RedirectMessage';
import { auth } from '@/auth';

// This layout will apply to all pages within the (admin) route group.
// It will be a Server Component by default, which is perfect for Auth.js 'auth' helper.
export default async function AdminLayout({ children }) {
  const session = await auth(); // Get the session server-side

  // 1. Check for Authentication
  if (!session) {
    console.log('AdminLayout: User not logged in, redirecting to sign-in.');
    return (
      <RedirectMessage
        heading='You must be logged in to access admin pages.'
        subheading='Please sign in to continue.'
        redirect='/' // Redirect to your sign-in page
      />
    );
  }

  // 2. Fetch User Role from DB (since session.user.role might be stale without this)
  let user = null;
  try {
    user = await getUserByEmail(session.user.email);
  } catch (error) {
    console.error('AdminLayout: Error fetching user by email:', error);
    // Handle error, e.g., redirect to an error page or sign-in
    return (
      <RedirectMessage
        heading='An error occurred while verifying your account. Please try again.'
        subheading='If the problem persists, contact support.'
        redirect='/signin'
      />
    );
  }

  // 3. Check for Admin Role
  const isAdmin = user?.role === 'admin'; // Use optional chaining in case user is null

  if (!isAdmin) {
    console.log(
      'AdminLayout: User is logged in but not an admin, redirecting to /home.'
    );
    return (
      <RedirectMessage
        heading='You must be an administrator to access this content.'
        subheading='Redirecting you to the home page...'
        redirect='/home' // Redirect non-admins to /home
      />
    );
  }

  // If authenticated and is admin, render the children (the page content)
  return (
    <PageContainer>
      {/* You can add common admin-specific UI here, like a header or sidebar */}
      {children}
    </PageContainer>
  );
}
