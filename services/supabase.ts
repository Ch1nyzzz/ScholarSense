
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { CloudConfig, Paper, Collection } from '../types';

let supabaseInstance: SupabaseClient | null = null;

export const getSupabaseClient = (config: CloudConfig): SupabaseClient | null => {
  if (!config.supabaseUrl || !config.supabaseKey || !config.isEnabled) {
    return null;
  }

  if (!supabaseInstance) {
    try {
        supabaseInstance = createClient(config.supabaseUrl, config.supabaseKey, {
            auth: {
                persistSession: true,
                autoRefreshToken: true,
            }
        });
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

// Helper to format Supabase errors
const formatError = (error: any): Error => {
    const msg = error?.message || "";
    
    // Postgres Error 42P01: undefined_table
    // PGRST200: Schema cache lookup failed (table missing from api exposure)
    // Also catch generic "Could not find the table" messages
    if (
        error?.code === '42P01' || 
        error?.code === 'PGRST200' || 
        msg.includes('schema cache') || 
        msg.includes('Could not find the table')
    ) {
        return new Error("Database setup incomplete. Please click 'View SQL' in Settings and run the script in Supabase.");
    }

    // Postgres Error 42501: insufficient_privilege (RLS)
    if (error?.code === '42501') {
        return new Error("Permission denied. Please check your RLS policies in Supabase.");
    }

    // Postgres Error 22P02: invalid_text_representation (Invalid input syntax for type uuid)
    if (error?.code === '22P02' && msg.includes('uuid')) {
        return new Error("Sync Error: Old local data uses invalid IDs. Please delete old papers and re-upload.");
    }

    return new Error(msg || "Unknown Supabase error");
};

// --- Storage Operations ---

export const uploadPdfToStorage = async (config: CloudConfig, file: File, userId: string): Promise<string | null> => {
    const client = getSupabaseClient(config);
    if (!client) return null;

    const fileExt = file.name.split('.').pop();
    const fileName = `${userId}/${Date.now()}_${Math.random().toString(36).substring(7)}.${fileExt}`;

    const { error } = await client.storage
        .from('papers')
        .upload(fileName, file, {
            cacheControl: '3600',
            upsert: false
        });

    if (error) {
        console.error("Storage upload failed:", JSON.stringify(error));
        throw formatError(error);
    }

    return fileName;
};

export const getPdfUrlFromStorage = async (config: CloudConfig, path: string): Promise<string | null> => {
    const client = getSupabaseClient(config);
    if (!client) return null;

    const { data } = await client.storage
        .from('papers')
        .createSignedUrl(path, 3600 * 24); // Valid for 24 hours

    return data?.signedUrl || null;
};

// --- Database Operations ---

export const savePaperToCloud = async (config: CloudConfig, paper: Paper) => {
    const client = getSupabaseClient(config);
    if (!client) return; // If config is not enabled, we rely on local storage only.

    const { data: { user } } = await client.auth.getUser();
    
    // CRITICAL CHANGE: Explicitly fail if configured but not logged in
    if (!user) {
         throw new Error("Sync Failed: You are not logged in. Please go to Settings > Cloud Sync to login.");
    }

    const dbRecord = {
        id: paper.id,
        user_id: user.id,
        title: paper.analysis?.title || paper.originalTitle,
        original_title: paper.originalTitle,
        source_url: paper.sourceUrl,
        storage_path: paper.storagePath,
        analysis: paper.analysis,
        tags: paper.tags,
        status: paper.status,
        is_favorite: paper.isFavorite,
        user_notes: paper.userNotes,
        created_at: new Date(paper.dateAdded).toISOString()
    };

    const { error } = await client
        .from('papers')
        .upsert(dbRecord);

    if (error) {
        // Log full error object to console for debugging
        console.error("DB Save Error:", JSON.stringify(error));
        throw formatError(error);
    }
};

export const fetchPapersFromCloud = async (config: CloudConfig): Promise<Paper[]> => {
    const client = getSupabaseClient(config);
    if (!client) return [];

    const { data, error } = await client
        .from('papers')
        .select('*')
        .order('created_at', { ascending: false });

    if (error) throw formatError(error);

    return data.map((record: any) => ({
        id: record.id,
        originalTitle: record.original_title || record.title,
        dateAdded: new Date(record.created_at).getTime(),
        status: record.status,
        analysis: record.analysis,
        sourceUrl: record.source_url,
        storagePath: record.storage_path,
        tags: record.tags || [],
        collectionIds: [],
        userNotes: record.user_notes || '',
        isFavorite: record.is_favorite || false,
        isRead: false,
        pdfData: undefined
    }));
};

export const deletePaperFromCloud = async (config: CloudConfig, id: string, storagePath?: string) => {
    const client = getSupabaseClient(config);
    if (!client) return;

    const { error: dbError } = await client.from('papers').delete().eq('id', id);
    if (dbError) throw formatError(dbError);

    if (storagePath) {
        const { error: storageError } = await client.storage.from('papers').remove([storagePath]);
        if (storageError) console.error("Error deleting storage file", storageError);
    }
};
