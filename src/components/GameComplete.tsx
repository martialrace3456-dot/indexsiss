import { RoundData } from "@/types/game";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

interface GameCompleteProps {
  rounds: RoundData[];
  onNewGame: () => void;
}

export const GameComplete = ({ rounds, onNewGame }: GameCompleteProps) => {
  const player1Rounds = rounds.filter((r) => r.playerNumber === 1);
  const player2Rounds = rounds.filter((r) => r.playerNumber === 2);

  const player1Total = player1Rounds.reduce((sum, r) => sum + r.score, 0);
  const player2Total = player2Rounds.reduce((sum, r) => sum + r.score, 0);

  const winner =
    player1Total > player2Total ? 1 : player1Total < player2Total ? 2 : null;

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-board p-4">
      <Card className="p-8 bg-card border-primary max-w-2xl w-full space-y-6">
        <div className="text-center space-y-2">
          <h2 className="text-4xl font-bold text-foreground">Game Complete!</h2>
          {winner ? (
            <p className="text-xl text-muted-foreground">
              Player {winner} Wins!
            </p>
          ) : (
            <p className="text-xl text-muted-foreground">It's a Tie!</p>
          )}
        </div>

        <div className="grid grid-cols-2 gap-6">
          <div className="p-6 bg-background rounded-lg border-2 border-primary">
            <div className="text-center">
              <div className="text-sm text-muted-foreground mb-2">Player 1</div>
              <div className="text-5xl font-bold font-mono text-primary mb-4">
                {player1Total.toFixed(2)}
              </div>
              <div className="space-y-1">
                {player1Rounds.map((round, index) => (
                  <div key={index} className="text-sm text-muted-foreground">
                    Round {rounds.indexOf(round) + 1}: {round.score.toFixed(2)}
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="p-6 bg-background rounded-lg border-2 border-secondary">
            <div className="text-center">
              <div className="text-sm text-muted-foreground mb-2">Player 2</div>
              <div className="text-5xl font-bold font-mono text-secondary mb-4">
                {player2Total.toFixed(2)}
              </div>
              <div className="space-y-1">
                {player2Rounds.map((round, index) => (
                  <div key={index} className="text-sm text-muted-foreground">
                    Round {rounds.indexOf(round) + 1}: {round.score.toFixed(2)}
                  </div>
                ))}
              </div>
            </div>
          </div>
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
