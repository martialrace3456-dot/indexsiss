import { Clock, Users, Trophy } from "lucide-react";
import { ContestWithParticipants } from "@/types/contest";
import { ScrollArea } from "@/components/ui/scroll-area";

interface ContestListProps {
  contests: ContestWithParticipants[];
  selectedContestId: string | null;
  onSelectContest: (contest: ContestWithParticipants | null) => void;
  showGlobal?: boolean;
  isGlobalSelected?: boolean;
  emptyMessage?: string;
}

function formatTimeLeft(endsAt: string): string {
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
}

function formatDuration(startedAt: string, endedAt: string): string {
  const start = new Date(startedAt);
  const end = new Date(endedAt);
  const diffMs = end.getTime() - start.getTime();
  
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMins / 60);
  const diffDays = Math.floor(diffHours / 24);
  
  if (diffDays > 0) return `Ran for ${diffDays}d ${diffHours % 24}h`;
  if (diffHours > 0) return `Ran for ${diffHours}h ${diffMins % 60}m`;
  return `Ran for ${diffMins}m`;
}

export function ContestList({
  contests,
  selectedContestId,
  onSelectContest,
  showGlobal = false,
  isGlobalSelected = false,
  emptyMessage = "No contests found"
}: ContestListProps) {
  const isExpiredList = contests.length > 0 && contests[0].status === 'expired';

  return (
    <ScrollArea className="h-full">
      <div className="space-y-2 pr-4">
        {showGlobal && (
          <button
            onClick={() => onSelectContest(null)}
            className={`w-full p-3 rounded-lg border-2 transition-all text-left ${
              isGlobalSelected
                ? "border-primary bg-primary/10"
                : "border-border hover:border-primary/50 bg-card"
            }`}
          >
            <div className="flex items-center gap-2 mb-1">
              <Trophy className="w-4 h-4 text-yellow-500" />
              <span className="font-semibold text-foreground">The Global Estimator Challenge</span>
            </div>
            <p className="text-xs text-muted-foreground">
              Compete against players worldwide
            </p>
          </button>
        )}
        
        {contests.map((contest) => (
          <button
            key={contest.id}
            onClick={() => onSelectContest(contest)}
            className={`w-full p-3 rounded-lg border-2 transition-all text-left ${
              selectedContestId === contest.id
                ? "border-primary bg-primary/10"
                : "border-border hover:border-primary/50 bg-card"
            }`}
          >
            <div className="flex items-center justify-between mb-1">
              <span className="font-semibold text-foreground truncate max-w-[60%]">
                {contest.name}
              </span>
              <div className="flex items-center gap-1 text-xs text-muted-foreground">
                <Users className="w-3 h-3" />
                <span>{contest.participant_count}/{contest.participant_limit}</span>
              </div>
            </div>
            <div className="flex items-center gap-1 text-xs text-muted-foreground">
              <Clock className="w-3 h-3" />
              <span>
                {isExpiredList 
                  ? formatDuration(contest.starts_at, contest.ends_at)
                  : formatTimeLeft(contest.ends_at)
                }
              </span>
            </div>
          </button>
        ))}
        
        {contests.length === 0 && !showGlobal && (
          <p className="text-center text-muted-foreground py-4 text-sm">
            {emptyMessage}
          </p>
        )}
      </div>
    </ScrollArea>
  );
}
