import { useEffect } from 'react';

const SecurityStyles = ({ userRole = '' }) => {
  useEffect(() => {
    // Only apply security styles in production mode
    if (import.meta.env.DEV) {
      return;
    }

    // Skip security styles for Admin and Developer roles
    if (userRole === 'Admin' || userRole === 'Developer') {
      return;
    }

    // Add security meta tags (screenshot-related tags removed)
    const addMetaTags = () => {
      const metaTags = [
        { name: 'referrer', content: 'no-referrer' }
      ];

      metaTags.forEach(({ name, content }) => {
        // Check if meta tag already exists
        if (!document.querySelector(`meta[name="${name}"]`)) {
          const meta = document.createElement('meta');
          meta.name = name;
          meta.content = content;
          document.getElementsByTagName('head')[0].appendChild(meta);
        }
      });
    };

    // Add security styles
    const addSecurityStyles = () => {
      const styleId = 'security-styles';
      
      // Check if styles already exist
      if (document.getElementById(styleId)) {
        return;
      }

      const style = document.createElement('style');
      style.id = styleId;
      style.textContent = `
        /* Disable text selection for most elements, but allow for inputs */
        body, div, span, p, h1, h2, h3, h4, h5, h6, a, ul, ol, li, img, table, tr, td, th {
          -webkit-user-select: none;
          -moz-user-select: none;
          -ms-user-select: none;
          user-select: none;
          -webkit-touch-callout: none;
          -webkit-user-drag: none;
          -khtml-user-drag: none;
          -moz-user-drag: none;
          -o-user-drag: none;
          user-drag: none;
        }
        
        /* Explicitly allow text selection and editing for input fields */
        input, textarea, [contenteditable="true"], .MuiInputBase-input, .MuiInput-input, .MuiTextField-root input, .MuiTextField-root textarea {
          -webkit-user-select: text !important;
          -moz-user-select: text !important;
          -ms-user-select: text !important;
          user-select: text !important;
          -webkit-touch-callout: default !important;
          pointer-events: auto !important;
        }
        
        /* Disable print media */
        @media print {
          body { display: none !important; }
        }
        
        /* Disable drag for images */
        img {
          -webkit-user-drag: none;
          -khtml-user-drag: none;
          -moz-user-drag: none;
          -o-user-drag: none;
          user-drag: none;
          pointer-events: none;
        }

        /* Basic security styles (screenshot protection removed) */
        body {
          -webkit-user-select: none;
          -moz-user-select: none;
          user-select: none;
          -webkit-touch-callout: none;
          -webkit-tap-highlight-color: transparent;
        }
      `;
      
      document.head.appendChild(style);
    };

    addMetaTags();
    addSecurityStyles();

    // Cleanup function
    return () => {
      // Remove security styles when component unmounts
      const securityStyles = document.getElementById('security-styles');
      if (securityStyles) {
        securityStyles.remove();
      }

      // Remove security meta tags
      const metaTagNames = ['referrer'];
      metaTagNames.forEach(name => {
        const meta = document.querySelector(`meta[name="${name}"]`);
        if (meta) {
          meta.remove();
        }
      });
    };
  }, [userRole]);

  return null; // This component doesn't render anything
};

export default SecurityStyles;
