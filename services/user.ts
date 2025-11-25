// services/userService.ts
import { supabase } from "@/initSupabase";
import type { User } from "@/models/user";

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
