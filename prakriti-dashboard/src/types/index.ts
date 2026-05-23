export interface User {
  id: number;
  name: string;
  contact: string;
  role: string;
  wallet_address?: string;
  balance?: number;
}

export interface WeeklyStats {
  ecoActions: number;
  activeTourists: number;
  certifiedBusinesses: number;
  complianceRate: number;
}

export interface Submission {
  id: number;
  user_id: number;
  title: string;
  location: string;
  status: "pending" | "approved" | "rejected";
  image?: string;
  scanned_image?: string;
  timestamp: string;
  reviewer_id?: number;
  remarks?: string;
  blockchain_tx?: string;
}

export interface BusinessApplication {
  id: number;
  business_id: number;
  description: string;
  checklist: Record<string, boolean>;
  photos: string[];
  status: "pending" | "approved" | "rejected";
  created_at: string;
}

export interface BCStats {
  blockchain_length: number;
  mining_difficulty: number;
  total_gp_circulation: number;
  pending_transactions: number;
}
