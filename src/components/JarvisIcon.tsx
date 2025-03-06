import React from 'react';

interface JarvisIconProps {
  size?: number;
  primaryColor?: string;
  secondaryColor?: string;
  pulseColor?: string;
}

export default function JarvisIcon({
  size = 512,
  primaryColor = '#0078D7',
  secondaryColor = '#FFFFFF',
  pulseColor = '#00A2FF'
}: JarvisIconProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 512 512"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      {/* Outer circle */}
      <circle cx="256" cy="256" r="256" fill={primaryColor} />
      
      {/* Inner circle */}
      <circle cx="256" cy="256" r="200" fill={secondaryColor} />
      
      {/* Pulse circle */}
      <circle cx="256" cy="256" r="150" fill={pulseColor} />
      
      {/* JARVIS interface elements */}
      <circle cx="256" cy="256" r="100" stroke={secondaryColor} strokeWidth="8" fill="none" />
      <circle cx="256" cy="256" r="70" stroke={secondaryColor} strokeWidth="6" fill="none" />
      <circle cx="256" cy="256" r="40" stroke={secondaryColor} strokeWidth="4" fill="none" />
      
      {/* Horizontal line */}
      <line x1="156" y1="256" x2="356" y2="256" stroke={secondaryColor} strokeWidth="8" />
      
      {/* Vertical line */}
      <line x1="256" y1="156" x2="256" y2="356" stroke={secondaryColor} strokeWidth="8" />
      
      {/* Diagonal lines */}
      <line x1="186" y1="186" x2="326" y2="326" stroke={secondaryColor} strokeWidth="4" />
      <line x1="186" y1="326" x2="326" y2="186" stroke={secondaryColor} strokeWidth="4" />
    </svg>
  );
} 