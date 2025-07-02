import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  MessageCircle,
  Send,
  Bot,
  User,
  Minimize2,
  Maximize2,
  Search,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import newsService from "../services/newsService";

interface Message {
  id: string;
  text: string;
  sender: "user" | "ai";
  timestamp: Date;
}

export default function ChatBox() {
  const [isExpanded, setIsExpanded] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    {
      id: "1",
      text: "🛰️ TechRadar AI online! I'm connected to global tech intelligence networks. Ask me about:\n\n• Current alerts and trends\n• AI & Energy Tech developments\n• ADNOC impact analysis\n• Specific companies or regions\n\nType your query to search real-time tech news!",
      sender: "ai",
      timestamp: new Date(),
    },
  ]);
  const [inputText, setInputText] = useState("");

  const handleSendMessage = async () => {
    if (!inputText.trim()) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      text: inputText,
      sender: "user",
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    const query = inputText;
    setInputText("");

    // Add typing indicator
    const typingMessage: Message = {
      id: "typing",
      text: "🔍 Searching global tech intelligence...",
      sender: "ai",
      timestamp: new Date(),
    };
    setMessages((prev) => [...prev, typingMessage]);

    try {
      // Search for relevant news
      const searchResults = await newsService.searchNews(query);

      // Remove typing indicator
      setMessages((prev) => prev.filter((msg) => msg.id !== "typing"));

      let response = "";
      if (searchResults.length > 0) {
        response = `Found ${searchResults.length} relevant articles:\n\n`;
        searchResults.slice(0, 3).forEach((news, index) => {
          response += `${index + 1}. **${news.headline}**\n`;
          response += `   📍 ${news.location.city}, ${news.location.country}\n`;
          response += `   📊 ${news.category} | ${news.source}\n`;
          response += `   💡 ${news.summary.substring(0, 100)}...\n\n`;
        });

        if (searchResults.length > 3) {
          response += `...and ${searchResults.length - 3} more results`;
        }
      } else {
        response = `No specific results found for "${query}". However, I'm monitoring global tech trends in AI, Energy Tech, Robotics, and Quantum Computing. Ask me about:\n\n• Latest AI developments\n• Energy technology innovations\n• ADNOC-relevant tech trends\n• Specific companies or regions`;
      }

      const aiResponse: Message = {
        id: (Date.now() + 1).toString(),
        text: response,
        sender: "ai",
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, aiResponse]);
    } catch (error) {
      // Remove typing indicator
      setMessages((prev) => prev.filter((msg) => msg.id !== "typing"));

      const errorResponse: Message = {
        id: (Date.now() + 1).toString(),
        text: "I'm experiencing connectivity issues with the intelligence network. Please try again or ask me about the current alerts on the dashboard.",
        sender: "ai",
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, errorResponse]);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      handleSendMessage();
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="relative"
    >
      <AnimatePresence>
        {isExpanded ? (
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            className="w-80 h-96 glass-panel rounded-xl border border-cyan-500/30 flex flex-col"
          >
            {/* Header */}
            <div className="p-4 border-b border-gray-700/50 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 bg-gradient-to-br from-cyan-500 to-blue-600 rounded-full flex items-center justify-center">
                  <Bot className="w-4 h-4 text-white" />
                </div>
                <div>
                  <h3 className="text-cyan-400 font-semibold text-sm">
                    Ask TechRadar...
                  </h3>
                  <p className="text-gray-400 text-xs">AI Assistant</p>
                </div>
              </div>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setIsExpanded(false)}
                className="text-gray-400 hover:text-white h-8 w-8"
              >
                <Minimize2 className="w-4 h-4" />
              </Button>
            </div>

            {/* Messages */}
            <div className="flex-1 p-4 space-y-3 overflow-y-auto scrollbar-hide">
              {messages.map((message) => (
                <motion.div
                  key={message.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className={`flex gap-2 ${message.sender === "user" ? "justify-end" : "justify-start"}`}
                >
                  {message.sender === "ai" && (
                    <div className="w-6 h-6 bg-gradient-to-br from-cyan-500 to-blue-600 rounded-full flex items-center justify-center flex-shrink-0">
                      <Bot className="w-3 h-3 text-white" />
                    </div>
                  )}
                  <div
                    className={`max-w-[70%] p-3 rounded-lg text-sm whitespace-pre-wrap ${
                      message.sender === "user"
                        ? "bg-cyan-600 text-white"
                        : "bg-gray-800 text-gray-200 border border-gray-700"
                    }`}
                  >
                    {message.text}
                  </div>
                  {message.sender === "user" && (
                    <div className="w-6 h-6 bg-gradient-to-br from-purple-500 to-pink-600 rounded-full flex items-center justify-center flex-shrink-0">
                      <User className="w-3 h-3 text-white" />
                    </div>
                  )}
                </motion.div>
              ))}
            </div>

            {/* Input */}
            <div className="p-4 border-t border-gray-700/50">
              <div className="flex gap-2">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <Input
                    value={inputText}
                    onChange={(e) => setInputText(e.target.value)}
                    onKeyPress={handleKeyPress}
                    placeholder="Search global tech intelligence..."
                    className="bg-gray-800/50 border-gray-600 text-white placeholder-gray-400 focus:border-cyan-500 pl-10"
                  />
                </div>
                <Button
                  onClick={handleSendMessage}
                  size="icon"
                  className="bg-cyan-600 hover:bg-cyan-700 text-white"
                  disabled={!inputText.trim()}
                >
                  <Send className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </motion.div>
        ) : (
          <motion.button
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            onClick={() => setIsExpanded(true)}
            className="glass-panel p-4 rounded-xl border border-cyan-500/30 hover:border-cyan-500/50 transition-all duration-300 flex items-center gap-3"
          >
            <div className="w-10 h-10 bg-gradient-to-br from-cyan-500 to-blue-600 rounded-full flex items-center justify-center">
              <MessageCircle className="w-5 h-5 text-white" />
            </div>
            <div className="text-left">
              <h3 className="text-cyan-400 font-semibold text-sm">
                Ask TechRadar...
              </h3>
              <p className="text-gray-400 text-xs">Click to chat with AI</p>
            </div>
            <Maximize2 className="w-4 h-4 text-gray-400" />
          </motion.button>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
