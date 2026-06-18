// Fake placeholder client to stop the app from crashing
export const supabase = {
  from: () => ({
    select: async () => ({ data: [], error: null }),
    insert: async () => ({ data: null, error: null }),
    update: async () => ({ data: null, error: null }),
    delete: async () => ({ data: null, error: null }),
  }),
  auth: {
    signUp: async () => ({ data: {}, error: null }),
    signInWithPassword: async () => ({ data: {}, error: null }),
    signOut: async () => ({ error: null }),
    onAuthStateChange: (callback: any) => {
      return { data: { subscription: { unsubscribe: () => {} } } };
    },
  },
} as any;