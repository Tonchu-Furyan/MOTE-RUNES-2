import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useToast } from '@/hooks/use-toast';
import { 
  fetchAllRunes, 
  fetchRuneById, 
  pullDailyRune, 
  fetchUserRunePulls, 
  fetchLatestUserRunePull, 
  hasUserPulledToday,
  type Rune,
  type RunePull
} from '@/lib/runes';

export function useRunes() {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  
  // Query to get all runes
  const allRunes = useQuery({
    queryKey: ['/api/runes'],
    queryFn: () => fetchAllRunes(),
  });
  
  // Query factory for a single rune
  const getRune = (id: number) => useQuery({
    queryKey: ['/api/runes', id],
    queryFn: () => fetchRuneById(id),
    enabled: !!id,
  });
  
  // Query factory for a user's rune pulls
  const getUserRunePulls = (userId: number | null) => useQuery({
    queryKey: ['/api/rune-pulls/user', userId],
    queryFn: () => fetchUserRunePulls(userId!),
    enabled: !!userId,
  });
  
  // Query factory for a user's latest rune pull
  const getLatestUserRunePull = (userId: number | null) => useQuery({
    queryKey: ['/api/rune-pulls/user/latest', userId],
    queryFn: () => fetchLatestUserRunePull(userId!),
    enabled: !!userId,
  });
  
  // Query to check if the user has pulled a rune today
  const getHasPulledToday = (userId: number | null) => useQuery({
    queryKey: ['/api/rune-pulls/user/check-today', userId],
    queryFn: () => hasUserPulledToday(userId!),
    enabled: !!userId,
  });
  
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
    getRune,
    getUserRunePulls,
    getLatestUserRunePull,
    getHasPulledToday,
    pullRuneMutation,
  };
}
