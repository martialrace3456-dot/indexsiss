import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Search } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

interface Score {
  id: string;
  player_name: string;
  total_score: number;
  game_date: string;
}

interface LeaderboardProps {
  currentPlayerName: string;
}

export const Leaderboard = ({ currentPlayerName }: LeaderboardProps) => {
  const [globalScores, setGlobalScores] = useState<Score[]>([]);
  const [personalScores, setPersonalScores] = useState<Score[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchScores();
  }, [currentPlayerName]);

  const fetchScores = async () => {
    setLoading(true);
    
    // Fetch global rankings
    const { data: globalData, error: globalError } = await supabase
      .from("scores")
      .select("*")
      .order("total_score", { ascending: false });

    if (!globalError && globalData) {
      setGlobalScores(globalData);
    }

    // Fetch personal history
    const { data: personalData, error: personalError } = await supabase
      .from("scores")
      .select("*")
      .eq("player_name", currentPlayerName)
      .order("total_score", { ascending: false });

    if (!personalError && personalData) {
      setPersonalScores(personalData);
    }

    setLoading(false);
  };

  const filteredGlobalScores = globalScores.filter((score) =>
    score.player_name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const getCurrentPlayerRank = () => {
    const index = globalScores.findIndex(
      (score) => score.player_name === currentPlayerName
    );
    return index !== -1 ? index + 1 : null;
  };

  const currentPlayerRank = getCurrentPlayerRank();

  return (
    <div className="grid md:grid-cols-2 gap-6">
      {/* Global Rankings */}
      <Card className="bg-card/50 border-primary/50">
        <CardHeader>
          <CardTitle className="text-2xl text-foreground mb-4">Global Rankings</CardTitle>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-5 h-5" />
            <Input
              type="text"
              placeholder="Search Player..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 bg-input border-border"
            />
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-2 max-h-[500px] overflow-y-auto">
            <div className="grid grid-cols-12 gap-2 px-4 py-2 text-sm font-semibold text-muted-foreground border-b border-border">
              <div className="col-span-2">Rank</div>
              <div className="col-span-7">Player</div>
              <div className="col-span-3 text-right">Score</div>
            </div>
            {loading ? (
              <div className="text-center py-8 text-muted-foreground">Loading...</div>
            ) : (
              filteredGlobalScores.map((score, index) => {
                const isCurrentPlayer = score.player_name === currentPlayerName;
                return (
                  <div
                    key={score.id}
                    className={`grid grid-cols-12 gap-2 px-4 py-3 rounded-lg transition-colors ${
                      isCurrentPlayer
                        ? "bg-primary/20 border border-primary"
                        : "hover:bg-muted/50"
                    }`}
                  >
                    <div className="col-span-2 font-mono text-foreground">
                      {index + 1}.
                    </div>
                    <div className="col-span-7 text-foreground truncate">
                      {score.player_name}
                    </div>
                    <div className="col-span-3 text-right font-mono text-foreground">
                      {score.total_score.toFixed(1)}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </CardContent>
      </Card>

      {/* Your History */}
      <Card className="bg-card/50 border-primary/50">
        <CardHeader>
          <CardTitle className="text-2xl text-foreground">Your History</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2 max-h-[500px] overflow-y-auto">
            <div className="grid grid-cols-12 gap-2 px-4 py-2 text-sm font-semibold text-muted-foreground border-b border-border">
              <div className="col-span-2">Rank</div>
              <div className="col-span-7">Game Date</div>
              <div className="col-span-3 text-right">Score</div>
            </div>
            {loading ? (
              <div className="text-center py-8 text-muted-foreground">Loading...</div>
            ) : personalScores.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                No games played yet
              </div>
            ) : (
              personalScores.map((score, index) => (
                <div
                  key={score.id}
                  className="grid grid-cols-12 gap-2 px-4 py-3 rounded-lg hover:bg-muted/50 transition-colors"
                >
                  <div className="col-span-2 font-mono text-foreground">
                    {index + 1}
                  </div>
                  <div className="col-span-7 text-muted-foreground text-sm">
                    {new Date(score.game_date).toLocaleDateString()}
                  </div>
                  <div className="col-span-3 text-right font-mono text-foreground">
                    {score.total_score.toFixed(1)}
                  </div>
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
