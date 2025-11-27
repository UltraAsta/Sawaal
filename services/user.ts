// services/userService.ts
import { supabase } from "@/initSupabase";
import { LeaderboardUser, UserRank, type User } from "@/models/user";

export async function fetchCurrentUser(): Promise<User | null> {
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error) throw error;
  if (!user) return null;

  const { data, error: userError } = await supabase
    .from("users")
    .select("*")
    .eq("id", user.id)
    .single();

  if (userError) throw userError;
  return data as User;
}

export async function fetchTopLeaderboard(): Promise<LeaderboardUser[]> {
  const { data, error } = await supabase.from("top_users_by_points").select();

  if (error) throw error;

  return (data || []) as LeaderboardUser[];
}

export function assignRank(points: number): string {
  if (points <= 10) return UserRank.RisingStar;
  if (points > 10 && points <= 100) return UserRank.SmartCookie;
  if (points > 100 && points <= 1000) return UserRank.TriviaTitan;
  if (points > 1000 && points <= 10000) return UserRank.KnowledgeNinja;
  if (points > 10000 && points <= 99999) return UserRank.BrainBlaster;
  return UserRank.QuizOverlord;
}
