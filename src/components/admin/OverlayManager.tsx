import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
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
import { useOverlay } from "@/hooks/useOverlay";
import { supabase } from "@/integrations/supabase/client";
import { OverlayContent } from "@/types/admin";
import { Plus, Trash2, Image, Video, Upload } from "lucide-react";
import { toast } from "sonner";

const POSITIONS = [
  { value: "board-cover", label: "Board Cover (Full)" },
  { value: "top-banner", label: "Top Banner" },
  { value: "bottom-banner", label: "Bottom Banner" },
  { value: "corner-badge", label: "Corner Badge" },
];

export function OverlayManager() {
  const { overlays, loading, createOverlay, updateOverlay, deleteOverlay } = useOverlay();
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);

  const [newOverlay, setNewOverlay] = useState({
    position: "board-cover" as OverlayContent['position'],
    content_type: "image" as OverlayContent['content_type'],
    url: "",
    is_active: false,
    display_start: "",
    display_end: "",
  });

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    try {
      const fileExt = file.name.split(".").pop();
      const fileName = `${Date.now()}.${fileExt}`;

      const { error: uploadError } = await supabase.storage
        .from("overlays")
        .upload(fileName, file);

      if (uploadError) throw uploadError;

      const { data: urlData } = supabase.storage.from("overlays").getPublicUrl(fileName);

      setNewOverlay((prev) => ({
        ...prev,
        url: urlData.publicUrl,
        content_type: file.type.startsWith("video") ? "video" : "image",
      }));

      toast.success("File uploaded successfully");
    } catch (error) {
      console.error("Upload error:", error);
      toast.error("Failed to upload file");
    } finally {
      setUploading(false);
    }
  };

  const handleCreate = async () => {
    if (!newOverlay.url) {
      toast.error("Please provide a URL or upload a file");
      return;
    }

    const success = await createOverlay({
      ...newOverlay,
      display_start: newOverlay.display_start || null,
      display_end: newOverlay.display_end || null,
    });

    if (success) {
      toast.success("Overlay created");
      setShowAddDialog(false);
      setNewOverlay({
        position: "board-cover",
        content_type: "image",
        url: "",
        is_active: false,
        display_start: "",
        display_end: "",
      });
    } else {
      toast.error("Failed to create overlay");
    }
  };

  const handleToggleActive = async (id: string, currentActive: boolean) => {
    const success = await updateOverlay(id, { is_active: !currentActive });
    if (success) {
      toast.success(currentActive ? "Overlay deactivated" : "Overlay activated");
    }
  };

  const handleDelete = async () => {
    if (!deletingId) return;
    const success = await deleteOverlay(deletingId);
    if (success) {
      toast.success("Overlay deleted");
    } else {
      toast.error("Failed to delete overlay");
    }
    setDeletingId(null);
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
        <h2 className="text-2xl font-bold">Overlay Management</h2>
        <Button onClick={() => setShowAddDialog(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Add Overlay
        </Button>
      </div>

      <div className="grid gap-4">
        {overlays.length === 0 ? (
          <Card>
            <CardContent className="py-8 text-center text-muted-foreground">
              No overlays configured. Click "Add Overlay" to create one.
            </CardContent>
          </Card>
        ) : (
          overlays.map((overlay) => (
            <Card key={overlay.id} className={overlay.is_active ? "border-primary" : ""}>
              <CardContent className="p-4">
                <div className="flex items-start gap-4">
                  <div className="w-24 h-24 bg-muted rounded-lg overflow-hidden flex-shrink-0">
                    {overlay.content_type === "image" ? (
                      <img
                        src={overlay.url}
                        alt="Overlay preview"
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <video
                        src={overlay.url}
                        className="w-full h-full object-cover"
                        muted
                      />
                    )}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      {overlay.content_type === "image" ? (
                        <Image className="h-4 w-4 text-muted-foreground" />
                      ) : (
                        <Video className="h-4 w-4 text-muted-foreground" />
                      )}
                      <span className="font-medium">
                        {POSITIONS.find((p) => p.value === overlay.position)?.label}
                      </span>
                      {overlay.is_active && (
                        <span className="text-xs bg-primary/20 text-primary px-2 py-0.5 rounded">
                          Active
                        </span>
                      )}
                    </div>
                    <p className="text-sm text-muted-foreground truncate max-w-md">
                      {overlay.url}
                    </p>
                    {(overlay.display_start || overlay.display_end) && (
                      <p className="text-xs text-muted-foreground mt-1">
                        {overlay.display_start && `From: ${new Date(overlay.display_start).toLocaleString()}`}
                        {overlay.display_start && overlay.display_end && " | "}
                        {overlay.display_end && `Until: ${new Date(overlay.display_end).toLocaleString()}`}
                      </p>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    <Switch
                      checked={overlay.is_active}
                      onCheckedChange={() => handleToggleActive(overlay.id, overlay.is_active)}
                    />
                    <Button
                      variant="destructive"
                      size="icon"
                      onClick={() => setDeletingId(overlay.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>

      {/* Add Overlay Dialog */}
      <AlertDialog open={showAddDialog} onOpenChange={setShowAddDialog}>
        <AlertDialogContent className="max-w-lg">
          <AlertDialogHeader>
            <AlertDialogTitle>Add New Overlay</AlertDialogTitle>
            <AlertDialogDescription>
              Configure a new overlay for the game interface.
            </AlertDialogDescription>
          </AlertDialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Position</Label>
              <Select
                value={newOverlay.position}
                onValueChange={(v) =>
                  setNewOverlay((prev) => ({ ...prev, position: v as OverlayContent['position'] }))
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {POSITIONS.map((pos) => (
                    <SelectItem key={pos.value} value={pos.value}>
                      {pos.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Content Type</Label>
              <Select
                value={newOverlay.content_type}
                onValueChange={(v) =>
                  setNewOverlay((prev) => ({ ...prev, content_type: v as 'image' | 'video' }))
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="image">Image</SelectItem>
                  <SelectItem value="video">Video</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Upload File or Enter URL</Label>
              <div className="flex gap-2">
                <Input
                  placeholder="https://..."
                  value={newOverlay.url}
                  onChange={(e) => setNewOverlay((prev) => ({ ...prev, url: e.target.value }))}
                />
                <Button variant="outline" className="flex-shrink-0" disabled={uploading}>
                  <label className="cursor-pointer flex items-center gap-2">
                    <Upload className="h-4 w-4" />
                    {uploading ? "Uploading..." : "Upload"}
                    <input
                      type="file"
                      accept="image/*,video/*"
                      onChange={handleFileUpload}
                      className="hidden"
                    />
                  </label>
                </Button>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Display Start (optional)</Label>
                <Input
                  type="datetime-local"
                  value={newOverlay.display_start}
                  onChange={(e) =>
                    setNewOverlay((prev) => ({ ...prev, display_start: e.target.value }))
                  }
                />
              </div>
              <div className="space-y-2">
                <Label>Display End (optional)</Label>
                <Input
                  type="datetime-local"
                  value={newOverlay.display_end}
                  onChange={(e) =>
                    setNewOverlay((prev) => ({ ...prev, display_end: e.target.value }))
                  }
                />
              </div>
            </div>

            <div className="flex items-center gap-2">
              <Switch
                id="new-active"
                checked={newOverlay.is_active}
                onCheckedChange={(checked) =>
                  setNewOverlay((prev) => ({ ...prev, is_active: checked }))
                }
              />
              <Label htmlFor="new-active">Activate immediately</Label>
            </div>
          </div>

          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleCreate}>Create Overlay</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Delete Dialog */}
      <AlertDialog open={!!deletingId} onOpenChange={() => setDeletingId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Overlay</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this overlay? This action cannot be undone.
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
