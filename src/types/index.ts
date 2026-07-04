export type PricingType = 'ONE_TIME' | 'SUBSCRIPTION';

export interface Course {
  id: string;
  title: string;
  description?: string;
  image_url?: string;
  price: number;
  original_price?: number;
  pricing_type: PricingType;
  is_published: boolean;
  features?: string[];
  created_at: string;
}

export interface CourseModule {
  id: string;
  course_id: string;
  title: string;
  order_index: number;
  created_at: string;
  course_lessons?: CourseLesson[];
}

export interface CourseLesson {
  id: string;
  module_id: string;
  title: string;
  description?: string;
  duration_minutes: number;
  order_index: number;
  video_url?: string;
  attachment_title?: string;
  attachment_url?: string;
  is_locked: boolean;
  created_at: string;
}

export interface User {
  id: string;
  email: string;
  full_name: string;
  avatar_url?: string;
  phone?: string;
  role: 'ADMIN' | 'STUDENT';
  balance: number;
  created_at: string;
}

export interface Book {
  id: string;
  title: string;
  description?: string;
  image_url?: string;
  price_digital: number;
  price_physical: number;
  original_price?: number;
  format: 'DIGITAL' | 'PHYSICAL' | 'BOTH';
  is_published: boolean;
  created_at: string;
}

export interface BookOrder {
  id: string;
  user_id: string;
  book_id: string;
  format: 'DIGITAL' | 'PHYSICAL';
  amount: number;
  status: 'PENDING' | 'DELIVERED' | 'COMPLETED';
  shipping_address?: string;
  phone_number?: string;
  created_at: string;
  books?: Book; // Joined relation
  users?: User; // Joined relation
}

export interface LiveSession {
  id: string;
  title: string;
  description?: string;
  instructor_name: string;
  session_date: string;
  price: number;
  max_seats: number;
  level: 'BEGINNER' | 'INTERMEDIATE' | 'ADVANCED' | 'ALL';
  zoom_link?: string;
  session_type: 'PRIVATE' | 'REVIEW';
  is_published: boolean;
  created_at: string;
}

export interface SessionBooking {
  id: string;
  user_id: string;
  session_id: string;
  amount: number;
  created_at: string;
  live_sessions?: LiveSession; // Joined relation
  users?: User; // Joined relation
}
