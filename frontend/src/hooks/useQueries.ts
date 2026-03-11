import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useActor } from './useActor';
import type { UserProfile, EmployeeProfile, LeaveBalance, LeaveRequest, Payslip, Letter, EmployeeDetails, BulkEmployeeRecord, EmployeeRecord } from '../backend';

// User Profile Queries
export function useGetCallerUserProfile() {
  const { actor, isFetching: actorFetching } = useActor();

  const query = useQuery<UserProfile | null>({
    queryKey: ['currentUserProfile'],
    queryFn: async () => {
      if (!actor) throw new Error('Actor not available');
      const profile = await actor.getCallerUserProfile();
      return profile;
    },
    enabled: !!actor && !actorFetching,
    retry: false,
  });

  return {
    ...query,
    isLoading: actorFetching || query.isLoading,
    isFetched: !!actor && query.isFetched,
  };
}

export function useSaveCallerUserProfile() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (profile: UserProfile) => {
      if (!actor) throw new Error('Actor not available');
      return actor.saveCallerUserProfile(profile);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['currentUserProfile'] });
    },
  });
}

// Employee Queries
export function useGetAllEmployees() {
  const { actor, isFetching } = useActor();

  return useQuery<EmployeeProfile[]>({
    queryKey: ['employees'],
    queryFn: async () => {
      if (!actor) throw new Error('Actor not available');
      return actor.getAllEmployees();
    },
    enabled: !!actor && !isFetching,
    retry: 2,
  });
}

export function useGetEmployeeRecords() {
  const { actor, isFetching } = useActor();

  return useQuery<EmployeeRecord[]>({
    queryKey: ['employeeRecords'],
    queryFn: async () => {
      if (!actor) throw new Error('Actor not available');
      return actor.getEmployeeRecords();
    },
    enabled: !!actor && !isFetching,
    retry: 2,
  });
}

export function useGetEmployee(employeeId: string) {
  const { actor, isFetching } = useActor();

  return useQuery<EmployeeProfile>({
    queryKey: ['employee', employeeId],
    queryFn: async () => {
      if (!actor) throw new Error('Actor not available');
      return actor.getEmployee(employeeId);
    },
    enabled: !!actor && !isFetching && !!employeeId,
    retry: 1,
  });
}

export function useRegisterEmployee() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (profile: EmployeeProfile) => {
      if (!actor) throw new Error('Actor not available');
      return actor.registerNewEmployee(profile);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['employees'] });
      queryClient.invalidateQueries({ queryKey: ['employeeRecords'] });
    },
  });
}

// Fixed: was calling actor.createEmployee which doesn't exist; correct method is actor.addEmployee
export function useAddEmployee() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (details: EmployeeDetails) => {
      if (!actor) throw new Error('Actor not available');
      return actor.addEmployee(details);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['employees'] });
      queryClient.invalidateQueries({ queryKey: ['employeeRecords'] });
    },
  });
}

// Keep useCreateEmployee as an alias for backward compatibility
export const useCreateEmployee = useAddEmployee;

export function useBulkCreateEmployees() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (bulkRecords: BulkEmployeeRecord[]) => {
      if (!actor) throw new Error('Actor not available');
      return actor.bulkCreateEmployees(bulkRecords);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['employees'] });
      queryClient.invalidateQueries({ queryKey: ['employeeRecords'] });
    },
  });
}

// Leave Queries
export function useGetLeaveBalance(employeeId: string) {
  const { actor, isFetching } = useActor();

  return useQuery<LeaveBalance>({
    queryKey: ['leaveBalance', employeeId],
    queryFn: async () => {
      if (!actor) throw new Error('Actor not available');
      return actor.getLeaveBalance(employeeId);
    },
    enabled: !!actor && !isFetching && !!employeeId,
  });
}

export function useGetLeaveRequests(employeeId: string) {
  const { actor, isFetching } = useActor();

  return useQuery<LeaveRequest[]>({
    queryKey: ['leaveRequests', employeeId],
    queryFn: async () => {
      if (!actor) return [];
      return actor.getLeaveRequests(employeeId);
    },
    enabled: !!actor && !isFetching && !!employeeId,
  });
}

export function useSubmitLeaveRequest() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ employeeId, leaveType, startDate, endDate }: { 
      employeeId: string; 
      leaveType: string; 
      startDate: bigint; 
      endDate: bigint;
    }) => {
      if (!actor) throw new Error('Actor not available');
      return actor.submitLeaveRequest(employeeId, leaveType, startDate, endDate);
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['leaveRequests', variables.employeeId] });
      queryClient.invalidateQueries({ queryKey: ['leaveBalance', variables.employeeId] });
    },
  });
}

export function useApproveLeaveRequest() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ employeeId, requestId }: { employeeId: string; requestId: bigint }) => {
      if (!actor) throw new Error('Actor not available');
      return actor.approveLeaveRequest(employeeId, requestId);
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['leaveRequests', variables.employeeId] });
      queryClient.invalidateQueries({ queryKey: ['leaveBalance', variables.employeeId] });
    },
  });
}

// Payroll Queries
export function useGetPayslips(employeeId: string) {
  const { actor, isFetching } = useActor();

  return useQuery<Payslip[]>({
    queryKey: ['payslips', employeeId],
    queryFn: async () => {
      if (!actor) return [];
      return actor.getPayslips(employeeId);
    },
    enabled: !!actor && !isFetching && !!employeeId,
  });
}

export function useUploadPayslip() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ employeeId, month, year, blobReference }: { 
      employeeId: string; 
      month: string; 
      year: string; 
      blobReference: any;
    }) => {
      if (!actor) throw new Error('Actor not available');
      return actor.uploadPayslip(employeeId, month, year, blobReference);
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['payslips', variables.employeeId] });
    },
  });
}

// Letters Queries
export function useGetLetters(employeeId: string) {
  const { actor, isFetching } = useActor();

  return useQuery<Letter[]>({
    queryKey: ['letters', employeeId],
    queryFn: async () => {
      if (!actor) return [];
      return actor.getLetters(employeeId);
    },
    enabled: !!actor && !isFetching && !!employeeId,
  });
}

export function useGenerateLetter() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ employeeId, letterType, blobReference }: { 
      employeeId: string; 
      letterType: string; 
      blobReference: any;
    }) => {
      if (!actor) throw new Error('Actor not available');
      return actor.generateLetter(employeeId, letterType, blobReference);
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['letters', variables.employeeId] });
    },
  });
}

// Authorization Queries
export function useIsCallerAdmin() {
  const { actor, isFetching } = useActor();

  return useQuery<boolean>({
    queryKey: ['isAdmin'],
    queryFn: async () => {
      if (!actor) return false;
      return actor.isCallerAdmin();
    },
    enabled: !!actor && !isFetching,
  });
}
