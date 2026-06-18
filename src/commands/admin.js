const DB = require("../database/db");
const KB = require("../utils/keyboards");
const { formatTime } = require("../utils/helpers");

async function handleAdmin(ctx, action, args = []) {
  const fromId = ctx.from.id;
  const chat = ctx.chat;
  const reply = (t, kb) => ctx.callbackQuery
    ? ctx.editMessageText(t, { parse_mode: "Markdown", ...kb })
    : ctx.reply(t, { parse_mode: "Markdown", ...kb });

  async function isAdmin() {
    try {
      const member = await ctx.telegram.getChatMember(chat.id, fromId);
      return ["administrator", "creator"].includes(member.status);
    } catch { return false; }
  }

  async function getTarget() {
    const replied = ctx.message?.reply_to_message;
    if (replied) return replied.from;
    if (args[0]) {
      const username = args[0].replace("@", "");
      try { const m = await ctx.telegram.getChatMember(chat.id, username); return m.user; } catch {}
    }
    return null;
  }

  switch (action) {
    case "kick": {
      if (!await isAdmin()) return reply("❌ Admin only!", KB.adminMenu());
      const t = await getTarget();
      if (!t) return reply("❌ Reply to a message or provide a username to kick.", KB.adminMenu());
      try {
        await ctx.telegram.banChatMember(chat.id, t.id);
        await ctx.telegram.unbanChatMember(chat.id, t.id);
        return reply(`👢 *${t.first_name}* was kicked from the chat.`, KB.adminMenu());
      } catch (e) { return reply(`❌ Failed: ${e.message}`, KB.adminMenu()); }
    }
    case "ban": {
      if (!await isAdmin()) return reply("❌ Admin only!", KB.adminMenu());
      const t = await getTarget();
      if (!t) return reply("❌ Reply to a message or provide a username to ban.", KB.adminMenu());
      try {
        await ctx.telegram.banChatMember(chat.id, t.id);
        return reply(`🚫 *${t.first_name}* was banned.`, KB.adminMenu());
      } catch (e) { return reply(`❌ Failed: ${e.message}`, KB.adminMenu()); }
    }
    case "unban": {
      if (!await isAdmin()) return reply("❌ Admin only!", KB.adminMenu());
      const t = await getTarget();
      if (!t) return reply("❌ Reply to a message or provide a username to unban.", KB.adminMenu());
      try {
        await ctx.telegram.unbanChatMember(chat.id, t.id);
        return reply(`✅ *${t.first_name}* was unbanned.`, KB.adminMenu());
      } catch (e) { return reply(`❌ Failed: ${e.message}`, KB.adminMenu()); }
    }
    case "mute": {
      if (!await isAdmin()) return reply("❌ Admin only!", KB.adminMenu());
      const t = await getTarget();
      if (!t) return reply("❌ Reply to a message or provide a username to mute.", KB.adminMenu());
      const dur = parseInt(args[0]) || 60;
      try {
        await ctx.telegram.restrictChatMember(chat.id, t.id, { permissions: { can_send_messages: false }, until_date: Math.floor(Date.now() / 1000) + dur * 60 });
        return reply(`🔇 *${t.first_name}* muted for ${dur} minutes.`, KB.adminMenu());
      } catch (e) { return reply(`❌ Failed: ${e.message}`, KB.adminMenu()); }
    }
    case "unmute": {
      if (!await isAdmin()) return reply("❌ Admin only!", KB.adminMenu());
      const t = await getTarget();
      if (!t) return reply("❌ Reply to a message or provide a username to unmute.", KB.adminMenu());
      try {
        await ctx.telegram.restrictChatMember(chat.id, t.id, { permissions: { can_send_messages: true, can_send_media_messages: true, can_send_polls: true, can_send_other_messages: true, can_add_web_page_previews: true } });
        return reply(`🔊 *${t.first_name}* was unmuted.`, KB.adminMenu());
      } catch (e) { return reply(`❌ Failed: ${e.message}`, KB.adminMenu()); }
    }
    case "warn": {
      if (!await isAdmin()) return reply("❌ Admin only!", KB.adminMenu());
      const t = await getTarget();
      if (!t) return reply("❌ Reply to a message or provide a username to warn.", KB.adminMenu());
      const warns = DB.getWarns(String(chat.id), String(t.id));
      warns.push({ reason: args.slice(1).join(" ") || "No reason", date: Date.now(), by: fromId });
      DB.saveWarns(String(chat.id), String(t.id), warns);
      return reply(`⚠️ *${t.first_name}* warned! (${warns.length}/3)\n\nReason: ${warns[warns.length - 1].reason}`, KB.adminMenu());
    }
    case "warnings": {
      const t = await getTarget() || ctx.from;
      const warns = DB.getWarns(String(chat.id), String(t.id));
      if (!warns.length) return reply(`✅ *${t.first_name}* has no warnings.`, KB.adminMenu());
      const list = warns.map((w, i) => `${i + 1}. ${w.reason}`).join("\n");
      return reply(`⚠️ *${t.first_name}'s Warnings (${warns.length}/3)*\n\n${list}`, KB.adminMenu());
    }
    case "clearwarns": {
      if (!await isAdmin()) return reply("❌ Admin only!", KB.adminMenu());
      const t = await getTarget();
      if (!t) return reply("❌ Reply to or mention a user.", KB.adminMenu());
      DB.saveWarns(String(chat.id), String(t.id), []);
      return reply(`✅ Cleared all warnings for *${t.first_name}*.`, KB.adminMenu());
    }
    case "promote": {
      if (!await isAdmin()) return reply("❌ Admin only!", KB.adminMenu());
      const t = await getTarget();
      if (!t) return reply("❌ Reply to or mention a user.", KB.adminMenu());
      try {
        await ctx.telegram.promoteChatMember(chat.id, t.id, { can_manage_chat: true, can_delete_messages: true, can_ban_users: true, can_restrict_members: true, can_pin_messages: true });
        return reply(`⬆️ *${t.first_name}* was promoted to admin.`, KB.adminMenu());
      } catch (e) { return reply(`❌ Failed: ${e.message}`, KB.adminMenu()); }
    }
    case "demote": {
      if (!await isAdmin()) return reply("❌ Admin only!", KB.adminMenu());
      const t = await getTarget();
      if (!t) return reply("❌ Reply to or mention a user.", KB.adminMenu());
      try {
        await ctx.telegram.promoteChatMember(chat.id, t.id, { can_manage_chat: false, can_delete_messages: false, can_ban_users: false, can_restrict_members: false, can_pin_messages: false });
        return reply(`⬇️ *${t.first_name}* was demoted.`, KB.adminMenu());
      } catch (e) { return reply(`❌ Failed: ${e.message}`, KB.adminMenu()); }
    }
    case "lock": {
      if (!await isAdmin()) return reply("❌ Admin only!", KB.adminMenu());
      try {
        await ctx.telegram.setChatPermissions(chat.id, { can_send_messages: false });
        return reply("🔒 Chat locked. Only admins can send messages.", KB.adminMenu());
      } catch (e) { return reply(`❌ Failed: ${e.message}`, KB.adminMenu()); }
    }
    case "unlock": {
      if (!await isAdmin()) return reply("❌ Admin only!", KB.adminMenu());
      try {
        await ctx.telegram.setChatPermissions(chat.id, { can_send_messages: true, can_send_media_messages: true, can_send_polls: true, can_send_other_messages: true });
        return reply("🔓 Chat unlocked.", KB.adminMenu());
      } catch (e) { return reply(`❌ Failed: ${e.message}`, KB.adminMenu()); }
    }
    case "tagall": {
      if (!await isAdmin()) return reply("❌ Admin only!", KB.adminMenu());
      return reply(`📢 @everyone — ${args.join(" ") || "Attention everyone!"}\n\n_(Telegram doesn't support true @all — use this for announcements)_`, KB.adminMenu());
    }
    case "invitelink": {
      if (!await isAdmin()) return reply("❌ Admin only!", KB.adminMenu());
      try {
        const link = await ctx.telegram.exportChatInviteLink(chat.id);
        return reply(`🔗 *Invite Link:*\n\n${link}`, KB.adminMenu());
      } catch (e) { return reply(`❌ Failed: ${e.message}`, KB.adminMenu()); }
    }
    case "antilink_on": {
      if (!await isAdmin()) return reply("❌ Admin only!", KB.adminMenu());
      DB.setChatSetting(String(chat.id), "antilink", true);
      return reply("🔗 *Anti-Link: ON*\n\nLinks will be deleted automatically.", KB.adminMenu());
    }
    case "antilink_off": {
      if (!await isAdmin()) return reply("❌ Admin only!", KB.adminMenu());
      DB.setChatSetting(String(chat.id), "antilink", false);
      return reply("🔗 *Anti-Link: OFF*\n\nLinks are now allowed.", KB.adminMenu());
    }
    case "stafflist": {
      try {
        const admins = await ctx.telegram.getChatAdministrators(chat.id);
        const list = admins.map(a => `${a.status === "creator" ? "👑" : "⭐"} ${a.user.first_name || a.user.username || "Unknown"}`).join("\n");
        return reply(`🛡 *Staff List*\n\n${list}`, KB.adminMenu());
      } catch (e) { return reply(`❌ Failed: ${e.message}`, KB.adminMenu()); }
    }
    case "myrole": {
      try {
        const member = await ctx.telegram.getChatMember(chat.id, fromId);
        const roles = { creator: "👑 Owner", administrator: "⭐ Admin", member: "👤 Member", restricted: "🔒 Restricted", left: "🚪 Left", kicked: "🚫 Banned" };
        return reply(`🏷 *Your Role*\n\n${roles[member.status] || "Unknown"}`, KB.adminMenu());
      } catch (e) { return reply(`❌ Failed: ${e.message}`, KB.adminMenu()); }
    }
    default:
      return reply("❓ Unknown admin action.", KB.adminMenu());
  }
}

module.exports = { handleAdmin };
