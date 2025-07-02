interface NewsItem {
  id: string;
  headline: string;
  source: string;
  category: string;
  summary: string;
  location: {
    lat: number;
    lng: number;
    city: string;
    country: string;
  };
  timestamp: string;
  impact?: string;
  relevance_score?: number;
  keywords?: string[];
  url?: string;
}

interface N8nResponse {
  data: NewsItem[];
  status: string;
  total: number;
}

const PINECONE_HOST = "https://n8n-3-138rhrh.svc.aped-4627-b74a.pinecone.io";

export class NewsService {
  private static instance: NewsService;
  private cache: Map<string, { data: NewsItem[]; timestamp: number }> =
    new Map();
  private readonly CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

  public static getInstance(): NewsService {
    if (!NewsService.instance) {
      NewsService.instance = new NewsService();
    }
    return NewsService.instance;
  }

  async fetchLatestNews(): Promise<NewsItem[]> {
    const cacheKey = "latest_news";
    const cached = this.cache.get(cacheKey);

    // Return cached data if it's still fresh
    if (cached && Date.now() - cached.timestamp < this.CACHE_DURATION) {
      return cached.data;
    }

    // For now, use fallback data while we debug Pinecone connection
    console.log("Pinecone connection debugging - using fallback data");
    const fallbackData = this.getFallbackData();

    // Cache the fallback data
    this.cache.set(cacheKey, {
      data: fallbackData,
      timestamp: Date.now(),
    });

    // Try to connect to Pinecone in the background (non-blocking)
    this.tryPineconeConnection().catch((error) => {
      console.log("Background Pinecone connection failed:", error.message);
    });

    return fallbackData;
  }

