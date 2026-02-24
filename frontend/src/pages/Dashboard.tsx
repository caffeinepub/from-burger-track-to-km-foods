import { useNavigate } from '@tanstack/react-router';
import { ClipboardList, DollarSign, Users, TrendingUp, ArrowRight, Loader2 } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useGetAttendanceByDate } from '../hooks/useQueries';
import { useGetFinancialRecordsByRange } from '../hooks/useQueries';
import { useGetAllStaff } from '../hooks/useQueries';
import { Shift } from '../backend';
import { dateToBigIntNs, formatDateDisplay, formatCurrency } from '../lib/dateUtils';

export default function Dashboard() {
  const navigate = useNavigate();
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const todayNs = dateToBigIntNs(today);

  const { data: attendance = [], isLoading: loadingAttendance } = useGetAttendanceByDate(todayNs);
  const { data: financials = [], isLoading: loadingFinancials } = useGetFinancialRecordsByRange(todayNs, todayNs);
  const { data: allStaff = [], isLoading: loadingStaff } = useGetAllStaff();

  const morningPresent = attendance.filter(
    (a) => a.shift === Shift.morning && a.signInTime && !a.signOutTime
  ).length;
  const eveningPresent = attendance.filter(
    (a) => a.shift === Shift.evening && a.signInTime && !a.signOutTime
  ).length;
  const totalPresent = attendance.filter((a) => a.signInTime).length;

  const totalCashSales = financials.reduce((sum, r) => sum + Number(r.cashSales), 0);
  const totalOnlineSales = financials.reduce((sum, r) => sum + Number(r.onlineSales), 0);
  const totalCash = totalCashSales + totalOnlineSales;
  const totalExpenses = financials.reduce((sum, r) => sum + Number(r.expenses), 0);

  const activeStaff = allStaff.filter((s) => s.isActive).length;

  const isLoading = loadingAttendance || loadingFinancials || loadingStaff;

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-3xl font-black text-foreground tracking-tight">Dashboard</h2>
          <p className="text-charcoal-muted font-medium mt-1">{formatDateDisplay(today)}</p>
        </div>
        <div className="flex gap-3">
          <Button
            onClick={() => navigate({ to: '/attendance' })}
            className="bg-amber text-charcoal-dark hover:bg-amber-light font-bold gap-2"
          >
            <ClipboardList size={16} />
            Attendance
            <ArrowRight size={14} />
          </Button>
          <Button
            onClick={() => navigate({ to: '/sales' })}
            variant="outline"
            className="border-red-accent text-red-accent hover:bg-red-accent hover:text-white font-bold gap-2"
          >
            <DollarSign size={16} />
            Sales
            <ArrowRight size={14} />
          </Button>
        </div>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="animate-spin text-amber" size={40} />
        </div>
      ) : (
        <>
          {/* Staff Summary */}
          <section>
            <h3 className="text-sm font-bold uppercase tracking-widest text-charcoal-muted mb-3">
              Today's Attendance
            </h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <StatCard
                label="Total Present"
                value={totalPresent}
                icon={<Users size={20} />}
                accent="amber"
              />
              <StatCard
                label="Morning Shift"
                value={morningPresent}
                icon={<span className="text-lg">☀</span>}
                accent="amber"
                sub="Currently in"
              />
              <StatCard
                label="Evening Shift"
                value={eveningPresent}
                icon={<span className="text-lg">🌙</span>}
                accent="red"
                sub="Currently in"
              />
              <StatCard
                label="Active Staff"
                value={activeStaff}
                icon={<Users size={20} />}
                accent="gold"
                sub="Total registered"
              />
            </div>
          </section>

          {/* Financial Summary */}
          <section>
            <h3 className="text-sm font-bold uppercase tracking-widest text-charcoal-muted mb-3">
              Today's Financials
            </h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <StatCard
                label="Cash Sales"
                value={formatCurrency(totalCashSales)}
                icon={<DollarSign size={20} />}
                accent="amber"
              />
              <StatCard
                label="Online Sales"
                value={formatCurrency(totalOnlineSales)}
                icon={<TrendingUp size={20} />}
                accent="amber"
              />
              <StatCard
                label="Total Revenue"
                value={formatCurrency(totalCash)}
                icon={<DollarSign size={20} />}
                accent="gold"
                highlight
              />
              <StatCard
                label="Total Expenses"
                value={formatCurrency(totalExpenses)}
                icon={<DollarSign size={20} />}
                accent="red"
              />
            </div>
          </section>

          {/* Quick Actions */}
          <section>
            <h3 className="text-sm font-bold uppercase tracking-widest text-charcoal-muted mb-3">
              Quick Actions
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <QuickActionCard
                title="Record Attendance"
                description="Sign in or sign out staff members for today's shifts"
                icon={<ClipboardList size={24} />}
                accent="amber"
                onClick={() => navigate({ to: '/attendance' })}
              />
              <QuickActionCard
                title="Update Sales"
                description="Enter cash sales, online sales, and expenses per shift"
                icon={<DollarSign size={24} />}
                accent="red"
                onClick={() => navigate({ to: '/sales' })}
              />
              <QuickActionCard
                title="Manage Staff"
                description="Add new staff members or deactivate existing ones"
                icon={<Users size={24} />}
                accent="gold"
                onClick={() => navigate({ to: '/staff' })}
              />
            </div>
          </section>
        </>
      )}
    </div>
  );
}

function StatCard({
  label,
  value,
  icon,
  accent,
  sub,
  highlight,
}: {
  label: string;
  value: string | number;
  icon: React.ReactNode;
  accent: 'amber' | 'red' | 'gold';
  sub?: string;
  highlight?: boolean;
}) {
  const accentClass = {
    amber: 'text-amber',
    red: 'text-red-accent',
    gold: 'text-gold',
  }[accent];

  return (
    <Card className={`bg-card-surface border-charcoal-light ${highlight ? 'ring-2 ring-gold' : ''}`}>
      <CardContent className="p-4">
        <div className={`mb-2 ${accentClass}`}>{icon}</div>
        <div className={`text-2xl font-black ${accentClass}`}>{value}</div>
        <div className="text-sm font-semibold text-foreground mt-0.5">{label}</div>
        {sub && <div className="text-xs text-charcoal-muted mt-0.5">{sub}</div>}
      </CardContent>
    </Card>
  );
}

function QuickActionCard({
  title,
  description,
  icon,
  accent,
  onClick,
}: {
  title: string;
  description: string;
  icon: React.ReactNode;
  accent: 'amber' | 'red' | 'gold';
  onClick: () => void;
}) {
  const accentClass = {
    amber: 'text-amber group-hover:bg-amber',
    red: 'text-red-accent group-hover:bg-red-accent',
    gold: 'text-gold group-hover:bg-gold',
  }[accent];

  return (
    <button
      onClick={onClick}
      className="group text-left bg-card-surface border border-charcoal-light rounded-xl p-5 hover:border-amber transition-all duration-200 hover:shadow-lg hover:shadow-amber/10"
    >
      <div className={`w-10 h-10 rounded-lg bg-charcoal-light flex items-center justify-center mb-3 transition-colors ${accentClass}`}>
        {icon}
      </div>
      <h4 className="font-black text-foreground text-base">{title}</h4>
      <p className="text-sm text-charcoal-muted mt-1 leading-relaxed">{description}</p>
      <div className="flex items-center gap-1 mt-3 text-xs font-bold text-charcoal-muted group-hover:text-amber transition-colors">
        Open <ArrowRight size={12} />
      </div>
    </button>
  );
}
