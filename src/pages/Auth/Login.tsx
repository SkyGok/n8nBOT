/**
 * Login Page
 * Handles user authentication
 */

import { useState } from 'react';
import { supabase } from '@/lib/supabase';
import { useNavigate, useLocation } from 'react-router-dom';

export function LoginPage() {
  const [emailOrUsername, setEmailOrUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();
  const location = useLocation();

  // Get the page the user was trying to access before login
  const from = (location.state as any)?.from?.pathname || '/dashboard';

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const input = emailOrUsername.trim();
      
      // Validate input
      if (!input) {
        throw new Error('Please enter your email address.');
      }

      if (!password) {
        throw new Error('Please enter your password.');
      }

      // Determine email - must be a valid email format
      let email = input.toLowerCase().trim(); // Normalize email
      
      // Validate email format
      if (!email.includes('@')) {
        throw new Error('Please enter a valid email address (e.g., user@example.com).');
      }

      // Basic email format validation
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email)) {
        throw new Error('Please enter a valid email address format.');
      }

      console.log('[Login] ============================================');
      console.log('[Login] Attempting to authenticate');
      console.log('[Login] Email:', email);
      console.log('[Login] Password length:', password.length);
      console.log('[Login] Supabase URL:', import.meta.env.VITE_SUPABASE_URL?.substring(0, 30) + '...');
      console.log('[Login] Has Supabase Key:', !!import.meta.env.VITE_SUPABASE_ANON_KEY);
      console.log('[Login] Supabase client:', supabase ? 'Initialized' : 'NOT INITIALIZED');
      console.log('[Login] ============================================');

      // Step 1: Authenticate with Supabase Auth (uses auth.users table)
      // This validates email and password from Authentication users
      const { data, error: authError } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (authError) {
        console.error('[Login] Auth error details:', {
          message: authError.message,
          status: authError.status,
          name: authError.name,
          code: (authError as any).code,
          fullError: authError,
        });
        
        // Log the full error object
        console.error('[Login] Full error object:', JSON.stringify(authError, null, 2));

        // Provide user-friendly error messages
        if (authError.message.includes('Invalid login credentials') || 
            authError.message.includes('Email not confirmed') ||
            authError.message.includes('Invalid email or password') ||
            authError.message.includes('Invalid login credentials')) {
          throw new Error('Invalid email or password. Please check your credentials and try again.');
        }
        
        if (authError.message.includes('Email not confirmed')) {
          throw new Error('Please verify your email address before logging in.');
        }

        // Show the actual error for debugging (you can remove this later)
        throw new Error(`Authentication failed: ${authError.message}`);
      }

      if (!data.user) {
        throw new Error('Login failed: No user data returned');
      }

      console.log('[Login] Authentication successful for user:', data.user.email);

      // Step 2: Verify/sync user exists in public.users table
      // Check if user exists in public.users
      type UserRecord = {
        id: string;
        email: string | null;
      };

      const { data: existingUser, error: checkError } = await supabase
        .from('users')
        .select('id, email')
        .eq('id', data.user.id)
        .single();

      if (checkError && checkError.code !== 'PGRST116') { // PGRST116 = not found
        console.error('[Login] Error checking public.users:', checkError);
      }

      const typedExistingUser = existingUser as UserRecord | null;

      // If user doesn't exist in public.users, create them
      if (!typedExistingUser) {
        const { error: syncError } = await supabase
          .from('users')
          .insert({
            id: data.user.id,
            email: data.user.email || email,
            full_name: data.user.user_metadata?.full_name || data.user.email?.split('@')[0] || email.split('@')[0],
            created_at: data.user.created_at,
          } as any);

        if (syncError) {
          console.warn('[Login] Error syncing user to public.users:', syncError);
          // Don't block login if sync fails - user is authenticated
        }
      } else {
        // Update email if it changed in auth.users
        if (typedExistingUser.email !== data.user.email) {
          const { error: updateError } = await supabase
            .from('users')
            .update({ email: data.user.email || null })
            .eq('id', data.user.id);

          if (updateError) {
            console.warn('[Login] Error updating user email in public.users:', updateError);
          }
        }
      }

      // Step 3: Verify user is assigned to at least one tenant
      const { data: tenantUsers, error: tenantCheckError } = await supabase
        .from('tenant_users')
        .select('tenant_id')
        .eq('user_id', data.user.id)
        .limit(1);

      if (tenantCheckError) {
        console.warn('[Login] Error checking tenant assignment:', tenantCheckError);
        // Don't block login if tenant check fails - let TenantContext handle it
      }

      if (!tenantUsers || tenantUsers.length === 0) {
        console.warn('[Login] User not assigned to any tenant. They will see an error after login.');
        // Still allow login - TenantContext will show appropriate error
        // throw new Error('User is not assigned to any tenant. Please contact support.');
      } else {
        console.log('[Login] User is assigned to', tenantUsers.length, 'tenant(s)');
      }

      // Redirect to the page they were trying to access, or dashboard
      // TenantContext will automatically load the tenant after auth
      navigate(from, { replace: true });
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Login failed. Please try again.';
      setError(errorMessage);
      console.error('[Login] Error:', err);
      // Clear password field on error for security, but keep email/username
      setPassword('');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
            Sign in to your account
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600">
            Access your tenant dashboard
          </p>
        </div>
        <form className="mt-8 space-y-6" onSubmit={handleLogin}>
          <div className="rounded-md shadow-sm -space-y-px">
            <div>
              <label htmlFor="emailOrUsername" className="sr-only">
                Email or Username
              </label>
              <input
                id="emailOrUsername"
                name="emailOrUsername"
                type="text"
                autoComplete="username"
                required
                value={emailOrUsername}
                onChange={(e) => {
                  setEmailOrUsername(e.target.value);
                  // Clear error when user starts typing
                  if (error) setError(null);
                }}
                className={`appearance-none rounded-none relative block w-full px-3 py-2 border ${
                  error 
                    ? 'border-red-300 focus:border-red-500 focus:ring-red-500' 
                    : 'border-gray-300 focus:border-blue-500 focus:ring-blue-500'
                } placeholder-gray-500 text-gray-900 rounded-t-md focus:outline-none focus:ring-1 focus:z-10 sm:text-sm`}
                placeholder="Email or Username"
              />
            </div>
            <div>
              <label htmlFor="password" className="sr-only">
                Password
              </label>
              <input
                id="password"
                name="password"
                type="password"
                autoComplete="current-password"
                required
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value);
                  // Clear error when user starts typing
                  if (error) setError(null);
                }}
                className={`appearance-none rounded-none relative block w-full px-3 py-2 border ${
                  error 
                    ? 'border-red-300 focus:border-red-500 focus:ring-red-500' 
                    : 'border-gray-300 focus:border-blue-500 focus:ring-blue-500'
                } placeholder-gray-500 text-gray-900 rounded-b-md focus:outline-none focus:ring-1 focus:z-10 sm:text-sm`}
                placeholder="Password"
              />
            </div>
          </div>

          {error && (
            <div className="rounded-md bg-red-50 border border-red-200 p-4">
              <div className="flex items-start">
                <div className="flex-shrink-0">
                  <svg
                    className="h-5 w-5 text-red-400"
                    viewBox="0 0 20 20"
                    fill="currentColor"
                    aria-hidden="true"
                  >
                    <path
                      fillRule="evenodd"
                      d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                      clipRule="evenodd"
                    />
                  </svg>
                </div>
                <div className="ml-3 flex-1">
                  <h3 className="text-sm font-medium text-red-800">{error}</h3>
                  <p className="mt-1 text-sm text-red-700">
                    Please check your credentials and try again.
                  </p>
                  <div className="mt-3">
                    <button
                      type="button"
                      onClick={() => {
                        setError(null);
                        // Focus on the password field for easy retry
                        document.getElementById('password')?.focus();
                      }}
                      className="text-sm font-medium text-red-800 hover:text-red-900 underline focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 rounded"
                    >
                      Click here to retry
                    </button>
                  </div>
                </div>
                <div className="ml-auto pl-3">
                  <button
                    type="button"
                    onClick={() => setError(null)}
                    className="inline-flex rounded-md bg-red-50 text-red-400 hover:bg-red-100 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2"
                    aria-label="Dismiss error"
                  >
                    <svg className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                      <path
                        fillRule="evenodd"
                        d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
                        clipRule="evenodd"
                      />
                    </svg>
                  </button>
                </div>
              </div>
            </div>
          )}

          <div>
            <button
              type="submit"
              disabled={loading}
              className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {loading ? (
                <span className="flex items-center">
                  <svg
                    className="animate-spin -ml-1 mr-3 h-5 w-5 text-white"
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                  >
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                    ></circle>
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                    ></path>
                  </svg>
                  Signing in...
                </span>
              ) : error ? (
                'Try Again'
              ) : (
                'Sign in'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

