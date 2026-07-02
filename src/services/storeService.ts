import { createClient } from "@/utils/supabase/client";
import { Book, BookOrder } from "@/types";

/**
 * Fetches all published books for the store.
 */
export async function getPublishedBooks(): Promise<Book[]> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from('books')
    .select('*')
    .eq('is_published', true);
    
  if (error) {
    console.error("Error fetching books:", error);
    return [];
  }
  return data as Book[];
}

/**
 * Fetches all books for the admin panel.
 */
export async function getAllBooksAdmin(): Promise<Book[]> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from('books')
    .select('*')
    .order('created_at', { ascending: false });
    
  if (error) {
    console.error("Error fetching books for admin:", error);
    return [];
  }
  return data as Book[];
}

/**
 * Fetches book orders for the admin panel.
 */
export async function getBookOrdersAdmin(): Promise<BookOrder[]> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from('book_orders')
    .select('*, books(*), users(*)')
    .order('created_at', { ascending: false });
    
  if (error) {
    console.error("Error fetching book orders for admin:", error);
    return [];
  }
  return data as BookOrder[];
}
