import { useState, useMemo } from 'react';
import { Loader2, LogIn, LogOut, Calendar } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';
import { Shift } from '../backend';
import { useGetAllStaff, useGetAttendanceByDate, useRecordSignIn, useRecordSignOut } from '../hooks/useQueries';
import { dateToBigIntNs, formatDateInput, parseDateInput, formatDateDisplay, formatTime } from '../lib/dateUtils';
import ShiftBadge from '../components/ShiftBadge';
import RoleBadge from '../components/RoleBadge';

type ShiftFilter = 'all' | 'morning' | 'evening';

export default function Attendance() {
  const [selectedDate, setSelectedDate] = useState<Date>(() => {
    const d = new Date();
    d.setHours(0, 0, 0, 0);
    return d;
  });
  const [shiftFilter, setShiftFilter] = useState<ShiftFilter>('all');
  const [signingIn, setSigningIn] = useState<Record<string, Shift | null>>({});

  const dateNs = dateToBigIntNs(selectedDate);

  const { data: allStaff = [], isLoading: loadingStaff } = useGetAllStaff();
  const { data: attendance = [], isLoading: loadingAttendance } = useGetAttendanceByDate(dateNs);
  const signIn = useRecordSignIn();
  const signOut = useRecordSignOut();

  const activeStaff = allStaff.filter((s) => s.isActive);

  const attendanceMap = useMemo(() => {
    const map: Record<string, typeof attendance[0]> = {};
    attendance.forEach((a) => { map[a.staffId] = a; });
    return map;
  }, [attendance]);

  const filteredStaff = activeStaff.filter((s) => {
    if (shiftFilter === 'all') return true;
    const record = attendanceMap[s.staffId];
    if (!record) return false;
    return record.shift === (shiftFilter === 'morning' ? Shift.morning : Shift.evening);
  });

  const handleSignIn = async (staffId: string) => {
    const shift = signingIn[staffId];
    if (!shift) {
      toast.error('Please select a shift before signing in');
      return;
    }
    try {
      await signIn.mutateAsync({ staffId, date: dateNs, shift });
      toast.success('Sign-in recorded!');
      setSigningIn((prev) => ({ ...prev, [staffId]: null }));
    } catch {
      toast.error('Failed to record sign-in');
    }
  };

  const handleSignOut = async (staffId: string) => {
    try {
      await signOut.mutateAsync({ staffId, date: dateNs });
      toast.success('Sign-out recorded!');
    } catch {
      toast.error('Failed to record sign-out');
    }
  };

  const isLoading = loadingStaff || loadingAttendance;

  const presentCount = attendance.filter((a) => a.signInTime).length;
  const morningCount = attendance.filter((a) => a.shift === Shift.morning).length;
  const eveningCount = attendance.filter((a) => a.shift === Shift.evening).length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-3xl font-black text-foreground tracking-tight">Daily Attendance</h2>
          <p className="text-charcoal-muted font-medium mt-1">{formatDateDisplay(selectedDate)}</p>
        </div>
        <div className="flex items-center gap-2">
          <Calendar size={16} className="text-charcoal-muted" />
          <Input
            type="date"
            value={formatDateInput(selectedDate)}
            onChange={(e) => {
              if (e.target.value) setSelectedDate(parseDateInput(e.target.value));
            }}
            className="bg-card-surface border-charcoal-light text-foreground focus:border-amber w-auto"
          />
        </div>
      </div>

      {/* Summary Chips */}
      <div className="flex flex-wrap gap-3">
        <div className="bg-card-surface border border-charcoal-light rounded-lg px-4 py-2 text-sm font-bold">
          <span className="text-charcoal-muted">Present: </span>
          <span className="text-amber">{presentCount}</span>
        </div>
        <div className="bg-card-surface border border-charcoal-light rounded-lg px-4 py-2 text-sm font-bold">
          <span className="text-charcoal-muted">☀ Morning: </span>
          <span className="text-amber">{morningCount}</span>
        </div>
        <div className="bg-card-surface border border-charcoal-light rounded-lg px-4 py-2 text-sm font-bold">
          <span className="text-charcoal-muted">🌙 Evening: </span>
          <span className="text-red-accent">{eveningCount}</span>
        </div>
      </div>

      {/* Shift Filter */}
      <Tabs value={shiftFilter} onValueChange={(v) => setShiftFilter(v as ShiftFilter)}>
        <TabsList className="bg-charcoal border border-charcoal-light">
          <TabsTrigger value="all" className="data-[state=active]:bg-amber data-[state=active]:text-charcoal-dark font-bold">
            All Shifts
          </TabsTrigger>
          <TabsTrigger value="morning" className="data-[state=active]:bg-amber data-[state=active]:text-charcoal-dark font-bold">
            ☀ Morning
          </TabsTrigger>
          <TabsTrigger value="evening" className="data-[state=active]:bg-red-accent data-[state=active]:text-white font-bold">
            🌙 Evening
          </TabsTrigger>
        </TabsList>
      </Tabs>

      {/* Attendance Table */}
      {isLoading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="animate-spin text-amber" size={36} />
        </div>
      ) : activeStaff.length === 0 ? (
        <Card className="bg-card-surface border-charcoal-light">
          <CardContent className="py-12 text-center">
            <p className="text-charcoal-muted font-semibold">No active staff members found</p>
            <p className="text-sm text-charcoal-muted mt-1">Add staff members in the Staff Management page first</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-2">
          {(shiftFilter === 'all' ? activeStaff : filteredStaff.length > 0 ? filteredStaff : activeStaff).map((staff) => {
            const record = attendanceMap[staff.staffId];
            const hasSignedIn = !!record?.signInTime;
            const hasSignedOut = !!record?.signOutTime;
            const pendingShift = signingIn[staff.staffId];

            return (
              <Card key={staff.staffId} className="bg-card-surface border-charcoal-light hover:border-amber/40 transition-colors">
                <CardContent className="p-4">
                  <div className="flex flex-col sm:flex-row sm:items-center gap-4">
                    {/* Staff Info */}
                    <div className="flex items-center gap-3 flex-1 min-w-0">
                      <div className="w-10 h-10 rounded-full bg-charcoal-light flex items-center justify-center text-amber font-black text-lg flex-shrink-0">
                        {staff.fullName.charAt(0).toUpperCase()}
                      </div>
                      <div className="min-w-0">
                        <p className="font-bold text-foreground">{staff.fullName}</p>
                        <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                          <RoleBadge role={staff.role} size="sm" />
                          {record && <ShiftBadge shift={record.shift} size="sm" />}
                        </div>
                      </div>
                    </div>

                    {/* Times */}
                    <div className="flex items-center gap-4 text-sm">
                      <div className="text-center">
                        <p className="text-xs text-charcoal-muted font-semibold uppercase tracking-wide">Sign In</p>
                        <p className={`font-bold ${hasSignedIn ? 'text-amber' : 'text-charcoal-muted'}`}>
                          {hasSignedIn ? formatTime(record.signInTime) : '—'}
                        </p>
                      </div>
                      <div className="text-center">
                        <p className="text-xs text-charcoal-muted font-semibold uppercase tracking-wide">Sign Out</p>
                        <p className={`font-bold ${hasSignedOut ? 'text-red-accent' : 'text-charcoal-muted'}`}>
                          {hasSignedOut ? formatTime(record.signOutTime!) : '—'}
                        </p>
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-2 flex-shrink-0">
                      {!hasSignedIn && (
                        <>
                          <Select
                            value={pendingShift ?? ''}
                            onValueChange={(v) =>
                              setSigningIn((prev) => ({ ...prev, [staff.staffId]: v as Shift }))
                            }
                          >
                            <SelectTrigger className="w-32 bg-charcoal border-charcoal-light text-foreground text-xs focus:border-amber h-8">
                              <SelectValue placeholder="Shift..." />
                            </SelectTrigger>
                            <SelectContent className="bg-charcoal border-charcoal-light">
                              <SelectItem value={Shift.morning} className="text-foreground">☀ Morning</SelectItem>
                              <SelectItem value={Shift.evening} className="text-foreground">🌙 Evening</SelectItem>
                            </SelectContent>
                          </Select>
                          <Button
                            size="sm"
                            onClick={() => handleSignIn(staff.staffId)}
                            disabled={signIn.isPending || !pendingShift}
                            className="bg-amber text-charcoal-dark hover:bg-amber-light font-bold h-8 gap-1"
                          >
                            {signIn.isPending ? <Loader2 size={12} className="animate-spin" /> : <LogIn size={12} />}
                            In
                          </Button>
                        </>
                      )}
                      {hasSignedIn && !hasSignedOut && (
                        <Button
                          size="sm"
                          onClick={() => handleSignOut(staff.staffId)}
                          disabled={signOut.isPending}
                          className="bg-red-accent text-white hover:bg-red-accent/80 font-bold h-8 gap-1"
                        >
                          {signOut.isPending ? <Loader2 size={12} className="animate-spin" /> : <LogOut size={12} />}
                          Sign Out
                        </Button>
                      )}
                      {hasSignedIn && hasSignedOut && (
                        <span className="text-xs font-bold text-charcoal-muted bg-charcoal-light px-3 py-1.5 rounded-lg">
                          ✓ Completed
                        </span>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
