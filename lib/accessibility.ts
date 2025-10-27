/**
 * Accessibility utilities for better WCAG compliance
 */

/**
 * Generate a unique ID for ARIA labels
 */
export const generateAriaId = (prefix: string): string => {
  return `${prefix}-${Math.random().toString(36).substr(2, 9)}`;
};

/**
 * Announce message to screen readers
 */
export const announceToScreenReader = (message: string, priority: "polite" | "assertive" = "polite") => {
  if (typeof document === "undefined") return;

  const announcement = document.createElement("div");
  announcement.setAttribute("role", "status");
  announcement.setAttribute("aria-live", priority);
  announcement.setAttribute("aria-atomic", "true");
  announcement.className = "sr-only";
  announcement.textContent = message;

  document.body.appendChild(announcement);

  // Remove after announcement
  setTimeout(() => {
    document.body.removeChild(announcement);
  }, 1000);
};

/**
 * Check if an element is focusable
 */
export const isFocusable = (element: HTMLElement): boolean => {
  if (element.tabIndex < 0) return false;
  if (element.hasAttribute("disabled")) return false;
  if (element.getAttribute("aria-hidden") === "true") return false;

  const tagName = element.tagName.toLowerCase();
  const focusableTags = ["a", "button", "input", "select", "textarea"];

  return focusableTags.includes(tagName) || element.tabIndex >= 0;
};

/**
 * Trap focus within a container (useful for modals)
 */
export const trapFocus = (container: HTMLElement) => {
  const focusableElements = container.querySelectorAll<HTMLElement>(
    'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
  );

  const firstElement = focusableElements[0];
  const lastElement = focusableElements[focusableElements.length - 1];

  const handleTabKey = (e: KeyboardEvent) => {
    if (e.key !== "Tab") return;

    if (e.shiftKey) {
      // Shift + Tab
      if (document.activeElement === firstElement) {
        lastElement.focus();
        e.preventDefault();
      }
    } else {
      // Tab
      if (document.activeElement === lastElement) {
        firstElement.focus();
        e.preventDefault();
      }
    }
  };

  container.addEventListener("keydown", handleTabKey);

  // Return cleanup function
  return () => {
    container.removeEventListener("keydown", handleTabKey);
  };
};

/**
 * Get contrast ratio between two colors
 */
export const getContrastRatio = (color1: string, color2: string): number => {
  const getLuminance = (color: string): number => {
    // Simple luminance calculation (would need proper color parsing in production)
    const rgb = color.match(/\d+/g);
    if (!rgb || rgb.length < 3) return 0;

    const [r, g, b] = rgb.map((val) => {
      const num = parseInt(val) / 255;
      return num <= 0.03928 ? num / 12.92 : Math.pow((num + 0.055) / 1.055, 2.4);
    });

    return 0.2126 * r + 0.7152 * g + 0.0722 * b;
  };

  const lum1 = getLuminance(color1);
  const lum2 = getLuminance(color2);

  const lighter = Math.max(lum1, lum2);
  const darker = Math.min(lum1, lum2);

  return (lighter + 0.05) / (darker + 0.05);
};

/**
 * Check if contrast ratio meets WCAG AA standards
 */
export const meetsWCAGAA = (contrastRatio: number, isLargeText = false): boolean => {
  return isLargeText ? contrastRatio >= 3 : contrastRatio >= 4.5;
};

/**
 * Check if contrast ratio meets WCAG AAA standards
 */
export const meetsWCAGAAA = (contrastRatio: number, isLargeText = false): boolean => {
  return isLargeText ? contrastRatio >= 4.5 : contrastRatio >= 7;
};

/**
 * Add skip to main content link
 */
export const addSkipLink = () => {
  if (typeof document === "undefined") return;

  const skipLink = document.createElement("a");
  skipLink.href = "#main-content";
  skipLink.textContent = "Skip to main content";
  skipLink.className = "sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 focus:z-50 focus:px-4 focus:py-2 focus:bg-primary focus:text-primary-foreground focus:rounded";

  document.body.insertBefore(skipLink, document.body.firstChild);
};

/**
 * Keyboard navigation helper
 */
export const handleArrowNavigation = (
  event: KeyboardEvent,
  items: HTMLElement[],
  currentIndex: number,
  onNavigate: (newIndex: number) => void
) => {
  let newIndex = currentIndex;

  switch (event.key) {
    case "ArrowDown":
    case "ArrowRight":
      event.preventDefault();
      newIndex = (currentIndex + 1) % items.length;
      break;
    case "ArrowUp":
    case "ArrowLeft":
      event.preventDefault();
      newIndex = currentIndex === 0 ? items.length - 1 : currentIndex - 1;
      break;
    case "Home":
      event.preventDefault();
      newIndex = 0;
      break;
    case "End":
      event.preventDefault();
      newIndex = items.length - 1;
      break;
    default:
      return;
  }

  items[newIndex]?.focus();
  onNavigate(newIndex);
};
