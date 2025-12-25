import { supabase } from "@/initSupabase";
import { Question, Quiz, QuizAttempt, QuizAttemptWithQuiz, Vote } from "@/models/quiz";

export async function fetchUserQuizzes(user_id: string): Promise<Quiz[]> {
  const { data, error } = await supabase
    .from("quizzes")
    .select(
      `
            *,
            creator:creator_id(id, username, profile_photo_url),
            category:category_id(id, category_name),
            difficulty:difficulty_id(id, difficulty_name),
            questions(id, question_text, options)
            `
    )
    .eq("creator_id", user_id);

  if (error) throw error;

  return data;
}

export async function fetchSavedQuizzes(user_id: string): Promise<Quiz[]> {
  const { data, error } = await supabase
    .from("saved_quizzes")
    .select(
      `
        quiz_id,
        quizzes (
          *,
          creator:creator_id(id, username, profile_photo_url),
          category:category_id(id, category_name),
          difficulty:difficulty_id(id, difficulty_name),
          questions(id, question_text, options)
        )
        `
    )
    .eq("user_id", user_id);

  if (error) throw error;

  // Extract the quiz data from the nested structure
  const quizzes = data?.map((item: any) => item.quizzes).filter(Boolean) || [];
  return quizzes;
}

export async function fetchUserQuizAttempts(user_id: string): Promise<QuizAttemptWithQuiz[]> {
  const { data, error } = await supabase
    .from("quiz_attempts")
    .select(
      `
        id,
        quiz_id,
        score,
        total_questions,
        correct_answers,
        points_earned,
        time_taken,
        completed_at,
        answers,
        quizzes (
          *,
          creator:creator_id(id, username, profile_photo_url),
          category:category_id(id, category_name),
          difficulty:difficulty_id(id, difficulty_name),
          questions(id, question_text, options)
        )
        `
    )
    .eq("user_id", user_id)
    .order("completed_at", { ascending: false });

  if (error) throw error;

  // Transform the data to match our interface
  const attempts: QuizAttemptWithQuiz[] =
    data?.map((item: any) => ({
      id: item.id,
      user_id: user_id,
      quiz_id: item.quiz_id,
      score: item.score,
      total_questions: item.total_questions,
      correct_answers: item.correct_answers,
      points_earned: item.points_earned,
      time_taken: item.time_taken,
      answers: item.answers,
      completed_at: item.completed_at,
      quiz: item.quizzes,
    })) || [];

  return attempts;
}

export async function fetchQuizById(quiz_id: string): Promise<Quiz | null> {
  const { data, error } = await supabase
    .from("quizzes")
    .select(
      `
        *,
        creator:creator_id(id, username, profile_photo_url),
        category:category_id(id, category_name),
        difficulty:difficulty_id(id, difficulty_name),
        questions(*)
        `
    )
    .eq("id", quiz_id)
    .single();

  console.log(data);
  if (error) throw error;

  // Sort questions by order_index
  if (data && data.questions) {
    data.questions.sort((a: Question, b: Question) => a.order_index - b.order_index);
  }

  return data;
}

export async function fetchQuizAttemptByUserAndQuiz(
  user_id: string,
  quiz_id: string
): Promise<QuizAttempt | null> {
  const { data, error } = await supabase
    .from("quiz_attempts")
    .select("*")
    .eq("quiz_id", quiz_id)
    .eq("user_id", user_id)
    .order("completed_at", { ascending: false })
    .limit(1)
    .single();

  if (error && error.code !== "PGRST116") throw error;

  return data;
}

export async function fetchQuizAttempts(quiz_id: string): Promise<number> {
  const { data, error } = await supabase.from("quiz_attempts").select("*").eq("quiz_id", quiz_id);

  if (error && error.code !== "PGRST116") throw error;

  return data!.length;
}

export async function fetchQuizComments(quiz_id: string): Promise<Comment[]> {
  const { data, error } = await supabase
    .from("comments")
    .select(
      `
        id,
        quiz_id,
        user_id,
        comment_text,
        created_at,
        user:user_id(id, username, profile_photo_url)
        `
    )
    .eq("quiz_id", quiz_id)
    .order("created_at", { ascending: false });

  if (error) throw error;

  return (
    data?.map((item: any) => ({
      ...item,
      user: item.user[0], // Extract the first user object from the array
    })) || []
  );
}

export async function createComment(params: {
  quiz_id: string;
  user_id: string;
  comment_text: string;
}): Promise<void> {
  const { error } = await supabase.from("comments").insert({
    quiz_id: params.quiz_id,
    user_id: params.user_id,
    comment_text: params.comment_text,
  });

  if (error) throw error;
}

export async function fetchQuizVotes(quiz_id: string): Promise<Vote[]> {
  const { data, error } = await supabase
    .from("votes")
    .select("id, quiz_id, user_id, vote_type, created_at")
    .eq("quiz_id", quiz_id);

  if (error) throw error;
  return data || [];
}

export async function createVote(params: {
  quiz_id: string;
  user_id: string;
  vote_type: "upvote" | "downvote";
}): Promise<void> {
  const { error } = await supabase.from("votes").insert({
    quiz_id: params.quiz_id,
    user_id: params.user_id,
    vote_type: params.vote_type,
  });

  if (error) throw error;
}

export async function updateVote(params: {
  id: string;
  vote_type: "upvote" | "downvote";
}): Promise<void> {
  const { error } = await supabase
    .from("votes")
    .update({ vote_type: params.vote_type })
    .eq("id", params.id);

  if (error) throw error;
}

export async function deleteVote(id: string): Promise<void> {
  const { error } = await supabase.from("votes").delete().eq("id", id);
  if (error) throw error;
}

export async function deleteQuiz(quizId: string): Promise<void> {
  const { error } = await supabase.from("quizzes").delete().eq("id", quizId);
  if (error) throw error;
}

export async function updateQuiz(
  quizId: string,
  quizData: {
    title: string;
    description: string;
    category_id: string;
    difficulty_id: string;
    is_public: boolean;
    is_ai_generated: boolean;
  }
): Promise<void> {
  const { error } = await supabase.from("quizzes").update(quizData).eq("id", quizId);
  if (error) throw error;
}

export async function updateQuestions(
  quizId: string,
  questions: Partial<Question>[]
): Promise<void> {
  // Delete existing questions for this quiz
  const { error: deleteError } = await supabase.from("questions").delete().eq("quiz_id", quizId);
  if (deleteError) throw deleteError;

  // Insert new questions
  const questionsData = questions.map((q, index) => ({
    quiz_id: quizId,
    question_text: q.question_text,
    options: q.options,
    correct_answer: q.correct_answer,
    order_index: index,
  }));

  const { error: insertError } = await supabase.from("questions").insert(questionsData);
  if (insertError) throw insertError;
}

export async function fetchCreatorQuizzes(creatorId: string): Promise<Quiz[]> {
  const { data, error } = await supabase
    .from("quizzes")
    .select(
      `
      *,
      category:quiz_categories!category_id(id, category_name),
      difficulty:quiz_difficulty!difficulty_id(id, difficulty_name)
    `
    )
    .eq("creator_id", creatorId)
    .order("created_at", { ascending: false });

  if (error) throw error;

  // Transform the data to ensure category and difficulty are objects, not arrays
  const transformedData = (data || []).map((quiz: any) => ({
    ...quiz,
    category: Array.isArray(quiz.category) ? quiz.category[0] : quiz.category,
    difficulty: Array.isArray(quiz.difficulty) ? quiz.difficulty[0] : quiz.difficulty,
  }));

  return transformedData as Quiz[];
}
