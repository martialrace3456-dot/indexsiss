export interface AdminSettings {
  id: string;
  key: string;
  value: string | boolean | number;
  updated_at: string;
}

export interface OverlayContent {
  id: string;
  position: 'board-cover' | 'top-banner' | 'bottom-banner' | 'corner-badge';
  content_type: 'image' | 'video';
  url: string;
  is_active: boolean;
  display_start: string | null;
  display_end: string | null;
  created_at: string;
  updated_at: string;
}

export interface Announcement {
  id: string;
  message: string;
  type: 'info' | 'warning' | 'success' | 'error';
  is_active: boolean;
  expires_at: string | null;
  created_at: string;
}

export interface ContestWithApproval {
  id: string;
  name: string;
  passcode_hash: string;
  duration_minutes: number;
  participant_limit: number;
  starts_at: string;
  ends_at: string;
  status: 'active' | 'expired';
  approval_status: 'pending' | 'approved' | 'rejected';
  admin_notes: string | null;
  created_at: string;
  participant_count?: number;
}

export interface GameAnalytics {
  totalGames: number;
  todayGames: number;
  weekGames: number;
  activeContests: number;
  uniquePlayers: number;
  averageScore: number;
  hourlyDistribution: { hour: number; count: number }[];
}
