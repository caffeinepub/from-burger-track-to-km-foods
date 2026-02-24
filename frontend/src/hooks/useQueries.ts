import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useActor } from './useActor';
import { Role, Shift } from '../backend';

// ─── Staff ───────────────────────────────────────────────────────────────────

export function useGetAllStaff() {
  const { actor, isFetching } = useActor();
  return useQuery({
    queryKey: ['staff'],
    queryFn: async () => {
      if (!actor) return [];
      return actor.getAllStaff();
    },
    enabled: !!actor && !isFetching,
  });
}

export function useAddStaff() {
  const { actor } = useActor();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ staffId, fullName, role }: { staffId: string; fullName: string; role: Role }) => {
      if (!actor) throw new Error('Actor not ready');
      return actor.addStaff(staffId, fullName, role);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['staff'] });
    },
    onError: (error: unknown) => {
      console.error('Failed to add staff:', error);
    },
  });
}

export function useDeactivateStaff() {
  const { actor } = useActor();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (staffId: string) => {
      if (!actor) throw new Error('Actor not ready');
      return actor.deactivateStaff(staffId);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['staff'] });
    },
    onError: (error: unknown) => {
      console.error('Failed to deactivate staff:', error);
    },
  });
}

// ─── Attendance ───────────────────────────────────────────────────────────────

export function useGetAttendanceByDate(date: bigint) {
  const { actor, isFetching } = useActor();
  return useQuery({
    queryKey: ['attendance', date.toString()],
    queryFn: async () => {
      if (!actor) return [];
      return actor.getAttendanceByDate(date);
    },
    enabled: !!actor && !isFetching,
  });
}

export function useRecordSignIn() {
  const { actor } = useActor();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ staffId, date, shift }: { staffId: string; date: bigint; shift: Shift }) => {
      if (!actor) throw new Error('Actor not ready');
      return actor.recordSignIn(staffId, date, shift);
    },
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['attendance', variables.date.toString()] });
    },
  });
}

export function useRecordSignOut() {
  const { actor } = useActor();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ staffId, date }: { staffId: string; date: bigint }) => {
      if (!actor) throw new Error('Actor not ready');
      return actor.recordSignOut(staffId, date);
    },
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['attendance', variables.date.toString()] });
    },
  });
}

// ─── Financial ────────────────────────────────────────────────────────────────

export function useGetFinancialRecordsByRange(startDate: bigint, endDate: bigint) {
  const { actor, isFetching } = useActor();
  return useQuery({
    queryKey: ['financial', startDate.toString(), endDate.toString()],
    queryFn: async () => {
      if (!actor) return [];
      return actor.getFinancialRecordsByRange(startDate, endDate);
    },
    enabled: !!actor && !isFetching,
  });
}

export function useUpdateFinancialRecord() {
  const { actor } = useActor();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({
      date,
      shift,
      cashSales,
      onlineSales,
      expenses,
    }: {
      date: bigint;
      shift: Shift;
      cashSales: bigint;
      onlineSales: bigint;
      expenses: bigint;
    }) => {
      if (!actor) throw new Error('Actor not ready');
      return actor.updateFinancialRecord(date, shift, cashSales, onlineSales, expenses);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['financial'] });
    },
  });
}
