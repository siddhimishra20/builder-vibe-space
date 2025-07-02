import { DemoResponse } from "@shared/api";
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Radar, ArrowRight } from "lucide-react";

export default function Index() {
  const [exampleFromServer, setExampleFromServer] = useState("");
  // Fetch users on component mount
  useEffect(() => {
    fetchDemo();
  }, []);

  // Example of how to fetch data from the server (if needed)
  const fetchDemo = async () => {
    try {
      const response = await fetch("/api/demo");
      const data = (await response.json()) as DemoResponse;
      setExampleFromServer(data.message);
    } catch (error) {
      console.error("Error fetching hello:", error);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-100 to-slate-200">
      <div className="text-center max-w-2xl mx-auto px-6">
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-slate-800 mb-4">
            Fusion Starter
          </h1>
          <p className="text-slate-600 text-lg">
            Production-ready React application with integrated Express server
          </p>
        </div>

        {/* TechRadar Dashboard Card */}
        <div className="bg-white rounded-2xl shadow-xl p-8 mb-8 border border-slate-200">
          <div className="flex items-center justify-center mb-4">
            <div className="w-16 h-16 bg-gradient-to-br from-cyan-500 to-blue-600 rounded-full flex items-center justify-center">
              <Radar className="w-8 h-8 text-white" />
            </div>
          </div>

          <h2 className="text-2xl font-bold text-slate-800 mb-3">
            Tech<span className="text-cyan-600">Radar</span> Dashboard
          </h2>

          <p className="text-slate-600 mb-6">
            High-tech interactive dashboard for ADNOC featuring real-time global
            AI & technology monitoring with dark glass morphism design
          </p>

          <div className="grid grid-cols-2 gap-4 mb-6 text-sm">
            <div className="flex items-center gap-2 text-slate-600">
              <div className="w-2 h-2 bg-green-500 rounded-full"></div>
              Static World Map
            </div>
            <div className="flex items-center gap-2 text-slate-600">
              <div className="w-2 h-2 bg-red-500 rounded-full"></div>
              Radar Alert Signals
            </div>
            <div className="flex items-center gap-2 text-slate-600">
              <div className="w-2 h-2 bg-cyan-500 rounded-full"></div>
              Floating News Cards
            </div>
            <div className="flex items-center gap-2 text-slate-600">
              <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
              AI Chat Interface
            </div>
          </div>

          <Link
            to="/techradar"
            className="inline-flex items-center gap-2 bg-gradient-to-r from-cyan-600 to-blue-600 text-white px-6 py-3 rounded-lg font-semibold hover:from-cyan-700 hover:to-blue-700 transition-all duration-300 transform hover:scale-105"
          >
            Launch TechRadar
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>

        <div className="text-slate-500 text-sm">
          <p>Built with React, TypeScript, Framer Motion & TailwindCSS</p>
          {exampleFromServer && (
            <p className="mt-2 text-cyan-600">Server: {exampleFromServer}</p>
          )}
        </div>
      </div>
    </div>
  );
}
