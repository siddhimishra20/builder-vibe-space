import { motion } from "framer-motion";
import { Radar, Globe, Activity } from "lucide-react";

export default function DashboardHeader() {
  return (
    <motion.header
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      className="fixed top-0 left-0 right-0 z-40 glass-panel border-b border-cyan-500/20"
    >
      <div className="px-6 py-4 flex items-center justify-between">
        {/* Left side - Logo and title */}
        <div className="flex items-center gap-4">
          {/* ADNOC Logo placeholder */}
          <div className="w-12 h-12 bg-gradient-to-br from-cyan-500 to-blue-600 rounded-lg flex items-center justify-center">
            <span className="text-white font-bold text-lg">A</span>
          </div>

          <div className="flex items-center gap-3">
            <Radar className="w-8 h-8 text-cyan-400 animate-pulse" />
            <div>
              <h1 className="text-2xl font-bold text-white tracking-wide">
                Tech<span className="text-cyan-400">Radar</span>
              </h1>
              <p className="text-gray-400 text-sm">
                Global AI & Technology Intelligence
              </p>
            </div>
          </div>
        </div>

        {/* Center - Status indicators */}
        <div className="flex items-center gap-6">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
            <span className="text-green-400 text-sm font-medium">LIVE</span>
          </div>

          <div className="flex items-center gap-2">
            <Globe className="w-4 h-4 text-cyan-400" />
            <span className="text-gray-300 text-sm">Global Coverage</span>
          </div>

          <div className="flex items-center gap-2">
            <Activity className="w-4 h-4 text-purple-400" />
            <span className="text-gray-300 text-sm">Real-time Analysis</span>
          </div>
        </div>

        {/* Right side - Time and status */}
        <div className="text-right">
          <div className="text-white font-mono text-lg">
            {new Date().toLocaleTimeString("en-US", {
              hour12: false,
              timeZone: "Asia/Dubai",
            })}
          </div>
          <div className="text-gray-400 text-sm">Abu Dhabi Time</div>
        </div>
      </div>
    </motion.header>
  );
}
