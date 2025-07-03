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

const NEWS_API_URL = "/api/news"; // Use Express proxy instead of direct webhook

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

    // First, try to get real data from the database via Express proxy
    try {
      console.log("Attempting to fetch data via proxy:", NEWS_API_URL);

      const requestHeaders = {
        Accept: "application/json",
        "Cache-Control": "no-cache",
      };

      // Wrap fetch in try-catch to handle network failures
      let response: Response;
      try {
        // Use Promise.race for timeout with shorter duration for better UX
        const fetchPromise = fetch(NEWS_API_URL, {
          method: "GET",
          headers: requestHeaders,
        });

        const timeoutPromise = new Promise<never>((_, reject) =>
          setTimeout(
            () => reject(new Error("Webhook timeout after 5 minutes")),
            300000,
          ),
        );

        response = await Promise.race([fetchPromise, timeoutPromise]);
        console.log("Proxy response received, status:", response.status);
      } catch (fetchError) {
        console.warn(
          "Fetch failed - likely network or server issue:",
          fetchError,
        );
        throw new Error("Network error - using demo data");
      }

      if (response.ok) {
        // Check content type first
        const contentType = response.headers.get("content-type");
        console.log("Response content type:", contentType);
        console.log("Response status:", response.status);

        // Get response as text first to debug
        const responseText = await response.text();
        console.log("Raw response text:", responseText);
        console.log("Response text length:", responseText.length);

        if (!responseText || responseText.trim().length === 0) {
          console.warn("Empty response from database");
          throw new Error("Empty response from database");
        }

        let rawData;
        try {
          rawData = JSON.parse(responseText);
          console.log("Successfully parsed JSON data:", rawData);
        } catch (parseError) {
          console.error("JSON parse error:", parseError);
          console.error(
            "Failed to parse response:",
            responseText.substring(0, 500),
          );

          // Check if it's HTML (error page)
          if (
            responseText.includes("<html>") ||
            responseText.includes("<!DOCTYPE")
          ) {
            throw new Error(
              "Received HTML instead of JSON - webhook may be returning error page",
            );
          }

          throw new Error(`Invalid JSON response: ${parseError.message}`);
        }

        // Handle empty webhook responses
        if (rawData && rawData.status === "empty_response") {
          console.warn("Webhook returned empty response - using fallback data");
          throw new Error("Empty webhook response");
        }

        // Transform the webhook data to our format
        const transformedData = this.transformWebhookData(rawData);

        if (transformedData.length > 0) {
          console.log(
            "Successfully transformed",
            transformedData.length,
            "news items",
          );
          // Cache the real data
          this.cache.set(cacheKey, {
            data: transformedData,
            timestamp: Date.now(),
          });

          return transformedData;
        } else {
          console.warn(
            "No valid news items after transformation - using fallback",
          );
          throw new Error("No valid news items");
        }
      } else {
        console.warn(
          "Database responded with error:",
          response.status,
          response.statusText,
        );

        // Try to get error details from proxy
        try {
          const errorData = await response.json();
          console.warn("Proxy error details:", errorData);

          if (errorData.error) {
            throw new Error(`Proxy error: ${errorData.error}`);
          }
        } catch (e) {
          console.warn("Could not read proxy error response");
        }
      }
    } catch (error) {
      console.warn(
        "Data fetch failed, using demo data:",
        error instanceof Error ? error.message : "Unknown error",
      );

      // Don't log as error since this is expected behavior when webhook is unavailable
      if (error instanceof Error) {
        if (error.message.includes("timeout")) {
          console.log(
            "→ Timeout occurred after 5 minutes - webhook may need more time",
          );
        } else if (error.message.includes("Network error")) {
          console.log("→ Network/server connection issue");
        } else if (error.message.includes("Failed to fetch")) {
          console.log("→ Express server may not be responding");
        } else {
          console.log("→ Other connection issue");
        }
      }
    }

    // Only use fallback data as last resort
    console.warn(
      "Using fallback data - webhook connection failed or timed out",
    );
    const fallbackData = this.getFallbackData();

    // Cache fallback data with shorter duration to retry sooner (1 minute for timeouts)
    this.cache.set(cacheKey, {
      data: fallbackData,
      timestamp: Date.now() - this.CACHE_DURATION * 0.8, // Retry in 1 minute instead of 5
    });

    return fallbackData;
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
    console.log("Webhook data type:", typeof webhookData);

    if (!webhookData) {
      console.warn("Webhook data is null or undefined");
      return [];
    }

    // Handle different possible data structures
    let newsArray: any[] = [];

    if (Array.isArray(webhookData)) {
      console.log("Data is array with", webhookData.length, "items");
      newsArray = webhookData;
    } else if (webhookData.data && Array.isArray(webhookData.data)) {
      console.log("Data.data is array with", webhookData.data.length, "items");
      newsArray = webhookData.data;
    } else if (webhookData.news && Array.isArray(webhookData.news)) {
      console.log("Data.news is array with", webhookData.news.length, "items");
      newsArray = webhookData.news;
    } else if (webhookData.articles && Array.isArray(webhookData.articles)) {
      console.log(
        "Data.articles is array with",
        webhookData.articles.length,
        "items",
      );
      newsArray = webhookData.articles;
    } else if (webhookData.items && Array.isArray(webhookData.items)) {
      console.log(
        "Data.items is array with",
        webhookData.items.length,
        "items",
      );
      newsArray = webhookData.items;
    } else if (typeof webhookData === "object" && webhookData !== null) {
      // If it's a single object, wrap it in an array
      console.log("Single object, wrapping in array");
      newsArray = [webhookData];
    } else {
      console.warn(
        "Unrecognized data structure:",
        Object.keys(webhookData || {}),
      );
      return [];
    }

    if (newsArray.length === 0) {
      console.warn("News array is empty");
      return [];
    }

    console.log("Processing", newsArray.length, "items");

    const transformedItems = newsArray
      .map((item: any, index: number) => {
        try {
          console.log(`Processing item ${index + 1}:`, item);

          const transformedItem: NewsItem = {
            id: item.id || item._id || `webhook_${Date.now()}_${index}`,
            headline:
              item.headline || item.title || item.name || "Tech News Alert",
            source:
              item.source ||
              item.publisher ||
              item.author ||
              "Tech Intelligence",
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
            transformedItem.impact =
              this.generateEnhancedImpact(transformedItem);
          }

          console.log(
            `Successfully transformed item ${index + 1}:`,
            transformedItem.headline,
          );
          return transformedItem;
        } catch (error) {
          console.error(`Error transforming item ${index + 1}:`, error, item);
          return null;
        }
      })
      .filter((item): item is NewsItem => item !== null);

    console.log(
      `Successfully transformed ${transformedItems.length} out of ${newsArray.length} items`,
    );
    return transformedItems;
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
