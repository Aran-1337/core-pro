import { createClient } from "@/utils/supabase/client";
import { Course, CourseModule, CourseLesson } from "@/types";

/**
 * Fetches all published courses for the student view.
 */
export async function getPublishedCourses(): Promise<Course[]> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from('courses')
    .select('*')
    .eq('is_published', true);
    
  if (error) {
    console.error("Error fetching published courses:", error);
    return [];
  }
  return data as Course[];
}

/**
 * Fetches all courses for the admin view.
 */
export async function getAllCoursesAdmin(): Promise<Course[]> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from('courses')
    .select('*')
    .order('created_at', { ascending: false });
    
  if (error) {
    console.error("Error fetching admin courses:", error);
    return [];
  }
  return data as Course[];
}
