import "dotenv/config";
import {
  Client,
  GatewayIntentBits,
  Partials,
  Collection,
  Events,
} from "discord.js";
import roleChangeListener from "./listeners/roleChange.js";
import { ensureStore } from "./lib/store.js"; // <- caminho corrigido

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMembers, // precisa estar habilitado no Dev Portal
    // GatewayIntentBits.GuildMessages, // não é necessário para nosso fluxo atual
    // GatewayIntentBits.MessageContent, // REMOVIDO para evitar 'disallowed intents'
  ],
  partials: [Partials.GuildMember, Partials.User],
});

client.commands = new Collection();

// carrega comandos
// carrega comandos (apenas 1 arquivo com os subcomandos)
import hierarquiaCommand from "./commands/hierarquia.js";
client.commands.set(hierarquiaCommand.data.name, hierarquiaCommand);

client.once(Events.ClientReady, async (c) => {
  console.log(`✅ Logado como ${c.user.tag}`);
  ensureStore();
});

client.on(Events.InteractionCreate, async (interaction) => {
  if (!interaction.isChatInputCommand()) return;
  const cmd = client.commands.get(interaction.commandName);
  if (!cmd) return;
  try {
    await cmd.execute(interaction, client);
  } catch (err) {
    console.error("Erro no comando:", err);
    const payload = {
      content: "❌ Ocorreu um erro ao executar o comando.",
      ephemeral: true,
    };
    if (interaction.deferred || interaction.replied)
      await interaction.followUp(payload).catch(() => {});
    else await interaction.reply(payload).catch(() => {});
  }
});

client.on(Events.GuildMemberUpdate, (oldMember, newMember) =>
  roleChangeListener(oldMember, newMember, client)
);

client.login(process.env.DISCORD_TOKEN);
