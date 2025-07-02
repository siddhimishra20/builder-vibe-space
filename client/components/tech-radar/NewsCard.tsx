import { motion } from "framer-motion";
import { Clock, MapPin, Zap } from "lucide-react";

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

interface NewsCardProps {
  alert: NewsAlert;
}

const getCategoryIcon = (category: string) => {
  switch (category.toLowerCase()) {
    case "ai":
      return "🤖";
    case "energy tech":
      return "⚡";
    case "energy storage":
      return "🔋";
    case "robotics":
      return "🦾";
    default:
      return "💡";
  }
};

const getCategoryColor = (category: string) => {
  switch (category.toLowerCase()) {
    case "ai":
      return "from-purple-600 to-purple-400";
    case "energy tech":
      return "from-yellow-600 to-yellow-400";
    case "energy storage":
      return "from-green-600 to-green-400";
    case "robotics":
      return "from-blue-600 to-blue-400";
    default:
      return "from-cyan-600 to-cyan-400";
  }
};

export default function NewsCard({ alert }: NewsCardProps) {
  const timeAgo = Math.floor((Date.now() - alert.timestamp.getTime()) / 60000);

  return (
    <motion.div
      whileHover={{ scale: 1.02 }}
      className="glass-panel-dark p-4 rounded-lg border border-gray-700/50 hover:border-cyan-500/50 transition-all duration-300"
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <div
          className={`px-2 py-1 rounded-full bg-gradient-to-r ${getCategoryColor(alert.category)} text-xs font-semibold text-white flex items-center gap-1`}
        >
          <span>{getCategoryIcon(alert.category)}</span>
          {alert.category}
        </div>
        <div className="flex items-center gap-1 text-gray-400 text-xs">
          <Clock className="w-3 h-3" />
          {timeAgo}m ago
        </div>
      </div>

      {/* Headline */}
      <h4 className="text-white font-semibold text-sm mb-2 line-clamp-2">
        {alert.headline}
      </h4>

      {/* Summary */}
      <p className="text-gray-300 text-xs mb-3 line-clamp-2">{alert.summary}</p>

      {/* Footer */}
      <div className="flex items-center justify-between text-xs">
        <div className="flex items-center gap-1 text-gray-400">
          <MapPin className="w-3 h-3" />
          {alert.city}, {alert.country}
        </div>
        <div className="text-cyan-400 font-medium">{alert.source}</div>
      </div>

      {/* Impact indicator */}
      <motion.div
        initial={{ opacity: 0, height: 0 }}
        whileHover={{ opacity: 1, height: "auto" }}
        className="mt-3 pt-3 border-t border-gray-700"
      >
        <div className="flex items-start gap-2">
          <Zap className="w-3 h-3 text-yellow-400 mt-0.5 flex-shrink-0" />
          <p className="text-xs text-gray-300">
            <span className="text-yellow-400 font-medium">Impact:</span>{" "}
            {alert.impact}
          </p>
        </div>
      </motion.div>
    </motion.div>
  );
}
