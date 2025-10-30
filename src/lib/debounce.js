const timers = new Map();

export function debounceGuild(guildId, fn, delay = 3000) {
  clearTimeout(timers.get(guildId));
  const t = setTimeout(fn, delay);
  timers.set(guildId, t);
}
