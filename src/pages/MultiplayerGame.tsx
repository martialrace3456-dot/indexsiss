import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { WelcomeScreen } from "@/components/WelcomeScreen";
import { GameBoard } from "@/components/GameBoard";
import { GuessInput } from "@/components/GuessInput";
import { SampleInfo } from "@/components/SampleInfo";
import { RoundResult } from "@/components/RoundResult";
import { RoundHistory } from "@/components/RoundHistory";
import { GameComplete } from "@/components/GameComplete";
import { HandoffScreen } from "@/components/HandoffScreen";
import { Card } from "@/components/ui/card";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { GameState } from "@/types/game";
import {
  generateDotsWithVariableDensity,
  calculateLocalDensity,
  calculateActualDensity,
  calculateStandardDeviation,
  calculateScore,
} from "@/utils/boardGenerator";

const BOARD_SIZE = 600;
const TOTAL_ROUNDS = 7;
const SAMPLES_PER_ROUND = 5;
const SAMPLE_RADIUS = 50;

const generateRandomDotCount = () => Math.floor(Math.random() * 75001) + 25000;

interface NextBoardData {
  dots: any[];
  totalDots: number;
  actualDensity: number;
  standardDeviation: number;
}

export default function MultiplayerGame() {
  const navigate = useNavigate();
  const [nextBoard, setNextBoard] = useState<NextBoardData | null>(null);
  const [gameState, setGameState] = useState<GameState>({
    currentPlayer: 1,
    currentRound: 1,
    phase: "setup",
    dots: [],
    boardSize: BOARD_SIZE,
    totalDots: 0,
    samplesRemaining: SAMPLES_PER_ROUND,
    rounds: [],
    currentRoundData: {},
  });

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
      playerNumber: gameState.currentPlayer,
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
  };

  const handleContinue = () => {
    if (gameState.rounds.length >= TOTAL_ROUNDS * 2) {
      setGameState({ ...gameState, phase: "complete" });
      return;
    }

    const isPlayer1Turn = gameState.currentPlayer === 1;
    const nextPlayer = isPlayer1Turn ? 2 : 1;
    const nextRound = isPlayer1Turn ? gameState.currentRound : gameState.currentRound + 1;

    setTimeout(() => {
      const totalDots = generateRandomDotCount();
      const dots = generateDotsWithVariableDensity(totalDots, BOARD_SIZE);
      const actualDensity = calculateActualDensity(totalDots, BOARD_SIZE);
      const standardDeviation = calculateStandardDeviation(dots, BOARD_SIZE);
      setNextBoard({ dots, totalDots, actualDensity, standardDeviation });
    }, 0);

    setGameState({
      ...gameState,
      phase: "handoff",
      currentPlayer: nextPlayer,
      currentRound: nextRound,
    });
  };

  const handleHandoffReady = () => {
    const boardData = nextBoard || (() => {
      const totalDots = generateRandomDotCount();
      const dots = generateDotsWithVariableDensity(totalDots, BOARD_SIZE);
      const actualDensity = calculateActualDensity(totalDots, BOARD_SIZE);
      const standardDeviation = calculateStandardDeviation(dots, BOARD_SIZE);
      return { dots, totalDots, actualDensity, standardDeviation };
    })();

    setGameState({
      ...gameState,
      phase: "sampling",
      dots: boardData.dots,
      totalDots: boardData.totalDots,
      samplesRemaining: SAMPLES_PER_ROUND,
      currentRoundData: {
        playerNumber: gameState.currentPlayer,
        samples: [],
        guess: null,
        actualDensity: boardData.actualDensity,
        standardDeviation: boardData.standardDeviation,
        score: 0,
      },
    });
    setNextBoard(null);
  };

  const handleStartGame = (player1Name: string, player2Name: string) => {
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
      player1Name,
      player2Name,
    });
  };

  const handleNewGame = () => {
    setGameState({
      currentPlayer: 1,
      currentRound: 1,
      phase: "setup",
      dots: [],
      boardSize: BOARD_SIZE,
      totalDots: 0,
      samplesRemaining: SAMPLES_PER_ROUND,
      rounds: [],
      currentRoundData: {},
    });
  };

  if (gameState.phase === "setup") {
    return <WelcomeScreen onStart={handleStartGame} />;
  }

  if (gameState.phase === "complete") {
    return (
      <div className="min-h-screen bg-background p-4">
        <GameComplete
          rounds={gameState.rounds}
          onNewGame={handleNewGame}
          player1Name={gameState.player1Name}
          player2Name={gameState.player2Name}
        />
      </div>
    );
  }

  const player1Score = gameState.rounds
    .filter((r) => r.playerNumber === 1)
    .reduce((sum, r) => sum + r.score, 0);

  const player2Score = gameState.rounds
    .filter((r) => r.playerNumber === 2)
    .reduce((sum, r) => sum + r.score, 0);

  return (
    <div className="min-h-screen bg-background p-4">
      <div className="max-w-7xl mx-auto space-y-4">
        {gameState.phase === "handoff" && (
          <HandoffScreen
            nextPlayer={gameState.currentPlayer}
            nextPlayerName={
              gameState.currentPlayer === 1
                ? gameState.player1Name
                : gameState.player2Name
            }
            onReady={handleHandoffReady}
          />
        )}
        {/* Header */}
        <Card className="p-0 bg-card border-2 border-primary shadow-lg shadow-primary/20 overflow-hidden">
          <div className="grid grid-cols-3 gap-0">
            {/* Player 1 Section */}
            <div
              className={`p-4 transition-colors ${
                gameState.currentPlayer === 1 ? "bg-blue-500/20" : "bg-card"
              }`}
            >
              <div className="text-sm text-muted-foreground mb-1">
                {gameState.player1Name || "Player 1"}
              </div>
              <div className="text-3xl font-bold font-mono text-foreground">
                {player1Score.toFixed(1)}
              </div>
            </div>

            {/* Center Section - Game Name and Round */}
            <div className="p-4 flex flex-col items-center justify-center text-center border-x border-border">
              <button
                onClick={() => navigate("/")}
                className="text-2xl sm:text-3xl font-bold text-foreground leading-tight hover:text-primary transition-colors"
              >
                Indexsis
              </button>
              <p className="text-sm text-muted-foreground mt-1">
                Round {gameState.currentRound} of {TOTAL_ROUNDS}
              </p>
            </div>

            {/* Player 2 Section */}
            <div
              className={`p-4 transition-colors ${
                gameState.currentPlayer === 2 ? "bg-blue-500/20" : "bg-card"
              }`}
            >
              <div className="text-sm text-muted-foreground mb-1">
                {gameState.player2Name || "Player 2"}
              </div>
              <div className="text-3xl font-bold font-mono text-foreground">
                {player2Score.toFixed(1)}
              </div>
            </div>
          </div>
        </Card>

        <div className="grid lg:grid-cols-[1fr,400px] gap-4">
          {/* Game Board */}
          <Card className="p-6 bg-card border-primary">
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
          <div className="space-y-4">
            <GuessInput 
              onSubmit={handleGuess} 
              disabled={gameState.phase !== "guessing"}
            />

            <SampleInfo
              samplesRemaining={gameState.samplesRemaining}
              samples={gameState.currentRoundData.samples || []}
            />

            <RoundHistory
              rounds={gameState.rounds}
              player1Name={gameState.player1Name}
              player2Name={gameState.player2Name}
            />
          </div>
        </div>
      </div>

      <Dialog open={gameState.phase === "reveal"} onOpenChange={() => {}}>
        <DialogContent>
          <RoundResult
            roundData={gameState.currentRoundData as any}
            onContinue={handleContinue}
            showContinue={true}
            isRoundComplete={gameState.currentPlayer === 2}
            nextPlayerName={
              gameState.currentPlayer === 1
                ? gameState.player2Name || "Player 2"
                : gameState.player1Name || "Player 1"
            }
          />
        </DialogContent>
      </Dialog>
    </div>
  );
}
