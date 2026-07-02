import { NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/client';

export async function GET() {
  const supabase = createClient();
  
  const { data: renewals, error: err1 } = await supabase.from('course_renewals').select('*');
  const { data: enrollments, error: err2 } = await supabase.from('enrollments').select('*').limit(10);
  
  return NextResponse.json({
    renewals,
    renewalsError: err1,
    enrollmentsSample: enrollments,
    enrollmentsError: err2
  });
}
