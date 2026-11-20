import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type { UpdateDepartmentInput } from '../types/areas.types';
import { createDepartment, getDepartments, updateDepartment } from './areas.api';

/** `['departments']`: the users and requests screens list departments under the same root. */
export const areasKeys = {
  all: ['departments'] as const,
  list: () => [...areasKeys.all, 'list'] as const,
};

export function useDepartments() {
  return useQuery({ queryKey: areasKeys.list(), queryFn: getDepartments });
}

export function useCreateDepartment() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: createDepartment,
    onSuccess: () => void queryClient.invalidateQueries({ queryKey: areasKeys.all }),
  });
}

export function useUpdateDepartment() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, input }: { id: string; input: UpdateDepartmentInput }) =>
      updateDepartment(id, input),
    onSuccess: () => void queryClient.invalidateQueries({ queryKey: areasKeys.all }),
  });
}
