const express = require("express");
const app = express();
const PORT = process.env.PORT || 3000;

app.get("/", (req, res) => {
  res.send("Bot is alive!");
});

app.listen(PORT, () => {
  console.log(`🌐 KeepAlive server running on port ${PORT}`);
});

const { 
  Client, 
  GatewayIntentBits, 
  Partials, 
  EmbedBuilder, 
  ActionRowBuilder, 
  ButtonBuilder, 
  ButtonStyle 
} = require("discord.js");
require("dotenv").config();

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent
  ],
  partials: [Partials.Channel]
});

// ========== CONFIG ==========
const STAFF_ROLE_ID = process.env.STAFF_ROLE_ID;
const THUMBNAIL_URL = process.env.THUMBNAIL_URL;

const COLOR_DEFAULT = process.env.COLOR_DEFAULT || "#7b7b7b";
const COLOR_TICKET_OPEN = process.env.COLOR_TICKET_OPEN || "#2ECC71";
const COLOR_TICKET_CLOSE = process.env.COLOR_TICKET_CLOSE || "#d70001";

const FOOTER_SERVER = process.env.FOOTER_SERVER || "Server Info";
const FOOTER_TICKET = process.env.FOOTER_TICKET || "Ticket System";

// ========== READY ==========
client.once("ready", async () => {
  console.log(`✅ Logged in as ${client.user.tag}`);
});

// ========== INTERACTION HANDLER ==========
client.on("interactionCreate", async (interaction) => {
  if (interaction.isStringSelectMenu()) {
    if (interaction.customId === "main_menu") {
      // ----- SERVER INFO -----
      if (interaction.values[0] === "server_info") {
        const serverInfo = new EmbedBuilder()
          .setColor(COLOR_DEFAULT)
          .setTitle("Server Information")
          .setDescription(
            "There's a 100% chance you're here because you're banned on the MBF Server and you want to appeal your ban, you must firstly understand our rules\n\n" +
            "- Appeal Misusing, using AI, lying, or failing an appeal too many times will get you blacklisted for 7 days.\n" +
            "- You can add additional information after writing up a ban appeal.\n" +
            "- You must know your ban reason before making a ban appeal.\n" +
            "> Please view <@155149108183695360> DM and review your ban reason.\n" +
            "- You must wait a week before appealing after your ban, unless it is false.\n" +
            "- Any main server rule broken here will lower the chance of your appeal being accepted.\n" +
            "If the rule is extreme, we may put you at an unappealable position.\n\n" +
            "**Appeal Blacklist**\n" +
            "Given to members who have failed an appeal too many times, misused appeals, used AI, or lied.\n" +
            "▢ Can also be given by staff if deemed necessary.\n\n" +
            "**Watchlist**\n" +
            "Members whose ban appeal is accepted but staff still suspects them may be put on watchlist.\n" +
            "They will be subject to 4x warnings for 3 weeks even if no rule is broken after unban."
          )
          .setThumbnail(THUMBNAIL_URL)
          .setFooter({ text: FOOTER_SERVER });

        await interaction.reply({ embeds: [serverInfo], ephemeral: true });
      }

      // ----- TICKET INFO -----
      if (interaction.values[0] === "ticket_info") {
        const ticketInfo = new EmbedBuilder()
          .setColor(COLOR_DEFAULT)
          .setTitle("Appeal and Unappealable Offences")
          .addFields(
            {
              name: "Appealable Offences",
              value:
                "```• 5+ Warnings\n" +
                "• Hate speech/Racism\n" +
                "• Underage\n" +
                "• Punishment Evasion```",
              inline: true
            },
            {
              name: "Unappealable Offences",
              value:
                "```• Cybercrimes\n" +
                "• Child Endangerment\n" +
                "• 2 Bans\n" +
                "• NSFW\n" +
                "• Promotion of NSFW Servers\n" +
                "• Raiding/Nuking```",
              inline: true
            }
          )
          .setThumbnail(THUMBNAIL_URL)
          .setFooter({ text: FOOTER_TICKET });

        await interaction.reply({ embeds: [ticketInfo], ephemeral: true });
      }
    }
  }

  // ----- BUTTON HANDLING -----
  if (interaction.isButton()) {
    // ===== OPEN TICKET =====
    if (interaction.customId === "open_ticket") {
      await interaction.deferReply({ ephemeral: true });

      // Kiểm tra xem user đã có ticket chưa
      const existingThread = interaction.channel.threads.cache.find(
        (t) => t.name === `ticket-${interaction.user.username}` && !t.archived
      );

      if (existingThread) {
        await interaction.editReply({ content: `⚠️ Bạn đã có ticket mở: ${existingThread}` });
        return;
      }

      // Tạo thread mới
      const thread = await interaction.channel.threads.create({
        name: `ticket-${interaction.user.username}`,
        type: 12, // private thread
        reason: "Support Ticket"
      });

      await thread.members.add(interaction.user.id);

      await thread.send({
        content: `<@&${STAFF_ROLE_ID}> New ticket created by <@${interaction.user.id}>`,
        embeds: [
          new EmbedBuilder()
            .setColor(COLOR_TICKET_OPEN)
            .setTitle("🎟️ Ticket Opened")
            .setDescription(
              "A staff member will be with you shortly.\n\n" +
              "When finished, click **Close Ticket** below."
            )
        ],
        components: [
          new ActionRowBuilder().addComponents(
            new ButtonBuilder()
              .setCustomId("close_ticket")
              .setLabel("🔒 Close Ticket")
              .setStyle(ButtonStyle.Danger)
          )
        ]
      });

      await interaction.editReply({ content: `✅ Ticket created: ${thread}` });
    }

    // ===== CLOSE TICKET =====
    if (interaction.customId === "close_ticket") {
      await interaction.message.channel.send({
        embeds: [
          new EmbedBuilder()
            .setColor(COLOR_TICKET_CLOSE)
            .setTitle("🔒 Ticket Closed")
            .setDescription("This ticket has been closed. Thank you for contacting support!")
        ]
      });

      await interaction.message.channel.setArchived(true);
    }
  }
});

// ========== LOGIN ==========
client.login(process.env.DISCORD_TOKEN);
