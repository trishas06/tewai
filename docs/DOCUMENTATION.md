# CNC Frontend Documentation

## Table of Contents
1. [Overview](#overview)
2. [Project Structure](#project-structure)
3. [Tech Stack](#tech-stack)
4. [Components](#components)
5. [Services](#services)
6. [Routing](#routing)
7. [State Management](#state-management)
8. [Theme and Styling](#theme-and-styling)
9. [Authentication](#authentication)
10. [Real-time Features](#real-time-features)
11. [Development Guidelines](#development-guidelines)

## Overview
This is a React-based frontend application built with Vite, providing a modern and efficient user interface for CNC operations. The application serves as a comprehensive platform for:

- **Loss Report Management**: Track and manage incident reports with detailed documentation
- **AI-Powered Chat Interface**: Intelligent chatbot for user assistance and guidance
- **Administrative Controls**: Centralized settings and user management
- **Real-time Updates**: Live notifications and instant message updates
- **Responsive Design**: Adaptive layout for various screen sizes
- **Theme Customization**: Light/dark mode with customizable color schemes

## Project Structure
```
├── src/
│   ├── components/          # Reusable UI components
│   │   ├── admin/          # Admin-specific components
│   │   │   ├── UserManagement.jsx
│   │   │   └── Settings.jsx
│   │   ├── layout/         # Layout components
│   │   │   ├── Header.jsx
│   │   │   ├── Sidebar.jsx
│   │   │   └── Footer.jsx
│   │   └── report/         # Report-related components
│   │       ├── ReportForm.jsx
│   │       └── ReportView.jsx
│   ├── pages/              # Page components
│   │   ├── Dashboard.jsx
│   │   ├── Login.jsx
│   │   └── LossReport.jsx
│   ├── services/           # API and service integrations
│   │   ├── authService.js
│   │   └── dashboardService.js
│   ├── utils/              # Utility functions
│   │   ├── axiosInstance.js
│   │   └── helpers.js
│   ├── assets/            # Static assets
│   │   ├── images/
│   │   └── styles/
│   ├── App.jsx           # Main application component
│   └── main.jsx         # Application entry point
├── public/              # Public assets
└── docs/               # Documentation
```

## Tech Stack

### Core Technologies
- **React 18**
  - Utilizes latest features including automatic batching
  - Concurrent rendering support
  - Improved Suspense functionality
  - Strict Mode compatibility

- **Vite**
  - Lightning-fast HMR (Hot Module Replacement)
  - Optimized build process
  - ES modules for development
  - Efficient code splitting
  - Environment variable handling

### UI Framework
- **Material-UI (MUI)**
  - Comprehensive component library
  - Custom theme support
  - Responsive grid system
  - CSS-in-JS styling
  - Accessibility features

### Routing and State Management
- **React Router v6**
  - Declarative routing
  - Nested routes support
  - Route protection
  - Dynamic route parameters
  - Navigation hooks

### Real-time Communication
- **Socket.IO**
  - Bidirectional communication
  - Automatic reconnection
  - Room-based messaging
  - Event handling system
  - Fallback transport methods

### HTTP Client
- **Axios**
  - Promise-based requests
  - Request/response interceptors
  - Custom instance configuration
  - Error handling
  - Request cancellation

### Development Tools
- **ESLint**
  - Code quality enforcement
  - Custom rule configuration
  - Automatic fixing capabilities
  - Integration with VS Code
  - Git hook integration

## Components

### Core Components

#### 1. App.jsx
```jsx
// Core application wrapper
const App = () => {
  const [mode, setMode] = useState('light');
  const colorMode = useMemo(() => ({
    toggleColorMode: () => {
      setMode((prevMode) => (prevMode === 'light' ? 'dark' : 'light'));
    },
  }), []);

  return (
    <ColorModeContext.Provider value={colorMode}>
      <ThemeProvider theme={theme}>
        <Router>
          <Routes>
            {/* Route definitions */}
          </Routes>
        </Router>
      </ThemeProvider>
    </ColorModeContext.Provider>
  );
};
```

Key Features:
- Theme context provider
- Router configuration
- Authentication state management
- Global error boundary
- Layout management

#### 2. AuthLayout
```jsx
// Protected route wrapper
const AuthLayout = ({ children }) => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isSessionExpired, setIsSessionExpired] = useState(false);

  // Session management logic
  useEffect(() => {
    // Session verification
    // Timeout handling
  }, []);

  return (
    <div className="auth-layout">
      <Header />
      <Sidebar />
      <main>{children}</main>
      <SessionTimeoutDialog
        open={isSessionExpired}
        onExtend={handleSessionExtend}
      />
    </div>
  );
};
```

Features:
- Session timeout monitoring
- Layout structure
- Navigation management
- Authentication checks
- Error boundary implementation

### Interactive Components

#### 1. ChatBot
```jsx
const ChatBot = ({ reportId, userId, selectedfaq }) => {
  const [messages, setMessages] = useState([]);
  const [socket, setSocket] = useState(null);
  const [sessionId, setSessionId] = useState(null);

  // Socket connection management
  useEffect(() => {
    const newSocket = io(SOCKET_URL);
    // Socket event handlers
  }, []);

  // Message handling
  const handleMessage = async (message) => {
    // Message processing
    // AI response handling
  };
};
```

Features:
- Real-time message handling
- Socket connection management
- Message history persistence
- Error handling and retry logic
- Typing indicators
- Message status tracking

Implementation Details:
- Uses Socket.IO for real-time communication
- Implements message queuing
- Handles connection interruptions
- Manages message persistence
- Provides typing indicators

#### 2. ChatArea
Message Display Features:
- Markdown rendering with syntax highlighting
- Image and file attachment support
- Message grouping by time
- Read receipts
- Inline media preview
- Copy/paste support

Message Interaction:
- Edit functionality
- Delete capability
- Reaction support
- Thread replies
- Message search

#### 3. PredefinedQuestions
Features:
- Category-based organization
- Search functionality
- Usage analytics
- Dynamic updates
- Customization options

#### 4. GenerateGuidanceReport
Report Generation:
- Template selection
- Dynamic form fields
- File attachments
- Preview capability
- Version control

### Utility Components

#### 1. SessionTimeoutDialog
Session Management:
- Configurable timeout duration
- Grace period settings
- Activity monitoring
- Multiple tab synchronization
- Session persistence

#### 2. SuccessPopup
Notification Features:
- Custom duration
- Animation support
- Queue management
- Priority handling
- Position customization

#### 3. Notifications
System Notifications:
- Multiple types (success, error, warning, info)
- Custom styling per type
- Auto-dismiss options
- Action buttons
- Progress indicators

## Services

### Authentication Service (authService.js)
```javascript
class AuthService {
  async login(credentials) {
    // Login implementation
  }

  async refreshToken() {
    // Token refresh logic
  }

  handleTokenStorage() {
    // Secure token storage
  }
}
```

Features:
- JWT token management
- Refresh token rotation
- Session tracking
- Secure storage
- Authorization headers

### Dashboard Service (dashboardService.js)
```javascript
class DashboardService {
  async fetchMetrics() {
    // Metrics retrieval
  }

  async generateReport() {
    // Report generation
  }

  handleCaching() {
    // Cache management
  }
}
```

Features:
- Data aggregation
- Real-time updates
- Cache management
- Error handling
- Rate limiting

## Routing
Detailed route configuration with guards and layouts:

```javascript
const routes = [
  {
    path: '/login',
    component: Login,
    public: true
  },
  {
    path: '/dashboard',
    component: Dashboard,
    layout: AuthLayout,
    roles: ['user', 'admin']
  },
  // Additional routes
];
```

## State Management
### Theme Management
```javascript
const themeContext = createContext({
  mode: 'light',
  toggleMode: () => {},
  // Additional theme controls
});
```

### Authentication State
```javascript
const authContext = createContext({
  user: null,
  login: () => {},
  logout: () => {},
  // Auth methods
});
```

### Application State
- Component-specific state
- Global state management
- Performance optimization
- State persistence
- State synchronization

## Theme and Styling
### Material-UI Theme Configuration
```javascript
const theme = createTheme({
  palette: {
    primary: {
      main: 'rgb(91, 155, 152)',
      light: 'rgb(120, 175, 172)',
      dark: 'rgb(70, 135, 132)'
    },
    // Additional theme configuration
  },
  typography: {
    // Typography settings
  },
  components: {
    // Component customization
  }
});
```

## Authentication
### Security Implementation
```javascript
const securityConfig = {
  tokenStorage: 'localStorage',
  refreshInterval: 5 * 60 * 1000, // 5 minutes
  sessionTimeout: 30 * 60 * 1000, // 30 minutes
  // Additional security settings
};
```

## Real-time Features
### WebSocket Configuration
```javascript
const socketConfig = {
  url: process.env.SOCKET_URL,
  options: {
    reconnection: true,
    reconnectionAttempts: 5,
    // Additional socket options
  }
};
```

## Development Guidelines
1. **Code Style**
   - Follow ESLint configuration
   - Use TypeScript for type safety
   - Implement proper error handling
   - Write unit tests for components

2. **Performance**
   - Implement code splitting
   - Use React.memo for optimization
   - Lazy load components
   - Optimize bundle size

3. **Security**
   - Implement CSRF protection
   - Use secure HTTP headers
   - Sanitize user input
   - Regular security audits

4. **Accessibility**
   - Follow WCAG guidelines
   - Implement keyboard navigation
   - Provide ARIA labels
   - Support screen readers 