const KB = require("../utils/keyboards");

async function handleMedia(ctx, action) {
  const reply = (t, kb) => ctx.callbackQuery
    ? ctx.editMessageText(t, { parse_mode: "Markdown", ...kb })
    : ctx.reply(t, { parse_mode: "Markdown", ...kb });

  const actions = {
    upscale:   { title: "⬆️ Image Upscale",       desc: "Reply to a photo to upscale it to 2x resolution\\." },
    enhance:   { title: "✨ AI Enhance",            desc: "Reply to a photo to enhance quality with AI\\." },
    remini:    { title: "💫 Remini Effect",         desc: "Reply to a photo to apply Remini-style sharpening\\." },
    removebg:  { title: "🗑 Remove Background",    desc: "Reply to a photo to remove its background\\." },
    night:     { title: "🌃 Night Filter",          desc: "Reply to a photo to apply a night/dark aesthetic filter\\." },
    sunset:    { title: "🌅 Sunset Filter",         desc: "Reply to a photo to apply a warm sunset tone\\." },
    rain:      { title: "🌧 Rain Overlay",          desc: "Reply to a photo to add a rain overlay effect\\." },
  };

  const found = actions[action];
  if (!found) return reply("❓ Unknown media action\\.", KB.mediaMenu());

  const replied = ctx.message?.reply_to_message?.photo;

  if (!replied) {
    return reply(
      `${found.title}\n\n💡 *Usage:*\nReply to a photo with the button or command to apply this effect\\.\n\n_${found.desc}_\n\n⚠️ Note: Full image processing requires a third-party image API \\(e\\.g\\. remove\\.bg, imgly\\)\\. Ensure your API keys are configured in \\.env\\.`,
      KB.mediaMenu()
    );
  }

  const photo = replied[replied.length - 1];
  const fileId = photo.file_id;

  await ctx.reply(
    `${found.title}\n\n📸 Photo received\\!\nFile ID: \`${fileId}\`\n\n⏳ Processing \\(requires external API\\)\\.\n\n_To enable real processing, add your image API key to \\.env and hook it into \`src/commands/media\\.js\`\\._`,
    { parse_mode: "Markdown", ...KB.mediaMenu() }
  );
}

module.exports = { handleMedia };
