import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import DashboardHeader from "../components/tech-radar/DashboardHeader";
import WorldMap from "../components/tech-radar/WorldMap";
import NewsCard from "../components/tech-radar/NewsCard";
import ChatBox from "../components/tech-radar/ChatBox";
import AlertSystem from "../components/tech-radar/AlertSystem";
import newsService from "../services/newsService";

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
  relevance_score?: number;
  keywords?: string[];
  url?: string;
}

export default function TechRadar() {
  const [alerts, setAlerts] = useState<NewsAlert[]>([]);
  const [activeAlert, setActiveAlert] = useState<NewsAlert | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const transformNewsItemToAlert = (newsItem: any): NewsAlert => ({
    id: newsItem.id,
    headline: newsItem.headline,
    source: newsItem.source,
    category: newsItem.category,
    summary: newsItem.summary,
    location: { lat: newsItem.location.lat, lng: newsItem.location.lng },
    city: newsItem.location.city,
    country: newsItem.location.country,
    timestamp: new Date(newsItem.timestamp),
    impact: newsItem.impact || "",
    relevance_score: newsItem.relevance_score,
    keywords: newsItem.keywords,
    url: newsItem.url,
  });

  const fetchLatestNews = async () => {
    try {
      setLoading(true);
      setError(null);

      // This will always return data (fallback if needed)
      const newsData = await newsService.fetchLatestNews();
      const transformedAlerts = newsData.map(transformNewsItemToAlert);

      setAlerts(transformedAlerts);

      // If there are alerts, show the first one as active
      if (transformedAlerts.length > 0) {
        setActiveAlert(transformedAlerts[0]);
        setTimeout(() => setActiveAlert(null), 5000);
      }
    } catch (err) {
      console.error("Error fetching news from database:", err);

      // Set specific error message based on error type
      if (err instanceof Error && err.message.includes("timeout")) {
        setError("Webhook timeout - using demo data");
      } else {
        setError("Webhook issue - using demo data");
      }

      // Always provide functional demo data when webhook fails
      const demoData = [
        {
          id: "demo_1",
          headline: "TechRadar System Operational",
          source: "System Status",
          category: "System",
          summary: "Dashboard is functional - webhook connection pending",
          location: { lat: 24.4539, lng: 54.3773 },
          city: "Abu Dhabi",
          country: "UAE",
          timestamp: new Date(),
          impact: "Dashboard operational with demo intelligence data",
        },
        {
          id: "demo_2",
          headline: "Global AI Investment Surges to Record Highs",
          source: "Tech Monitor",
          category: "AI",
          summary:
            "Worldwide AI investments reach $50B in Q3, with energy sector leading adoption",
          location: { lat: 37.7749, lng: -122.4194 },
          city: "San Francisco",
          country: "USA",
          timestamp: new Date(Date.now() - 300000),
          impact:
            "Opportunity for ADNOC to accelerate AI initiatives and strategic partnerships",
        },
        {
          id: "demo_3",
          headline: "Breakthrough in Green Hydrogen Production Efficiency",
          source: "Energy News",
          category: "Energy Tech",
          summary:
            "New catalyst technology reduces green hydrogen production costs by 40%",
          location: { lat: 52.52, lng: 13.405 },
          city: "Berlin",
          country: "Germany",
          timestamp: new Date(Date.now() - 600000),
          impact:
            "Strategic technology for ADNOC's renewable energy and hydrogen initiatives",
        },
      ];
      setAlerts(demoData);
    } finally {
      setLoading(false);
    }
  };

  const enhanceAlertWithImpact = async (alert: NewsAlert) => {
    if (!alert.impact) {
      try {
        const impact = await newsService.getImpactAnalysis(alert);
        setAlerts((prev) =>
          prev.map((a) => (a.id === alert.id ? { ...a, impact } : a)),
        );
      } catch (err) {
        console.error("Error getting impact analysis:", err);
      }
    }
  };

  useEffect(() => {
    fetchLatestNews();

    // Set up more frequent updates to get real data (every 2 minutes)
    const interval = setInterval(fetchLatestNews, 2 * 60 * 1000);

    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    // Enhance alerts with impact analysis
    alerts.forEach((alert) => {
      if (!alert.impact) {
        enhanceAlertWithImpact(alert);
      }
    });
  }, [alerts]);

  useEffect(() => {
    // Simulate real-time alert activation
    if (alerts.length > 0) {
      const interval = setInterval(() => {
        const randomAlert = alerts[Math.floor(Math.random() * alerts.length)];
        setActiveAlert(randomAlert);

        // Play alert sound (placeholder)
        // new Audio('/alert-sound.mp3').play().catch(() => {});

        // Clear active alert after 5 seconds
        setTimeout(() => setActiveAlert(null), 5000);
      }, 15000); // Show a random alert every 15 seconds

      return () => clearInterval(interval);
    }
  }, [alerts]);

  return (
    <div className="h-screen w-full bg-gradient-to-br from-black via-gray-900 to-black overflow-hidden">
      {/* Background gradient overlay */}
      <div className="absolute inset-0 bg-gradient-to-r from-purple-900/10 via-transparent to-blue-900/10 pointer-events-none" />

      <DashboardHeader />

      {/* Loading state */}
      {loading && (
        <div className="absolute inset-0 flex items-center justify-center z-50 bg-black/50 backdrop-blur-sm">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="glass-panel p-8 rounded-xl text-center"
          >
            <div className="w-12 h-12 border-4 border-cyan-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
            <h3 className="text-cyan-400 font-semibold text-lg mb-2">
              Loading TechRadar
            </h3>
            <p className="text-gray-300 text-sm">
              Fetching latest global tech intelligence...
            </p>
          </motion.div>
        </div>
      )}

      {/* Connection status */}
      <div className="absolute top-20 right-4 z-40">
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          className="glass-panel p-3 rounded-xl border border-cyan-500/30 max-w-sm"
        >
          <div className="flex items-center gap-2">
            <div
              className={`w-2 h-2 rounded-full ${
                loading
                  ? "bg-yellow-500 animate-pulse"
                  : error
                    ? "bg-red-500 animate-pulse"
                    : "bg-green-500 animate-pulse"
              }`}
            />
            <span
              className={`text-xs font-semibold ${
                loading
                  ? "text-yellow-400"
                  : error
                    ? "text-red-400"
                    : "text-green-400"
              }`}
            >
              {loading
                ? "CONNECTING..."
                : error?.includes("activation")
                  ? "WEBHOOK INACTIVE"
                  : error?.includes("timeout")
                    ? "WEBHOOK SLOW"
                    : error?.includes("demo")
                      ? "DEMO MODE"
                      : error
                        ? "WEBHOOK ERROR"
                        : "LIVE DATABASE"}
            </span>
          </div>
          <p className="text-gray-300 text-xs mt-1">
            {loading
              ? "Connecting to database..."
              : error?.includes("activation")
                ? "N8N workflow needs to be activated"
                : error?.includes("timeout")
                  ? "Webhook taking too long - using demo data"
                  : error?.includes("demo")
                    ? "Displaying demo intelligence data"
                    : error
                      ? "Webhook connection issue detected"
                      : `${alerts.length} live alerts from database`}
          </p>
          {error && (
            <p
              className={`text-xs mt-1 ${error.includes("timeout") ? "text-orange-400" : error.includes("demo") ? "text-yellow-400" : error.includes("activation") ? "text-orange-400" : "text-red-400"}`}
            >
              {error.includes("activation")
                ? "Click 'Execute workflow' in n8n then refresh"
                : error.includes("timeout")
                  ? "Webhook response time >8s - check n8n performance"
                  : error.includes("demo")
                    ? "System operational - check webhook status"
                    : "Webhook returning empty/error responses"}
            </p>
          )}
        </motion.div>
      </div>

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
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-cyan-400 font-bold text-lg">Live Alerts</h3>
              <button
                onClick={fetchLatestNews}
                className="text-gray-400 hover:text-cyan-400 transition-colors"
                title="Refresh news"
              >
                <motion.div
                  animate={{ rotate: loading ? 360 : 0 }}
                  transition={{ duration: 1, repeat: loading ? Infinity : 0 }}
                >
                  ⟳
                </motion.div>
              </button>
            </div>

            <div className="space-y-3">
              {alerts.length > 0
                ? alerts.map((alert, index) => (
                    <motion.div
                      key={alert.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.1 }}
                    >
                      <NewsCard alert={alert} />
                    </motion.div>
                  ))
                : !loading && (
                    <div className="text-center py-8">
                      <p className="text-gray-400 text-sm">
                        No alerts available
                      </p>
                      <button
                        onClick={fetchLatestNews}
                        className="mt-2 text-cyan-400 hover:text-cyan-300 text-sm underline"
                      >
                        Refresh
                      </button>
                    </div>
                  )}
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
