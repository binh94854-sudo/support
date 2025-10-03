const {
  Client,
  GatewayIntentBits,
  Partials,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  EmbedBuilder
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

client.once("ready", async () => {
  console.log(`✅ Logged in as ${client.user.tag}`);

  const channel = client.channels.cache.get(process.env.TICKET_CHANNEL_ID);
  if (channel) {
    const embed = new EmbedBuilder()
      .setTitle("🎫 Ticket Support")
      .setDescription("Nhấn nút bên dưới để mở ticket hỗ trợ staff.")
      .setColor("#2b2d31");

    const row = new ActionRowBuilder().addComponents(
      new ButtonBuilder()
        .setCustomId("create_ticket")
        .setLabel("📩 Open a Ticket")
        .setStyle(ButtonStyle.Primary)
    );

    await channel.send({ embeds: [embed], components: [row] });
    console.log("📩 Ticket panel sent!");
  } else {
    console.log("⚠️ Không tìm thấy TICKET_CHANNEL_ID. Kiểm tra lại .env");
  }
});

client.on("interactionCreate", async interaction => {
  if (!interaction.isButton()) return;
  const staffRoleId = process.env.STAFF_ROLE_ID;

  // ===== Nút mở ticket =====
  if (interaction.customId === "create_ticket") {
    const channel = interaction.channel;

    const existing = channel.threads.cache.find(
      t => t.name === `ticket-${interaction.user.username}`
    );
    if (existing) {
      return interaction.reply({
        content: "❌ Bạn đã có ticket mở rồi!",
        ephemeral: true
      });
    }

    const thread = await channel.threads.create({
      name: `ticket-${interaction.user.username}`,
      autoArchiveDuration: 1440,
      type: 12, // private thread
      invitable: false
    });

    await thread.members.add(interaction.user.id);

    await thread.send({
      content: `<@${interaction.user.id}> đã mở ticket! <@&${staffRoleId}>`,
      embeds: [
        new EmbedBuilder()
          .setTitle("🎟 Ticket Opened")
          .setDescription("Hãy mô tả vấn đề của bạn, staff sẽ phản hồi sớm.")
          .setColor("#2ecc71")
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

    interaction.reply({
      content: `✅ Ticket đã mở: ${thread}`,
      ephemeral: true
    });
  }

  // ===== Nút đóng ticket =====
  if (interaction.customId === "close_ticket") {
    if (interaction.channel.isThread()) {
      await interaction.channel.setArchived(true, "Ticket closed");
      interaction.reply({
        content: "✅ Ticket đã đóng!",
        ephemeral: true
      });
    }
  }
});

client.login(process.env.TOKEN);
