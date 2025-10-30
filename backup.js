// import { RANKS } from "../config/ranks.js";
// import { getGuildConfig, setGuildConfig } from "../lib/store.js";

// export async function buildHierarchyContent(guild) {
//   const lines = [];
//   for (const r of [...RANKS].sort((a, b) => b.order - a.order)) {
//     lines.push(r.label);
//     const role = guild.roles.cache.get(r.roleId);
//     if (!role) {
//       lines.push("(sem membros)\n");
//       continue;
//     }
//     const members = [...role.members.values()].sort((a, b) =>
//       a.displayName.localeCompare(b.displayName)
//     );
//     if (!members.length) {
//       lines.push("(sem membros)\n");
//     } else {
//       lines.push(members.map((m) => `• ${m}`).join("\n") + "\n");
//     }
//   }
//   return lines.join("\n");
// }

// export async function ensureHierarchyMessage(guild, channel) {
//   const cfg = getGuildConfig(guild.id) || {};
//   let messageId = cfg.hierarchyMessageId;
//   let msg = null;

//   if (messageId) {
//     try {
//       msg = await channel.messages.fetch(messageId);
//     } catch {}
//   }

//   const content = await buildHierarchyContent(guild);

//   if (!msg) {
//     msg = await channel.send({ content });
//     setGuildConfig(guild.id, {
//       hierarchyChannelId: channel.id,
//       hierarchyMessageId: msg.id,
//     });
//   } else {
//     await msg.edit({ content }).catch(() => {});
//   }
//   return msg;
// }

// export async function refreshHierarchy(guild) {
//   const cfg = getGuildConfig(guild.id);
//   if (!cfg?.hierarchyChannelId) return;
//   const channel = guild.channels.cache.get(cfg.hierarchyChannelId);
//   if (!channel) return;
//   await ensureHierarchyMessage(guild, channel);
// }

// src/listeners/roleChange.js
// // src/listeners/roleChange.js
// import { highestRankOf, rankByRoleId } from "../config/ranks.js";
// import { setRankTag, stripControlledTag } from "../lib/nick.js";
// import { debounceGuild } from "../lib/debounce.js";
// import { refreshHierarchy } from "../features/hierarchy.js";
// import { getGuildConfig } from "../lib/store.js";

// export default async function roleChangeListener(oldMember, newMember) {
//   try {
//     const oldRoleIds = new Set(oldMember.roles.cache.map((r) => r.id));
//     const newRoleIds = new Set(newMember.roles.cache.map((r) => r.id));
//     const added = [...newRoleIds].filter((id) => !oldRoleIds.has(id));
//     const removed = [...oldRoleIds].filter((id) => !newRoleIds.has(id));

//     if (added.length === 0 && removed.length === 0) {
//       debounceGuild(newMember.guild.id, () =>
//         refreshHierarchy(newMember.guild)
//       );
//       return;
//     }

//     // 🔁 Mapeia roles adicionadas/removidas -> nomes de rank (p/ log)
//     const addedRanks = added.map(rankByRoleId).filter(Boolean);
//     const removedRanks = removed.map(rankByRoleId).filter(Boolean);

//     // 🔧 Switch de tags via .env
//     const tagsDisabled =
//       String(process.env.DISABLE_TAGS).toLowerCase() === "true";

//     if (!tagsDisabled) {
//       const currentHighest = highestRankOf(newMember);

//       if (currentHighest) {
//         // Aplica SEMPRE a tag do maior posto, limpando quaisquer tags anteriores (inclui [SD]/[ALUNO])
//         await setRankTag(newMember, currentHighest.sigla);
//       } else {
//         // Sem posto mapeado -> limpa qualquer tag controlada que tenha sobrado
//         const currentName =
//           newMember.nickname ||
//           newMember.user.displayName ||
//           newMember.user.username;

//         const base = stripControlledTag(currentName) || null;
//         if (base !== currentName) {
//           try {
//             await newMember.setNickname(base);
//           } catch {}
//         }
//       }
//     }

//     // Atualiza o quadro (com debounce)
//     debounceGuild(newMember.guild.id, () => refreshHierarchy(newMember.guild));

//     // 📣 Logs (usa store primeiro, cai pro .env se não houver)
//     const cfg = getGuildConfig(newMember.guild.id);
//     const logChannelId = cfg?.logChannelId ?? process.env.LOG_CHANNEL_ID;
//     if (logChannelId) {
//       const ch = newMember.guild.channels.cache.get(logChannelId);
//       if (ch) {
//         const addedStr = addedRanks.map((r) => r.key).join(", ") || "-";
//         const removedStr = removedRanks.map((r) => r.key).join(", ") || "-";
//         ch.send(`🔁 ${newMember} | +${addedStr}  -${removedStr}`).catch(
//           () => {}
//         );
//       }
//     }
//   } catch (e) {
//     console.error("roleChangeListener error:", e);
//   }
// }
