import { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { GameBoard } from "@/components/GameBoard";
import { GuessInput } from "@/components/GuessInput";
import { SampleInfo } from "@/components/SampleInfo";
import { RoundResult } from "@/components/RoundResult";
import { Leaderboard } from "@/components/Leaderboard";
import { Card } from "@/components/ui/card";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { GameState } from "@/types/game";
import {
  generateDotsWithVariableDensity,
  calculateLocalDensity,
  calculateActualDensity,
  calculateStandardDeviation,
  calculateScore,
} from "@/utils/boardGenerator";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

const BOARD_SIZE = 600;
const TOTAL_ROUNDS = 7;
const SAMPLES_PER_ROUND = 5;
const SAMPLE_RADIUS = 50;

const generateRandomDotCount = () => Math.floor(Math.random() * 75001) + 25000;

export default function SinglePlayerGame() {
  const navigate = useNavigate();
  const location = useLocation();
  const { toast } = useToast();
  const playerName = location.state?.playerName || "Player";

  const [activeTab, setActiveTab] = useState<"play" | "leaderboard">("play");
  const [gameState, setGameState] = useState<GameState>(() => {
    const totalDots = generateRandomDotCount();
    const dots = generateDotsWithVariableDensity(totalDots, BOARD_SIZE);
    const actualDensity = calculateActualDensity(totalDots, BOARD_SIZE);
    const standardDeviation = calculateStandardDeviation(dots, BOARD_SIZE);

    return {
      currentPlayer: 1,
      currentRound: 1,
      phase: "sampling",
      dots,
      boardSize: BOARD_SIZE,
      totalDots,
      samplesRemaining: SAMPLES_PER_ROUND,
      rounds: [],
      currentRoundData: {
        playerNumber: 1,
        samples: [],
        guess: null,
        actualDensity,
        standardDeviation,
        score: 0,
      },
      player1Name: playerName,
    };
  });

  const [showResult, setShowResult] = useState(false);
  const [gameCompleteDialog, setGameCompleteDialog] = useState(false);
  const [isTopScore, setIsTopScore] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);

  const handleSample = (x: number, y: number) => {
    if (gameState.phase !== "sampling" || gameState.samplesRemaining <= 0) return;

    const localDensity = calculateLocalDensity(gameState.dots, x, y, SAMPLE_RADIUS);
    const newSample = { x, y, radius: SAMPLE_RADIUS, localDensity };

    const updatedSamples = [...(gameState.currentRoundData.samples || []), newSample];
    const newSamplesRemaining = gameState.samplesRemaining - 1;

    setGameState({
      ...gameState,
      samplesRemaining: newSamplesRemaining,
      phase: newSamplesRemaining === 0 ? "guessing" : "sampling",
      currentRoundData: {
        ...gameState.currentRoundData,
        samples: updatedSamples,
      },
    });
  };

  const handleGuess = (guess: number) => {
    const score = calculateScore(
      guess,
      gameState.currentRoundData.actualDensity!,
      gameState.currentRoundData.standardDeviation!
    );

    const completedRound = {
      playerNumber: 1 as 1 | 2,
      samples: gameState.currentRoundData.samples || [],
      guess,
      actualDensity: gameState.currentRoundData.actualDensity!,
      standardDeviation: gameState.currentRoundData.standardDeviation!,
      score,
    };

    setGameState({
      ...gameState,
      phase: "reveal",
      rounds: [...gameState.rounds, completedRound],
      currentRoundData: completedRound,
    });

    setShowResult(true);
  };

  const handleContinue = () => {
    if (isProcessing) return;
    setIsProcessing(true);
    setShowResult(false);

    if (gameState.currentRound >= TOTAL_ROUNDS) {
      // Game complete - save score
      const totalScore = gameState.rounds.reduce((sum, r) => sum + r.score, 0);
      saveScore(totalScore);
      setIsProcessing(false);
      return;
    }

    // Start next round
    const totalDots = generateRandomDotCount();
    const dots = generateDotsWithVariableDensity(totalDots, BOARD_SIZE);
    const actualDensity = calculateActualDensity(totalDots, BOARD_SIZE);
    const standardDeviation = calculateStandardDeviation(dots, BOARD_SIZE);

    setGameState(prev => ({
      ...prev,
      currentRound: prev.currentRound + 1,
      phase: "sampling",
      dots,
      totalDots,
      samplesRemaining: SAMPLES_PER_ROUND,
      currentRoundData: {
        playerNumber: 1,
        samples: [],
        guess: null,
        actualDensity,
        standardDeviation,
        score: 0,
      },
    }));
    setIsProcessing(false);
  };

  const saveScore = async (totalScore: number) => {
    try {
      // Check if this is a top 3 personal score
      const { data: personalScores } = await supabase
        .from("scores")
        .select("total_score")
        .eq("player_name", playerName)
        .order("total_score", { ascending: false })
        .limit(3);

      const isTop3 = !personalScores || personalScores.length < 3 || 
        totalScore > personalScores[personalScores.length - 1].total_score;

      setIsTopScore(isTop3);

      // Save the score
      const { error } = await supabase.from("scores").insert({
        player_name: playerName,
        total_score: totalScore,
      });

      if (error) throw error;

      setGameCompleteDialog(true);
    } catch (error) {
      console.error("Error saving score:", error);
      toast({
        title: "Error",
        description: "Failed to save score. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleNewGame = () => {
    const totalDots = generateRandomDotCount();
    const dots = generateDotsWithVariableDensity(totalDots, BOARD_SIZE);
    const actualDensity = calculateActualDensity(totalDots, BOARD_SIZE);
    const standardDeviation = calculateStandardDeviation(dots, BOARD_SIZE);

    setGameState({
      currentPlayer: 1,
      currentRound: 1,
      phase: "sampling",
      dots,
      boardSize: BOARD_SIZE,
      totalDots,
      samplesRemaining: SAMPLES_PER_ROUND,
      rounds: [],
      currentRoundData: {
        playerNumber: 1,
        samples: [],
        guess: null,
        actualDensity,
        standardDeviation,
        score: 0,
      },
      player1Name: playerName,
    });
    setGameCompleteDialog(false);
    setActiveTab("play");
  };

  const totalScore = gameState.rounds.reduce((sum, r) => sum + r.score, 0);

  return (
    <div className="min-h-screen bg-background p-2 sm:p-4">
      <div className="max-w-7xl mx-auto space-y-2 sm:space-y-4">
        {/* Header - Increased height with centered tabs */}
        <div className="flex flex-col items-center justify-center py-4 sm:py-6 space-y-3 sm:space-y-4">
          <button
            onClick={() => navigate("/")}
            className="text-2xl sm:text-3xl font-bold text-foreground hover:text-primary transition-colors"
          >
            Indexsis
          </button>

          <div className="flex gap-2">
            <Button
              variant={activeTab === "play" ? "default" : "outline"}
              onClick={() => setActiveTab("play")}
              className="px-6 sm:px-8 text-sm sm:text-base"
            >
              Play
            </Button>
            <Button
              variant={activeTab === "leaderboard" ? "default" : "outline"}
              onClick={() => setActiveTab("leaderboard")}
              className="px-6 sm:px-8 text-sm sm:text-base"
            >
              Leaderboard
            </Button>
          </div>
        </div>

        {activeTab === "play" ? (
          <div className="grid lg:grid-cols-[1fr,320px] xl:grid-cols-[1fr,400px] gap-2 sm:gap-4">
            {/* Game Board */}
            <Card className="p-3 sm:p-6 bg-card border-primary">
              <GameBoard
                dots={gameState.dots}
                boardSize={gameState.boardSize}
                samples={gameState.currentRoundData.samples || []}
                showDots={gameState.phase === "reveal"}
                onSample={handleSample}
                canSample={gameState.phase === "sampling" && gameState.samplesRemaining > 0}
              />
            </Card>

            {/* Right Sidebar */}
            <div className="space-y-2 sm:space-y-4">
              {/* Player Info */}
              <Card className="p-3 sm:p-4 bg-card border-primary">
                <div className="space-y-1 sm:space-y-2">
                  <div className="text-xs sm:text-sm text-muted-foreground">{playerName}</div>
                  <div className="text-2xl sm:text-3xl font-bold font-mono text-foreground">
                    {totalScore.toFixed(1)}
                  </div>
                  <div className="text-xs sm:text-sm text-muted-foreground">
                    Round {gameState.currentRound} of {TOTAL_ROUNDS}
                  </div>
                </div>
              </Card>

              {/* Guess Input - Always visible */}
              <GuessInput 
                onSubmit={handleGuess}
                disabled={gameState.phase !== "guessing"}
              />

              {/* Sample Info */}
              <SampleInfo
                samplesRemaining={gameState.samplesRemaining}
                samples={gameState.currentRoundData.samples || []}
              />

              {/* Game History */}
              <Card className="p-3 sm:p-4 bg-card border-primary">
                <h3 className="text-base sm:text-lg font-bold text-foreground mb-2 sm:mb-3">Game History</h3>
                <div className="space-y-2 max-h-[200px] sm:max-h-[300px] overflow-y-auto">
                  {gameState.rounds.map((round, index) => (
                    <div
                      key={index}
                      className="p-2 sm:p-3 bg-muted/50 rounded-lg text-xs sm:text-sm"
                    >
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Round {index + 1}</span>
                        <span className="font-mono font-bold text-foreground">
                          {round.score.toFixed(1)}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </Card>
            </div>
          </div>
        ) : (
          <Leaderboard currentPlayerName={playerName} />
        )}
      </div>

      {/* Round Result Dialog */}
      <Dialog open={showResult} onOpenChange={setShowResult}>
        <DialogContent>
          <RoundResult
            roundData={gameState.currentRoundData as any}
            onContinue={handleContinue}
            showContinue={true}
            isRoundComplete={gameState.currentRound >= TOTAL_ROUNDS}
            nextPlayerName={playerName}
            disabled={isProcessing}
          />
        </DialogContent>
      </Dialog>

      {/* Game Complete Dialog */}
      <Dialog open={gameCompleteDialog} onOpenChange={setGameCompleteDialog}>
        <DialogContent>
          <div className="space-y-6 text-center">
            {isTopScore && (
              <div className="text-2xl font-bold text-primary animate-pulse">
                🎉 New Personal Best! 🎉
              </div>
            )}
            <div>
              <h2 className="text-3xl font-bold text-foreground mb-2">
                Game Completed
              </h2>
              <p className="text-xl text-muted-foreground">
                Your Final Score:
              </p>
              <p className="text-5xl font-bold font-mono text-primary mt-2">
                {totalScore.toFixed(1)}
              </p>
            </div>
            <div className="flex gap-4">
              <Button
                onClick={handleNewGame}
                className="flex-1 bg-gradient-accent hover:opacity-90"
              >
                Play Again
              </Button>
              <Button
                onClick={() => {
                  setGameCompleteDialog(false);
                  setActiveTab("leaderboard");
                }}
                variant="outline"
                className="flex-1"
              >
                View Leaderboard
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
