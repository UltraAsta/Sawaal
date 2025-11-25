import React, { createContext, useContext, useEffect, useState } from "react";
import { supabase } from "../initSupabase";

interface BookmarkContextType {
  bookmarkedQuizIds: Set<string>;
  isBookmarked: (quizId: string) => boolean;
  toggleBookmark: (quizId: string, userId: string) => Promise<void>;
  refreshBookmarks: (userId: string) => Promise<void>;
}

const BookmarkContext = createContext<BookmarkContextType | undefined>(undefined);

export function BookmarkProvider({ children }: { children: React.ReactNode }) {
  const [bookmarkedQuizIds, setBookmarkedQuizIds] = useState<Set<string>>(new Set());

  const isBookmarked = (quizId: string) => {
    return bookmarkedQuizIds.has(quizId);
  };

  const refreshBookmarks = async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from("saved_quizzes")
        .select("quiz_id")
        .eq("user_id", userId);

      if (error) {
        console.log(`Error fetching bookmarks: ${error.message}`);
        return;
      }

      const bookmarkedIds = new Set(data?.map((item) => item.quiz_id) || []);
      setBookmarkedQuizIds(bookmarkedIds);
    } catch (e: any) {
      console.log(e);
    }
  };

  const toggleBookmark = async (quizId: string, userId: string) => {
    const isCurrentlyBookmarked = bookmarkedQuizIds.has(quizId);

    // Optimistically update UI first for instant feedback
    if (isCurrentlyBookmarked) {
      setBookmarkedQuizIds((prev) => {
        const newSet = new Set(prev);
        newSet.delete(quizId);
        return newSet;
      });
    } else {
      setBookmarkedQuizIds((prev) => new Set(prev).add(quizId));
    }

    try {
      if (isCurrentlyBookmarked) {
        // Remove bookmark from database
        const { error: deleteError } = await supabase
          .from("saved_quizzes")
          .delete()
          .eq("quiz_id", quizId)
          .eq("user_id", userId);

        if (deleteError) {
          console.log(`Error removing bookmark: ${deleteError.message}`);
          // Revert optimistic update on error
          setBookmarkedQuizIds((prev) => new Set(prev).add(quizId));
          return;
        }

        console.log("Bookmark removed");
      } else {
        // Add bookmark to database
        const { error: insertError } = await supabase.from("saved_quizzes").insert({
          quiz_id: quizId,
          user_id: userId,
        });

        if (insertError) {
          console.log(`Error adding bookmark: ${insertError.message}`);
          // Revert optimistic update on error
          setBookmarkedQuizIds((prev) => {
            const newSet = new Set(prev);
            newSet.delete(quizId);
            return newSet;
          });
          return;
        }

        console.log("Bookmark added");
      }
    } catch (e: any) {
      console.log(e);
      // Revert optimistic update on error
      if (isCurrentlyBookmarked) {
        setBookmarkedQuizIds((prev) => new Set(prev).add(quizId));
      } else {
        setBookmarkedQuizIds((prev) => {
          const newSet = new Set(prev);
          newSet.delete(quizId);
          return newSet;
        });
      }
    }
  };

  return (
    <BookmarkContext.Provider
      value={{
        bookmarkedQuizIds,
        isBookmarked,
        toggleBookmark,
        refreshBookmarks,
      }}
    >
      {children}
    </BookmarkContext.Provider>
  );
}

export function useBookmarks() {
  const context = useContext(BookmarkContext);
  if (context === undefined) {
    throw new Error("useBookmarks must be used within a BookmarkProvider");
  }
  return context;
}
