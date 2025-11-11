/**
 * Header component for the dashboard
 * Displays app title and navigation with toggleable menu button
 */

interface HeaderProps {
  onMenuClick: () => void;
  sidebarOpen: boolean;
}

export const Header: React.FC<HeaderProps> = ({ onMenuClick, sidebarOpen }) => {
  return (
    <header className="bg-white border-b border-gray-200 px-4 sm:px-6 py-3 sm:py-4 sticky top-0 z-30" role="banner">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3 sm:space-x-4">
          {/* Menu toggle button - visible on all screen sizes */}
          <button
            onClick={onMenuClick}
            className="p-2 rounded-md text-gray-600 hover:text-gray-900 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-primary-500 touch-manipulation"
            aria-label={sidebarOpen ? "Close menu" : "Open menu"}
            aria-expanded={sidebarOpen}
          >
            {sidebarOpen ? (
              // Close icon (X)
              <svg
                className="w-6 h-6"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                aria-hidden="true"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            ) : (
              // Menu icon (hamburger)
              <svg
                className="w-6 h-6"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                aria-hidden="true"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M4 6h16M4 12h16M4 18h16"
                />
              </svg>
            )}
          </button>
          
          <div>
            <h1 className="text-xl sm:text-2xl font-bold text-gray-900">n8n Phone Analytics</h1>
            <p className="text-xs sm:text-sm text-gray-500 mt-0.5 sm:mt-1">AI Agent Dashboard</p>
          </div>
        </div>
        
        <nav aria-label="Main navigation">
          <div className="flex items-center space-x-2 sm:space-x-4">
            <button
              className="text-gray-600 hover:text-gray-900 focus:outline-none focus:ring-2 focus:ring-primary-500 rounded-md p-2 sm:px-3 sm:py-2 touch-manipulation"
              aria-label="Notifications"
            >
              <svg
                className="w-5 h-5 sm:w-6 sm:h-6"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                aria-hidden="true"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"
                />
              </svg>
            </button>
          </div>
        </nav>
      </div>
    </header>
  );
};

