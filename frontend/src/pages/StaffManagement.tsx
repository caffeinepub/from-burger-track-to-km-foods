import { useState } from 'react';
import { UserPlus, Loader2, UserX, Search } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { toast } from 'sonner';
import { Role } from '../backend';
import { useGetAllStaff, useAddStaff, useDeactivateStaff } from '../hooks/useQueries';
import { generateStaffId } from '../lib/dateUtils';
import RoleBadge from '../components/RoleBadge';

export default function StaffManagement() {
  const { data: allStaff = [], isLoading } = useGetAllStaff();
  const addStaffMutation = useAddStaff();
  const deactivate = useDeactivateStaff();

  const [name, setName] = useState('');
  const [role, setRole] = useState<Role>(Role.staff);
  const [search, setSearch] = useState('');

  const activeStaff = allStaff.filter((s) => s.isActive);
  const inactiveStaff = allStaff.filter((s) => !s.isActive);

  const filtered = activeStaff.filter((s) =>
    s.fullName.toLowerCase().includes(search.toLowerCase())
  );

  const handleAdd = async () => {
    const trimmedName = name.trim();
    if (!trimmedName) {
      toast.error('Please enter a staff name');
      return;
    }
    const staffId = generateStaffId();
    try {
      await addStaffMutation.mutateAsync({ staffId, fullName: trimmedName, role });
      toast.success(`${trimmedName} added successfully!`);
      setName('');
      setRole(Role.staff);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : String(err);
      if (message.includes('duplicate') || message.includes('already exists')) {
        toast.error('A staff member with this ID already exists. Please try again.');
      } else {
        toast.error('Failed to add staff member. Please try again.');
      }
    }
  };

  const handleDeactivate = async (staffId: string, fullName: string) => {
    try {
      await deactivate.mutateAsync(staffId);
      toast.success(`${fullName} has been deactivated`);
    } catch {
      toast.error('Failed to deactivate staff member');
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-black text-foreground tracking-tight">Staff Management</h2>
        <p className="text-charcoal-muted font-medium mt-1">
          {activeStaff.length} active member{activeStaff.length !== 1 ? 's' : ''}
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Add Staff Form */}
        <Card className="bg-card-surface border-charcoal-light lg:col-span-1">
          <CardHeader className="pb-4">
            <CardTitle className="flex items-center gap-2 text-amber font-black">
              <UserPlus size={20} />
              Add New Staff
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-1.5">
              <Label className="text-sm font-bold text-foreground">Full Name</Label>
              <Input
                placeholder="Enter full name..."
                value={name}
                onChange={(e) => setName(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleAdd()}
                className="bg-charcoal border-charcoal-light text-foreground placeholder:text-charcoal-muted focus:border-amber"
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-sm font-bold text-foreground">Role</Label>
              <Select value={role} onValueChange={(v) => setRole(v as Role)}>
                <SelectTrigger className="bg-charcoal border-charcoal-light text-foreground focus:border-amber">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-charcoal border-charcoal-light">
                  <SelectItem value={Role.staff} className="text-foreground hover:bg-charcoal-light">
                    Staff Member
                  </SelectItem>
                  <SelectItem value={Role.manager} className="text-foreground hover:bg-charcoal-light">
                    Manager
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>
            <Button
              onClick={handleAdd}
              disabled={addStaffMutation.isPending || !name.trim()}
              className="w-full bg-amber text-charcoal-dark hover:bg-amber-light font-black"
            >
              {addStaffMutation.isPending ? (
                <><Loader2 size={16} className="animate-spin mr-2" /> Adding...</>
              ) : (
                <><UserPlus size={16} className="mr-2" /> Add Staff Member</>
              )}
            </Button>
          </CardContent>
        </Card>

        {/* Staff List */}
        <div className="lg:col-span-2 space-y-4">
          <div className="relative">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-charcoal-muted" />
            <Input
              placeholder="Search staff..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9 bg-card-surface border-charcoal-light text-foreground placeholder:text-charcoal-muted focus:border-amber"
            />
          </div>

          {isLoading ? (
            <div className="flex items-center justify-center py-16">
              <Loader2 className="animate-spin text-amber" size={36} />
            </div>
          ) : filtered.length === 0 ? (
            <Card className="bg-card-surface border-charcoal-light">
              <CardContent className="py-12 text-center">
                <p className="text-charcoal-muted font-semibold">
                  {search ? 'No staff found matching your search' : 'No active staff members yet'}
                </p>
                <p className="text-sm text-charcoal-muted mt-1">Add your first staff member using the form</p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-2">
              {filtered.map((staff) => (
                <Card key={staff.staffId} className="bg-card-surface border-charcoal-light hover:border-amber/50 transition-colors">
                  <CardContent className="p-4 flex items-center justify-between gap-4">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-10 h-10 rounded-full bg-charcoal-light flex items-center justify-center text-amber font-black text-lg flex-shrink-0">
                        {staff.fullName.charAt(0).toUpperCase()}
                      </div>
                      <div className="min-w-0">
                        <p className="font-bold text-foreground truncate">{staff.fullName}</p>
                        <p className="text-xs text-charcoal-muted font-mono truncate">{staff.staffId}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3 flex-shrink-0">
                      <RoleBadge role={staff.role} />
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="text-charcoal-muted hover:text-red-accent hover:bg-red-accent/10"
                          >
                            <UserX size={16} />
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent className="bg-card-surface border-charcoal-light">
                          <AlertDialogHeader>
                            <AlertDialogTitle className="text-foreground font-black">Deactivate Staff Member</AlertDialogTitle>
                            <AlertDialogDescription className="text-charcoal-muted">
                              Are you sure you want to deactivate <strong className="text-foreground">{staff.fullName}</strong>? They will no longer appear in active staff lists.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel className="bg-charcoal border-charcoal-light text-foreground hover:bg-charcoal-light">
                              Cancel
                            </AlertDialogCancel>
                            <AlertDialogAction
                              onClick={() => handleDeactivate(staff.staffId, staff.fullName)}
                              className="bg-red-accent text-white hover:bg-red-accent/80 font-bold"
                            >
                              Deactivate
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}

          {inactiveStaff.length > 0 && (
            <p className="text-xs text-charcoal-muted text-center pt-2">
              {inactiveStaff.length} deactivated member{inactiveStaff.length !== 1 ? 's' : ''} hidden
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
