import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
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
import { useAnnouncements } from "@/hooks/useAnnouncements";
import { Announcement } from "@/types/admin";
import { Plus, Trash2, Info, AlertTriangle, CheckCircle, XCircle } from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";

const TYPE_CONFIG = {
  info: { icon: Info, color: "text-blue-500", bg: "bg-blue-500/20" },
  warning: { icon: AlertTriangle, color: "text-yellow-500", bg: "bg-yellow-500/20" },
  success: { icon: CheckCircle, color: "text-green-500", bg: "bg-green-500/20" },
  error: { icon: XCircle, color: "text-red-500", bg: "bg-red-500/20" },
};

export function AnnouncementManager() {
  const { announcements, loading, createAnnouncement, updateAnnouncement, deleteAnnouncement } =
    useAnnouncements();
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const [newAnnouncement, setNewAnnouncement] = useState({
    message: "",
    type: "info" as Announcement['type'],
    is_active: true,
    expires_at: "",
  });

  const handleCreate = async () => {
    if (!newAnnouncement.message.trim()) {
      toast.error("Please enter a message");
      return;
    }

    const success = await createAnnouncement({
      ...newAnnouncement,
      expires_at: newAnnouncement.expires_at || null,
    });

    if (success) {
      toast.success("Announcement created");
      setShowAddDialog(false);
      setNewAnnouncement({ message: "", type: "info", is_active: true, expires_at: "" });
    } else {
      toast.error("Failed to create announcement");
    }
  };

  const handleToggleActive = async (id: string, currentActive: boolean) => {
    const success = await updateAnnouncement(id, { is_active: !currentActive });
    if (success) {
      toast.success(currentActive ? "Announcement deactivated" : "Announcement activated");
    }
  };

  const handleDelete = async () => {
    if (!deletingId) return;
    const success = await deleteAnnouncement(deletingId);
    if (success) {
      toast.success("Announcement deleted");
    } else {
      toast.error("Failed to delete announcement");
    }
    setDeletingId(null);
  };

  const isExpired = (expiresAt: string | null) => {
    if (!expiresAt) return false;
    return new Date(expiresAt) < new Date();
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
        <h2 className="text-2xl font-bold">Announcements</h2>
        <Button onClick={() => setShowAddDialog(true)}>
          <Plus className="h-4 w-4 mr-2" />
          New Announcement
        </Button>
      </div>

      <div className="space-y-4">
        {announcements.length === 0 ? (
          <Card>
            <CardContent className="py-8 text-center text-muted-foreground">
              No announcements yet. Create one to broadcast messages to all players.
            </CardContent>
          </Card>
        ) : (
          announcements.map((announcement) => {
            const typeConfig = TYPE_CONFIG[announcement.type];
            const TypeIcon = typeConfig.icon;
            const expired = isExpired(announcement.expires_at);

            return (
              <Card
                key={announcement.id}
                className={`${announcement.is_active && !expired ? "border-primary" : ""} ${
                  expired ? "opacity-60" : ""
                }`}
              >
                <CardContent className="p-4">
                  <div className="flex items-start gap-4">
                    <div className={`p-2 rounded-lg ${typeConfig.bg}`}>
                      <TypeIcon className={`h-5 w-5 ${typeConfig.color}`} />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <Badge variant="outline" className={`${typeConfig.bg} ${typeConfig.color}`}>
                          {announcement.type}
                        </Badge>
                        {announcement.is_active && !expired && (
                          <Badge className="bg-primary/20 text-primary">Active</Badge>
                        )}
                        {expired && <Badge variant="secondary">Expired</Badge>}
                      </div>
                      <p className="text-foreground">{announcement.message}</p>
                      <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground">
                        <span>Created: {format(new Date(announcement.created_at), 'MMM d, yyyy h:mm a')}</span>
                        {announcement.expires_at && (
                          <span>Expires: {format(new Date(announcement.expires_at), 'MMM d, yyyy h:mm a')}</span>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Switch
                        checked={announcement.is_active}
                        onCheckedChange={() =>
                          handleToggleActive(announcement.id, announcement.is_active)
                        }
                      />
                      <Button
                        variant="destructive"
                        size="icon"
                        onClick={() => setDeletingId(announcement.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })
        )}
      </div>

      {/* Add Announcement Dialog */}
      <AlertDialog open={showAddDialog} onOpenChange={setShowAddDialog}>
        <AlertDialogContent className="max-w-lg">
          <AlertDialogHeader>
            <AlertDialogTitle>New Announcement</AlertDialogTitle>
            <AlertDialogDescription>
              Create a new announcement to broadcast to all active players.
            </AlertDialogDescription>
          </AlertDialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Message</Label>
              <Textarea
                placeholder="Enter your announcement message..."
                value={newAnnouncement.message}
                onChange={(e) =>
                  setNewAnnouncement((prev) => ({ ...prev, message: e.target.value }))
                }
                rows={3}
              />
            </div>

            <div className="space-y-2">
              <Label>Type</Label>
              <Select
                value={newAnnouncement.type}
                onValueChange={(v) =>
                  setNewAnnouncement((prev) => ({ ...prev, type: v as Announcement['type'] }))
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="info">Info</SelectItem>
                  <SelectItem value="warning">Warning</SelectItem>
                  <SelectItem value="success">Success</SelectItem>
                  <SelectItem value="error">Error</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Expires At (optional)</Label>
              <Input
                type="datetime-local"
                value={newAnnouncement.expires_at}
                onChange={(e) =>
                  setNewAnnouncement((prev) => ({ ...prev, expires_at: e.target.value }))
                }
              />
            </div>

            <div className="flex items-center gap-2">
              <Switch
                id="new-active-announcement"
                checked={newAnnouncement.is_active}
                onCheckedChange={(checked) =>
                  setNewAnnouncement((prev) => ({ ...prev, is_active: checked }))
                }
              />
              <Label htmlFor="new-active-announcement">Activate immediately</Label>
            </div>
          </div>

          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleCreate}>Create Announcement</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Delete Dialog */}
      <AlertDialog open={!!deletingId} onOpenChange={() => setDeletingId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Announcement</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this announcement? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-destructive text-destructive-foreground"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
