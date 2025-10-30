import { highestRankOf } from "../config/ranks.js";
import { setRankTag, stripControlledTag } from "../lib/nick.js";

/**
 * Normaliza toda a guild:
 * - Se applyTags=true: aplica/ajusta a tag do nick conforme o maior posto (inclui [ALUNO]/[SD]).
 * - Se o membro não tiver nenhum posto mapeado: remove tags controladas que sobraram.
 * - Sempre busca todos os membros pra ter cache atualizado.
 */
export async function normalizeGuild(guild, { applyTags = true } = {}) {
  // Puxa todos os membros pro cache
  const members = await guild.members.fetch();

  const tagsDisabled =
    String(process.env.DISABLE_TAGS).toLowerCase() === "true";
  const canSet = applyTags && !tagsDisabled;

  let changed = 0,
    scanned = 0;

  for (const [, member] of members) {
    scanned++;

    const currentHighest = highestRankOf(member);
    const currentName =
      member.nickname || member.user.displayName || member.user.username;

    if (currentHighest && canSet) {
      // Aplica a tag do maior posto (limpando anteriores)
      const before = currentName;
      try {
        await setRankTag(member, currentHighest.sigla);
      } catch {}
      const after =
        member.nickname || member.user.displayName || member.user.username;
      if (before !== after) changed++;
      continue;
    }

    // Sem posto mapeado OU tags desativadas → apenas limpa tags controladas (se houver)
    const base = stripControlledTag(currentName) || null;
    if (base !== currentName) {
      try {
        await member.setNickname(base);
      } catch {}
      changed++;
    }
  }

  return { scanned, changed, applied: canSet };
}
