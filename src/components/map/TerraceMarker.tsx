import React from "react";

interface TerraceMarkerProps {
  x: number; // screen x position
  y: number; // screen y position
  isSunlit: boolean;
  sunAzimuth?: number; // degrees
  sunAltitude?: number; // degrees
  selected?: boolean;
  onClick?: () => void;
}

const SIZE = 24;
const FLARE_SIZE = 40; // Smaller SVG for flare
const FLARE_RADIUS = 14;
const ANIMATION_DURATION = 1300; // ms

// CSS keyframes for the flare animation
const flareAnimation = `
@keyframes solar-flare {
  0% {
    transform: scale(0.7);
    opacity: 0.8;
  }
  70% {
    opacity: 0.25;
  }
  100% {
    transform: scale(3.5);
    opacity: 0;
  }
}
@keyframes solar-flare2 {
  0% {
    transform: scale(0.9);
    opacity: 0.5;
  }
  70% {
    opacity: 0.15;
  }
  100% {
    transform: scale(2.5);
    opacity: 0;
  }
}`;

const TerraceMarker: React.FC<TerraceMarkerProps> = ({
  x,
  y,
  isSunlit,
  sunAzimuth,
  sunAltitude,
  selected = false,
  onClick,
}) => {
  return (
    <div
      style={{
        position: "absolute",
        left: x - SIZE / 2,
        top: y - SIZE / 2,
        width: SIZE,
        height: SIZE,
        pointerEvents: "auto",
        zIndex: selected ? 2 : 1,
      }}
      onClick={onClick}
      tabIndex={0}
      aria-label={isSunlit ? "Sunny terrace" : "Shaded terrace"}
      className={`group focus:outline-none ${
        selected ? "ring-2 ring-amber-500" : ""
      }`}
    >
      {/* Inject keyframes for the flare animation */}
      <style>{flareAnimation}</style>
      {/* Persistent soft glow for sunlit marker using SVG blur filter (commented out for debugging) */}
      {/*
      {isSunlit && (
        <svg
          width={GLOW_SIZE}
          height={GLOW_SIZE}
          viewBox={`0 0 ${GLOW_SIZE} ${GLOW_SIZE}`}
          style={{
            position: "absolute",
            left: -(GLOW_SIZE - SIZE) / 2,
            top: -(GLOW_SIZE - SIZE) / 2,
            pointerEvents: "none",
            zIndex: 1,
          }}
        >
          <defs>
            <filter id="soft-glow" x="-50%" y="-50%" width="200%" height="200%">
              <feGaussianBlur stdDeviation="8" result="coloredBlur" />
              <feMerge>
                <feMergeNode in="coloredBlur" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
          </defs>
          <circle
            cx={GLOW_SIZE / 2}
            cy={GLOW_SIZE / 2}
            r={18}
            fill="#F9A825"
            opacity={0.32}
            filter="url(#soft-glow)"
          />
        </svg>
      )}
      */}
      {/* Refined Solar Flare Radial Gradient Effect (animated, always on for sunlit) */}
      {isSunlit && (
        <svg
          width={FLARE_SIZE}
          height={FLARE_SIZE}
          viewBox={`0 0 ${FLARE_SIZE} ${FLARE_SIZE}`}
          style={{
            position: "absolute",
            left: -(FLARE_SIZE - SIZE) / 2,
            top: -(FLARE_SIZE - SIZE) / 2,
            pointerEvents: "none",
            zIndex: 2,
            overflow: "visible",
            background: "none",
          }}
        >
          {/* Main flare */}
          <circle
            cx={FLARE_SIZE / 2}
            cy={FLARE_SIZE / 2}
            r={FLARE_RADIUS}
            fill="url(#sunlit-gradient)"
            style={{
              transformOrigin: "50% 50%",
              animation: `solar-flare ${ANIMATION_DURATION}ms cubic-bezier(0.4,0,0.2,1) infinite`,
            }}
          />
          {/* Secondary, offset flare for extra wow */}
          <circle
            cx={FLARE_SIZE / 2}
            cy={FLARE_SIZE / 2}
            r={FLARE_RADIUS - 3}
            fill="url(#sunlit-gradient2)"
            style={{
              transformOrigin: "50% 50%",
              animation: `solar-flare2 ${ANIMATION_DURATION}ms cubic-bezier(0.4,0,0.2,1) infinite`,
              animationDelay: `${ANIMATION_DURATION / 2}ms`,
            }}
          />
          <defs>
            <radialGradient id="sunlit-gradient" cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor="#FFF8E1" stopOpacity="1" />
              <stop offset="20%" stopColor="#F9A825" stopOpacity="0.7" />
              <stop offset="60%" stopColor="#F9A825" stopOpacity="0.18" />
              <stop offset="100%" stopColor="#F9A825" stopOpacity="0" />
            </radialGradient>
            <radialGradient id="sunlit-gradient2" cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor="#FFFDE7" stopOpacity="0.5" />
              <stop offset="30%" stopColor="#FFD54F" stopOpacity="0.18" />
              <stop offset="100%" stopColor="#F9A825" stopOpacity="0" />
            </radialGradient>
          </defs>
        </svg>
      )}
      {/* Marker base (SVG) */}
      <svg
        width={SIZE}
        height={SIZE}
        viewBox={`0 0 ${SIZE} ${SIZE}`}
        style={{ position: "relative", zIndex: 3 }}
      >
        <circle
          cx={SIZE / 2}
          cy={SIZE / 2}
          r={isSunlit ? 9 : 7}
          fill={isSunlit ? "#F9A825" : "#607D8B"}
          stroke="#fff"
          strokeWidth={2}
        />
      </svg>
    </div>
  );
};

export default TerraceMarker;
