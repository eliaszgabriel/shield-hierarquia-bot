import "dotenv/config";
import { REST, Routes, SlashCommandBuilder, ChannelType } from "discord.js";

const commands = [
  new SlashCommandBuilder()
    .setName("hierarquia")
    .setDescription("Comandos da hierarquia")
    .addSubcommand((sc) =>
      sc
        .setName("setup")
        .setDescription(
          "Define o canal/mensagem do quadro e cria se necessário"
        )
        .addChannelOption((opt) =>
          opt
            .setName("canal")
            .setDescription("Canal onde o quadro será mantido")
            .addChannelTypes(ChannelType.GuildText)
            .setRequired(false)
        )
    )
    .addSubcommand((sc) =>
      sc.setName("refresh").setDescription("Reconstrói o quadro agora")
    )
    .toJSON(),
];

const rest = new REST({ version: "10" }).setToken(process.env.DISCORD_TOKEN);

try {
  await rest.put(
    Routes.applicationGuildCommands(
      process.env.APPLICATION_ID,
      process.env.GUILD_ID
    ),
    { body: commands }
  );
  console.log("✅ Slash commands registrados");
} catch (err) {
  console.error("Erro ao registrar comandos:", err);
}
