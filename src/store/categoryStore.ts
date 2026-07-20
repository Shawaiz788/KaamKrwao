import { create } from 'zustand';
import { getCategoriesFromBackend } from '@/services/task';
import { Category } from '@/types';

// ─── Icon / colour mapping (driven by category name) ──────────────────────────
// Mirrors the same mapping used in HomeView's getCategoryStyle for consistency.
const NAME_STYLE_MAP: Record<string, { icon: string; color: string }> = {
    'electrician': { icon: 'flash',               color: '#F97316' },
    'plumber':     { icon: 'build',               color: '#A855F7' },
    'ac service':  { icon: 'snow',                color: '#3B82F6' },
    'tutor':       { icon: 'school',              color: '#10B981' },
    'mehndi':      { icon: 'leaf',                color: '#84CC16' },
    'cleaning':    { icon: 'sparkles',            color: '#EAB308' },
    'painter':     { icon: 'brush',               color: '#EC4899' },
    'mason':       { icon: 'construct',           color: '#EF4444' },
    'other':       { icon: 'ellipsis-horizontal', color: '#6B7280' },
};

const FALLBACK_COLORS = ['#F97316', '#A855F7', '#3B82F6', '#10B981', '#84CC16', '#EAB308', '#EC4899', '#EF4444', '#6366F1'];
const FALLBACK_ICONS  = ['flash',   'build',   'snow',   'school',  'leaf',    'sparkles', 'brush',  'construct', 'briefcase'];

/** Resolve the icon name + accent colour for any category name string. */
export function getCategoryStyle(name: string): { icon: string; color: string } {
    const normalized = name.trim().toLowerCase();

    if (NAME_STYLE_MAP[normalized]) return NAME_STYLE_MAP[normalized];

    // Partial-match fallback
    for (const key of Object.keys(NAME_STYLE_MAP)) {
        if (normalized.includes(key) || key.includes(normalized)) {
            return NAME_STYLE_MAP[key];
        }
    }

    // Deterministic hash fallback so the same unknown name always gets the same style
    let hash = 0;
    for (let i = 0; i < name.length; i++) {
        hash = name.charCodeAt(i) + ((hash << 5) - hash);
    }
    const index = Math.abs(hash) % FALLBACK_COLORS.length;
    return { icon: FALLBACK_ICONS[index], color: FALLBACK_COLORS[index] };
}

// ─── Store ─────────────────────────────────────────────────────────────────────

interface CategoryStoreState {
    /** Flat list fetched from the API. Empty until first successful fetch. */
    categories: Category[];
    /** True while a fetch is in flight. */
    loading: boolean;
    /** Whether the fetch has already completed at least once this session. */
    fetched: boolean;

    /** Fetch from API only if not already fetched this session. */
    ensureCategories: () => Promise<void>;

    /** Look up a category by its numeric id. Returns undefined if not loaded yet. */
    getCategoryById: (id: number) => Category | undefined;

    /** Convenience: icon + color for a given category id. */
    getStyleById: (id: number) => { icon: string; color: string };
}

const useCategoryStore = create<CategoryStoreState>((set, get) => ({
    categories: [],
    loading: false,
    fetched: false,

    ensureCategories: async () => {
        const { fetched, loading } = get();
        if (fetched || loading) return; // already loaded or in-flight

        set({ loading: true });
        try {
            const data = await getCategoriesFromBackend();
            set({ categories: data, fetched: true });
        } catch (err) {
            console.error('[categoryStore] Failed to fetch categories:', err);
            // Don't mark as fetched so we can retry on next call
        } finally {
            set({ loading: false });
        }
    },

    getCategoryById: (id) => get().categories.find((c) => c.id === id),

    getStyleById: (id) => {
        const cat = get().categories.find((c) => c.id === id);
        return getCategoryStyle(cat?.name ?? '');
    },
}));

export default useCategoryStore;
