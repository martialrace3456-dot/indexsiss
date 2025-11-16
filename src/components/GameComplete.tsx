import { RoundData } from "@/types/game";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

interface GameCompleteProps {
  rounds: RoundData[];
  onNewGame: () => void;
  player1Name?: string;
  player2Name?: string;
}

export const GameComplete = ({ rounds, onNewGame, player1Name, player2Name }: GameCompleteProps) => {
  const displayPlayer1 = player1Name || "Player 1";
  const displayPlayer2 = player2Name || "Player 2";
  const player1Rounds = rounds.filter((r) => r.playerNumber === 1);
  const player2Rounds = rounds.filter((r) => r.playerNumber === 2);

  const player1Total = player1Rounds.reduce((sum, r) => sum + r.score, 0);
  const player2Total = player2Rounds.reduce((sum, r) => sum + r.score, 0);

  const winner = player1Total > player2Total ? 1 : player2Total > player1Total ? 2 : null;

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-board p-4">
      <Card className="p-8 bg-card border-primary max-w-2xl w-full space-y-6">
        <div className="text-center space-y-2">
          <h2 className="text-4xl font-bold text-foreground">
            {winner
              ? `${winner === 1 ? displayPlayer1 : displayPlayer2} Wins!`
              : "It's a Tie!"}
          </h2>
          <p className="text-xl text-muted-foreground">
            Game complete after 7 rounds
          </p>
        </div>

        <div className="grid grid-cols-2 gap-6">
          <Card className="p-6 bg-primary/10 border-primary">
            <div className="text-center space-y-2">
              <div className="text-sm text-muted-foreground">{displayPlayer1}</div>
              <div className="text-4xl sm:text-5xl font-bold font-mono text-primary break-words">
                {player1Total.toFixed(2)}
              </div>
            </div>
          </Card>
          <Card className="p-6 bg-secondary/10 border-secondary">
            <div className="text-center space-y-2">
              <div className="text-sm text-muted-foreground">{displayPlayer2}</div>
              <div className="text-4xl sm:text-5xl font-bold font-mono text-secondary break-words">
                {player2Total.toFixed(2)}
              </div>
            </div>
          </Card>
        </div>

        <div className="pt-4">
          <Button
            onClick={onNewGame}
            className="w-full bg-gradient-accent hover:opacity-90 text-primary-foreground font-semibold text-xl py-8"
          >
            New Game
          </Button>
        </div>
      </Card>
    </div>
  );
};
