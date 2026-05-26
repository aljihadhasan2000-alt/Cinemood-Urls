export interface LinkItem {
  id: string;
  title: string;
  url: string;
  clickCount?: number;
}

export interface Collection {
  id: string; // Slug code string
  title: string;
  description: string;
  links: LinkItem[];
  createdAt: string;
  views: number;
  isPasswordProtected: boolean;
  expiryTime: "none" | "1h" | "1d" | "7d";
  expiresAt: string | null;
  isPublic: boolean;
  enableQr: boolean;
  enableAnalytics: boolean;
  authorName?: string;
  password?: string;
}

export interface TrendingPage {
  id: string;
  title: string;
  description: string;
  views: number;
  linksCount: number;
  createdAt: string;
  authorName?: string;
}
