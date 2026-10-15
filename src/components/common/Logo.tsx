import React from 'react';

interface LogoIconProps {
  className?: string;
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  variant?: 'forest' | 'white' | 'lime';
}

export const LogoIcon: React.FC<LogoIconProps> = ({
  className = '',
  size = 'md',
  variant = 'forest',
}) => {
  const sizeMap = {
    xs: 'w-5 h-5',
    sm: 'w-7 h-7',
    md: 'w-9 h-9',
    lg: 'w-11 h-11',
    xl: 'w-14 h-14',
  };

  return (
    <div
      className={`relative inline-flex items-center justify-center shrink-0 ${sizeMap[size]} ${className}`}
      aria-label="MockMaster Brand Emblem"
    >
      <svg
        viewBox="0 0 48 48"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="w-full h-full drop-shadow-xs"
      >
        <defs>
          <linearGradient id="shieldGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#173f35" />
            <stop offset="100%" stopColor="#0f2c25" />
          </linearGradient>
          <linearGradient id="limeGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#c9ed71" />
            <stop offset="100%" stopColor="#a3df3b" />
          </linearGradient>
          <linearGradient id="coralGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#ef765f" />
            <stop offset="100%" stopColor="#dc583f" />
          </linearGradient>
        </defs>

        {/* Shield / Emblem Base */}
        <path
          d="M24 3L8 9V22C8 32.5 14.8 42.2 24 45C33.2 42.2 40 32.5 40 22V9L24 3Z"
          fill="url(#shieldGrad)"
          stroke="#235447"
          strokeWidth="1.5"
        />

        {/* Outer Accent Rim */}
        <path
          d="M24 5.5L10 10.8V21.5C10 30.5 15.8 38.8 24 41.5C32.2 38.8 38 30.5 38 21.5V10.8L24 5.5Z"
          stroke="#c9ed71"
          strokeWidth="0.75"
          strokeOpacity="0.4"
        />

        {/* Dynamic Stylized "M" with CBT Speed Ribbons */}
        <path
          d="M15 31V19L21 26L24 23L27 26L33 19V31"
          stroke="#dff4e9"
          strokeWidth="3.2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />

        {/* Ascending Victory / Correct-Answer Checkmark */}
        <path
          d="M20 28.5L24.5 33L35 15"
          stroke="url(#limeGrad)"
          strokeWidth="3.6"
          strokeLinecap="round"
          strokeLinejoin="round"
        />

        {/* Apex Achievement Star Badge */}
        <circle cx="24" cy="11.5" r="2.2" fill="#ef765f" />
        <circle cx="24" cy="11.5" r="1.2" fill="#ffffff" />
      </svg>
    </div>
  );
};

interface LogoProps {
  className?: string;
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  variant?: 'dark' | 'light' | 'monochrome';
  showSubtitle?: boolean;
  showBadge?: boolean;
  onClick?: () => void;
}

export const Logo: React.FC<LogoProps> = ({
  className = '',
  size = 'md',
  variant = 'dark',
  showSubtitle = true,
  showBadge = true,
  onClick,
}) => {
  const isLight = variant === 'light';

  return (
    <div
      onClick={onClick}
      className={`inline-flex items-center gap-2.5 select-none ${
        onClick ? 'cursor-pointer' : ''
      } ${className}`}
    >
      <LogoIcon size={size} />

      <div className="flex flex-col">
        <div className="flex items-center gap-1.5 leading-none">
          <span
            className={`font-black tracking-tight font-display ${
              size === 'xs'
                ? 'text-sm'
                : size === 'sm'
                ? 'text-base'
                : size === 'md'
                ? 'text-xl'
                : size === 'lg'
                ? 'text-2xl'
                : 'text-3xl'
            } ${isLight ? 'text-white' : 'text-[#173f35]'}`}
          >
            Mock<span className={isLight ? 'text-[#c9ed71]' : 'text-[#235447]'}>Master</span>
          </span>

          {showBadge && (
            <span
              className={`px-1.5 py-0.5 text-[9px] font-extrabold uppercase tracking-wider rounded-sm ${
                isLight
                  ? 'bg-[#c9ed71] text-[#173f35]'
                  : 'bg-[#dff4e9] text-[#173f35] border border-[#b8e6ce]'
              }`}
            >
              CBT 2026
            </span>
          )}
        </div>

        {showSubtitle && (
          <span
            className={`text-[10px] tracking-tight font-semibold mt-0.5 ${
              isLight ? 'text-[#b8e6ce]' : 'text-[#52635a]'
            }`}
          >
            All-India Competitive Exam CBT Portal
          </span>
        )}
      </div>
    </div>
  );
};
