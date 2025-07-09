import { motion } from "framer-motion";
import { Clock, MapPin, Zap, Gamepad2, Cpu, FileText } from "lucide-react";

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
const categoryStyles: { [key: string]: { icon: JSX.Element; color: string } } = {
  AI: { icon: <Cpu className="w-3 h-3" />, color: "from-purple-600 to-purple-400" },
  "Energy Tech": { icon: <Zap className="w-3 h-3" />, color: "from-yellow-600 to-yellow-400" },
  "Energy Storage": { icon: <BatteryFull />, color: "from-green-600 to-green-400" }, // Using Cpu as placeholder
  Robotics: { icon: <Cpu className="w-3 h-3" />, color: "from-blue-600 to-blue-400" }, // Using Cpu as placeholder
  Gaming: { icon: <Gamepad2 className="w-3 h-3" />, color: "from-pink-600 to-pink-400" },
  Technology: { icon: <Cpu className="w-3 h-3" />, color: "from-indigo-600 to-indigo-400" },
  "General News": { icon: <FileText className="w-3 h-3" />, color: "from-gray-600 to-gray-400" },
  default: { icon: <FileText className="w-3 h-3" />, color: "from-cyan-600 to-cyan-400" },
};

const getCategoryStyle = (category: string) => {
  return categoryStyles[category] || categoryStyles.default;
};

export default function NewsCard({ alert }: NewsCardProps) {
  const timeAgo = Math.floor((Date.now() - new Date(alert.timestamp).getTime()) / 60000);
  const style = getCategoryStyle(alert.category);

  return (
    // Wrap the card in an anchor tag to make it clickable
    <a href={alert.url} target="_blank" rel="noopener noreferrer">
      <motion.div
        whileHover={{ scale: 1.02, borderColor: 'rgba(6, 182, 212, 0.7)' }} // Enhanced hover
        className="glass-panel-dark p-4 rounded-lg border border-gray-700/50 transition-all duration-300 cursor-pointer"
      >
        {/* Header */}
        <div className="flex items-center justify-between mb-3">
          <div
            className={`px-2 py-1 rounded-full bg-gradient-to-r ${style.color} text-xs font-semibold text-white flex items-center gap-1.5`}
          >
            {style.icon}
            {alert.category}
          </div>
          <div className="flex items-center gap-1 text-gray-400 text-xs">
            <Clock className="w-3 h-3" />
            {timeAgo > 60 ? `${Math.floor(timeAgo / 60)}h` : `${timeAgo}m`} ago
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
      </motion.div>
    </a>
  );
}
