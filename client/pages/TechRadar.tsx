import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import DashboardHeader from "../components/tech-radar/DashboardHeader";
import WorldMap from "../components/tech-radar/WorldMap";
import NewsCard from "../components/tech-radar/NewsCard";
import ChatBox from "../components/tech-radar/ChatBox";
import AlertSystem from "../components/tech-radar/AlertSystem";

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

const mockAlerts: NewsAlert[] = [
  {
    id: "1",
    headline: "Microsoft Announces Major AI Infrastructure Investment",
    source: "Reuters",
    category: "AI",
    summary: "Microsoft commits $20B to new AI data centers across Europe",
    location: { lat: 52.52, lng: 13.405 },
    city: "Berlin",
    country: "Germany",
    timestamp: new Date(),
    impact:
      "Potential partnership opportunities for ADNOC's digital transformation initiatives",
  },
  {
    id: "2",
    headline: "Saudi Arabia Launches New Green Hydrogen Initiative",
    source: "Bloomberg",
    category: "Energy Tech",
    summary: "NEOM announces $8.5B green hydrogen facility",
    location: { lat: 24.7136, lng: 46.6753 },
    city: "Riyadh",
    country: "Saudi Arabia",
    timestamp: new Date(Date.now() - 300000),
    impact:
      "Direct competition in renewable energy sector - strategic response needed",
  },
  {
    id: "3",
    headline: "Tesla's New Battery Technology Breakthrough",
    source: "TechCrunch",
    category: "Energy Storage",
    summary: "New lithium-metal batteries promise 50% more capacity",
    location: { lat: 37.7749, lng: -122.4194 },
    city: "San Francisco",
    country: "USA",
    timestamp: new Date(Date.now() - 600000),
    impact: "Opportunity for ADNOC to explore energy storage partnerships",
  },
  {
    id: "4",
    headline: "China's Quantum Computing Milestone",
    source: "South China Morning Post",
    category: "AI",
    summary: "New quantum processor achieves 1000-qubit breakthrough",
    location: { lat: 39.9042, lng: 116.4074 },
    city: "Beijing",
    country: "China",
    timestamp: new Date(Date.now() - 900000),
    impact:
      "Critical advancement in computational capabilities affecting global tech landscape",
  },
  {
    id: "5",
    headline: "Norway's Offshore Wind Revolution",
    source: "Energy Voice",
    category: "Energy Tech",
    summary: "World's largest floating wind farm begins operations",
    location: { lat: 59.9139, lng: 10.7522 },
    city: "Oslo",
    country: "Norway",
    timestamp: new Date(Date.now() - 1200000),
    impact: "Potential for ADNOC to explore floating offshore wind technology",
  },
  {
    id: "6",
    headline: "India's Solar Manufacturing Expansion",
    source: "Economic Times",
    category: "Energy Tech",
    summary: "₹50,000 crore investment in solar panel production announced",
    location: { lat: 28.6139, lng: 77.209 },
    city: "New Delhi",
    country: "India",
    timestamp: new Date(Date.now() - 1500000),
    impact:
      "Opportunity for renewable energy partnerships and technology transfer",
  },
];

export default function TechRadar() {
  const [alerts, setAlerts] = useState<NewsAlert[]>([]);
  const [activeAlert, setActiveAlert] = useState<NewsAlert | null>(null);

  useEffect(() => {
    // Simulate real-time alerts coming in
    const timeouts: NodeJS.Timeout[] = [];

    mockAlerts.forEach((alert, index) => {
      const timeout = setTimeout(() => {
        setAlerts((prev) => [...prev, alert]);
        setActiveAlert(alert);

        // Play alert sound (placeholder)
        // new Audio('/alert-sound.mp3').play().catch(() => {});

        // Clear active alert after 5 seconds
        setTimeout(() => setActiveAlert(null), 5000);
      }, index * 3000);

      timeouts.push(timeout);
    });

    return () => timeouts.forEach(clearTimeout);
  }, []);

  return (
    <div className="h-screen w-full bg-gradient-to-br from-black via-gray-900 to-black overflow-hidden">
      {/* Background gradient overlay */}
      <div className="absolute inset-0 bg-gradient-to-r from-purple-900/10 via-transparent to-blue-900/10 pointer-events-none" />

      <DashboardHeader />

      <div className="relative h-full pt-16 flex">
        {/* Main map area */}
        <div className="flex-1 relative">
          <WorldMap alerts={alerts} activeAlert={activeAlert} />
          <AlertSystem alerts={alerts} activeAlert={activeAlert} />
        </div>

        {/* Side panel for news cards */}
        <div className="w-80 p-4 space-y-4 overflow-y-auto scrollbar-hide">
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            className="glass-panel p-4 rounded-xl"
          >
            <h3 className="text-cyan-400 font-bold text-lg mb-4">
              Live Alerts
            </h3>
            <div className="space-y-3">
              {alerts.map((alert, index) => (
                <motion.div
                  key={alert.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.2 }}
                >
                  <NewsCard alert={alert} />
                </motion.div>
              ))}
            </div>
          </motion.div>
        </div>
      </div>

      {/* Chat box in bottom left */}
      <div className="absolute bottom-4 left-4 z-20">
        <ChatBox />
      </div>

      {/* Impact analysis panel */}
      {activeAlert && (
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.9 }}
          className="absolute top-20 right-96 z-30 w-80 glass-panel p-6 rounded-xl border border-cyan-500/30"
        >
          <div className="flex items-center gap-2 mb-3">
            <div className="w-3 h-3 bg-red-500 rounded-full animate-pulse" />
            <h4 className="text-cyan-400 font-semibold">
              ADNOC Impact Analysis
            </h4>
          </div>
          <p className="text-gray-300 text-sm">{activeAlert.impact}</p>
          <div className="mt-4 pt-3 border-t border-gray-700">
            <p className="text-xs text-gray-400">
              Source: {activeAlert.city}, {activeAlert.country}
            </p>
          </div>
        </motion.div>
      )}
    </div>
  );
}
