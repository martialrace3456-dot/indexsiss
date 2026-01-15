import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useGameAnalytics } from "@/hooks/useGameAnalytics";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from "recharts";
import { Gamepad2, Users, Trophy, TrendingUp, Calendar, Clock } from "lucide-react";

export function AnalyticsDashboard() {
  const { analytics, loading } = useGameAnalytics();

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!analytics) {
    return <p className="text-muted-foreground">Unable to load analytics.</p>;
  }

  const statCards = [
    { label: "Total Games", value: analytics.totalGames, icon: Gamepad2, color: "text-blue-500" },
    { label: "Today's Games", value: analytics.todayGames, icon: Calendar, color: "text-green-500" },
    { label: "This Week", value: analytics.weekGames, icon: Clock, color: "text-yellow-500" },
    { label: "Active Contests", value: analytics.activeContests, icon: Trophy, color: "text-purple-500" },
    { label: "Unique Players", value: analytics.uniquePlayers, icon: Users, color: "text-pink-500" },
    { label: "Avg Score", value: analytics.averageScore, icon: TrendingUp, color: "text-cyan-500" },
  ];

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold">Analytics Dashboard</h2>

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        {statCards.map((stat) => (
          <Card key={stat.label}>
            <CardContent className="pt-4">
              <div className="flex items-center gap-2 mb-2">
                <stat.icon className={`h-5 w-5 ${stat.color}`} />
                <span className="text-sm text-muted-foreground">{stat.label}</span>
              </div>
              <p className="text-2xl font-bold">{stat.value.toLocaleString()}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Games by Hour (Last 7 Days)</CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={analytics.hourlyDistribution}>
              <XAxis 
                dataKey="hour" 
                tickFormatter={(h) => `${h}:00`}
                stroke="hsl(var(--muted-foreground))"
              />
              <YAxis stroke="hsl(var(--muted-foreground))" />
              <Tooltip
                contentStyle={{
                  backgroundColor: "hsl(var(--card))",
                  border: "1px solid hsl(var(--border))",
                  borderRadius: "8px",
                }}
                labelFormatter={(h) => `${h}:00 - ${h}:59`}
              />
              <Bar dataKey="count" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>
    </div>
  );
}
