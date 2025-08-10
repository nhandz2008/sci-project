'use client';

interface ImagePreviewProps {
  src: string;
  alt: string;
  className?: string;
  maxHeight?: string;
  maxWidth?: string;
  onClick?: () => void;
}

export default function ImagePreview({
  src,
  alt,
  className = '',
  maxHeight = '200px',
  maxWidth = '100%',
  onClick
}: ImagePreviewProps) {
  const handleClick = () => {
    if (onClick) {
      onClick();
    }
  };

  const handleKeyDown = (event: React.KeyboardEvent) => {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      handleClick();
    }
  };

  return (
    <div
      className={`relative group ${onClick ? 'cursor-pointer' : ''} ${className}`}
      onClick={handleClick}
      onKeyDown={handleKeyDown}
      tabIndex={onClick ? 0 : undefined}
      role={onClick ? 'button' : undefined}
      aria-label={onClick ? `View ${alt}` : undefined}
    >
      <img
        src={src}
        alt={alt}
        className="w-full h-auto object-cover rounded-lg border border-gray-200"
        style={{ maxHeight, maxWidth }}
        loading="lazy"
      />

      {onClick && (
        <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-20 transition-all duration-200 rounded-lg flex items-center justify-center">
          <div className="opacity-0 group-hover:opacity-100 transition-opacity duration-200">
            <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
            </svg>
          </div>
        </div>
      )}
    </div>
  );
}
