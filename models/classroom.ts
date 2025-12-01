import { Quiz } from "./quiz";
import { User } from "./user";

export interface Classroom {
  id: string;
  name: string;
  description: string;
  creator: User;
  quizzes?: Quiz[];
  code: string;
  created_at: string;
}
