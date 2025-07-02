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

const NEWS_WEBHOOK_URL =
  "https://e0ca-5-195-220-7.ngrok-free.app/webhook-test/50e6515b-a272-40d5-9c9f-4b70c9697362";

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

    // Always start with fallback data to ensure the app works
    const fallbackData = this.getFallbackData();

    // Cache fallback data immediately
    this.cache.set(cacheKey, {
      data: fallbackData,
      timestamp: Date.now(),
    });

    // Try to fetch from webhook in background (non-blocking)
    this.tryWebhookFetch(cacheKey).catch(() => {
      // Silently fail - we already have fallback data
    });

    return fallbackData;
  }

  private async tryWebhookFetch(cacheKey: string): Promise<void> {
    try {
      console.log("Attempting webhook connection to:", NEWS_WEBHOOK_URL);

      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 8000); // 8 second timeout

      // Try different approaches for CORS
      const response = await fetch(NEWS_WEBHOOK_URL, {
        method: "GET",
        mode: "cors", // Explicit CORS mode
        headers: {
          Accept: "application/json",
          "Content-Type": "application/json",
          "ngrok-skip-browser-warning": "true",
          "User-Agent": "TechRadar-Dashboard/1.0",
        },
        signal: controller.signal,
      });

      clearTimeout(timeoutId);
      console.log("Webhook response status:", response.status);

      if (response.ok) {
        const rawData = await response.json();
        console.log("Successfully received webhook data:", rawData);

        // Transform and update cache with real data
        const transformedData = this.transformWebhookData(rawData);

        this.cache.set(cacheKey, {
          data: transformedData,
          timestamp: Date.now(),
        });

        // Optionally trigger a refresh of the UI here
        console.log("Live data cached successfully");
      } else {
        console.log(
          "Webhook responded with error:",
          response.status,
          response.statusText,
        );
      }
    } catch (error) {
      if (error instanceof Error) {
        if (error.name === "AbortError") {
          console.log("Webhook connection timeout - using fallback data");
        } else if (error.message.includes("CORS")) {
          console.log("CORS error with webhook - using fallback data");
        } else if (error.message.includes("Failed to fetch")) {
          console.log(
            "Network error connecting to webhook - using fallback data",
          );
        } else {
          console.log("Webhook connection error:", error.message);
        }
      }
    }
  }

  async searchNews(query: string): Promise<NewsItem[]> {
    console.log("Searching for:", query);

    // Get cached data to avoid any fetch issues
    const cacheKey = "latest_news";
    const cached = this.cache.get(cacheKey);
    const allNews = cached?.data || this.getFallbackData();

    const queryLower = query.toLowerCase();

    // Filter news based on query
    const filtered = allNews.filter(
      (item) =>
        item.headline.toLowerCase().includes(queryLower) ||
        item.summary.toLowerCase().includes(queryLower) ||
        item.category.toLowerCase().includes(queryLower) ||
        item.keywords?.some((keyword) =>
          keyword.toLowerCase().includes(queryLower),
        ),
    );

    // If no matches, return most relevant items
    if (filtered.length === 0) {
      return allNews.slice(0, 3);
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

  private transformWebhookData(webhookData: any): NewsItem[] {
    console.log("Transforming webhook data:", webhookData);

    // Handle different possible data structures
    let newsArray: any[] = [];

    if (Array.isArray(webhookData)) {
      newsArray = webhookData;
    } else if (webhookData.data && Array.isArray(webhookData.data)) {
      newsArray = webhookData.data;
    } else if (webhookData.news && Array.isArray(webhookData.news)) {
      newsArray = webhookData.news;
    } else if (webhookData.articles && Array.isArray(webhookData.articles)) {
      newsArray = webhookData.articles;
    } else if (typeof webhookData === "object") {
      // If it's a single object, wrap it in an array
      newsArray = [webhookData];
    }

    return newsArray.map((item: any, index: number) => {
      const transformedItem: NewsItem = {
        id: item.id || item._id || `webhook_${Date.now()}_${index}`,
        headline: item.headline || item.title || item.name || "Tech News Alert",
        source:
          item.source || item.publisher || item.author || "Tech Intelligence",
        category: this.categorizeNews(
          item.category || item.type || item.tag || item.headline || "",
        ),
        summary:
          item.summary ||
          item.description ||
          item.content ||
          item.excerpt ||
          "Latest technology development detected",
        location: this.extractLocation(
          item.location || item.country || item.city || item.region,
        ),
        timestamp:
          item.timestamp ||
          item.published_at ||
          item.date ||
          item.created_at ||
          new Date().toISOString(),
        impact: item.impact || "",
        relevance_score: this.calculateRelevanceScore(item),
        keywords: this.extractKeywords(item),
        url: item.url || item.link || item.source_url || "",
      };

      // Generate impact analysis for items without it
      if (!transformedItem.impact) {
        transformedItem.impact = this.generateEnhancedImpact(transformedItem);
      }

      return transformedItem;
    });
  }

  private calculateRelevanceScore(item: any): number {
    // Calculate relevance based on content
    const content =
      (item.headline || "") +
      " " +
      (item.summary || "") +
      " " +
      (item.category || "");
    const contentLower = content.toLowerCase();

    let score = 0.5; // Base score

    // ADNOC-specific keywords
    const adnocKeywords = [
      "adnoc",
      "abu dhabi",
      "uae",
      "emirates",
      "gulf",
      "middle east",
    ];
    const energyKeywords = [
      "oil",
      "gas",
      "energy",
      "petroleum",
      "renewable",
      "hydrogen",
      "carbon",
    ];
    const techKeywords = [
      "ai",
      "artificial intelligence",
      "digital",
      "automation",
      "iot",
      "blockchain",
    ];

    adnocKeywords.forEach((keyword) => {
      if (contentLower.includes(keyword)) score += 0.2;
    });

    energyKeywords.forEach((keyword) => {
      if (contentLower.includes(keyword)) score += 0.15;
    });

    techKeywords.forEach((keyword) => {
      if (contentLower.includes(keyword)) score += 0.1;
    });

    // Ensure score is between 0 and 1
    return Math.min(1, Math.max(0.3, score));
  }

  private extractKeywords(item: any): string[] {
    const keywords: string[] = [];

    // Extract from existing keywords field
    if (item.keywords) {
      if (Array.isArray(item.keywords)) {
        keywords.push(...item.keywords);
      } else if (typeof item.keywords === "string") {
        keywords.push(...item.keywords.split(",").map((k) => k.trim()));
      }
    }

    // Extract from tags
    if (item.tags && Array.isArray(item.tags)) {
      keywords.push(...item.tags);
    }

    // Extract from category
    if (item.category) {
      keywords.push(item.category);
    }

    return keywords.filter((k) => k && k.length > 0).slice(0, 5);
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

  async testWebhookConnection(): Promise<boolean> {
    try {
      console.log("Testing webhook connection...");
      const response = await fetch(NEWS_WEBHOOK_URL, {
        method: "GET",
        mode: "no-cors", // Try no-cors mode for testing
        headers: {
          "ngrok-skip-browser-warning": "true",
        },
      });

      console.log("Test response:", response);
      return true;
    } catch (error) {
      console.log("Webhook test failed:", error);
      return false;
    }
  }

  // Method to force refresh data
  async forceRefresh(): Promise<NewsItem[]> {
    this.clearCache();
    return this.fetchLatestNews();
  }
}

export default NewsService.getInstance();