  private async tryPineconeConnection(): Promise<void> {
    try {
      console.log("Attempting Pinecone connection to:", PINECONE_HOST);

      // Test with a simple fetch with timeout
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 5000); // 5 second timeout

      const response = await fetch(`${PINECONE_HOST}/query`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
          "Access-Control-Allow-Origin": "*",
          "Access-Control-Allow-Methods": "POST, GET, OPTIONS",
          "Access-Control-Allow-Headers": "Content-Type",
        },
        signal: controller.signal,
        body: JSON.stringify({
          vector: this.getEmbeddingForQuery("test"),
          topK: 1,
          includeMetadata: true,
          includeValues: false,
        }),
      });

      clearTimeout(timeoutId);
      console.log("Pinecone response status:", response.status);

      if (response.ok) {
        const result = await response.json();
        console.log("Pinecone connection successful:", result);
      } else {
        console.log("Pinecone response error:", response.statusText);
      }
    } catch (error) {
      if (error instanceof Error) {
        if (error.name === "AbortError") {
          console.log("Pinecone connection timeout");
        } else {
          console.log("Pinecone connection error:", error.message);
        }
      }
    }
  }

  async searchNews(query: string): Promise<NewsItem[]> {
    console.log("Searching for:", query);

    // For now, return filtered fallback data based on query
    const fallbackData = this.getFallbackData();
    const queryLower = query.toLowerCase();

    // Filter fallback data based on query
    const filtered = fallbackData.filter(
      (item) =>
        item.headline.toLowerCase().includes(queryLower) ||
        item.summary.toLowerCase().includes(queryLower) ||
        item.category.toLowerCase().includes(queryLower) ||
        item.keywords?.some((keyword) =>
          keyword.toLowerCase().includes(queryLower),
        ),
    );

    // If no matches, return some relevant items
    if (filtered.length === 0) {
      return fallbackData.slice(0, 3);
    }

    return filtered.slice(0, 5);
  }

  async getImpactAnalysis(newsItem: NewsItem): Promise<string> {
    // Return enhanced impact analysis based on category and content
    return this.generateEnhancedImpact(newsItem);
  }

  private transformNewsData(rawData: any[]): NewsItem[] {
    return rawData.map((item, index) => ({
      id: item.id || `news_${Date.now()}_${index}`,
      headline: item.headline || item.title || "Unknown Headline",
      source: item.source || "Unknown Source",
      category: this.categorizeNews(item.category || item.headline || ""),
      summary: item.summary || item.description || "No summary available",
      location: this.extractLocation(
        item.location || item.country || item.city,
      ),
      timestamp:
        item.timestamp || item.published_at || new Date().toISOString(),
      impact: item.impact || "",
      relevance_score: item.relevance_score || 0.5,
      keywords: item.keywords || [],
      url: item.url || item.link || "",
    }));
  }

  private transformPineconeData(pineconeResult: any): NewsItem[] {
    if (!pineconeResult || !pineconeResult.matches) {
      return [];
    }

    return pineconeResult.matches.map((match: any, index: number) => {
      const metadata = match.metadata || {};
      return {
        id: match.id || `pinecone_${Date.now()}_${index}`,
        headline: metadata.headline || metadata.title || "Tech News Alert",
        source: metadata.source || "Global Intelligence",
        category: this.categorizeNews(
          metadata.category || metadata.headline || "",
        ),
        summary:
          metadata.summary ||
          metadata.description ||
          "Latest technology development detected",
        location: this.extractLocation(
          metadata.location || metadata.country || metadata.city,
        ),
        timestamp:
          metadata.timestamp ||
          metadata.published_at ||
          new Date().toISOString(),
        impact: metadata.impact || "",
        relevance_score: match.score || Math.random() * 0.3 + 0.7, // Higher relevance for Pinecone matches
        keywords: metadata.keywords
          ? Array.isArray(metadata.keywords)
            ? metadata.keywords
            : metadata.keywords.split(",")
          : [],
        url: metadata.url || metadata.link || "",
      };
    });
  }

  private getEmbeddingForQuery(query: string): number[] {
    // For now, return a mock embedding vector
    // In production, this would call an embedding API like OpenAI's text-embedding-ada-002
    const dimension = 1536; // Standard OpenAI embedding dimension
    const mockEmbedding = new Array(dimension)
      .fill(0)
      .map(() => Math.random() * 0.01 - 0.005);

    // Add some semantic meaning based on query keywords
    const keywords = [
      "technology",
      "AI",
      "energy",
      "robotics",
      "quantum",
      "ADNOC",
      "innovation",
    ];
    keywords.forEach((keyword, idx) => {
      if (query.toLowerCase().includes(keyword.toLowerCase())) {
        mockEmbedding[idx * 10] = 0.5 + Math.random() * 0.3;
      }
    });

    return mockEmbedding;
  }

  private extractLocation(locationData: any): {
    lat: number;
    lng: number;
    city: string;
    country: string;
  } {
    // Handle different location data formats
    if (
      typeof locationData === "object" &&
      locationData.lat &&
      locationData.lng
    ) {
      return {
        lat: parseFloat(locationData.lat),
        lng: parseFloat(locationData.lng),
        city: locationData.city || "Unknown City",
        country: locationData.country || "Unknown Country",
      };
    }

    // Fallback to city/country mapping
    const locationMap: Record<
      string,
      { lat: number; lng: number; city: string; country: string }
    > = {
      "United States": {
        lat: 39.8283,
        lng: -98.5795,
        city: "Washington DC",
        country: "USA",
      },
      China: { lat: 39.9042, lng: 116.4074, city: "Beijing", country: "China" },
      Germany: { lat: 52.52, lng: 13.405, city: "Berlin", country: "Germany" },
      "United Kingdom": {
        lat: 51.5074,
        lng: -0.1278,
        city: "London",
        country: "UK",
      },
      Japan: { lat: 35.6762, lng: 139.6503, city: "Tokyo", country: "Japan" },
      India: { lat: 28.6139, lng: 77.209, city: "New Delhi", country: "India" },
      "Saudi Arabia": {
        lat: 24.7136,
        lng: 46.6753,
        city: "Riyadh",
        country: "Saudi Arabia",
      },
      Norway: { lat: 59.9139, lng: 10.7522, city: "Oslo", country: "Norway" },
      France: { lat: 48.8566, lng: 2.3522, city: "Paris", country: "France" },
      "South Korea": {
        lat: 37.5665,
        lng: 126.978,
        city: "Seoul",
        country: "South Korea",
      },
    };

    const locationString =
      typeof locationData === "string" ? locationData : "United States";
    return locationMap[locationString] || locationMap["United States"];
  }

  private categorizeNews(text: string): string {
    const categories = {
      AI: [
        "artificial intelligence",
        "machine learning",
        "neural network",
        "deep learning",
        "ai",
        "chatgpt",
        "openai",
        "google ai",
      ],
      "Energy Tech": [
        "renewable energy",
        "solar",
        "wind",
        "hydrogen",
        "green energy",
        "clean energy",
        "battery",
        "electric",
      ],
      Robotics: ["robot", "automation", "autonomous", "drone", "robotics"],
      "Quantum Computing": [
        "quantum",
        "qubit",
        "quantum computing",
        "quantum processor",
      ],
      "Energy Storage": ["battery", "energy storage", "lithium", "fuel cell"],
    };

    const lowerText = text.toLowerCase();

    for (const [category, keywords] of Object.entries(categories)) {
      if (keywords.some((keyword) => lowerText.includes(keyword))) {
        return category;
      }
    }

    return "Technology";
  }

  private generateFallbackImpact(newsItem: NewsItem): string {
    const impactTemplates = {
      AI: "Potential opportunities for ADNOC to explore AI integration in operations and digital transformation initiatives.",
      "Energy Tech":
        "Strategic relevance for ADNOC's renewable energy portfolio and sustainable technology investments.",
      Robotics:
        "Opportunity to enhance operational efficiency through automation and robotics in oil and gas operations.",
      "Quantum Computing":
        "Long-term implications for computational capabilities in complex energy modeling and optimization.",
      "Energy Storage":
        "Critical technology for ADNOC's renewable energy projects and grid stability solutions.",
    };

    return (
      impactTemplates[newsItem.category as keyof typeof impactTemplates] ||
      "Potential relevance to ADNOC's technological advancement and innovation strategy."
    );
  }

  private generateEnhancedImpact(newsItem: NewsItem): string {
    const headline = newsItem.headline.toLowerCase();
    const summary = newsItem.summary.toLowerCase();
    const location = newsItem.location;

    // Enhanced impact analysis based on content and location
    if (headline.includes("microsoft") || headline.includes("azure")) {
      return "Strategic partnership opportunity with Microsoft for cloud infrastructure and AI capabilities in ADNOC's digital transformation roadmap.";
    }

    if (
      headline.includes("saudi") ||
      headline.includes("neom") ||
      location.country === "Saudi Arabia"
    ) {
      return "Critical regional competition requiring immediate strategic response to maintain ADNOC's market leadership in the Gulf energy sector.";
    }

    if (headline.includes("hydrogen") || summary.includes("hydrogen")) {
      return "Direct impact on ADNOC's hydrogen strategy - requires assessment for technology acquisition, partnership, or competitive response.";
    }

    if (
      headline.includes("quantum") ||
      newsItem.category === "Quantum Computing"
    ) {
      return "Revolutionary computational advancement with potential to transform ADNOC's reservoir modeling, logistics optimization, and predictive maintenance capabilities.";
    }

    if (headline.includes("tesla") || headline.includes("battery")) {
      return "Energy storage breakthrough relevant to ADNOC's renewable energy integration and grid stability projects in the UAE.";
    }

    if (headline.includes("offshore") || headline.includes("wind")) {
      return "Offshore renewable technology with direct application potential for ADNOC's sustainable energy initiatives in UAE coastal waters.";
    }

    // Fallback to category-based impact
    return this.generateFallbackImpact(newsItem);
  }

  private getFallbackData(): NewsItem[] {
    // Fallback data in case Pinecone is unavailable
    return [
      {
        id: "fallback_1",
        headline:
          "Microsoft Announces $10B AI Infrastructure Expansion in Middle East",
        source: "Reuters",
        category: "AI",
        summary:
          "Microsoft plans major AI data centers across Gulf region, targeting energy sector applications",
        location: {
          lat: 24.4539,
          lng: 54.3773,
          city: "Abu Dhabi",
          country: "UAE",
        },
        timestamp: new Date().toISOString(),
        impact:
          "Direct opportunity for ADNOC to partner on AI-powered oil & gas operations optimization",
        relevance_score: 0.95,
        keywords: ["AI", "Microsoft", "Middle East", "Energy"],
        url: "https://reuters.com/tech/microsoft-ai-expansion",
      },
      {
        id: "fallback_2",
        headline:
          "Saudi Arabia's NEOM Unveils World's Largest Green Hydrogen Plant",
        source: "Bloomberg Energy",
        category: "Energy Tech",
        summary:
          "Revolutionary $8.5B facility to produce 650 tons of green hydrogen daily using renewable energy",
        location: {
          lat: 24.7136,
          lng: 46.6753,
          city: "Riyadh",
          country: "Saudi Arabia",
        },
        timestamp: new Date(Date.now() - 300000).toISOString(),
        impact:
          "Competitive pressure on ADNOC's hydrogen strategy - immediate strategic response required",
        relevance_score: 0.88,
        keywords: [
          "Green Hydrogen",
          "NEOM",
          "Renewable Energy",
          "Saudi Arabia",
        ],
        url: "https://bloomberg.com/energy/hydrogen-facility",
      },
      {
        id: "fallback_3",
        headline: "China's AI Breakthrough: Quantum-Enhanced Energy Modeling",
        source: "Nature Energy",
        category: "Quantum Computing",
        summary:
          "Chinese researchers achieve 1000x faster energy reservoir simulations using quantum AI",
        location: {
          lat: 39.9042,
          lng: 116.4074,
          city: "Beijing",
          country: "China",
        },
        timestamp: new Date(Date.now() - 600000).toISOString(),
        impact:
          "Revolutionary modeling capabilities could transform ADNOC's exploration and production efficiency",
        relevance_score: 0.82,
        keywords: ["Quantum Computing", "AI", "Energy Modeling", "China"],
        url: "https://nature.com/energy/quantum-ai",
      },
      {
        id: "fallback_4",
        headline: "Tesla Energy Storage Breakthrough: 10x Battery Density",
        source: "TechCrunch",
        category: "Energy Storage",
        summary:
          "New silicon-nanowire technology promises game-changing energy storage for renewable grids",
        location: {
          lat: 37.7749,
          lng: -122.4194,
          city: "San Francisco",
          country: "USA",
        },
        timestamp: new Date(Date.now() - 900000).toISOString(),
        impact:
          "Critical technology for ADNOC's renewable energy projects and grid-scale storage solutions",
        relevance_score: 0.75,
        keywords: [
          "Battery Technology",
          "Tesla",
          "Energy Storage",
          "Renewable",
        ],
        url: "https://techcrunch.com/tesla-battery-breakthrough",
      },
      {
        id: "fallback_5",
        headline: "Norway's Floating Wind Farm Sets New Efficiency Record",
        source: "Energy Voice",
        category: "Energy Tech",
        summary:
          "Hywind Tampen achieves 60% capacity factor, demonstrating viability of offshore wind",
        location: {
          lat: 59.9139,
          lng: 10.7522,
          city: "Oslo",
          country: "Norway",
        },
        timestamp: new Date(Date.now() - 1200000).toISOString(),
        impact:
          "Proven technology for ADNOC's offshore renewable energy strategy in UAE waters",
        relevance_score: 0.78,
        keywords: [
          "Offshore Wind",
          "Floating Technology",
          "Norway",
          "Renewable",
        ],
        url: "https://energyvoice.com/floating-wind-record",
      },
    ];
  }

  clearCache(): void {
    this.cache.clear();
  }
}

export default NewsService.getInstance();
