import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Contest, ContestWithParticipants } from "@/types/contest";

export function useContests() {
  const [activeContests, setActiveContests] = useState<ContestWithParticipants[]>([]);
  const [expiredContests, setExpiredContests] = useState<ContestWithParticipants[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchContests = useCallback(async () => {
    setLoading(true);
    try {
      // First, update any contests that have passed their end time
      await supabase
        .from('contests')
        .update({ status: 'expired' })
        .eq('status', 'active')
        .lt('ends_at', new Date().toISOString());

      // Fetch all contests that are approved (only approved contests visible to players)
      const { data: contests, error } = await supabase
        .from('contests')
        .select('*')
        .eq('approval_status', 'approved')
        .order('ends_at', { ascending: true });

      if (error) throw error;

      // Get participant counts for each contest
      const contestsWithCounts: ContestWithParticipants[] = await Promise.all(
        (contests || []).map(async (contest) => {
          const { count } = await supabase
            .from('contest_scores')
            .select('player_name', { count: 'exact', head: true })
            .eq('contest_id', contest.id);

          // Get unique participants by counting distinct player names
          const { data: uniquePlayers } = await supabase
            .from('contest_scores')
            .select('player_name')
            .eq('contest_id', contest.id);

          const uniqueCount = new Set(uniquePlayers?.map(p => p.player_name) || []).size;

          return {
            ...contest,
            status: contest.status as 'active' | 'expired',
            participant_count: uniqueCount
          };
        })
      );

      setActiveContests(contestsWithCounts.filter(c => c.status === 'active'));
      setExpiredContests(contestsWithCounts.filter(c => c.status === 'expired'));
    } catch (error) {
      console.error('Error fetching contests:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchContests();
  }, [fetchContests]);

  return { activeContests, expiredContests, loading, refetch: fetchContests };
}
