import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface SinglePlayerSetupProps {
  onStart: (playerName: string) => void;
}

export const SinglePlayerSetup = ({ onStart }: SinglePlayerSetupProps) => {
  const [playerName, setPlayerName] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (playerName.trim()) {
      onStart(playerName.trim());
    }
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <Card className="w-full max-w-md border-2 border-primary shadow-lg shadow-primary/20">
        <CardHeader>
          <CardTitle className="text-3xl text-center text-foreground">
            The Estimator Challenge
          </CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <label htmlFor="playerName" className="text-sm font-medium text-foreground">
                Enter Your Name
              </label>
              <Input
                id="playerName"
                type="text"
                value={playerName}
                onChange={(e) => setPlayerName(e.target.value)}
                placeholder="Your name"
                className="bg-input border-border"
                maxLength={20}
              />
            </div>

            <Button
              type="submit"
              disabled={!playerName.trim()}
              className="w-full bg-gradient-accent hover:opacity-90 text-primary-foreground font-semibold text-lg py-6"
            >
              Start Challenge
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};
