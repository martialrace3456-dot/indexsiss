import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { useContestApproval } from "@/hooks/useContestApproval";
import { useAdminSettings } from "@/hooks/useAdminSettings";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { format } from "date-fns";
import { Check, X, Trash2, Clock, Users } from "lucide-react";
import { toast } from "sonner";

export function ContestApproval() {
  const { contests, pendingContests, loading, approveContest, rejectContest, deleteContest } =
    useContestApproval();
  const { settings, updateSetting } = useAdminSettings();

  const [rejectingId, setRejectingId] = useState<string | null>(null);
  const [rejectNotes, setRejectNotes] = useState("");
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [filter, setFilter] = useState<'all' | 'pending' | 'approved' | 'rejected'>('all');

  const handleApprove = async (id: string) => {
    const success = await approveContest(id);
    if (success) {
      toast.success("Contest approved");
    } else {
      toast.error("Failed to approve contest");
    }
  };

  const handleReject = async () => {
    if (!rejectingId) return;
    const success = await rejectContest(rejectingId, rejectNotes);
    if (success) {
      toast.success("Contest rejected");
    } else {
      toast.error("Failed to reject contest");
    }
    setRejectingId(null);
    setRejectNotes("");
  };

  const handleDelete = async () => {
    if (!deletingId) return;
    const success = await deleteContest(deletingId);
    if (success) {
      toast.success("Contest deleted");
    } else {
      toast.error("Failed to delete contest");
    }
    setDeletingId(null);
  };

  const handleApprovalToggle = async (checked: boolean) => {
    await updateSetting('require_contest_approval', checked);
    toast.success(checked ? "Contest approval enabled" : "Contest auto-approval enabled");
  };

  const filteredContests = contests.filter((c) => {
    if (filter === 'all') return true;
    return c.approval_status === filter;
  });

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending':
        return <Badge variant="outline" className="bg-yellow-500/20 text-yellow-500">Pending</Badge>;
      case 'approved':
        return <Badge variant="outline" className="bg-green-500/20 text-green-500">Approved</Badge>;
      case 'rejected':
        return <Badge variant="outline" className="bg-red-500/20 text-red-500">Rejected</Badge>;
      default:
        return null;
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">Contest Management</h2>
        <div className="flex items-center gap-2">
          <Switch
            id="require-approval"
            checked={settings.require_contest_approval}
            onCheckedChange={handleApprovalToggle}
          />
          <Label htmlFor="require-approval">Require manual approval</Label>
        </div>
      </div>

      {pendingContests.length > 0 && (
        <Card className="border-yellow-500/50">
          <CardHeader>
            <CardTitle className="text-yellow-500">
              Pending Approval ({pendingContests.length})
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {pendingContests.map((contest) => (
              <div
                key={contest.id}
                className="flex items-center justify-between p-4 bg-muted rounded-lg"
              >
                <div>
                  <p className="font-medium">{contest.name}</p>
                  <div className="flex items-center gap-4 text-sm text-muted-foreground mt-1">
                    <span className="flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      {contest.duration_minutes} min
                    </span>
                    <span className="flex items-center gap-1">
                      <Users className="h-3 w-3" />
                      Limit: {contest.participant_limit}
                    </span>
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button size="sm" onClick={() => handleApprove(contest.id)}>
                    <Check className="h-4 w-4 mr-1" />
                    Approve
                  </Button>
                  <Button
                    size="sm"
                    variant="destructive"
                    onClick={() => setRejectingId(contest.id)}
                  >
                    <X className="h-4 w-4 mr-1" />
                    Reject
                  </Button>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      <div className="flex gap-2">
        {(['all', 'pending', 'approved', 'rejected'] as const).map((f) => (
          <Button
            key={f}
            variant={filter === f ? "default" : "outline"}
            size="sm"
            onClick={() => setFilter(f)}
          >
            {f.charAt(0).toUpperCase() + f.slice(1)}
          </Button>
        ))}
      </div>

      <div className="space-y-4">
        {filteredContests.map((contest) => (
          <Card key={contest.id}>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <p className="font-medium">{contest.name}</p>
                    {getStatusBadge(contest.approval_status)}
                    {contest.status === 'expired' && (
                      <Badge variant="secondary">Expired</Badge>
                    )}
                  </div>
                  <div className="flex items-center gap-4 text-sm text-muted-foreground">
                    <span>Duration: {contest.duration_minutes} min</span>
                    <span>Participants: {contest.participant_count}/{contest.participant_limit}</span>
                    <span>Created: {format(new Date(contest.created_at), 'MMM d, yyyy')}</span>
                  </div>
                  {contest.admin_notes && (
                    <p className="text-sm text-red-400 mt-2">Note: {contest.admin_notes}</p>
                  )}
                </div>
                <div className="flex gap-2">
                  {contest.approval_status !== 'approved' && (
                    <Button size="sm" variant="outline" onClick={() => handleApprove(contest.id)}>
                      <Check className="h-4 w-4" />
                    </Button>
                  )}
                  <Button
                    size="sm"
                    variant="destructive"
                    onClick={() => setDeletingId(contest.id)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Reject Dialog */}
      <AlertDialog open={!!rejectingId} onOpenChange={() => setRejectingId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Reject Contest</AlertDialogTitle>
            <AlertDialogDescription>
              Provide a reason for rejecting this contest (optional).
            </AlertDialogDescription>
          </AlertDialogHeader>
          <Textarea
            placeholder="Reason for rejection..."
            value={rejectNotes}
            onChange={(e) => setRejectNotes(e.target.value)}
          />
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleReject}>Reject</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Delete Dialog */}
      <AlertDialog open={!!deletingId} onOpenChange={() => setDeletingId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Contest</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete the contest and all its scores. This action cannot be
              undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
