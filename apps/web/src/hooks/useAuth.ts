import { trpc } from "@/lib/trpc";

export function useAuth() {
  const me = trpc.auth.me.useQuery();
  const login = trpc.auth.demoLogin.useMutation({
    onSuccess: () => me.refetch(),
  });
  const logout = trpc.auth.logout.useMutation({
    onSuccess: () => me.refetch(),
  });

  return {
    user: me.data ?? null,
    loading: me.isLoading,
    login: login.mutateAsync,
    loggingIn: login.isPending,
    signout: () => logout.mutateAsync(),
  };
}