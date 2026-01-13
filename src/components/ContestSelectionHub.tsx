import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft, Search, Trophy, Clock, Users, Settings, ChevronRight } from "lucide-react";
import { useContests } from "@/hooks/useContests";
import { ContestList } from "@/components/ContestList";
import { CreateContestModal } from "@/components/CreateContestModal";
import { ManageContestModal } from "@/components/ManageContestModal";
import { ContestLeaderboard } from "@/components/ContestLeaderboard";
import { ContestWithParticipants } from "@/types/contest";
import { toast } from "sonner";

export function ContestSelectionHub() {
  const navigate = useNavigate();
  const { activeContests, expiredContests, loading, refetch } = useContests();
  
  const [playerName, setPlayerName] = useState("");
  const [selectedContest, setSelectedContest] = useState<ContestWithParticipants | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showManageModal, setShowManageModal] = useState(false);
  const [showLeaderboard, setShowLeaderboard] = useState(false);

  const isGlobalSelected = selectedContest === null;
  const isExpiredContest = selectedContest?.status === 'expired';

  const handleStart = () => {
    if (!playerName.trim()) {
      toast.error("Please enter your name");
      return;
    }

    if (selectedContest && selectedContest.participant_count >= selectedContest.participant_limit) {
      toast.error("This contest has reached its participant limit");
      return;
    }

    navigate("/single-player", {
      state: {
        playerName: playerName.trim(),
        contestId: selectedContest?.id || null,
        contestName: selectedContest?.name || "The Global Estimator Challenge"
      }
    });
  };

  const handleSelectContest = (contest: ContestWithParticipants | null) => {
    setSelectedContest(contest);
    setShowLeaderboard(false);
  };

  const filteredActiveContests = activeContests.filter(c =>
    c.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const filteredExpiredContests = expiredContests.filter(c =>
    c.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const formatTimeLeft = (endsAt: string) => {
    const now = new Date();
    const end = new Date(endsAt);
    const diffMs = end.getTime() - now.getTime();
    
    if (diffMs <= 0) return "Ended";
    
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);
    
    if (diffDays > 0) return `${diffDays}d ${diffHours % 24}h left`;
    if (diffHours > 0) return `${diffHours}h ${diffMins % 60}m left`;
    return `${diffMins}m left`;
  };

  // Show leaderboard view
  if (showLeaderboard && selectedContest) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <div className="w-full max-w-2xl h-[600px]">
          <ContestLeaderboard
            contest={selectedContest}
            currentPlayerName={playerName}
            onBack={() => setShowLeaderboard(false)}
          />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4 relative">
      <Button
        variant="ghost"
        size="icon"
        onClick={() => navigate("/")}
        className="absolute top-4 left-4"
      >
        <ArrowLeft className="w-6 h-6" />
      </Button>

      <div className="w-full max-w-5xl">
        <h1 className="text-3xl md:text-4xl font-bold text-center mb-6 text-foreground">
          The Global Estimator Challenge
        </h1>

        <div className="grid grid-cols-1 md:grid-cols-5 gap-4 h-[600px]">
          {/* Left Column - 40% */}
          <div className="md:col-span-2 flex flex-col gap-4">
            {/* Participant Area */}
            <Card className="flex-1 border-2 border-primary shadow-lg shadow-primary/20">
              <CardHeader className="pb-2">
                <CardTitle className="text-lg flex items-center gap-2">
                  <Trophy className="w-5 h-5 text-yellow-500" />
                  Participant Area
                </CardTitle>
                <p className="text-sm text-primary font-medium">
                  {selectedContest?.name || "The Global Estimator Challenge"}
                </p>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <label htmlFor="playerName" className="text-sm font-medium text-foreground">
                    Your Name
                  </label>
                  <Input
                    id="playerName"
                    type="text"
                    value={playerName}
                    onChange={(e) => setPlayerName(e.target.value)}
                    placeholder="Enter your name"
                    className="bg-input border-border"
                    maxLength={20}
                    disabled={isExpiredContest}
                  />
                </div>

                <Button
                  onClick={handleStart}
                  disabled={!playerName.trim() || isExpiredContest}
                  className="w-full bg-gradient-accent hover:opacity-90 text-primary-foreground font-semibold py-6"
                >
                  {isExpiredContest ? "Contest Ended" : "Start Challenge"}
                </Button>
              </CardContent>
            </Card>

            {/* Conductor Area */}
            <Card className="border-2 border-border">
              <CardHeader className="pb-2">
                <CardTitle className="text-lg flex items-center gap-2">
                  <Settings className="w-5 h-5 text-muted-foreground" />
                  Conductor Area
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {selectedContest ? (
                  <>
                    <div className="p-3 bg-muted rounded-lg space-y-2">
                      <p className="font-medium text-foreground">{selectedContest.name}</p>
                      <div className="flex items-center gap-4 text-sm text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <Clock className="w-4 h-4" />
                          {isExpiredContest 
                            ? "Contest Ended" 
                            : formatTimeLeft(selectedContest.ends_at)
                          }
                        </span>
                        <span className="flex items-center gap-1">
                          <Users className="w-4 h-4" />
                          {selectedContest.participant_count}/{selectedContest.participant_limit}
                        </span>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        onClick={() => setShowLeaderboard(true)}
                        className="flex-1"
                      >
                        <Trophy className="w-4 h-4 mr-2" />
                        Leaderboard
                      </Button>
                      <Button
                        variant="outline"
                        onClick={() => setShowManageModal(true)}
                        className="flex-1"
                      >
                        <Settings className="w-4 h-4 mr-2" />
                        Manage
                      </Button>
                    </div>
                  </>
                ) : (
                  <p className="text-sm text-muted-foreground">
                    Select a contest to view details, or create your own.
                  </p>
                )}
                
                <Button
                  variant="ghost"
                  onClick={() => setShowCreateModal(true)}
                  className="w-full justify-between text-primary hover:text-primary hover:bg-primary/10"
                >
                  Launch a Contest
                  <ChevronRight className="w-4 h-4" />
                </Button>
              </CardContent>
            </Card>
          </div>

          {/* Right Column - 60% */}
          <Card className="md:col-span-3 border-2 border-border flex flex-col overflow-hidden">
            <CardContent className="flex-1 flex flex-col gap-4 p-4 overflow-hidden">
              {/* Search */}
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  placeholder="Search contests..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9 bg-input border-border"
                />
              </div>

              {/* Currently Running */}
              <div className="flex-1 min-h-0 flex flex-col">
                <h3 className="text-sm font-semibold text-muted-foreground mb-2">
                  Currently Running
                </h3>
                <div className="flex-1 overflow-hidden">
                  {loading ? (
                    <div className="flex items-center justify-center py-8">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                    </div>
                  ) : (
                    <ContestList
                      contests={filteredActiveContests}
                      selectedContestId={selectedContest?.id || null}
                      onSelectContest={handleSelectContest}
                      showGlobal={true}
                      isGlobalSelected={isGlobalSelected}
                      emptyMessage="No active contests"
                    />
                  )}
                </div>
              </div>

              {/* Expired Contests */}
              <div className="flex-1 min-h-0 flex flex-col">
                <h3 className="text-sm font-semibold text-muted-foreground mb-2">
                  Expired Contests
                </h3>
                <div className="flex-1 overflow-hidden">
                  <ContestList
                    contests={filteredExpiredContests}
                    selectedContestId={selectedContest?.id || null}
                    onSelectContest={handleSelectContest}
                    emptyMessage="No expired contests"
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Modals */}
      <CreateContestModal
        open={showCreateModal}
        onOpenChange={setShowCreateModal}
        onContestCreated={refetch}
      />

      <ManageContestModal
        contest={selectedContest}
        open={showManageModal}
        onOpenChange={setShowManageModal}
        onContestUpdated={refetch}
      />
    </div>
  );
}
