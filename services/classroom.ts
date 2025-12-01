import { supabase } from "@/initSupabase";
import { Classroom } from "@/models/classroom";
import { Quiz } from "@/models/quiz";
import * as Crypto from "expo-crypto";

export function generateClassroomJoinCode(): string {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
  const bytes = Crypto.getRandomBytes(6);

  return Array.from(bytes)
    .map((b: number) => chars[b % chars.length])
    .join("");
}

export async function createClassroom(classroom: Classroom, quizIds?: string[]): Promise<string> {
  const { data, error } = await supabase
    .from("classroom")
    .insert([
      {
        creator_id: classroom.creator.id,
        name: classroom.name,
        description: classroom.description,
        code: classroom.code,
      },
    ])
    .select()
    .single();

  if (error) throw error;

  // Add quizzes to classroom if any were provided
  if (quizIds && quizIds.length > 0 && data) {
    const classroomQuizzes = quizIds.map((quizId) => ({
      classroom_id: data.id,
      quiz_id: quizId,
    }));

    const { error: quizzesError } = await supabase
      .from("classroom_quizzes")
      .insert(classroomQuizzes);

    if (quizzesError) {
      console.error("Failed to add quizzes to classroom:", quizzesError);
    }
  }

  return data.id;
}

export async function fetchClassroomById(classroomId: string): Promise<Classroom> {
  const { data, error } = await supabase
    .from("classroom")
    .select(
      `
      *,
      creator:users!creator_id(id, username, profile_photo_url)
    `
    )
    .eq("id", classroomId)
    .single();

  if (error) throw error;
  return data as Classroom;
}

export async function fetchClassroomQuizzes(classroomId: string): Promise<Quiz[]> {
  const { data, error } = await supabase
    .from("quizzes")
    .select(
      `
        *,
        category:quiz_categories!category_id(id, category_name),
        difficulty:quiz_difficulty!difficulty_id(id, difficulty_name)
    `
    )
    .eq("classroom_id", classroomId);

  if (error) throw error;

  return (data || []).map((quiz: any) => ({
    ...quiz,
    category: Array.isArray(quiz.category) ? quiz.category[0] : quiz.category,
    difficulty: Array.isArray(quiz.difficulty) ? quiz.difficulty[0] : quiz.difficulty,
  })) as Quiz[];
}

export async function fetchUserClassrooms(userId: string): Promise<Classroom[]> {
  const { data, error } = await supabase
    .from("classroom")
    .select(
      `
      *,
      creator:users!creator_id(id, username, profile_photo_url)
    `
    )
    .eq("creator_id", userId)
    .order("created_at", { ascending: false });

  if (error) throw error;
  return data as Classroom[];
}

export async function updateClassroom(
  classroomId: string,
  updates: { name: string; description: string }
): Promise<void> {
  const { error } = await supabase
    .from("classroom")
    .update({
      name: updates.name,
      description: updates.description,
    })
    .eq("id", classroomId);

  if (error) throw error;
}

export async function deleteClassroom(classroomId: string): Promise<void> {
  const { error } = await supabase.from("classroom").delete().eq("id", classroomId);

  if (error) throw error;
}

export async function addQuizzesToClassroom(classroomId: string, quizIds: string[]): Promise<void> {
  // First verify the quizzes exist
  const { data: existingQuizzes, error: fetchError } = await supabase
    .from("quizzes")
    .select("id, classroom_id")
    .in("id", quizIds);

  console.log("Existing quizzes:", existingQuizzes);

  if (fetchError) throw fetchError;

  // Now update each quiz
  for (const quizId of quizIds) {
    const { data, error } = await supabase
      .from("quizzes")
      .update({ classroom_id: classroomId, is_practice: true })
      .eq("id", quizId)
      .select();

    console.log("Update result:", { quizId, classroomId, data, error });

    if (error) throw error;
  }
}

