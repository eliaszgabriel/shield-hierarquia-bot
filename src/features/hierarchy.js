import { RANKS } from "../config/ranks.js";
import { getGuildConfig, setGuildConfig } from "../lib/store.js";
import { EmbedBuilder } from "discord.js";

// Monta o embed bonito da hierarquia
export async function buildHierarchyEmbed(guild) {
  const eb = new EmbedBuilder()
    .setTitle("📋 Quadro de Praças — SHIELD")
    .setColor(0x1f2937) // cinza escuro agradável
    .setTimestamp(new Date());

  let total = 0;

  for (const r of [...RANKS].sort((a, b) => b.order - a.order)) {
    const role = guild.roles.cache.get(r.roleId);
    const members = role ? [...role.members.values()] : [];
    total += members.length;

    const value =
      members.length === 0
        ? "_(sem membros)_"
        : members
            .sort((a, b) => a.displayName.localeCompare(b.displayName))
            .map((m) => `${m}`)
            .join("\n");

    eb.addFields({
      name: `${r.label} — **${members.length}**`,
      value: value,
      inline: false,
    });
  }

  eb.setFooter({ text: `Total: ${total} • Atualizado` });
  return eb;
}

export async function ensureHierarchyMessage(guild, channel) {
  const cfg = getGuildConfig(guild.id) || {};
  let messageId = cfg.hierarchyMessageId;
  let msg = null;

  if (messageId) {
    try {
      msg = await channel.messages.fetch(messageId);
    } catch {}
  }

  const embed = await buildHierarchyEmbed(guild);

  if (!msg) {
    msg = await channel.send({ embeds: [embed] });
    setGuildConfig(guild.id, {
      hierarchyChannelId: channel.id,
      hierarchyMessageId: msg.id,
    });
  } else {
    await msg.edit({ embeds: [embed] }).catch(() => {});
  }
  return msg;
}

export async function refreshHierarchy(guild) {
  const cfg = getGuildConfig(guild.id);
  if (!cfg?.hierarchyChannelId) return;
  const channel = guild.channels.cache.get(cfg.hierarchyChannelId);
  if (!channel) return;
  await ensureHierarchyMessage(guild, channel);
}
