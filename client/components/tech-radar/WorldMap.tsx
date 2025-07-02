import { useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

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

// Abu Dhabi coordinates
const ABU_DHABI = { lat: 24.4539, lng: 54.3773 };

// Custom dark map style for the futuristic theme
const DARK_MAP_STYLE = `
  .leaflet-container {
    background: linear-gradient(135deg, #0f172a 0%, #1e293b 50%, #0f172a 100%);
  }
  .leaflet-tile {
    filter: brightness(0.3) contrast(1.2) saturate(0.8) hue-rotate(200deg);
  }
  .leaflet-control-zoom {
    background: rgba(15, 23, 42, 0.8);
    backdrop-filter: blur(8px);
    border: 1px solid rgba(6, 182, 212, 0.3);
    border-radius: 8px;
  }
  .leaflet-control-zoom a {
    background: rgba(6, 182, 212, 0.1);
    color: #06b6d4;
    border: none;
  }
  .leaflet-control-zoom a:hover {
    background: rgba(6, 182, 212, 0.2);
  }
`;

export default function WorldMap({ alerts, activeAlert }: WorldMapProps) {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstance = useRef<L.Map | null>(null);
  const markersRef = useRef<L.Marker[]>([]);
  const connectionLinesRef = useRef<L.Polyline[]>([]);
  const [hoveredAlert, setHoveredAlert] = useState<string | null>(null);

  useEffect(() => {
    if (!mapRef.current || mapInstance.current) return;

    // Initialize the map
    const map = L.map(mapRef.current, {
      center: [30, 20], // Center on Middle East/Europe
      zoom: 2,
      zoomControl: true,
      attributionControl: false,
      preferCanvas: true,
    });

    // Add dark tile layer
    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      attribution: "",
      maxZoom: 18,
    }).addTo(map);

    // Add ADNOC HQ marker with custom styling
    const abuDhabiIcon = L.divIcon({
      className: "adnoc-hq-marker",
      html: `
        <div class="relative">
          <div class="w-6 h-6 bg-cyan-500 rounded-full border-2 border-cyan-300 animate-pulse shadow-lg shadow-cyan-500/50"></div>
          <div class="absolute -top-8 left-1/2 transform -translate-x-1/2 whitespace-nowrap">
            <span class="text-cyan-400 text-xs font-bold bg-black/50 px-2 py-1 rounded backdrop-blur">ADNOC HQ</span>
          </div>
        </div>
      `,
      iconSize: [24, 24],
      iconAnchor: [12, 12],
    });

    L.marker([ABU_DHABI.lat, ABU_DHABI.lng], { icon: abuDhabiIcon }).addTo(map);

    mapInstance.current = map;

    // Add custom styles
    const styleSheet = document.createElement("style");
    styleSheet.textContent = DARK_MAP_STYLE;
    document.head.appendChild(styleSheet);

    return () => {
      if (mapInstance.current) {
        mapInstance.current.remove();
        mapInstance.current = null;
      }
      document.head.removeChild(styleSheet);
    };
  }, []);

  useEffect(() => {
    if (!mapInstance.current) return;

    const map = mapInstance.current;

    // Clear existing markers and lines
    markersRef.current.forEach((marker) => map.removeLayer(marker));
    connectionLinesRef.current.forEach((line) => map.removeLayer(line));
    markersRef.current = [];
    connectionLinesRef.current = [];

    alerts.forEach((alert) => {
      const isActive = activeAlert?.id === alert.id;

      // Create 3D-style connection line with animation effect
      const connectionLine = L.polyline(
        [
          [alert.location.lat, alert.location.lng],
          [ABU_DHABI.lat, ABU_DHABI.lng],
        ],
        {
          color: isActive ? "#ef4444" : "#ef4444",
          weight: isActive ? 4 : 2,
          opacity: isActive ? 0.9 : 0.5,
          dashArray: isActive ? "10, 5" : "5, 10",
          className: `connection-line ${isActive ? "active-line" : ""}`,
        },
      );

      // Add gradient effect to line
      const lineElement = connectionLine.getElement();
      if (lineElement) {
        lineElement.style.background = `linear-gradient(90deg, #ef4444, #06b6d4)`;
        lineElement.style.filter = `drop-shadow(0 0 ${isActive ? "8px" : "4px"} rgba(239, 68, 68, 0.6))`;
      }

      connectionLine.addTo(map);
      connectionLinesRef.current.push(connectionLine);

      // Create alert marker with radar pulse effect and relevance score
      const relevanceSize = alert.relevance_score
        ? Math.max(16, alert.relevance_score * 32)
        : 24;
      const alertIcon = L.divIcon({
        className: "alert-marker",
        html: `
          <div class="relative">
            ${
              isActive
                ? `
              <div class="absolute inset-0 w-8 h-8 bg-red-500/30 rounded-full animate-ping"></div>
              <div class="absolute inset-1 w-6 h-6 bg-red-500/50 rounded-full animate-pulse"></div>
            `
                : ""
            }
            <div class="relative w-4 h-4 bg-red-500 rounded-full border-2 border-red-300 shadow-lg ${
              isActive ? "animate-bounce" : ""
            }" style="width: ${relevanceSize}px; height: ${relevanceSize}px"></div>
            <div class="absolute -top-6 left-1/2 transform -translate-x-1/2 whitespace-nowrap">
              <span class="text-red-400 text-xs font-semibold bg-black/70 px-1.5 py-0.5 rounded backdrop-blur">${alert.city}</span>
            </div>
            ${
              alert.relevance_score
                ? `
              <div class="absolute -bottom-6 left-1/2 transform -translate-x-1/2">
                <span class="text-yellow-400 text-xs font-bold bg-black/70 px-1 py-0.5 rounded">${Math.round(alert.relevance_score * 100)}%</span>
              </div>
            `
                : ""
            }
          </div>
        `,
        iconSize: [
          Math.max(32, relevanceSize + 8),
          Math.max(32, relevanceSize + 8),
        ],
        iconAnchor: [
          Math.max(16, (relevanceSize + 8) / 2),
          Math.max(16, (relevanceSize + 8) / 2),
        ],
      });

      const marker = L.marker([alert.location.lat, alert.location.lng], {
        icon: alertIcon,
      });

      marker.on("mouseover", () => setHoveredAlert(alert.id));
      marker.on("mouseout", () => setHoveredAlert(null));

      // Add popup with enhanced alert details
      const popupContent = `
        <div class="bg-black/90 text-white p-4 rounded-lg border border-cyan-500/30 backdrop-blur max-w-sm">
          <h4 class="font-bold text-cyan-400 mb-2 text-sm">${alert.headline}</h4>
          <p class="text-xs text-gray-300 mb-3 leading-relaxed">${alert.summary}</p>

          <div class="grid grid-cols-2 gap-2 mb-3 text-xs">
            <div>
              <span class="text-gray-400">Category:</span>
              <span class="text-cyan-400 ml-1">${alert.category}</span>
            </div>
            <div>
              <span class="text-gray-400">Source:</span>
              <span class="text-white ml-1">${alert.source}</span>
            </div>
          </div>

          ${
            alert.relevance_score
              ? `
            <div class="mb-2">
              <div class="flex justify-between text-xs mb-1">
                <span class="text-gray-400">Relevance to ADNOC</span>
                <span class="text-yellow-400 font-bold">${Math.round(alert.relevance_score * 100)}%</span>
              </div>
              <div class="w-full bg-gray-700 rounded-full h-1.5">
                <div class="bg-gradient-to-r from-yellow-600 to-yellow-400 h-1.5 rounded-full" style="width: ${alert.relevance_score * 100}%"></div>
              </div>
            </div>
          `
              : ""
          }

          ${
            alert.keywords && alert.keywords.length > 0
              ? `
            <div class="mb-2">
              <span class="text-gray-400 text-xs">Keywords:</span>
              <div class="flex flex-wrap gap-1 mt-1">
                ${alert.keywords
                  .slice(0, 4)
                  .map(
                    (keyword) => `
                  <span class="bg-gray-800 text-cyan-400 text-xs px-2 py-0.5 rounded">${keyword}</span>
                `,
                  )
                  .join("")}
              </div>
            </div>
          `
              : ""
          }

          ${
            alert.url
              ? `
            <a href="${alert.url}" target="_blank" rel="noopener noreferrer"
               class="inline-flex items-center text-cyan-400 hover:text-cyan-300 text-xs mt-2">
              Read Full Article →
            </a>
          `
              : ""
          }
        </div>
      `;

      marker.bindPopup(popupContent, {
        className: "custom-popup",
        maxWidth: 300,
      });

      marker.addTo(map);
      markersRef.current.push(marker);
    });
  }, [alerts, activeAlert]);

  return (
    <div className="absolute inset-0">
      <div
        ref={mapRef}
        className="w-full h-full"
        style={{
          filter: "brightness(0.8) contrast(1.1)",
        }}
      />

      {/* Overlay effects for enhanced 3D appearance */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute inset-0 bg-gradient-to-t from-black/20 via-transparent to-black/20" />
        <div className="absolute inset-0 bg-gradient-to-r from-purple-900/5 via-transparent to-blue-900/5" />
      </div>

      {/* Active alert radar overlay */}
      {activeAlert && (
        <motion.div
          key={activeAlert.id}
          initial={{ opacity: 0, scale: 0 }}
          animate={{ opacity: 1, scale: 1 }}
          className="absolute inset-0 pointer-events-none"
        >
          <div
            className="absolute w-32 h-32 border-2 border-red-500/30 rounded-full animate-ping"
            style={{
              left: "50%",
              top: "50%",
              transform: "translate(-50%, -50%)",
            }}
          />
        </motion.div>
      )}

      <style>{`
        .leaflet-popup-content-wrapper {
          background: rgba(15, 23, 42, 0.95);
          backdrop-filter: blur(12px);
          border: 1px solid rgba(6, 182, 212, 0.3);
          border-radius: 8px;
        }
        .leaflet-popup-tip {
          background: rgba(15, 23, 42, 0.95);
          border: 1px solid rgba(6, 182, 212, 0.3);
        }
        .connection-line {
          animation: dashAnimation 3s linear infinite;
        }
        .active-line {
          animation: dashAnimation 1s linear infinite;
        }
        @keyframes dashAnimation {
          to {
            stroke-dashoffset: -30;
          }
        }
      `}</style>
    </div>
  );
}
