import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { GameAnalytics } from "@/types/admin";

export function useGameAnalytics() {
  const [analytics, setAnalytics] = useState<GameAnalytics | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchAnalytics = useCallback(async () => {
    try {
      const now = new Date();
      const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate()).toISOString();
      const weekStart = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString();

      // Get total games count
      const { count: totalGames } = await supabase
        .from('scores')
        .select('*', { count: 'exact', head: true });

      // Get today's games
      const { count: todayGames } = await supabase
        .from('scores')
        .select('*', { count: 'exact', head: true })
        .gte('game_date', todayStart);

      // Get week's games
      const { count: weekGames } = await supabase
        .from('scores')
        .select('*', { count: 'exact', head: true })
        .gte('game_date', weekStart);

      // Get active contests
      const { count: activeContests } = await supabase
        .from('contests')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'active');

      // Get unique players
      const { data: players } = await supabase
        .from('scores')
        .select('player_name');
      const uniquePlayers = new Set(players?.map((p) => p.player_name) || []).size;

      // Get average score
      const { data: scores } = await supabase
        .from('scores')
        .select('total_score');
      const avgScore =
        scores && scores.length > 0
          ? scores.reduce((sum, s) => sum + Number(s.total_score), 0) / scores.length
          : 0;

      // Get hourly distribution for the last 7 days
      const { data: recentGames } = await supabase
        .from('scores')
        .select('game_date')
        .gte('game_date', weekStart);

      const hourlyDist = new Array(24).fill(0);
      recentGames?.forEach((game) => {
        const hour = new Date(game.game_date).getHours();
        hourlyDist[hour]++;
      });

      setAnalytics({
        totalGames: totalGames || 0,
        todayGames: todayGames || 0,
        weekGames: weekGames || 0,
        activeContests: activeContests || 0,
        uniquePlayers,
        averageScore: Math.round(avgScore),
        hourlyDistribution: hourlyDist.map((count, hour) => ({ hour, count })),
      });
    } catch (error) {
      console.error('Error fetching analytics:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAnalytics();
  }, [fetchAnalytics]);

  return { analytics, loading, refetch: fetchAnalytics };
}
