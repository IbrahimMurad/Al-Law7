import { useQuery } from "@tanstack/react-query";
import type { Sheikh } from "@shared/schema";

export function useAuth() {
  const { data: user, isLoading, error } = useQuery<Sheikh | null>({
    queryKey: ["/api/auth/me"],
    retry: false,
  });

  return {
    user,
    isLoading,
    isAuthenticated: !!user && !error,
  };
}
