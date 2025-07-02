import { motion } from "framer-motion";
import { useState } from "react";

interface NewsAlert {
  id: string;
  headline: string;
  source: string;
  category: string;
  summary: string;
  location: { lat: number; lng: number };
  city: string;
  country: string;
  timestamp: Date;
  impact: string;
}

interface WorldMapProps {
  alerts: NewsAlert[];
  activeAlert: NewsAlert | null;
}

// Convert lat/lng to SVG coordinates (simplified projection)
const latLngToSVG = (lat: number, lng: number) => {
  const x = ((lng + 180) / 360) * 800;
  const y = ((90 - lat) / 180) * 400;
  return { x, y };
};

// Abu Dhabi coordinates
const ABU_DHABI = { lat: 24.4539, lng: 54.3773 };

export default function WorldMap({ alerts, activeAlert }: WorldMapProps) {
  const [hoveredAlert, setHoveredAlert] = useState<string | null>(null);

  const abuDhabiPos = latLngToSVG(ABU_DHABI.lat, ABU_DHABI.lng);

  return (
    <div className="absolute inset-0 flex items-center justify-center">
      <div className="relative w-full max-w-6xl h-full max-h-[600px]">
        <svg
          viewBox="0 0 800 400"
          className="w-full h-full opacity-80"
          style={{ filter: "drop-shadow(0 0 20px rgba(6, 182, 212, 0.3))" }}
        >
          {/* Background */}
          <rect width="800" height="400" fill="url(#mapGradient)" />

          {/* Gradient definitions */}
          <defs>
            <linearGradient
              id="mapGradient"
              x1="0%"
              y1="0%"
              x2="100%"
              y2="100%"
            >
              <stop
                offset="0%"
                style={{ stopColor: "#1a1a2e", stopOpacity: 0.8 }}
              />
              <stop
                offset="50%"
                style={{ stopColor: "#16213e", stopOpacity: 0.6 }}
              />
              <stop
                offset="100%"
                style={{ stopColor: "#0f172a", stopOpacity: 0.9 }}
              />
            </linearGradient>

            <radialGradient id="radarPulse" cx="50%" cy="50%" r="50%">
              <stop
                offset="0%"
                style={{ stopColor: "#ef4444", stopOpacity: 0.8 }}
              />
              <stop
                offset="70%"
                style={{ stopColor: "#ef4444", stopOpacity: 0.3 }}
              />
              <stop
                offset="100%"
                style={{ stopColor: "#ef4444", stopOpacity: 0 }}
              />
            </radialGradient>
          </defs>

          {/* Simple world map outline */}
          <WorldMapSVG />

          {/* Abu Dhabi HQ marker */}
          <g>
            <motion.circle
              cx={abuDhabiPos.x}
              cy={abuDhabiPos.y}
              r="8"
              fill="#06b6d4"
              stroke="#22d3ee"
              strokeWidth="2"
              animate={{
                scale: [1, 1.2, 1],
                opacity: [0.8, 1, 0.8],
              }}
              transition={{
                duration: 2,
                repeat: Infinity,
                ease: "easeInOut",
              }}
            />
            <text
              x={abuDhabiPos.x}
              y={abuDhabiPos.y - 15}
              textAnchor="middle"
              className="fill-cyan-400 text-xs font-semibold"
            >
              ADNOC HQ
            </text>
          </g>

          {/* Alert markers and connections */}
          {alerts.map((alert) => {
            const alertPos = latLngToSVG(
              alert.location.lat,
              alert.location.lng,
            );
            const isActive = activeAlert?.id === alert.id;
            const isHovered = hoveredAlert === alert.id;

            return (
              <g key={alert.id}>
                {/* Connection line to Abu Dhabi */}
                <motion.line
                  x1={alertPos.x}
                  y1={alertPos.y}
                  x2={abuDhabiPos.x}
                  y2={abuDhabiPos.y}
                  stroke="url(#connectionGradient)"
                  strokeWidth="2"
                  strokeDasharray="5,5"
                  initial={{ pathLength: 0, opacity: 0 }}
                  animate={{
                    pathLength: isActive ? 1 : 0.3,
                    opacity: isActive ? 1 : 0.4,
                  }}
                  transition={{ duration: 1.5, ease: "easeInOut" }}
                />

                {/* Radar pulse effect */}
                {isActive && (
                  <motion.circle
                    cx={alertPos.x}
                    cy={alertPos.y}
                    r="20"
                    fill="url(#radarPulse)"
                    animate={{
                      r: [10, 30, 50],
                      opacity: [0.8, 0.3, 0],
                    }}
                    transition={{
                      duration: 2,
                      repeat: Infinity,
                      ease: "easeOut",
                    }}
                  />
                )}

                {/* Alert marker */}
                <motion.circle
                  cx={alertPos.x}
                  cy={alertPos.y}
                  r={isHovered ? "8" : "6"}
                  fill="#ef4444"
                  stroke="#fca5a5"
                  strokeWidth="2"
                  animate={{
                    scale: isActive ? [1, 1.3, 1] : 1,
                  }}
                  transition={{
                    duration: 1,
                    repeat: isActive ? Infinity : 0,
                  }}
                  onMouseEnter={() => setHoveredAlert(alert.id)}
                  onMouseLeave={() => setHoveredAlert(null)}
                  className="cursor-pointer"
                />

                {/* Alert label */}
                <text
                  x={alertPos.x}
                  y={alertPos.y - 12}
                  textAnchor="middle"
                  className="fill-red-400 text-xs font-medium pointer-events-none"
                >
                  {alert.city}
                </text>
              </g>
            );
          })}

          {/* Additional gradient for connection lines */}
          <defs>
            <linearGradient
              id="connectionGradient"
              x1="0%"
              y1="0%"
              x2="100%"
              y2="0%"
            >
              <stop
                offset="0%"
                style={{ stopColor: "#ef4444", stopOpacity: 0.8 }}
              />
              <stop
                offset="100%"
                style={{ stopColor: "#06b6d4", stopOpacity: 0.8 }}
              />
            </linearGradient>
          </defs>
        </svg>
      </div>
    </div>
  );
}

// Simplified world map SVG paths
function WorldMapSVG() {
  return (
    <g fill="none" stroke="#334155" strokeWidth="1" opacity="0.6">
      {/* Continents outline - simplified */}
      <path d="M 100 150 Q 200 100 300 150 Q 400 200 500 150 Q 600 100 700 150 L 700 300 Q 600 350 500 300 Q 400 250 300 300 Q 200 350 100 300 Z" />
      <path d="M 50 100 Q 150 50 250 100 L 250 200 Q 150 250 50 200 Z" />
      <path d="M 550 50 Q 650 25 750 50 L 750 150 Q 650 175 550 150 Z" />
      <path d="M 200 250 Q 300 225 400 250 L 400 350 Q 300 375 200 350 Z" />
      <path d="M 500 200 Q 600 175 700 200 L 700 300 Q 600 325 500 300 Z" />
      <path d="M 350 300 Q 450 275 550 300 L 550 380 Q 450 395 350 380 Z" />
    </g>
  );
}
