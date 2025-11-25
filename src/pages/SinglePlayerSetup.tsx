import { useNavigate } from "react-router-dom";
import { SinglePlayerSetup } from "@/components/SinglePlayerSetup";

export default function SinglePlayerSetupPage() {
  const navigate = useNavigate();

  const handleStart = (playerName: string) => {
    navigate("/single-player", { state: { playerName } });
  };

  return <SinglePlayerSetup onStart={handleStart} />;
}
