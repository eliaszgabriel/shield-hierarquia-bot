import {
  SlashCommandBuilder,
  ChannelType,
  PermissionFlagsBits,
} from "discord.js";
import { setGuildConfig, getGuildConfig } from "../lib/store.js";
import { ensureHierarchyMessage } from "../features/hierarchy.js";

export default {
  data: new SlashCommandBuilder()
    .setName("hierarquia")
    .setDescription("Comandos da hierarquia")
    .addSubcommand((sc) =>
      sc
        .setName("setup")
        .setDescription("Define canal e cria/atualiza a mensagem do quadro")
        .addChannelOption((opt) =>
          opt
            .setName("canal")
            .setDescription("Canal de texto para o quadro")
            .addChannelTypes(ChannelType.GuildText)
            .setRequired(false)
        )
    )
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild),

  async execute(interaction) {
    const sub = interaction.options.getSubcommand();
    if (sub !== "setup") return;

    const channel =
      interaction.options.getChannel("canal") || interaction.channel;
    await interaction.deferReply({ ephemeral: true });

    await ensureHierarchyMessage(interaction.guild, channel);
    setGuildConfig(interaction.guild.id, { hierarchyChannelId: channel.id });

    const cfg = getGuildConfig(interaction.guild.id);
    await interaction.editReply(
      `✅ Quadro configurado em <#${channel.id}> (messageId: ${cfg.hierarchyMessageId}).`
    );
  },
};
