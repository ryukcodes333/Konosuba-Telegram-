require("dotenv").config();
const { Telegraf } = require("telegraf");
const { handleCallback, handleTextMessage } = require("./src/handler");

const token = process.env.BOT_TOKEN;
if (!token) { console.error("❌ BOT_TOKEN is not set. Add it to .env"); process.exit(1); }

const bot = new Telegraf(token);

bot.start((ctx) => {
  const name = ctx.from.first_name || "Adventurer";
  return ctx.reply(
    `🌊 *Welcome, ${name}!*\n\nI'm *Aqua*, your friendly KONOSUBA-inspired bot! 💙\n\nUse the menu below to explore all my features — Economy, Gambling, Pokémon, RPG, Games, and much more!`,
    { parse_mode: "Markdown", ...require("./src/utils/keyboards").mainMenu() }
  );
});

bot.help((ctx) => {
  const prefix = process.env.BOT_PREFIX || ".";
  return ctx.reply(
    `🌊 *Aqua Bot — Help*\n\n*Categories:*\n⚙️ Admin | 💰 Economy | 🎲 Gambling\n🎉 Fun | 💞 Interactions | 🎮 Games\n🐾 Pokémon | ⬇️ Downloader | ⚔️ RPG\n🏰 Guild | 🎴 Cards | 🔥 Vibe\n📱 Media | 💸 Payments\n\n*Prefix:* \`${prefix}\`\n*Example:* \`${prefix}daily\` | \`${prefix}menu\`\n\nClick the button below for the full menu:`,
    { parse_mode: "Markdown", ...require("./src/utils/keyboards").mainMenu() }
  );
});

bot.on("callback_query", async (ctx) => {
  try { await handleCallback(ctx); } catch (err) {
    console.error("Callback error:", err);
    ctx.answerCbQuery("❌ Something went wrong!").catch(() => {});
  }
});

bot.on("text", async (ctx) => {
  try { await handleTextMessage(ctx); } catch (err) {
    console.error("Text handler error:", err);
  }
});

bot.on("photo", async (ctx) => {
  const caption = ctx.message?.caption || "";
  const prefix = process.env.BOT_PREFIX || ".";
  if (caption.startsWith(prefix)) {
    const parts = caption.slice(prefix.length).trim().split(/\s+/);
    const mediaActions = ["upscale","enhance","remini","removebg","night","sunset","rain"];
    if (mediaActions.includes(parts[0])) {
      const { handleMedia } = require("./src/commands/media");
      await handleMedia(ctx, parts[0]).catch(console.error);
    }
  }
});

bot.catch((err, ctx) => {
  console.error(`[BOT ERROR] ${ctx?.updateType || "unknown"}:`, err);
});

async function launch() {
  const webhookUrl = process.env.WEBHOOK_URL;
  const port = parseInt(process.env.PORT || "3000");

  if (webhookUrl) {
    await bot.launch({ webhook: { domain: webhookUrl, port } });
    console.log(`🌊 Aqua Bot launched via webhook on port ${port}`);
    console.log(`🔗 Webhook: ${webhookUrl}`);
  } else {
    await bot.launch();
    console.log("🌊 Aqua Bot launched via long-polling");
  }

  console.log(`✅ Bot: @${bot.botInfo?.username || "Aqua"}`);
}

launch().catch((err) => {
  console.error("Failed to launch bot:", err);
  process.exit(1);
});

process.once("SIGINT",  () => bot.stop("SIGINT"));
process.once("SIGTERM", () => bot.stop("SIGTERM"));
