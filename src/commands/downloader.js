const KB = require("../utils/keyboards");

async function handleDownloader(ctx, action) {
  const reply = (t, kb) => ctx.callbackQuery
    ? ctx.editMessageText(t, { parse_mode: "Markdown", ...kb })
    : ctx.reply(t, { parse_mode: "Markdown", ...kb });

  const prompts = {
    ytmp3_prompt:      ["🎵 *YouTube → MP3*",      "Send the YouTube URL and I'll try to fetch audio."],
    ytmp4_prompt:      ["🎬 *YouTube → MP4*",      "Send the YouTube URL and I'll try to fetch video."],
    tiktok_prompt:     ["🎵 *TikTok Downloader*",  "Send the TikTok video URL."],
    instagram_prompt:  ["📸 *Instagram Downloader*","Send the Instagram post/reel URL."],
    facebook_prompt:   ["📘 *Facebook Downloader*", "Send the Facebook video URL."],
  };

  if (prompts[action]) {
    const [title, body] = prompts[action];
    return reply(`${title}\n\n${body}\n\n⚠️ _Free downloader — quality may vary. Send the URL as a plain text message\\._`, KB.downloaderMenu());
  }

  return reply(
    `⬇️ *Downloader*\n\nSupports:\n• YouTube \\(MP3 / MP4\\)\n• TikTok\n• Instagram\n• Facebook\n\n_Select a platform above, then send the URL\\._`,
    KB.downloaderMenu()
  );
}

async function handleDownloaderUrl(ctx, url) {
  const ytRe = /(?:youtu\\.be\\/|youtube\\.com\\/watch\\?v=)([\w-]+)/i;
  const ttRe = /tiktok\\.com/i;
  const igRe = /instagram\\.com/i;
  const fbRe = /facebook\\.com|fb\\.watch/i;

  if (ytRe.test(url)) {
    await ctx.reply(
      `🎵 *YouTube Downloader*\n\n🔗 URL received!\n\n_Note: Direct download requires a server-side tool (yt-dlp). For full functionality, deploy with yt-dlp installed on your server or use a download API service\\._\n\n✅ URL: \`${url}\``,
      { parse_mode: "Markdown", ...KB.downloaderMenu() }
    );
    return true;
  }
  if (ttRe.test(url)) {
    await ctx.reply(`🎵 *TikTok Link Received*\n\nURL: \`${url}\`\n\n_Server-side yt-dlp/cobalt required for actual download\\._`, { parse_mode: "Markdown", ...KB.downloaderMenu() });
    return true;
  }
  if (igRe.test(url)) {
    await ctx.reply(`📸 *Instagram Link Received*\n\nURL: \`${url}\`\n\n_Server-side instaloader/cobalt required for actual download\\._`, { parse_mode: "Markdown", ...KB.downloaderMenu() });
    return true;
  }
  if (fbRe.test(url)) {
    await ctx.reply(`📘 *Facebook Link Received*\n\nURL: \`${url}\`\n\n_Server-side downloader required for actual download\\._`, { parse_mode: "Markdown", ...KB.downloaderMenu() });
    return true;
  }
  return false;
}

module.exports = { handleDownloader, handleDownloaderUrl };