export async function removeQuizFromClassroom(classroomId: string, quizId: string): Promise<void> {
  const { error } = await supabase
    .from("quizzes")
    .update({ classroom_id: null, is_practice: false })
    .eq("id", quizId)
    .eq("classroom_id", classroomId);

  if (error) throw error;
}

export async function joinClassroomByCode(userId: string, code: string): Promise<Classroom> {
  // Find classroom by code
  const { data: classroom, error: classroomError } = await supabase
    .from("classroom")
    .select(
      `
      *,
      creator:users!creator_id(id, username, profile_photo_url)
    `
    )
    .eq("code", code.toUpperCase())
    .single();

  if (classroomError) {
    if (classroomError.code === "PGRST116") {
      throw new Error("Invalid classroom code");
    }
    throw classroomError;
  }

  // Check if already a member
  const { data: existingMember } = await supabase
    .from("classroom_students")
    .select("id")
    .eq("classroom_id", classroom.id)
    .eq("student_id", userId)
    .single();

  if (existingMember) {
    throw new Error("You are already a member of this classroom");
  }

  // Add student to classroom
  const { error: joinError } = await supabase.from("classroom_students").insert({
    classroom_id: classroom.id,
    student_id: userId,
  });

  if (joinError) throw joinError;

  return classroom as Classroom;
}

export async function fetchStudentClassrooms(userId: string): Promise<Classroom[]> {
  const { data, error } = await supabase
    .from("classroom_students")
    .select(
      `
      classroom_id,
      classroom:classroom_id (
        *,
        creator:users!creator_id(id, username, profile_photo_url)
      )
    `
    )
    .eq("student_id", userId)
    .order("joined_at", { ascending: false });

  if (error) throw error;

  return (data || []).map((item: any) => item.classroom).filter(Boolean) as Classroom[];
}

export async function leaveClassroom(classroomId: string, userId: string): Promise<void> {
  const { error } = await supabase
    .from("classroom_students")
    .delete()
    .eq("classroom_id", classroomId)
    .eq("student_id", userId);

  if (error) throw error;
}

export interface ClassroomLeaderboardEntry {
  student_id: string;
  username: string;
  profile_photo_url: string;
  total_points: number;
  quizzes_completed: number;
  rank: number;
}

export async function fetchClassroomLeaderboard(
  classroomId: string
): Promise<ClassroomLeaderboardEntry[]> {
  // Get all students in the classroom
  const { data: students, error: studentsError } = await supabase
    .from("classroom_students")
    .select(
      `
      student_id,
      users:student_id (id, username, profile_photo_url)
    `
    )
    .eq("classroom_id", classroomId);

  if (studentsError) throw studentsError;

  // Calculate stats for each student by joining quiz_attempts with quizzes
  const leaderboard: ClassroomLeaderboardEntry[] = await Promise.all(
    (students || []).map(async (student: any) => {
      // Fetch attempts for quizzes in this classroom using a join
      const { data: attempts } = await supabase
        .from("quiz_attempts")
        .select(
          `
          points_earned,
          quiz_id,
          quizzes!inner(classroom_id)
        `
        )
        .eq("user_id", student.student_id)
        .eq("quizzes.classroom_id", classroomId);

      const totalPoints = (attempts || []).reduce(
        (sum: number, attempt: any) => sum + (attempt.points_earned || 0),
        0
      );
      const quizzesCompleted = new Set((attempts || []).map((a: any) => a.quiz_id)).size;

      return {
        student_id: student.student_id,
        username: student.users.username,
        profile_photo_url: student.users.profile_photo_url,
        total_points: totalPoints,
        quizzes_completed: quizzesCompleted,
        rank: 0,
      };
    })
  );

  // Sort by points and assign ranks
  leaderboard.sort((a, b) => b.total_points - a.total_points);
  leaderboard.forEach((entry, index) => {
    entry.rank = index + 1;
  });

  return leaderboard;
}

export async function countStudentsClassroom(classroomId: string): Promise<number> {
  const { data, error } = await supabase
    .from("classroom_students")
    .select("*")
    .eq("classroom_id", classroomId);

  if (error) throw error;

  return data.length;
}
