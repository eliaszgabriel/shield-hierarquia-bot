import { highestRankOf } from "../config/ranks.js";
import { setRankTag, stripControlledTag } from "../lib/nick.js";
import { debounceGuild } from "../lib/debounce.js";
import { refreshHierarchy } from "../features/hierarchy.js";
import { getGuildConfig } from "../lib/store.js";
import { EmbedBuilder, AuditLogEvent } from "discord.js";

// Debounce de LOG (por usuário)
const logTimers = new Map();
const rankSnapshots = new Map();

// Buscando quem executou a ação no Audit Log
async function resolveActor(guild, targetUserId) {
  try {
    const logs = await guild.fetchAuditLogs({
      type: AuditLogEvent.MemberRoleUpdate,
      limit: 5,
    });
    for (const [, entry] of logs.entries) {
      if (entry.target?.id === targetUserId) {
        if (Date.now() - entry.createdTimestamp <= 30000) return entry.executor;
      }
    }
  } catch {}
  return null;
}

function makeHistoryEmbed(member, beforeRank, afterRank, actor) {
  const eb = new EmbedBuilder()
    .setAuthor({
      name: member.user?.tag ?? member.displayName,
      iconURL: member.displayAvatarURL?.() ?? undefined,
    })
    .setTimestamp(Date.now());

  const promoted =
    afterRank && (!beforeRank || afterRank.order > beforeRank.order);
  const title = promoted ? "📈 Promoção" : "📉 Rebaixamento";
  const color = promoted ? 0x16a34a : 0xdc2626;

  eb.setTitle(title).setColor(color);

  eb.addFields(
    { name: "Membro", value: `${member}`, inline: false },
    {
      name: "Antes",
      value: beforeRank ? `**${beforeRank.sigla}**` : "_Nenhum_",
      inline: true,
    },
    {
      name: "Depois",
      value: afterRank ? `**${afterRank.sigla}**` : "_Nenhum_",
      inline: true,
    }
  );

  if (actor) {
    eb.addFields({ name: "Executor", value: `${actor}`, inline: false });
  }
  return eb;
}

async function sendFinalLog(newMember, beforeRank, afterRank) {
  if (beforeRank?.key === afterRank?.key) return; // ✅ Sem log inútil!

  const cfg = getGuildConfig(newMember.guild.id);
  const logChannelId = cfg?.logChannelId ?? process.env.LOG_CHANNEL_ID;
  if (!logChannelId) return;

  const channel = newMember.guild.channels.cache.get(logChannelId);
  if (!channel) return;

  const actor = await resolveActor(newMember.guild, newMember.id);
  const emb = makeHistoryEmbed(newMember, beforeRank, afterRank, actor);
  await channel.send({ embeds: [emb] }).catch(() => {});
}

export default async function roleChangeListener(oldMember, newMember) {
  try {
    const before = highestRankOf(oldMember) || null;
    const after = highestRankOf(newMember) || null;

    const userId = newMember.id;
    rankSnapshots.set(userId, { before, after });

    // ✅ Aguarda para só enviar o estado final
    clearTimeout(logTimers.get(userId));
    logTimers.set(
      userId,
      setTimeout(async () => {
        const snapshot = rankSnapshots.get(userId);
        if (!snapshot) return;

        const { before, after } = snapshot;

        // ✅ Corrige TAGS
        const tagsDisabled =
          String(process.env.DISABLE_TAGS).toLowerCase() === "true";
        if (!tagsDisabled) {
          if (after) await setRankTag(newMember, after.sigla);
          else {
            const base =
              stripControlledTag(
                newMember.nickname ??
                  newMember.user.displayName ??
                  newMember.user.username
              ) || null;
            await newMember.setNickname(base).catch(() => {});
          }
        }

        // ✅ Atualiza quadro
        debounceGuild(newMember.guild.id, () =>
          refreshHierarchy(newMember.guild)
        );

        // ✅ Log apenas 1 por troca!
        await sendFinalLog(newMember, before, after);
      }, 500) // tempo para consolidar mudanças
    );
  } catch (err) {
    console.error("roleChangeListener error:", err);
  }
}
