export type ProfileRoleState = {
  userId: string | null;
  role: string | null;
  loading: boolean;
};

// A profile response belongs only to the session that requested it. In
// particular, a slow admin response must not overwrite a later member/logout.
export function createProfileRoleTracker(
  loadRole: (userId: string) => Promise<string | null>,
  publish: (state: ProfileRoleState) => void,
) {
  let version = 0;
  let disposed = false;
  return {
    async setUser(userId: string | null) {
      const request = ++version;
      publish({ userId, role: null, loading: userId !== null });
      if (!userId) return;
      let role: string | null = null;
      try { role = await loadRole(userId); } catch { /* Never retain previous privileges on failure. */ }
      if (!disposed && request === version) {
        publish({ userId, role: role ?? "user", loading: false });
      }
    },
    dispose() { disposed = true; version++; },
  };
}
