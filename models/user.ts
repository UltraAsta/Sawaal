export interface User {
  id: string;
  username: string;
  profile_photo_url: string;
  email: string;
  bio: string;
  role: Student | Tutor;
  total_points: number;
  current_rank: string;
  created_at: string;
  updated_at: string;
}

export type Student = 1;
export type Tutor = 2;
