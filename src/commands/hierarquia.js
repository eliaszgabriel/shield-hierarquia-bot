import {
  SlashCommandBuilder,
  ChannelType,
  PermissionFlagsBits,
} from "discord.js";
import { setGuildConfig, getGuildConfig } from "../lib/store.js";
import {
  ensureHierarchyMessage,
  refreshHierarchy,
} from "../features/hierarchy.js";
import { normalizeGuild } from "../features/normalize.js";
import { canManage } from "../config/permissions.js";

export default {
  data: new SlashCommandBuilder()
    .setName("hierarquia")
    .setDescription("Comandos da hierarquia")
    .addSubcommand((sc) =>
      sc
        .setName("setup")
        .setDescription(
          "Define canal, normaliza e cria/atualiza o quadro (EMBED)"
        )
        .addChannelOption((opt) =>
          opt
            .setName("canal")
            .setDescription("Canal de texto para o quadro")
            .addChannelTypes(ChannelType.GuildText)
            .setRequired(false)
        )
        .addBooleanOption((opt) =>
          opt
            .setName("normalizar_tags")
            .setDescription(
              "Aplicar/ajustar tags no nick em massa (default: true)"
            )
            .setRequired(false)
        )
    )
    .addSubcommand((sc) =>
      sc.setName("refresh").setDescription("Reconstrói o quadro agora (EMBED)")
    )
    .addSubcommand((sc) =>
      sc
        .setName("setlog")
        .setDescription("Define o canal de logs ou desativa")
        .addChannelOption((opt) =>
          opt
            .setName("canal")
            .setDescription(
              "Canal de texto para logs (deixe vazio para desativar)"
            )
            .addChannelTypes(ChannelType.GuildText)
            .setRequired(false)
        )
    )
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild),

  async execute(interaction) {
    if (!interaction.isChatInputCommand()) return;

    // ✅ Gate de permissão extra (além do ManageGuild)
    if (!canManage(interaction.member)) {
      return interaction.reply({
        content: "❌ Você não tem permissão para usar este comando.",
        ephemeral: true,
      });
    }

    const sub = interaction.options.getSubcommand();

    if (sub === "setup") {
      const channel =
        interaction.options.getChannel("canal") || interaction.channel;
      const normalize = interaction.options.getBoolean("normalizar_tags");
      const applyTags = normalize === null ? true : normalize;

      await interaction.deferReply({ ephemeral: true });

      // Normaliza guild (aplica tags, a menos que DISABLE_TAGS=true)
      const { scanned, changed, applied } = await normalizeGuild(
        interaction.guild,
        {
          applyTags,
        }
      );

      // Cria/atualiza quadro (embed)
      await ensureHierarchyMessage(interaction.guild, channel);
      setGuildConfig(interaction.guild.id, { hierarchyChannelId: channel.id });

      const cfg = getGuildConfig(interaction.guild.id);
      return interaction.editReply(
        [
          `✅ Quadro configurado em <#${channel.id}> (messageId: ${cfg.hierarchyMessageId}).`,
          `👥 Membros varridos: ${scanned}`,
          applied
            ? `🏷️ Tags ajustadas em: ${changed}`
            : `🚫 Tags desativadas (DISABLE_TAGS=true). Limpezas aplicadas: ${changed}`,
        ].join("\n")
      );
    }

    if (sub === "refresh") {
      await interaction.deferReply({ ephemeral: true });
      await refreshHierarchy(interaction.guild);
      return interaction.editReply("🔄 O quadro foi atualizado (embed).");
    }

    if (sub === "setlog") {
      await interaction.deferReply({ ephemeral: true });
      const ch = interaction.options.getChannel("canal");
      if (ch) {
        setGuildConfig(interaction.guild.id, { logChannelId: ch.id });
        return interaction.editReply(
          `✅ Logs serão enviados para <#${ch.id}>.`
        );
      } else {
        setGuildConfig(interaction.guild.id, { logChannelId: null });
        return interaction.editReply("✅ Logs desativados para esta guild.");
      }
    }
  },
};
