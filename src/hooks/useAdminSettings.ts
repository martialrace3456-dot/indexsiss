import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";

interface SettingsMap {
  require_contest_approval: boolean;
  rounds_per_game: number;
  samples_per_round: number;
  sample_radius: number;
  min_dots: number;
  max_dots: number;
}

const defaultSettings: SettingsMap = {
  require_contest_approval: false,
  rounds_per_game: 7,
  samples_per_round: 5,
  sample_radius: 50,
  min_dots: 25000,
  max_dots: 100000,
};

export function useAdminSettings() {
  const [settings, setSettings] = useState<SettingsMap>(defaultSettings);
  const [loading, setLoading] = useState(true);

  const fetchSettings = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from('admin_settings')
        .select('key, value');

      if (error) throw error;

      const settingsMap = { ...defaultSettings };
      data?.forEach((row) => {
        const key = row.key as keyof SettingsMap;
        if (key in settingsMap) {
          const val = row.value;
          if (typeof val === 'string') {
            if (val === 'true' || val === 'false') {
              (settingsMap as any)[key] = val === 'true';
            } else {
              const num = parseInt(val, 10);
              (settingsMap as any)[key] = isNaN(num) ? val : num;
            }
          } else if (typeof val === 'boolean') {
            (settingsMap as any)[key] = val;
          } else if (typeof val === 'number') {
            (settingsMap as any)[key] = val;
          } else {
            (settingsMap as any)[key] = val;
          }
        }
      });

      setSettings(settingsMap);
    } catch (error) {
      console.error('Error fetching admin settings:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  const updateSetting = async (key: keyof SettingsMap, value: boolean | number | string) => {
    try {
      // Use upsert to handle both insert and update cases
      const { error } = await supabase
        .from('admin_settings')
        .upsert(
          { key, value: value, updated_at: new Date().toISOString() },
          { onConflict: 'key' }
        );

      if (error) throw error;

      setSettings((prev) => ({ ...prev, [key]: value }));
      return true;
    } catch (error) {
      console.error('Error updating setting:', error);
      return false;
    }
  };

  useEffect(() => {
    fetchSettings();
  }, [fetchSettings]);

  return { settings, loading, updateSetting, refetch: fetchSettings };
}
