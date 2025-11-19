import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { CloudConfig, Paper, Collection } from '../types';

let supabaseInstance: SupabaseClient | null = null;

export const getSupabaseClient = (config: CloudConfig): SupabaseClient | null => {
  if (!config.supabaseUrl || !config.supabaseKey || !config.isEnabled) {
    return null;
  }

  if (!supabaseInstance) {
    try {
        supabaseInstance = createClient(config.supabaseUrl, config.supabaseKey);
    } catch (e) {
        console.error("Failed to create Supabase client", e);
        return null;
    }
  }
  return supabaseInstance;
};

export const resetSupabaseClient = () => {
    supabaseInstance = null;
};

// Data structure for the Cloud Backup
export interface BackupData {
    papers: Paper[];
    collections: Collection[];
    updatedAt: number;
    deviceId: string;
}

export const syncToCloud = async (config: CloudConfig, data: BackupData) => {
    const client = getSupabaseClient(config);
    if (!client) throw new Error("Cloud not configured");

    // Check for auth
    const { data: { user } } = await client.auth.getUser();
    if (!user) throw new Error("Not authenticated");

    // We store the entire state as a JSON blob in a 'backups' table for simplicity in this version
    // Table schema: id (uuid), user_id (uuid), data (jsonb), updated_at (timestamptz)
    
    const { error } = await client
        .from('user_backups')
        .upsert({ 
            user_id: user.id,
            data: data,
            updated_at: new Date().toISOString()
        }, { onConflict: 'user_id' });

    if (error) throw error;
    return Date.now();
};

export const pullFromCloud = async (config: CloudConfig): Promise<BackupData | null> => {
    const client = getSupabaseClient(config);
    if (!client) throw new Error("Cloud not configured");

    const { data: { user } } = await client.auth.getUser();
    if (!user) throw new Error("Not authenticated");

    const { data, error } = await client
        .from('user_backups')
        .select('data')
        .eq('user_id', user.id)
        .single();

    if (error) {
        if (error.code === 'PGRST116') return null; // No data found
        throw error;
    }

    return data?.data as BackupData;
};