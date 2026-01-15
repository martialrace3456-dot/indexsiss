import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Announcement } from "@/types/admin";

export function useAnnouncements() {
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [activeAnnouncements, setActiveAnnouncements] = useState<Announcement[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchAnnouncements = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from('announcements')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;

      const typedData = (data || []).map((item) => ({
        ...item,
        type: item.type as Announcement['type'],
      }));

      setAnnouncements(typedData);

      // Filter active announcements
      const now = new Date();
      const active = typedData.filter((a) => {
        if (!a.is_active) return false;
        if (a.expires_at && new Date(a.expires_at) < now) return false;
        return true;
      });

      setActiveAnnouncements(active);
    } catch (error) {
      console.error('Error fetching announcements:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  const createAnnouncement = async (announcement: Omit<Announcement, 'id' | 'created_at'>) => {
    try {
      const { error } = await supabase.from('announcements').insert(announcement);
      if (error) throw error;
      await fetchAnnouncements();
      return true;
    } catch (error) {
      console.error('Error creating announcement:', error);
      return false;
    }
  };

  const updateAnnouncement = async (id: string, updates: Partial<Announcement>) => {
    try {
      const { error } = await supabase.from('announcements').update(updates).eq('id', id);
      if (error) throw error;
      await fetchAnnouncements();
      return true;
    } catch (error) {
      console.error('Error updating announcement:', error);
      return false;
    }
  };

  const deleteAnnouncement = async (id: string) => {
    try {
      const { error } = await supabase.from('announcements').delete().eq('id', id);
      if (error) throw error;
      await fetchAnnouncements();
      return true;
    } catch (error) {
      console.error('Error deleting announcement:', error);
      return false;
    }
  };

  // Subscribe to realtime updates
  useEffect(() => {
    fetchAnnouncements();

    const channel = supabase
      .channel('announcements-changes')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'announcements' },
        () => {
          fetchAnnouncements();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [fetchAnnouncements]);

  return {
    announcements,
    activeAnnouncements,
    loading,
    createAnnouncement,
    updateAnnouncement,
    deleteAnnouncement,
    refetch: fetchAnnouncements,
  };
}
