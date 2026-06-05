// src/hooks/useVault.ts
// [TO-DO: Update this to replace the hooks in the vault page]
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "../lib/api";
import { vaultApi } from "../api/vault";

export const useVaultDocuments = () => {
  return useQuery({
    queryKey: ['vaultDocuments'],
    queryFn: async () => { /* ... fetch and sign URLs ... */ }
  });
};

export const useUploadDocument = (onSuccessCallback: () => void) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (payload) => { /* ... execute upload ... */ },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['vaultDocuments'] });
      onSuccessCallback(); // Closes the modal in the UI
    }
  });
};