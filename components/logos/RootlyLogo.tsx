/**
 * Rootly Logo
 * Source: Rootly - Modern incident management platform
 * License: Trademark
 * Brand Colors: Gray (#6B7280), Green (#10B981)
 */

interface RootlyLogoProps {
  className?: string;
  width?: number;
  height?: number;
}

export function RootlyLogo({
  className,
  width = 24,
  height = 24,
}: RootlyLogoProps) {
  return (
    <svg
      className={className}
      width={width}
      height={height}
      viewBox="0 0 64 64"
      xmlns="http://www.w3.org/2000/svg"
    >
      <title>Rootly</title>
      {/* 3D Hexagonal cube shape - Rootly icon */}
      {/* Top face - light gray */}
      <path
        d="M32 4 L56 18 L32 32 L8 18 Z"
        fill="#9CA3AF"
      />
      {/* Left face - dark gray */}
      <path
        d="M8 18 L32 32 L32 60 L8 46 Z"
        fill="#6B7280"
      />
      {/* Right face - green */}
      <path
        d="M32 32 L56 18 L56 46 L32 60 Z"
        fill="#10B981"
      />
      {/* Inner cutout - top */}
      <path
        d="M32 20 L44 27 L32 34 L20 27 Z"
        fill="#D1D5DB"
      />
      {/* Inner cutout - left */}
      <path
        d="M20 27 L32 34 L32 48 L20 41 Z"
        fill="#4B5563"
      />
      {/* Inner cutout - right */}
      <path
        d="M32 34 L44 27 L44 41 L32 48 Z"
        fill="#059669"
      />
    </svg>
  );
}
