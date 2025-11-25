export interface Question {
  id?: string;
  quiz_id: string;
  question_text: string;
  correct_answer: string;
  options: QuizOption[] | null;
  order_index: number;
  created_at?: string;
  updated_at?: string;
}

export type QuizOption = {
  id: string;
  text: string;
};

export interface QuizCategory {
  id: string;
  category_name: string;
  created_at: string;
  updated_at: string;
}

export interface QuizDifficulty {
  id: string;
  difficulty_name: string;
  created_at: string;
  updated_at: string;
}

export interface Quiz {
  id: string;
  title: string;
  description: string;
  is_public: boolean;
  is_ai_generated: boolean;
  total_attempts: number;
  created_at: string;
  updated_at: string;
  creator_id: string;
  category_id: string;
  difficulty_id: string;
  creator: {
    id: string;
    username: string;
    profile_photo_url: string;
  };
  category: {
    id: string;
    category_name: string;
  };
  difficulty: {
    id: string;
    difficulty_name: string;
  };
  questions: Question[];
}

export interface Comment {
  id: string;
  quiz_id: string;
  user_id: string;
  comment_text: string;
  created_at: string;
  user: {
    id: string;
    username: string;
    profile_photo_url: string;
  };
}

export interface Vote {
  id: string;
  quiz_id: string;
  user_id: string;
  vote_type: "upvote" | "downvote";
  created_at: string;
}

export interface QuizAttempt {
  id: string;
  user_id: string;
  quiz_id: string;
  score: number;
  total_questions: number;
  correct_answers: number;
  points_earned: number;
  time_taken: number;
  answers: (string | null)[];
  completed_at: string;
}

export interface QuizAttemptWithQuiz extends QuizAttempt {
  quiz: Quiz;
}
