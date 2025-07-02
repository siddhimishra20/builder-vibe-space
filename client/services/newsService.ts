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

const N8N_WORKFLOW_URL =
  "https://e0ca-5-195-220-7.ngrok-free.app/workflow/rF5r3qdhi8yAVGzQ";

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

    try {
      const response = await fetch(N8N_WORKFLOW_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "ngrok-skip-browser-warning": "true", // Skip ngrok warning page
        },
        body: JSON.stringify({
          action: "get_latest_news",
          limit: 10,
          categories: [
            "AI",
            "Energy Tech",
            "Robotics",
            "Energy Storage",
            "Quantum Computing",
          ],
        }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result: N8nResponse = await response.json();

      // Transform the data to match our interface
      const transformedData = this.transformNewsData(result.data || []);

      // Cache the result
      this.cache.set(cacheKey, {
        data: transformedData,
        timestamp: Date.now(),
      });

      return transformedData;
    } catch (error) {
      console.error("Error fetching news from n8n workflow:", error);

      // Return fallback data if the API is unavailable
      return this.getFallbackData();
    }
  }

  async searchNews(query: string): Promise<NewsItem[]> {
    try {
      const response = await fetch(N8N_WORKFLOW_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "ngrok-skip-browser-warning": "true",
        },
        body: JSON.stringify({
          action: "search_news",
          query: query,
          limit: 5,
        }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result: N8nResponse = await response.json();
      return this.transformNewsData(result.data || []);
    } catch (error) {
      console.error("Error searching news:", error);
      return [];
    }
  }

  async getImpactAnalysis(newsItem: NewsItem): Promise<string> {
    try {
      const response = await fetch(N8N_WORKFLOW_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "ngrok-skip-browser-warning": "true",
        },
        body: JSON.stringify({
          action: "analyze_impact",
          news_id: newsItem.id,
          headline: newsItem.headline,
          category: newsItem.category,
          summary: newsItem.summary,
        }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();
      return result.impact_analysis || this.generateFallbackImpact(newsItem);
    } catch (error) {
      console.error("Error getting impact analysis:", error);
      return this.generateFallbackImpact(newsItem);
    }
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

  private getFallbackData(): NewsItem[] {
    // Fallback data in case the n8n workflow is unavailable
    return [
      {
        id: "fallback_1",
        headline: "Microsoft Announces Major AI Infrastructure Investment",
        source: "Reuters",
        category: "AI",
        summary: "Microsoft commits $20B to new AI data centers across Europe",
        location: {
          lat: 52.52,
          lng: 13.405,
          city: "Berlin",
          country: "Germany",
        },
        timestamp: new Date().toISOString(),
        impact:
          "Potential partnership opportunities for ADNOC's digital transformation initiatives",
      },
      {
        id: "fallback_2",
        headline: "Saudi Arabia Launches New Green Hydrogen Initiative",
        source: "Bloomberg",
        category: "Energy Tech",
        summary: "NEOM announces $8.5B green hydrogen facility",
        location: {
          lat: 24.7136,
          lng: 46.6753,
          city: "Riyadh",
          country: "Saudi Arabia",
        },
        timestamp: new Date(Date.now() - 300000).toISOString(),
        impact:
          "Direct competition in renewable energy sector - strategic response needed",
      },
    ];
  }

  clearCache(): void {
    this.cache.clear();
  }
}

export default NewsService.getInstance();
