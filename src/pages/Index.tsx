import { useState } from "react";
import { GameState, RoundData } from "@/types/game";
import {
  generateDotsWithVariableDensity,
  calculateLocalDensity,
  calculateActualDensity,
  calculateStandardDeviation,
  calculateScore,
} from "@/utils/boardGenerator";
import { GameBoard } from "@/components/GameBoard";
import { SampleInfo } from "@/components/SampleInfo";
import { GuessInput } from "@/components/GuessInput";
import { RoundResult } from "@/components/RoundResult";
import { RoundHistory } from "@/components/RoundHistory";
import { HandoffScreen } from "@/components/HandoffScreen";
import { GameComplete } from "@/components/GameComplete";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

const BOARD_SIZE = 1000;
const TOTAL_DOTS = 300000;
const SAMPLES_PER_ROUND = 5;
const TOTAL_ROUNDS = 10; // 5 rounds per player

const Index = () => {
  const [gameState, setGameState] = useState<GameState>(() => {
    const dots = generateDotsWithVariableDensity(TOTAL_DOTS, BOARD_SIZE);
    const actualDensity = calculateActualDensity(TOTAL_DOTS, BOARD_SIZE);
    const standardDeviation = calculateStandardDeviation(dots, BOARD_SIZE);

    return {
      currentPlayer: 1,
      currentRound: 1,
      phase: "sampling",
      dots,
      boardSize: BOARD_SIZE,
      totalDots: TOTAL_DOTS,
      samplesRemaining: SAMPLES_PER_ROUND,
      rounds: [],
      currentRoundData: {
        playerNumber: 1,
        samples: [],
        actualDensity,
        standardDeviation,
        score: 0,
      },
    };
  });

  const handleSample = (x: number, y: number) => {
    if (gameState.phase !== "sampling" || gameState.samplesRemaining <= 0)
      return;

    const minRadius = BOARD_SIZE * 0.05;
    const maxRadius = BOARD_SIZE * 0.15;
    const radius = minRadius + Math.random() * (maxRadius - minRadius);

    const localDensity = calculateLocalDensity(
      gameState.dots,
      x,
      y,
      radius
    );

    const newSamples = [
      ...(gameState.currentRoundData.samples || []),
      { x, y, radius, localDensity },
    ];

    setGameState({
      ...gameState,
      samplesRemaining: gameState.samplesRemaining - 1,
      currentRoundData: {
        ...gameState.currentRoundData,
        samples: newSamples,
      },
      phase: gameState.samplesRemaining === 1 ? "guessing" : "sampling",
    });
  };

  const handleGuess = (guess: number) => {
    const score = calculateScore(
      guess,
      gameState.currentRoundData.actualDensity!,
      gameState.currentRoundData.standardDeviation!
    );

    const completedRound: RoundData = {
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
      currentRoundData: completedRound,
      rounds: [...gameState.rounds, completedRound],
    });
  };

  const handleContinue = () => {
    if (gameState.currentRound >= TOTAL_ROUNDS) {
      setGameState({ ...gameState, phase: "complete" });
      return;
    }

    const nextPlayer = gameState.currentPlayer === 1 ? 2 : 1;
    setGameState({
      ...gameState,
      phase: "handoff",
      currentPlayer: nextPlayer,
      currentRound: gameState.currentRound + 1,
    });
  };

  const handleHandoffReady = () => {
    const dots = generateDotsWithVariableDensity(TOTAL_DOTS, BOARD_SIZE);
    const actualDensity = calculateActualDensity(TOTAL_DOTS, BOARD_SIZE);
    const standardDeviation = calculateStandardDeviation(dots, BOARD_SIZE);

    setGameState({
      ...gameState,
      phase: "sampling",
      dots,
      samplesRemaining: SAMPLES_PER_ROUND,
      currentRoundData: {
        playerNumber: gameState.currentPlayer,
        samples: [],
        actualDensity,
        standardDeviation,
        score: 0,
      },
    });
  };

  const handleNewGame = () => {
    const dots = generateDotsWithVariableDensity(TOTAL_DOTS, BOARD_SIZE);
    const actualDensity = calculateActualDensity(TOTAL_DOTS, BOARD_SIZE);
    const standardDeviation = calculateStandardDeviation(dots, BOARD_SIZE);

    setGameState({
      currentPlayer: 1,
      currentRound: 1,
      phase: "sampling",
      dots,
      boardSize: BOARD_SIZE,
      totalDots: TOTAL_DOTS,
      samplesRemaining: SAMPLES_PER_ROUND,
      rounds: [],
      currentRoundData: {
        playerNumber: 1,
        samples: [],
        actualDensity,
        standardDeviation,
        score: 0,
      },
    });
  };

  if (gameState.phase === "handoff") {
    return (
      <HandoffScreen
        nextPlayer={gameState.currentPlayer}
        onReady={handleHandoffReady}
      />
    );
  }

  if (gameState.phase === "complete") {
    return <GameComplete rounds={gameState.rounds} onNewGame={handleNewGame} />;
  }

  return (
    <div className="min-h-screen bg-gradient-board p-4">
      <div className="max-w-7xl mx-auto space-y-4">
        {/* Header */}
        <Card className="p-4 bg-card border-primary">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-foreground">
                Sigma Guess
              </h1>
              <p className="text-sm text-muted-foreground">
                Statistical Estimation Game
              </p>
            </div>
            <div className="flex gap-4">
              <div className="text-center">
                <div className="text-xs text-muted-foreground">Round</div>
                <div className="text-2xl font-bold font-mono text-foreground">
                  {gameState.currentRound}/{TOTAL_ROUNDS}
                </div>
              </div>
              <div
                className={`w-16 h-16 rounded-full flex items-center justify-center text-2xl font-bold ${
                  gameState.currentPlayer === 1
                    ? "bg-primary text-primary-foreground"
                    : "bg-secondary text-secondary-foreground"
                }`}
              >
                P{gameState.currentPlayer}
              </div>
            </div>
          </div>
        </Card>

        <div className="grid lg:grid-cols-3 gap-4">
          {/* Main Board */}
          <div className="lg:col-span-2 space-y-4">
            <Card className="p-4 bg-card border-primary">
              <GameBoard
                dots={gameState.dots}
                boardSize={gameState.boardSize}
                samples={gameState.currentRoundData.samples || []}
                showDots={gameState.phase === "reveal"}
                onSample={handleSample}
                canSample={gameState.phase === "sampling"}
              />
              {gameState.phase === "sampling" && (
                <p className="text-center text-sm text-muted-foreground mt-4">
                  Touch the covered board to take samples
                </p>
              )}
            </Card>

            {gameState.phase === "reveal" && (
              <RoundResult
                roundData={gameState.currentRoundData as RoundData}
                onContinue={handleContinue}
                showContinue={true}
              />
            )}
          </div>

          {/* Side Panel */}
          <div className="space-y-4">
            {(gameState.phase === "sampling" || gameState.phase === "reveal") && (
              <Card className="p-4 bg-card border-primary">
                <SampleInfo
                  samples={gameState.currentRoundData.samples || []}
                  samplesRemaining={gameState.samplesRemaining}
                />
              </Card>
            )}

            {gameState.phase === "guessing" && (
              <GuessInput onSubmit={handleGuess} />
            )}

            {gameState.rounds.length > 0 && (
              <Card className="p-4 bg-card border-primary">
                <RoundHistory rounds={gameState.rounds} />
              </Card>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Index;
