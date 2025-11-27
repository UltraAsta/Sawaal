export interface User {
  id: string;
  username: string;
  profile_photo_url: string;
  email: string;
  bio: string;
  role: UserRole;
  total_points?: number;
  current_rank: string;
  created_at: string;
  updated_at: string;
}

export enum UserRole {
  Student = 1,
  Tutor = 2,
}

export enum UserRank {
  RisingStar = "Rising Star",
  SmartCookie = "Smart Cookie",
  TriviaTitan = "Trivia Titan",
  KnowledgeNinja = "Knowledge Ninja",
  BrainBlaster = "Brain Blaster",
  QuizOverlord = "Quiz Overlord",
}

export interface LeaderboardUser {
  user_id: string;
  username: string;
  email: string;
  total_points: number;
  attempts_count: number;
  last_attempt_at?: string;
}
