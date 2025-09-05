import { useEffect } from 'react';

export const useSecurity = (userRole = '') => {
  useEffect(() => {
    // Only apply security measures in production mode
    if (import.meta.env.DEV) {
      console.log('Development mode: Security measures disabled');
      return;
    }

    // Skip security measures for Admin and Developer roles
    if (userRole === 'Admin' || userRole === 'Developer') {
      console.log(`Security measures disabled for ${userRole} role`);
      return;
    }

    console.log('Production mode: Security measures enabled');

    // Check if element is an input field (including Material-UI inputs)
    const isInputField = (element) => {
      if (!element) return false;
      
      const tagName = element.tagName;
      if (['INPUT', 'TEXTAREA'].includes(tagName)) return true;
      
      // Check for contenteditable
      if (element.contentEditable === 'true') return true;
      
      // Check for Material-UI input classes
      if (element.classList && (
        element.classList.contains('MuiInputBase-input') ||
        element.classList.contains('MuiInput-input') ||
        element.classList.contains('MuiOutlinedInput-input') ||
        element.classList.contains('MuiFilledInput-input')
      )) return true;
      
      // Check if element is inside a Material-UI input
      const closestInput = element.closest('.MuiInputBase-root, .MuiTextField-root, input, textarea');
      if (closestInput) return true;
      
      return false;
    };

    // Disable right-click context menu
    const handleContextMenu = (e) => {
      e.preventDefault();
      e.stopPropagation();
      return false;
    };

    // Disable copy/paste and other keyboard shortcuts
    const handleKeyDown = (e) => {
      // Disable F12 (Developer Tools)
      if (e.key === 'F12') {
        e.preventDefault();
        e.stopPropagation();
        return false;
      }

      // Disable Ctrl+Shift+I (Developer Tools)
      if (e.ctrlKey && e.shiftKey && e.key === 'I') {
        e.preventDefault();
        e.stopPropagation();
        return false;
      }

      // Disable Ctrl+Shift+J (Console)
      if (e.ctrlKey && e.shiftKey && e.key === 'J') {
        e.preventDefault();
        e.stopPropagation();
        return false;
      }

      // Disable Ctrl+U (View Source)
      if (e.ctrlKey && e.key === 'u') {
        e.preventDefault();
        e.stopPropagation();
        return false;
      }

      // Allow copy/paste only for input fields
      if (e.ctrlKey && (e.key === 'c' || e.key === 'v' || e.key === 'x' || e.key === 'a')) {
        const targetElement = e.target;
        if (!isInputField(targetElement)) {
          e.preventDefault();
          e.stopPropagation();
          return false;
        }
      }
    };

    // Disable text selection for non-input elements
    const handleSelectStart = (e) => {
      const targetElement = e.target;
      if (!isInputField(targetElement)) {
        e.preventDefault();
        return false;
      }
    };

    // Disable drag and drop for images and other elements
    const handleDragStart = (e) => {
      const targetElement = e.target;
      if (targetElement.tagName === 'IMG' || !isInputField(targetElement)) {
        e.preventDefault();
        return false;
      }
    };

    // Detect developer tools
    const detectDevTools = () => {
      const threshold = 160;
      const widthThreshold = window.outerWidth - window.innerWidth > threshold;
      const heightThreshold = window.outerHeight - window.innerHeight > threshold;
      
      if (widthThreshold || heightThreshold) {
        // Dev tools might be open - you could hide content or show a warning
        console.clear();
      }
    };

    // Add event listeners
    document.addEventListener('contextmenu', handleContextMenu, { capture: true, passive: false });
    document.addEventListener('keydown', handleKeyDown, { capture: true, passive: false });
    document.addEventListener('dragstart', handleDragStart, { capture: true, passive: false });
    document.addEventListener('selectstart', handleSelectStart, { capture: true, passive: false });
    
    // Monitor for developer tools
    setInterval(detectDevTools, 1000);

    // Disable some console methods to prevent easy debugging
    console.log = () => {};
    console.warn = () => {};
    console.error = () => {};
    console.info = () => {};
    console.debug = () => {};

    // Cleanup function
    return () => {
      document.removeEventListener('contextmenu', handleContextMenu, { capture: true });
      document.removeEventListener('keydown', handleKeyDown, { capture: true });
      document.removeEventListener('dragstart', handleDragStart, { capture: true });
      document.removeEventListener('selectstart', handleSelectStart, { capture: true });

      // Restore console methods
      console.log = console.log.bind(console);
      console.warn = console.warn.bind(console);
      console.error = console.error.bind(console);
      console.info = console.info.bind(console);
      console.debug = console.debug.bind(console);

      // Remove drag event listeners from images
      const images = document.querySelectorAll('img');
      images.forEach(img => {
        img.removeEventListener('dragstart', handleDragStart);
      });
    };
  }, [userRole]);
};

export default useSecurity;