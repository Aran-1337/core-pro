"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import { createClient } from "@/utils/supabase/client";
import { getUpcomingSessions } from "@/services/liveSessionService";
import { LiveSession } from "@/types";
import { ResponsiveContainer, AreaChart, Area, XAxis, Tooltip } from 'recharts';



const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-surface-container-highest border border-white/10 p-3 rounded-lg shadow-lg text-sm z-20" dir="rtl">
        <div className="font-bold text-primary mb-1">{label}</div>
        <div className="text-on-surface">{payload[0].value.toLocaleString()} ج.م</div>
      </div>
    );
  }
  return null;
};

export default function AdminDashboardPage() {
  const [adminName, setAdminName] = useState("جاري التحميل...");
  const [chartRange, setChartRange] = useState<'30' | '90'>('90');
  const [pendingCount, setPendingCount] = useState(0);
  const [pendingStudentsCount, setPendingStudentsCount] = useState(0);
  const [totalStudents, setTotalStudents] = useState(0);
  const [totalRevenue, setTotalRevenue] = useState(0);
  const [totalCourses, setTotalCourses] = useState(0);
  const [totalBooksSold, setTotalBooksSold] = useState(0);
  const [totalEnrollments, setTotalEnrollments] = useState(0);
  const [studentsGrowth, setStudentsGrowth] = useState(0);
  const [revenueGrowth, setRevenueGrowth] = useState(0);
  
  const [upcomingSessions, setUpcomingSessions] = useState<LiveSession[]>([]);
  const [isSessionLive, setIsSessionLive] = useState(false);
  
  const [chartData90, setChartData90] = useState<any[]>([
    { name: 'JAN', value: 0 }, { name: 'FEB', value: 0 }, { name: 'MAR', value: 0 },
    { name: 'APR', value: 0 }, { name: 'MAY', value: 0 }, { name: 'JUN', value: 0 },
  ]);
  const [chartData30, setChartData30] = useState<any[]>([
    { name: 'الأسبوع ٤', value: 0 }, { name: 'الأسبوع ٣', value: 0 },
    { name: 'الأسبوع ٢', value: 0 }, { name: 'الأسبوع ١', value: 0 }
  ]);
  
  useEffect(() => {
    const fetchData = async () => {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { data } = await supabase.from('users').select('full_name').eq('id', user.id).single();
        if (data && data.full_name) {
          setAdminName(data.full_name);
        }
      }

      try {
        const { count: walletCount } = await supabase.from('wallet_requests').select('*', { count: 'exact', head: true }).eq('status', 'PENDING');
        const { count: bookCount } = await supabase.from('book_orders').select('*', { count: 'exact', head: true }).eq('status', 'PENDING');
        setPendingCount((walletCount || 0) + (bookCount || 0));

        const { count: studentCount } = await supabase.from('users').select('*', { count: 'exact', head: true }).eq('status', 'PENDING').eq('role', 'STUDENT');
        setPendingStudentsCount(studentCount || 0);

        const { count: activeStudentsCount } = await supabase.from('users').select('*', { count: 'exact', head: true }).eq('status', 'APPROVED').eq('role', 'STUDENT');
        setTotalStudents(activeStudentsCount || 0);

        const { count: coursesCount } = await supabase.from('courses').select('*', { count: 'exact', head: true });
        setTotalCourses(coursesCount || 0);

        const { count: booksSold } = await supabase.from('book_orders').select('*', { count: 'exact', head: true });
        setTotalBooksSold(booksSold || 0);

        const { count: enrollmentsCount } = await supabase.from('enrollments').select('*', { count: 'exact', head: true });
        setTotalEnrollments(enrollmentsCount || 0);

        // Fetch students growth rate
        const date30DaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();
        const date60DaysAgo = new Date(Date.now() - 60 * 24 * 60 * 60 * 1000).toISOString();

        const { count: currentMonthStudents } = await supabase
          .from('users')
          .select('*', { count: 'exact', head: true })
          .eq('role', 'STUDENT')
          .eq('status', 'APPROVED')
          .gte('created_at', date30DaysAgo);

        const { count: prevMonthStudents } = await supabase
          .from('users')
          .select('*', { count: 'exact', head: true })
          .eq('role', 'STUDENT')
          .eq('status', 'APPROVED')
          .gte('created_at', date60DaysAgo)
          .lt('created_at', date30DaysAgo);

        const sPrev = prevMonthStudents || 0;
        const sCurr = currentMonthStudents || 0;
        const sGrowth = sPrev === 0 ? (sCurr > 0 ? 100 : 0) : Math.round(((sCurr - sPrev) / sPrev) * 100);
        setStudentsGrowth(sGrowth);

        const { data: approvedWallets } = await supabase.from('wallet_requests').select('amount, created_at').eq('status', 'APPROVED');
        if (approvedWallets) {
          const rev = approvedWallets.reduce((acc, curr) => acc + (curr.amount || 0), 0);
          setTotalRevenue(rev);

          // Calculate Dynamic Chart Data & Revenue Growth
          const now = new Date();
          const date30Ms = Date.now() - 30 * 24 * 60 * 60 * 1000;
          const date60Ms = Date.now() - 60 * 24 * 60 * 60 * 1000;

          let currentMonthRevenue = 0;
          let prevMonthRevenue = 0;

          approvedWallets.forEach(req => {
            const reqTime = new Date(req.created_at).getTime();
            if (reqTime >= date30Ms) {
              currentMonthRevenue += Number(req.amount || 0);
            } else if (reqTime >= date60Ms && reqTime < date30Ms) {
              prevMonthRevenue += Number(req.amount || 0);
            }
          });

          const rPrev = prevMonthRevenue || 0;
          const rGrowth = rPrev === 0 ? (currentMonthRevenue > 0 ? 100 : 0) : Math.round(((currentMonthRevenue - rPrev) / rPrev) * 100);
          setRevenueGrowth(rGrowth);
          
          // Data for 90 days (Last 6 months)
          const monthsData: any[] = [];
          for (let i = 5; i >= 0; i--) {
            const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
            const monthName = d.toLocaleString('en-US', { month: 'short' }).toUpperCase();
            monthsData.push({ name: monthName, value: 0, month: d.getMonth(), year: d.getFullYear() });
          }
          
          // Data for 30 days (Last 4 weeks)
          const weeksData = [
            { name: 'الأسبوع ٤', value: 0 }, // Oldest
            { name: 'الأسبوع ٣', value: 0 },
            { name: 'الأسبوع ٢', value: 0 },
            { name: 'الأسبوع ١', value: 0 }, // Newest
          ];
          const oneWeek = 7 * 24 * 60 * 60 * 1000;

          approvedWallets.forEach(req => {
            const date = new Date(req.created_at);
            
            // Populate monthsData
            const monthMatch = monthsData.find(m => m.month === date.getMonth() && m.year === date.getFullYear());
            if (monthMatch) {
              monthMatch.value += (req.amount || 0);
            }

            // Populate weeksData
            const diffTime = now.getTime() - date.getTime();
            if (diffTime >= 0 && diffTime < 4 * oneWeek) {
              const weekIndex = Math.floor(diffTime / oneWeek); // 0 = Week 1 (newest), 3 = Week 4 (oldest)
              if (weekIndex >= 0 && weekIndex < 4) {
                weeksData[3 - weekIndex].value += (req.amount || 0);
              }
            }
          });

          setChartData90(monthsData);
          setChartData30(weeksData);

          // Fetch next live session
          const sessions = await getUpcomingSessions(3);
          if (sessions && sessions.length > 0) {
            setUpcomingSessions(sessions);
            // Check if the closest one is currently live (within 2 hours of start time)
            const closestSessionTime = new Date(sessions[0].session_date).getTime();
            const nowTime = now.getTime();
            const twoHoursMs = 2 * 60 * 60 * 1000;
            if (nowTime >= closestSessionTime && nowTime <= closestSessionTime + twoHoursMs) {
              setIsSessionLive(true);
            }
          }
        }

      } catch (err) {
        // Silent catch for tables not existing yet
      }
    };
    fetchData();
  }, []);

  const [logs, setLogs] = useState<string[]>([
    "> Admin session started...",
    "> Backup completed: 04:00 AM",
    "> New enrollment: Student #9422",
    "> Unauthorized access attempt blocked [IP: 192.168.1.1]"
  ]);

  return (
    <main className="pt-28 pb-12 px-container-margin max-w-7xl mx-auto min-h-screen">
      {/* Header handled by layout, but we could have a secondary admin header here if needed */}
      
      {/* KPI Dashboard Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4 mb-8">
        
        {/* KPI 1: Students */}
        <div className="glass-card p-6 rounded-xl flex flex-col justify-between hover:-translate-y-1 hover:border-primary/30 hover:shadow-[0_0_15px_rgba(0,210,255,0.1)] transition-all duration-300">
          <div className="flex justify-between items-start mb-4">
            <div className="p-2 bg-primary/10 rounded-lg">
              <span className="material-symbols-outlined text-primary">groups</span>
            </div>
            <span className={`text-xs font-bold flex items-center gap-1 ${studentsGrowth >= 0 ? 'text-secondary' : 'text-error'}`}>
              <span className="material-symbols-outlined text-xs">{studentsGrowth >= 0 ? 'trending_up' : 'trending_down'}</span>
              {studentsGrowth >= 0 ? `+${studentsGrowth}` : studentsGrowth}%
            </span>
          </div>
          <div>
            <div className="text-on-surface-variant text-[11px] font-medium mb-1">إجمالي الطلاب</div>
            <div className="text-2xl font-bold font-label-caps text-on-surface">{totalStudents.toLocaleString('ar-EG')}</div>
          </div>
        </div>

        {/* KPI 2: Revenue */}
        <div className="glass-card p-6 rounded-xl flex flex-col justify-between border-r-2 border-r-primary-container hover:-translate-y-1 hover:border-primary/30 hover:shadow-[0_0_15px_rgba(0,210,255,0.1)] transition-all duration-300">
          <div className="flex justify-between items-start mb-4">
            <div className="p-2 bg-primary-container/20 rounded-lg">
              <span className="material-symbols-outlined text-primary-container">payments</span>
            </div>
            <span className={`text-xs font-bold flex items-center gap-1 ${revenueGrowth >= 0 ? 'text-secondary' : 'text-error'}`}>
              <span className="material-symbols-outlined text-xs">{revenueGrowth >= 0 ? 'trending_up' : 'trending_down'}</span>
              {revenueGrowth >= 0 ? `+${revenueGrowth}` : revenueGrowth}%
            </span>
          </div>
          <div>
            <div className="text-on-surface-variant text-[11px] font-medium mb-1">إجمالي الأرباح (EGP)</div>
            <div className="text-2xl font-bold font-label-caps text-on-surface">{totalRevenue.toLocaleString()}</div>
          </div>
        </div>

        {/* KPI 3: Courses */}
        <div className="glass-card p-6 rounded-xl flex flex-col justify-between hover:-translate-y-1 hover:border-primary/30 hover:shadow-[0_0_15px_rgba(0,210,255,0.1)] transition-all duration-300">
          <div className="flex justify-between items-start mb-4">
            <div className="p-2 bg-tertiary/10 rounded-lg">
              <span className="material-symbols-outlined text-tertiary">menu_book</span>
            </div>
            <div className="text-on-surface-variant text-xs">نشط حالياً</div>
          </div>
          <div>
            <div className="text-on-surface-variant text-[11px] font-medium mb-1">الكورسات المتاحة</div>
            <div className="text-2xl font-bold font-label-caps text-on-surface">{totalCourses.toLocaleString('ar-EG')}</div>
          </div>
        </div>

        {/* KPI 4: Pending Orders */}
        <div className="glass-card p-6 rounded-xl flex flex-col justify-between hover:-translate-y-1 hover:border-primary/30 hover:shadow-[0_0_15px_rgba(0,210,255,0.1)] transition-all duration-300">
          <div className="flex justify-between items-start mb-4">
            <div className="p-2 bg-error/10 rounded-lg">
              <span className="material-symbols-outlined text-error">shopping_cart_checkout</span>
            </div>
            {pendingCount > 0 && <span className="flex h-2 w-2 rounded-full bg-error animate-pulse"></span>}
          </div>
          <div>
            <div className="text-on-surface-variant text-[11px] font-medium mb-1">الطلبات المعلقة</div>
            <div className="text-2xl font-bold font-label-caps text-on-surface">{pendingCount.toLocaleString('ar-EG')}</div>
          </div>
        </div>

        {/* KPI 5: Book Sales */}
        <div className="glass-card p-4 rounded-xl flex flex-col justify-between hover:-translate-y-1 hover:border-primary/30 hover:shadow-[0_0_15px_rgba(0,210,255,0.1)] transition-all duration-300">
          <div className="flex justify-between items-start mb-4">
            <div className="p-2 bg-secondary/10 rounded-lg">
              <span className="material-symbols-outlined text-secondary">import_contacts</span>
            </div>
          </div>
          <div>
            <div className="text-on-surface-variant text-[11px] font-medium mb-1">الكتب المباعة</div>
            <div className="text-2xl font-bold font-label-caps text-on-surface">{totalBooksSold.toLocaleString('ar-EG')}</div>
          </div>
        </div>

        {/* KPI 6: Course Enrollments */}
        <div className="glass-card p-4 rounded-xl flex flex-col justify-between hover:-translate-y-1 hover:border-primary/30 hover:shadow-[0_0_15px_rgba(0,210,255,0.1)] transition-all duration-300">
          <div className="flex justify-between items-start mb-4">
            <div className="p-2 bg-tertiary/10 rounded-lg">
              <span className="material-symbols-outlined text-tertiary">how_to_reg</span>
            </div>
          </div>
          <div>
            <div className="text-on-surface-variant text-[11px] font-medium mb-1">تسجيلات الكورسات</div>
            <div className="text-2xl font-bold font-label-caps text-on-surface">{totalEnrollments.toLocaleString('ar-EG')}</div>
          </div>
        </div>

      </div>

      {/* Main Section Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* Sidebar: Navigation/Quick Access */}
        <aside className="lg:col-span-3 flex flex-col gap-4">
          <h3 className="text-on-surface-variant font-bold text-xs uppercase tracking-widest px-2 mb-2">التحكم السريع</h3>
          
          <Link href="/admin/students" className="group flex items-center justify-between p-4 glass-card rounded-xl border-r-4 border-r-primary hover:-translate-y-1 transition-all">
            <div className="flex items-center gap-3">
              <span className="material-symbols-outlined text-primary group-hover:scale-110 transition-transform">groups</span>
              <span className="font-medium text-on-surface">إدارة الطلاب</span>
            </div>
            <div className="flex items-center gap-2">
              {pendingStudentsCount > 0 && (
                <span className="bg-error text-white text-[10px] font-bold px-2 py-0.5 rounded-full animate-in fade-in zoom-in">
                  {pendingStudentsCount}
                </span>
              )}
              <span className="material-symbols-outlined text-on-surface-variant text-sm">chevron_left</span>
            </div>
          </Link>
          
          <Link href="/admin/courses" className="group flex items-center justify-between p-4 glass-card rounded-xl hover:-translate-y-1 transition-all">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-lg bg-surface-container-highest border border-white/5 flex items-center justify-center group-hover:bg-primary/20 transition-colors">
                <span className="material-symbols-outlined text-primary">school</span>
              </div>
              <div className="text-right">
                <div className="font-bold text-on-surface">إدارة الكورسات</div>
                <div className="text-xs text-on-surface-variant">رفع الدروس وتسعيرها</div>
              </div>
            </div>
            <span className="material-symbols-outlined text-on-surface-variant group-hover:text-primary transition-colors">chevron_left</span>
          </Link>

          <Link href="/admin/books" className="group flex items-center justify-between p-4 glass-card rounded-xl hover:-translate-y-1 transition-all">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-lg bg-surface-container-highest border border-white/5 flex items-center justify-center group-hover:bg-primary/20 transition-colors">
                <span className="material-symbols-outlined text-primary">menu_book</span>
              </div>
              <div className="text-right">
                <div className="font-bold text-on-surface">إدارة الكتب</div>
                <div className="text-xs text-on-surface-variant">إضافة الكتب ورفع الـ PDF</div>
              </div>
            </div>
            <span className="material-symbols-outlined text-on-surface-variant group-hover:text-primary transition-colors">chevron_left</span>
          </Link>
          
          <Link href="/admin/orders" className="group flex items-center justify-between p-4 glass-card rounded-xl hover:-translate-y-1 transition-all">
            <div className="flex items-center gap-3">
              <span className="material-symbols-outlined text-on-surface-variant group-hover:text-primary transition-colors">receipt_long</span>
              <span className="font-medium text-on-surface">الطلبات والمحفظة</span>
            </div>
            <div className="flex items-center gap-2">
              {pendingCount > 0 && (
                <span className="bg-error text-white text-[10px] font-bold px-2 py-0.5 rounded-full animate-in fade-in zoom-in">
                  {pendingCount}
                </span>
              )}
              <span className="material-symbols-outlined text-on-surface-variant text-sm">chevron_left</span>
            </div>
          </Link>
          
          <Link href="/admin/live" className="group flex items-center justify-between p-4 glass-card rounded-xl hover:-translate-y-1 transition-all">
            <div className="flex items-center gap-3">
              <span className="material-symbols-outlined text-on-surface-variant group-hover:text-primary transition-colors">live_tv</span>
              <span className="font-medium text-on-surface">الحصص المباشرة</span>
            </div>
            <span className="bg-error text-on-error px-2 py-0.5 rounded text-[10px] font-bold">LIVE</span>
          </Link>

          <Link href="/admin/reviews" className="group flex items-center justify-between p-4 glass-card rounded-xl hover:-translate-y-1 transition-all">
            <div className="flex items-center gap-3">
              <span className="material-symbols-outlined text-on-surface-variant group-hover:text-primary transition-colors">reviews</span>
              <span className="font-medium text-on-surface">آراء الطلاب</span>
            </div>
            <span className="material-symbols-outlined text-on-surface-variant text-sm">chevron_left</span>
          </Link>

          <Link href="/admin/settings" className="group flex items-center justify-between p-4 glass-card rounded-xl hover:-translate-y-1 transition-all">
            <div className="flex items-center gap-3">
              <span className="material-symbols-outlined text-on-surface-variant group-hover:text-primary transition-colors">settings</span>
              <span className="font-medium text-on-surface">الإعدادات وطرق الدفع</span>
            </div>
            <span className="material-symbols-outlined text-on-surface-variant text-sm">chevron_left</span>
          </Link>

          <Link href="/admin/tracking" className="group flex items-center justify-between p-4 glass-card rounded-xl hover:-translate-y-1 transition-all border border-primary/20 bg-primary/5">
            <div className="flex items-center gap-3">
              <span className="material-symbols-outlined text-primary group-hover:scale-110 transition-transform">radar</span>
              <span className="font-medium text-on-surface">مراقبة الزوار (IP)</span>
            </div>
            <span className="material-symbols-outlined text-primary text-sm">chevron_left</span>
          </Link>

          {/* Terminal-style log */}
          <div className="mt-4 glass-card rounded-xl overflow-hidden border border-white/5" dir="ltr">
            <div className="bg-surface-container-high px-4 py-2 flex items-center">
              <div className="flex gap-2">
                <div className="w-3 h-3 bg-[#ff5f56] rounded-full"></div>
                <div className="w-3 h-3 bg-[#ffbd2e] rounded-full"></div>
                <div className="w-3 h-3 bg-[#27c93f] rounded-full"></div>
              </div>
              <div className="flex-1 text-center pr-16">
                <span className="text-[10px] font-code-sm text-on-surface-variant uppercase tracking-widest">System_Log</span>
              </div>
            </div>
            <div className="p-4 font-code-sm text-code-sm bg-[#05070a] min-h-[150px] text-left">
              {logs.map((log, i) => (
                <div key={i} className={`${i === logs.length - 1 ? 'text-error/80' : 'text-primary/80'} mb-1 leading-relaxed`}>
                  {log}
                </div>
              ))}
              <div className="animate-pulse inline-block w-2 h-4 bg-primary align-middle ml-1 mt-0.5"></div>
            </div>
          </div>
        </aside>

        {/* Main Content: Charts & Lists */}
        <div className="lg:col-span-9 space-y-8">
          
          {/* Revenue Chart Simulation */}
          <div className="glass-card rounded-2xl p-8 relative overflow-hidden">
            <div className="flex justify-between items-center mb-8 relative z-10">
              <div>
                <h2 className="text-xl font-bold text-on-surface mb-1">نمو الأرباح الشهرية</h2>
                <p className="text-on-surface-variant text-sm">تحليل مالي للربع الحالي من عام ٢٠٢٤</p>
              </div>
              <div className="flex gap-2">
                <button 
                  onClick={() => setChartRange('30')}
                  className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all ${chartRange === '30' ? 'bg-primary text-on-primary shadow-[0_0_10px_rgba(0,210,255,0.3)]' : 'bg-surface-container-high border border-white/10 hover:bg-white/5 text-on-surface-variant'}`}>
                  ٣٠ يوم
                </button>
                <button 
                  onClick={() => setChartRange('90')}
                  className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all ${chartRange === '90' ? 'bg-primary text-on-primary shadow-[0_0_10px_rgba(0,210,255,0.3)]' : 'bg-surface-container-high border border-white/10 hover:bg-white/5 text-on-surface-variant'}`}>
                  ٩٠ يوم
                </button>
              </div>
            </div>
            <div className="h-64 w-full relative" dir="ltr">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={chartRange === '90' ? chartData90 : chartData30} margin={{ top: 20, right: 10, left: 10, bottom: 0 }}>
                  <defs>
                    <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#00d2ff" stopOpacity={0.4}/>
                      <stop offset="95%" stopColor="#00d2ff" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <XAxis dataKey="name" stroke="#ffffff40" fontSize={10} tickMargin={10} axisLine={false} tickLine={false} />
                  <Tooltip content={<CustomTooltip />} cursor={{ stroke: '#00d2ff', strokeWidth: 1, strokeDasharray: '5 5' }} />
                  <Area type="monotone" dataKey="value" stroke="#00d2ff" strokeWidth={3} fillOpacity={1} fill="url(#colorValue)" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Bottom Section: Top Instructors & Live Status */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            
            {/* Instructor Settings / Single Instructor Model */}
            <div className="glass-card rounded-2xl p-6">
              <div className="flex justify-between items-center mb-6">
                <h3 className="font-bold text-lg text-on-surface">حساب المحاضر الرئيسي</h3>
              </div>
              
              <div className="flex items-center justify-between bg-surface-container-low p-4 rounded-xl border border-white/5">
                <div className="flex items-center gap-4">
                  <div className="w-14 h-14 rounded-xl border-2 border-primary/30 overflow-hidden relative group">
                    <div className="w-full h-full bg-surface-container-highest flex items-center justify-center text-primary">
                      <span className="material-symbols-outlined text-2xl">person</span>
                    </div>
                  </div>
                  <div>
                    <div className="font-bold text-base text-on-surface">{adminName}</div>
                    <div className="text-xs text-on-surface-variant mt-1">المدير العام والمحاضر</div>
                  </div>
                </div>
                <div className="text-left">
                  <Link href="/admin/settings" className="inline-block p-2 bg-surface-container-highest hover:bg-primary/20 text-primary rounded-lg transition-colors">
                    <span className="material-symbols-outlined text-sm">edit</span>
                  </Link>
                </div>
              </div>
            </div>

            {/* Live Sessions Status */}
            <div className="glass-card rounded-2xl p-6 relative overflow-hidden">
              <div className="flex justify-between items-center mb-6">
                <h3 className="font-bold text-lg text-on-surface">الحصص المباشرة الآن</h3>
                <div className="flex items-center gap-2">
                  <span className={`h-2 w-2 rounded-full animate-pulse ${isSessionLive ? 'bg-green-500' : 'bg-error'}`}></span>
                  <span className={`${isSessionLive ? 'text-green-500' : 'text-error'} text-xs font-bold`}>
                    {isSessionLive ? 'جاري البث الآن' : 'لا يوجد بث حالياً'}
                  </span>
                </div>
              </div>
              <div className="space-y-4">
                {upcomingSessions.length > 0 ? (
                  upcomingSessions.map((session, idx) => {
                    const sessionTime = new Date(session.session_date).getTime();
                    const nowTime = new Date().getTime();
                    const twoHoursMs = 2 * 60 * 60 * 1000;
                    const isThisSessionLive = nowTime >= sessionTime && nowTime <= sessionTime + twoHoursMs;

                    return (
                      <div key={session.id} className="flex items-center justify-between bg-surface-container-low p-4 rounded-xl border border-white/5">
                        <div className="flex items-center gap-4">
                          <div className={`w-14 h-14 rounded-xl border-2 overflow-hidden relative flex items-center justify-center ${isThisSessionLive ? 'border-green-500/50 bg-green-500/10 text-green-500' : 'border-primary/30 bg-surface-container-highest text-primary'}`}>
                            <span className={`material-symbols-outlined text-2xl ${isThisSessionLive ? 'animate-pulse' : ''}`}>
                              {isThisSessionLive ? 'sensors' : 'event'}
                            </span>
                          </div>
                          <div>
                            <div className="font-bold text-base text-on-surface">{session.title}</div>
                            <div className="text-xs text-on-surface-variant mt-1" dir="ltr">
                              {new Date(session.session_date).toLocaleString('ar-EG', { dateStyle: 'short', timeStyle: 'short' })}
                            </div>
                            {isThisSessionLive && (
                              <a href={session.zoom_link} target="_blank" rel="noreferrer" className="inline-block mt-2 px-3 py-1 bg-green-500/20 text-green-500 hover:bg-green-500 hover:text-white rounded text-[10px] font-bold transition-colors">
                                دخول البث المباشر
                              </a>
                            )}
                          </div>
                        </div>
                        <div className="text-left">
                          <Link href="/admin/live" className="inline-block p-2 bg-surface-container-highest hover:bg-primary/20 text-primary rounded-lg transition-colors">
                            <span className="material-symbols-outlined text-sm">edit</span>
                          </Link>
                        </div>
                      </div>
                    );
                  })
                ) : (
                  <div className="p-4 rounded-xl border border-dashed border-white/10 flex flex-col items-center justify-center py-8 text-center">
                    <span className="material-symbols-outlined text-3xl text-on-surface-variant mb-2 opacity-30">videocam_off</span>
                    <p className="text-on-surface-variant text-sm font-medium">لا توجد حصص مجدولة</p>
                  </div>
                )}
              </div>
              {/* Abstract graphic background */}
              <div className="absolute -bottom-10 -left-10 w-40 h-40 bg-primary/5 rounded-full blur-3xl pointer-events-none"></div>
            </div>

          </div>

        </div>
      </div>
    </main>
  );
}
