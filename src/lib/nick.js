import { CONTROLLED_TAGS } from "../config/ranks.js";

// Regex: remove QUALQUER combinação de tags controladas no começo (ex.: "[CB] [SD] ")
const alternation = CONTROLLED_TAGS.map((t) =>
  t.replace(/[[\]()*+?.^$|]/g, "\\$&")
).join("|");
const CONTROLLED_TAGS_REGEX = new RegExp(`^(?:(${alternation})\\s*)+`, "i");

export function stripControlledTag(text) {
  if (!text) return text;
  return text.replace(CONTROLLED_TAGS_REGEX, "").trim();
}

export async function setRankTag(member, newTag) {
  const base =
    stripControlledTag(
      member.nickname || member.user.displayName || member.user.username
    ) || "";

  const next = `${newTag} ${base}`.trim();
  const current =
    member.nickname || member.user.displayName || member.user.username;

  if (next === current) return;

  try {
    await member.setNickname(next);
  } catch (err) {
    // Permissões/hierarquia de cargos podem impedir – só loga
    console.warn("Falha ao alterar nickname:", err?.message || err);
  }
}
