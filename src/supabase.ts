export const supabase: any = {
  from: (table: string) => ({
    select: async (..._args: any[]) => ({ data: null, error: null }),
    insert: async (_payload: any) => ({ data: null, error: null }),
    update: async (_payload: any) => ({ data: null, error: null }),
    delete: async () => ({ data: null, error: null }),
  }),
  auth: {
    user: () => null,
    signIn: async () => ({ user: null }),
    signOut: async () => ({}),
  },
  storage: {
    from: (_bucket: string) => ({
      upload: async () => ({ data: null, error: null }),
      getPublicUrl: (_path: string) => ({ publicURL: '' }),
    }),
  },
};

export default supabase;