// Verifica se um membro pode usar /hierarquia
export function canManage(member) {
  if (!member) return false;
  // Permissão nativa também vale (ManageGuild)
  if (member.permissions.has("ManageGuild")) return true;

  const raw = process.env.MANAGER_ROLE_IDS || "";
  const allowIds = raw
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);

  if (allowIds.length === 0) return false;
  return allowIds.some((id) => member.roles.cache.has(id));
}
