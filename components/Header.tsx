'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { ThemeSwitch } from './ThemeSwitch';
import { useTheme } from '@/lib/theme';
import RoleSwitcher from './header/RoleSwitcher';
import GitHubIssueButton from './header/GitHubIssueButton';
import JiraIssueButton from './header/JiraIssueButton';
import HeaderLauncherButton from './dashboard/HeaderLauncherButton';
import { UserMenu } from './auth';

/**
 * Material Design 3 compliant top app bar
 *
 * Features:
 * - Scroll-aware elevation with surface tint (MD3 spec)
 * - Backdrop blur for failsafe opacity
 * - Smooth transitions using MD3 motion tokens
 * - Proper z-indexing and stacking context
 */
export default function Header() {
  const { currentTheme } = useTheme();
  const isDark = currentTheme.mode === 'dark';
  const [isScrolled, setIsScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      // Trigger elevation change after 8px of scroll (MD3 recommendation)
      setIsScrolled(window.scrollY > 8);
    };

    // Check initial scroll position
    handleScroll();

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <header
      id="navigation"
      role="banner"
      className={`
        h-14 sm:h-16
        border-b
        sticky top-0 z-50
        transition-all duration-200
        ${isScrolled
          ? 'bg-md-surface-container-low border-md-outline shadow-md'
          : 'bg-md-surface border-md-outline-variant'
        }
      `}
      style={{
        // Failsafe backdrop blur prevents any content bleed-through
        backdropFilter: isScrolled ? 'blur(12px) saturate(150%)' : 'blur(8px)',
        WebkitBackdropFilter: isScrolled ? 'blur(12px) saturate(150%)' : 'blur(8px)',
        // MD3 standard easing for smooth transitions
        transitionTimingFunction: 'cubic-bezier(0.2, 0.0, 0, 1.0)',
        // Elevation shadow only when scrolled (MD3 level 2)
        boxShadow: isScrolled
          ? '0 1px 2px 0 rgb(0 0 0 / 0.3), 0 2px 6px 2px rgb(0 0 0 / 0.15)'
          : 'none',
      }}
    >
      <div className="h-full px-4 sm:px-6 flex items-center justify-between">
        {/* Logo with accessible focus state */}
        <Link
          href="/"
          className="-ml-2 flex items-center gap-3 hover:opacity-80 transition-opacity
            focus:outline-none focus-visible:ring-2 focus-visible:ring-md-primary
            focus-visible:ring-offset-2 focus-visible:ring-offset-md-surface rounded-sm"
        >
          <Image
            src={isDark ? "/thebridge-logo-dark.svg" : "/thebridge-logo-light.svg"}
            alt="TheBridge"
            width={140}
            height={40}
            priority
            className="h-8 sm:h-10 w-auto"
          />
        </Link>

        {/* Center: Dashboard Launcher Button (when active) */}
        <div className="absolute left-1/2 -translate-x-1/2">
          <HeaderLauncherButton />
        </div>

        {/* Status & Theme Controls */}
        <div className="flex items-center gap-2 sm:gap-3">
          <GitHubIssueButton />
          <JiraIssueButton />
          <RoleSwitcher variant="chip" size="small" />
          <ThemeSwitch />
          <UserMenu />
        </div>
      </div>
    </header>
  );
}
