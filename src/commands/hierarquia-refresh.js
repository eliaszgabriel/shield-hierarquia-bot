import { SlashCommandBuilder, PermissionFlagsBits } from "discord.js";
import { refreshHierarchy } from "../features/hierarchy.js";

export default {
  data: new SlashCommandBuilder()
    .setName("hierarquia")
    .setDescription("Comandos da hierarquia")
    .addSubcommand((sc) =>
      sc.setName("refresh").setDescription("Reconstrói o quadro agora")
    )
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild),

  async execute(interaction) {
    const sub = interaction.options.getSubcommand();
    if (sub !== "refresh") return;

    await interaction.deferReply({ ephemeral: true });
    await refreshHierarchy(interaction.guild);
    await interaction.editReply("🔄 O quadro foi atualizado.");
  },
};
