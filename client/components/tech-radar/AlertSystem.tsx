import { motion, AnimatePresence } from "framer-motion";
import { AlertTriangle, TrendingUp, Zap } from "lucide-react";

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

interface AlertSystemProps {
  alerts: NewsAlert[];
  activeAlert: NewsAlert | null;
}

export default function AlertSystem({ alerts, activeAlert }: AlertSystemProps) {
  return (
    <div className="absolute inset-0 pointer-events-none">
      {/* Alert notifications */}
      <AnimatePresence>
        {activeAlert && (
          <motion.div
            initial={{ opacity: 0, scale: 0.8, y: -20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.8, y: -20 }}
            className="absolute top-4 left-1/2 transform -translate-x-1/2 z-30 pointer-events-auto"
          >
            <div className="glass-panel-alert p-4 rounded-xl border border-red-500/50 max-w-md">
              <div className="flex items-center gap-3">
                <div className="flex-shrink-0">
                  <div className="w-10 h-10 bg-red-500/20 rounded-full flex items-center justify-center">
                    <AlertTriangle className="w-5 h-5 text-red-400" />
                  </div>
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-red-400 font-semibold text-sm">
                      NEW ALERT
                    </span>
                    <span className="text-cyan-400 text-xs">
                      {activeAlert.category}
                    </span>
                  </div>
                  <h4 className="text-white font-medium text-sm mb-1">
                    {activeAlert.headline}
                  </h4>
                  <p className="text-gray-300 text-xs">
                    📍 {activeAlert.city}, {activeAlert.country}
                  </p>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Alert summary panel */}
      <div className="absolute top-4 right-4 z-20 pointer-events-auto">
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          className="glass-panel p-4 rounded-xl border border-cyan-500/30 w-64"
        >
          <h3 className="text-cyan-400 font-semibold text-sm mb-3 flex items-center gap-2">
            <TrendingUp className="w-4 h-4" />
            Alert Status
          </h3>

          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-gray-300 text-xs">Total Alerts</span>
              <span className="text-white font-semibold">{alerts.length}</span>
            </div>

            <div className="flex items-center justify-between">
              <span className="text-gray-300 text-xs">Active Monitoring</span>
              <div className="flex items-center gap-1">
                <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                <span className="text-green-400 text-xs font-medium">
                  ONLINE
                </span>
              </div>
            </div>

            <div className="flex items-center justify-between">
              <span className="text-gray-300 text-xs">High Priority</span>
              <span className="text-red-400 font-semibold">
                {
                  alerts.filter(
                    (alert) =>
                      alert.category === "AI" ||
                      alert.category === "Energy Tech",
                  ).length
                }
              </span>
            </div>
          </div>

          {/* Categories breakdown */}
          <div className="mt-4 pt-3 border-t border-gray-700">
            <div className="space-y-2">
              {["AI", "Energy Tech", "Energy Storage", "Robotics"].map(
                (category) => {
                  const count = alerts.filter(
                    (alert) => alert.category === category,
                  ).length;
                  return (
                    <div
                      key={category}
                      className="flex items-center justify-between"
                    >
                      <span className="text-gray-400 text-xs">{category}</span>
                      <span className="text-cyan-400 text-xs font-medium">
                        {count}
                      </span>
                    </div>
                  );
                },
              )}
            </div>
          </div>
        </motion.div>
      </div>

      {/* Global threat level indicator */}
      <div className="absolute bottom-4 right-4 z-20 pointer-events-auto">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="glass-panel p-4 rounded-xl border border-yellow-500/30"
        >
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-yellow-500/20 rounded-full flex items-center justify-center">
              <Zap className="w-4 h-4 text-yellow-400" />
            </div>
            <div>
              <div className="text-yellow-400 font-semibold text-sm">
                Threat Level
              </div>
              <div className="text-white font-bold text-lg">MODERATE</div>
            </div>
          </div>
          <div className="mt-2 w-full bg-gray-700 rounded-full h-2">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: "60%" }}
              transition={{ duration: 1, ease: "easeOut" }}
              className="bg-gradient-to-r from-yellow-600 to-yellow-400 h-2 rounded-full"
            />
          </div>
        </motion.div>
      </div>
    </div>
  );
}
