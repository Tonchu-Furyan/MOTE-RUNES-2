import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useToast } from '@/hooks/use-toast';
import { 
  fetchAllRunes, 
  fetchRuneById, 
  pullDailyRune, 
  fetchUserRunePulls, 
  fetchLatestUserRunePull, 
  hasUserPulledToday,
  fetchRuneCountsByUser,
  type Rune,
  type RunePull,
  type RuneCount
} from '@/lib/runes';

// Custom hooks for different rune-related queries
export function useAllRunes() {
  return useQuery({
    queryKey: ['/api/runes'],
    queryFn: () => fetchAllRunes(),
  });
}

export function useRune(id: number | null) {
  return useQuery({
    queryKey: ['/api/runes', id],
    queryFn: () => fetchRuneById(id!),
    enabled: !!id,
  });
}

export function useUserRunePulls(userId: number | null) {
  return useQuery({
    queryKey: ['/api/rune-pulls/user', userId],
    queryFn: () => fetchUserRunePulls(userId!),
    enabled: !!userId,
  });
}

export function useLatestUserRunePull(userId: number | null) {
  return useQuery({
    queryKey: ['/api/rune-pulls/user/latest', userId],
    queryFn: () => fetchLatestUserRunePull(userId!),
    enabled: !!userId,
  });
}

export function useHasPulledToday(userId: number | null) {
  return useQuery({
    queryKey: ['/api/rune-pulls/user/check-today', userId],
    queryFn: () => hasUserPulledToday(userId!),
    enabled: !!userId,
  });
}

export function useRuneCountsByUser(userId: number | null) {
  return useQuery({
    queryKey: ['/api/rune-counts/user', userId],
    queryFn: () => fetchRuneCountsByUser(userId!),
    enabled: !!userId,
  });
}

export function useRunes() {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  
  // Query to get all runes
  const allRunes = useAllRunes();
  
  // Mutation to pull a daily rune
  const pullRuneMutation = useMutation({
    mutationFn: (userId: number) => {
      console.log('pullRuneMutation executing with userId:', userId);
      return pullDailyRune(userId);
    },
    onSuccess: (data) => {
      console.log('Rune pull mutation succeeded with data:', data);
      // Invalidate relevant queries
      queryClient.invalidateQueries({ queryKey: ['/api/rune-pulls/user', data.userId] });
      queryClient.invalidateQueries({ queryKey: ['/api/rune-pulls/user/latest', data.userId] });
      queryClient.invalidateQueries({ queryKey: ['/api/rune-pulls/user/check-today', data.userId] });
      
      toast({
        title: 'Rune Pulled Successfully',
        description: `You pulled ${data.rune.name}`,
      });
    },
    onError: (error) => {
      console.error('Rune pull mutation failed:', error);
      toast({
        variant: 'destructive',
        title: 'Failed to pull rune',
        description: error instanceof Error ? error.message : 'Unknown error occurred',
      });
    },
  });
  
  return {
    allRunes,
    pullRuneMutation
  };
}
