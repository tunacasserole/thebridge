'use client';

import React from 'react';

interface SkipLink {
  href: string;
  label: string;
}

interface SkipLinksProps {
  links?: SkipLink[];
}

const defaultLinks: SkipLink[] = [
  { href: '#main-content', label: 'Skip to main content' },
  { href: '#navigation', label: 'Skip to navigation' },
  { href: '#footer', label: 'Skip to footer' }
];

export function SkipLinks({ links = defaultLinks }: SkipLinksProps) {
  return (
    <div className="sr-only focus-within:not-sr-only">
      <nav
        aria-label="Skip links"
        className="fixed top-0 left-0 z-[200] bg-primary-main text-primary-on-main"
      >
        <ul className="flex flex-col">
          {links.map((link) => (
            <li key={link.href}>
              <a
                href={link.href}
                className="
                  block px-4 py-2 text-sm font-medium
                  focus:outline-none focus:ring-2 focus:ring-primary-on-main
                  focus:bg-primary-container focus:text-primary-on-container
                  hover:bg-primary-container hover:text-primary-on-container
                  transition-colors duration-200
                "
                onClick={(e) => {
                  // Ensure the target element gets focus after skip link navigation
                  const target = document.querySelector(link.href);
                  if (target) {
                    e.preventDefault();
                    target.scrollIntoView({ behavior: 'smooth', block: 'start' });

                    // Set tabindex if element is not naturally focusable
                    if (target instanceof HTMLElement) {
                      const originalTabIndex = target.getAttribute('tabindex');
                      target.setAttribute('tabindex', '-1');
                      target.focus();

                      // Restore original tabindex after a brief delay
                      setTimeout(() => {
                        if (originalTabIndex !== null) {
                          target.setAttribute('tabindex', originalTabIndex);
                        } else {
                          target.removeAttribute('tabindex');
                        }
                      }, 100);
                    }
                  }
                }}
              >
                {link.label}
              </a>
            </li>
          ))}
        </ul>
      </nav>
    </div>
  );
}