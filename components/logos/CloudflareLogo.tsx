/**
 * Cloudflare Logo
 * Source: Official Cloudflare brand assets
 * License: Trademark
 * Brand Colors: Orange (#F38020), Yellow (#FAAE40)
 */

interface CloudflareLogoProps {
  className?: string;
  width?: number;
  height?: number;
}

export function CloudflareLogo({
  className,
  width = 24,
  height = 24,
}: CloudflareLogoProps) {
  return (
    <svg
      className={className}
      width={width}
      height={height}
      viewBox="0 0 32 32"
      xmlns="http://www.w3.org/2000/svg"
    >
      <title>Cloudflare</title>
      {/* Cloudflare cloud icon */}
      <path
        fill="#F38020"
        d="M23.5 14.5c-.3-2.9-2.7-5.1-5.6-5.1-2 0-3.8 1.1-4.8 2.7-.5-.2-1-.3-1.6-.3-2.2 0-4 1.8-4 4 0 .3 0 .5.1.8-1.8.5-3.1 2.1-3.1 4 0 2.3 1.9 4.2 4.2 4.2h13.6c2.3 0 4.2-1.9 4.2-4.2 0-2.1-1.5-3.8-3.5-4.1z"
      />
      <path
        fill="#FAAE40"
        d="M27.9 20.2c0 1.9-1.5 3.4-3.4 3.4H10.7c-1.9 0-3.4-1.5-3.4-3.4 0-1.7 1.2-3.1 2.8-3.3.1-.3.1-.6.1-1 0-1.8 1.5-3.3 3.3-3.3.5 0 1 .1 1.4.3.9-1.4 2.5-2.3 4.2-2.3 2.5 0 4.7 1.9 4.9 4.4 1.7.2 3 1.7 3 3.5-.1.2-.1.4-.1.7z"
      />
    </svg>
  );
}
