const DB = require("../database/db");
const KB = require("../utils/keyboards");
const { formatNumber, formatTime, capitalize } = require("../utils/helpers");

const CS = process.env.CURRENCY_SYMBOL || "💎";
const OWNER_ID = process.env.OWNER_ID;

function isOwner(ctx) {
  return String(ctx.from.id) === String(OWNER_ID);
}

function replyText(ctx, text, kb, replyMsgId) {
  return ctx.reply(text, { parse_mode: "Markdown", ...(kb || {}), ...(replyMsgId ? { reply_to_message_id: replyMsgId } : {}) });
}

async function handleOwner(ctx, action, args = []) {
  if (!isOwner(ctx)) {
    return; // silently ignore non-owners
  }

  const msgId = ctx.message?.message_id;
  const id = String(ctx.from.id);

  async function getTarget() {
    const replied = ctx.message?.reply_to_message;
    if (replied) return { id: String(replied.from.id), name: replied.from.first_name || replied.from.username || "User" };
    if (args[0]) {
      const clean = args[0].replace("@","");
      try { const m = await ctx.telegram.getChatMember(ctx.chat.id, clean); return { id: String(m.user.id), name: m.user.first_name || clean }; } catch {}
    }
    return null;
  }

  switch (action) {

    // ─── ECONOMY ───────────────────────────────────────────────
    case "addcoins":
    case "give": {
      const t = await getTarget();
      const amount = parseInt(args[0]) || parseInt(args[1]);
      if (!t || !amount) return replyText(ctx, "Reply to a user and specify amount.\n`.give 1000`", null, msgId);
      const eco = DB.getEconomy(t.id);
      DB.saveEconomy(t.id, { wallet: eco.wallet + amount });
      return replyText(ctx, `Added ${CS} ${formatNumber(amount)} to *${t.name}*'s wallet.\nNew balance: ${CS} ${formatNumber(eco.wallet + amount)}`, null, msgId);
    }

    case "removecoins":
    case "take": {
      const t = await getTarget();
      const amount = parseInt(args[0]) || parseInt(args[1]);
      if (!t || !amount) return replyText(ctx, "Reply to a user and specify amount.", null, msgId);
      const eco = DB.getEconomy(t.id);
      DB.saveEconomy(t.id, { wallet: Math.max(0, eco.wallet - amount) });
      return replyText(ctx, `Removed ${CS} ${formatNumber(amount)} from *${t.name}*'s wallet.`, null, msgId);
    }

    case "setcoins": {
      const t = await getTarget();
      const amount = parseInt(args[0]) || parseInt(args[1]);
      if (!t || amount === undefined) return replyText(ctx, "Reply to a user and specify amount.", null, msgId);
      DB.saveEconomy(t.id, { wallet: amount });
      return replyText(ctx, `Set *${t.name}*'s wallet to ${CS} ${formatNumber(amount)}.`, null, msgId);
    }

    case "addbank": {
      const t = await getTarget();
      const amount = parseInt(args[0]) || parseInt(args[1]);
      if (!t || !amount) return replyText(ctx, "Reply to a user and specify amount.", null, msgId);
      const eco = DB.getEconomy(t.id);
      DB.saveEconomy(t.id, { bank: eco.bank + amount });
      return replyText(ctx, `Added ${CS} ${formatNumber(amount)} to *${t.name}*'s bank.`, null, msgId);
    }

    case "reseteconomy": {
      const t = await getTarget();
      if (!t) return replyText(ctx, "Reply to a user.", null, msgId);
      DB.saveEconomy(t.id, { wallet: 500, bank: 0, bankLimit: 5000, loan: 0, prestige: 0, totalEarned: 0 });
      return replyText(ctx, `Reset *${t.name}*'s economy.`, null, msgId);
    }

    case "addxp": {
      const t = await getTarget();
      const amount = parseInt(args[0]) || parseInt(args[1]) || 100;
      if (!t) return replyText(ctx, "Reply to a user.", null, msgId);
      const u = DB.getUser(t.id);
      DB.saveUser(t.id, { xp: (u.xp || 0) + amount });
      return replyText(ctx, `Added ${amount} XP to *${t.name}*.`, null, msgId);
    }

    case "setlevel": {
      const t = await getTarget();
      const level = parseInt(args[0]) || parseInt(args[1]);
      if (!t || !level) return replyText(ctx, "Reply to user and specify level.", null, msgId);
      DB.saveUser(t.id, { level });
      return replyText(ctx, `Set *${t.name}*'s level to ${level}.`, null, msgId);
    }

    case "setprestige": {
      const t = await getTarget();
      const p = parseInt(args[0]) || parseInt(args[1]);
      if (!t) return replyText(ctx, "Reply to user.", null, msgId);
      DB.saveEconomy(t.id, { prestige: p });
      return replyText(ctx, `Set *${t.name}*'s prestige to ${p}.`, null, msgId);
    }

    // ─── POKEMON ───────────────────────────────────────────────
    case "givepokemon": {
      const t = await getTarget();
      const pokeName = (args[0] || args[1] || "").toLowerCase();
      if (!t || !pokeName) return replyText(ctx, "Reply to user and specify Pokemon name.", null, msgId);
      const { getPokemonData, NATURES, rand } = require("../utils/helpers");
      const pk = await getPokemonData(pokeName);
      if (!pk) return replyText(ctx, `Pokemon "${pokeName}" not found.`, null, msgId);
      const nature = NATURES[rand(0, NATURES.length - 1)];
      const gift = { ...pk, level: parseInt(args[2]) || 50, maxHp: pk.hp * 2, currentHp: pk.hp * 2, exp: 0, nature, friendship: 100, heldItem: null, status: null, fainted: false, caughtAt: Date.now() };
      const pkData = DB.getPokemon(t.id);
      if (pkData.party.length < 6) DB.savePokemon(t.id, { party: [...pkData.party, gift] });
      else DB.savePokemon(t.id, { pc: [...pkData.pc, gift] });
      return replyText(ctx, `Gave *${capitalize(pokeName)}* to *${t.name}*.`, null, msgId);
    }

    case "setpokemonlevel": {
      const t = await getTarget();
      const idx = parseInt(args[0]) - 1;
      const level = parseInt(args[1]);
      if (!t || isNaN(idx) || !level) return replyText(ctx, "Usage: reply user, .setpokemonlevel <slot> <level>", null, msgId);
      const pkData = DB.getPokemon(t.id);
      if (!pkData.party[idx]) return replyText(ctx, "Pokemon slot not found.", null, msgId);
      pkData.party[idx].level = level;
      DB.savePokemon(t.id, { party: pkData.party });
      return replyText(ctx, `Set *${t.name}*'s slot ${idx+1} to level ${level}.`, null, msgId);
    }

    case "clearparty": {
      const t = await getTarget();
      if (!t) return replyText(ctx, "Reply to user.", null, msgId);
      DB.savePokemon(t.id, { party: [] });
      return replyText(ctx, `Cleared *${t.name}*'s Pokemon party.`, null, msgId);
    }

    case "clearpc": {
      const t = await getTarget();
      if (!t) return replyText(ctx, "Reply to user.", null, msgId);
      DB.savePokemon(t.id, { pc: [] });
      return replyText(ctx, `Cleared *${t.name}*'s PC storage.`, null, msgId);
    }

    case "giveballs": {
      const t = await getTarget();
      const qty = parseInt(args[0]) || parseInt(args[1]) || 10;
      if (!t) return replyText(ctx, "Reply to user.", null, msgId);
      DB.addItem(t.id, "Poke Ball", qty);
      DB.addItem(t.id, "Great Ball", qty);
      DB.addItem(t.id, "Ultra Ball", qty);
      return replyText(ctx, `Gave ${qty} of each ball to *${t.name}*.`, null, msgId);
    }

    case "givemasterball": {
      const t = await getTarget();
      const qty = parseInt(args[0]) || parseInt(args[1]) || 1;
      if (!t) return replyText(ctx, "Reply to user.", null, msgId);
      DB.addItem(t.id, "Master Ball", qty);
      return replyText(ctx, `Gave ${qty} Master Ball(s) to *${t.name}*.`, null, msgId);
    }

    case "giveitem": {
      const t = await getTarget();
      const item = args.slice(0, -1).join(" ") || args[0];
      const qty = parseInt(args[args.length - 1]) || 1;
      if (!t || !item) return replyText(ctx, "Reply to user and specify item name.", null, msgId);
      DB.addItem(t.id, item, qty);
      return replyText(ctx, `Gave ${qty}x *${item}* to *${t.name}*.`, null, msgId);
    }

    case "resetpokedex": {
      const t = await getTarget();
      if (!t) return replyText(ctx, "Reply to user.", null, msgId);
      const fs = require("fs"), path = require("path");
      const filePath = path.join(__dirname, "../../data/pokedexSeen.json");
      try { const d = JSON.parse(fs.readFileSync(filePath, "utf8") || "{}"); delete d[t.id]; fs.writeFileSync(filePath, JSON.stringify(d, null, 2)); } catch {}
      return replyText(ctx, `Reset *${t.name}*'s Pokedex.`, null, msgId);
    }

    case "resetpokemon": {
      const t = await getTarget();
      if (!t) return replyText(ctx, "Reply to user.", null, msgId);
      DB.savePokemon(t.id, { party: [], pc: [], starter: null, oakStep: 0 });
      return replyText(ctx, `Reset *${t.name}*'s entire Pokemon data.`, null, msgId);
    }

    // ─── USER MANAGEMENT ──────────────────────────────────────
    case "resetuser": {
      const t = await getTarget();
      if (!t) return replyText(ctx, "Reply to user.", null, msgId);
      DB.saveUser(t.id, { xp: 0, level: 1, banned: false });
      DB.saveEconomy(t.id, { wallet: 500, bank: 0 });
      return replyText(ctx, `Reset *${t.name}*'s user profile.`, null, msgId);
    }

    case "botban": {
      const t = await getTarget();
      if (!t) return replyText(ctx, "Reply to user.", null, msgId);
      DB.saveUser(t.id, { banned: true });
      return replyText(ctx, `*${t.name}* has been bot-banned.`, null, msgId);
    }

    case "botunban": {
      const t = await getTarget();
      if (!t) return replyText(ctx, "Reply to user.", null, msgId);
      DB.saveUser(t.id, { banned: false });
      return replyText(ctx, `*${t.name}* has been bot-unbanned.`, null, msgId);
    }

    case "userinfo": {
      const t = await getTarget() || { id };
      const u = DB.getUser(t.id);
      const eco = DB.getEconomy(t.id);
      const pk = DB.getPokemon(t.id);
      return replyText(ctx, [
        `*User Info: ${t.name || "Unknown"}*`,
        `ID: \`${t.id}\``,
        `Level: ${u.level} | XP: ${u.xp}`,
        `Wallet: ${CS} ${formatNumber(eco.wallet)}`,
        `Bank: ${CS} ${formatNumber(eco.bank)}`,
        `Prestige: ${eco.prestige}`,
        `Pokemon Party: ${pk.party.length}`,
        `Starter: ${pk.starter || "None"}`,
        `Banned: ${u.banned ? "Yes" : "No"}`,
      ].join("\n"), null, msgId);
    }

    case "allusers": {
      const users = DB.getAllUsers();
      const count = Object.keys(users).length;
      return replyText(ctx, `Total registered users: *${count}*`, null, msgId);
    }

    case "allgroups": {
      const groups = DB.getAllGroups();
      const count = Object.keys(groups).length;
      return replyText(ctx, `Total groups in DB: *${count}*`, null, msgId);
    }

    case "topbalance": {
      const eco = DB.getAllEconomy();
      const sorted = Object.entries(eco).sort((a, b) => (b[1].wallet + b[1].bank) - (a[1].wallet + a[1].bank)).slice(0, 10);
      const list = sorted.map(([uid, e], i) => `${i+1}. \`${uid}\` - ${CS} ${formatNumber(e.wallet + e.bank)}`).join("\n");
      return replyText(ctx, `*Top Balances*\n\n${list || "No data."}`, null, msgId);
    }

    // ─── BOT MANAGEMENT ────────────────────────────────────────
    case "broadcast": {
      const text = args.join(" ");
      if (!text) return replyText(ctx, "Usage: `.broadcast <message>`", null, msgId);
      const users = DB.getAllUsers();
      let sent = 0, failed = 0;
      for (const uid of Object.keys(users)) {
        try { await ctx.telegram.sendMessage(uid, `*Broadcast from Owner:*\n\n${text}`, { parse_mode: "Markdown" }); sent++; } catch { failed++; }
        await new Promise(r => setTimeout(r, 50));
      }
      return replyText(ctx, `Broadcast done!\nSent: ${sent}\nFailed: ${failed}`, null, msgId);
    }

    case "groupbroadcast": {
      const text = args.join(" ");
      if (!text) return replyText(ctx, "Usage: `.groupbroadcast <message>`", null, msgId);
      const groups = DB.getAllGroups();
      let sent = 0, failed = 0;
      for (const gid of Object.keys(groups)) {
        try { await ctx.telegram.sendMessage(gid, `*Announcement:*\n\n${text}`, { parse_mode: "Markdown" }); sent++; } catch { failed++; }
        await new Promise(r => setTimeout(r, 100));
      }
      return replyText(ctx, `Group broadcast done!\nSent: ${sent}\nFailed: ${failed}`, null, msgId);
    }

    case "join": {
      const link = args[0];
      if (!link) return replyText(ctx, "Usage: `.join <invite_link>`", null, msgId);
      try {
        await ctx.telegram.joinChat(link);
        return replyText(ctx, `Successfully joined the group!`, null, msgId);
      } catch (e) {
        return replyText(ctx, `Failed to join: ${e.message}`, null, msgId);
      }
    }

    case "leave": {
      const targetChatId = args[0] || String(ctx.chat.id);
      try {
        await ctx.telegram.leaveChat(targetChatId);
        return replyText(ctx, `Left chat \`${targetChatId}\`.`, null, msgId);
      } catch (e) {
        return replyText(ctx, `Failed to leave: ${e.message}`, null, msgId);
      }
    }

    case "ping":
      return replyText(ctx, `Pong! Bot is online.\nTimestamp: ${new Date().toISOString()}`, null, msgId);

    case "uptime": {
      const upMs = process.uptime() * 1000;
      return replyText(ctx, `Uptime: ${formatTime(upMs)}`, null, msgId);
    }

    case "stats": {
      const users = DB.getAllUsers();
      const eco = DB.getAllEconomy();
      const groups = DB.getAllGroups();
      const mem = process.memoryUsage();
      return replyText(ctx, [
        `*Bot Statistics*`,
        `Users: ${Object.keys(users).length}`,
        `Groups: ${Object.keys(groups).length}`,
        `Uptime: ${formatTime(process.uptime() * 1000)}`,
        `Memory: ${Math.round(mem.heapUsed / 1024 / 1024)}MB / ${Math.round(mem.heapTotal / 1024 / 1024)}MB`,
        `Node: ${process.version}`,
        `Platform: ${process.platform}`,
      ].join("\n"), null, msgId);
    }

    case "eval": {
      const code = args.join(" ");
      if (!code) return replyText(ctx, "Provide code to eval.", null, msgId);
      try {
        let result = eval(code);
        if (result && typeof result.then === "function") result = await result;
        const output = typeof result === "object" ? JSON.stringify(result, null, 2) : String(result);
        return replyText(ctx, `*Eval Result:*\n\`\`\`\n${output.slice(0, 2000)}\n\`\`\``, null, msgId);
      } catch (e) {
        return replyText(ctx, `*Eval Error:*\n\`\`\`\n${e.message}\n\`\`\``, null, msgId);
      }
    }

    case "shell": {
      const cmd = args.join(" ");
      if (!cmd) return replyText(ctx, "Provide a shell command.", null, msgId);
      const { exec } = require("child_process");
      try {
        const out = await new Promise((res, rej) => exec(cmd, { timeout: 10000 }, (e, stdout, stderr) => e ? rej(e) : res(stdout || stderr)));
        return replyText(ctx, `*Shell Output:*\n\`\`\`\n${out.slice(0, 2000)}\n\`\`\``, null, msgId);
      } catch (e) {
        return replyText(ctx, `*Shell Error:* ${e.message}`, null, msgId);
      }
    }

    case "restart": {
      await replyText(ctx, "Restarting bot...", null, msgId);
      process.exit(0);
    }

    case "clearcooldowns": {
      const t = await getTarget();
      if (!t) return replyText(ctx, "Reply to user.", null, msgId);
      const fs = require("fs"), path = require("path");
      const filePath = path.join(__dirname, "../../data/cooldowns.json");
      try {
        const d = JSON.parse(fs.readFileSync(filePath, "utf8") || "{}");
        for (const k of Object.keys(d)) { if (k.startsWith(t.id + ":")) delete d[k]; }
        fs.writeFileSync(filePath, JSON.stringify(d, null, 2));
      } catch {}
      return replyText(ctx, `Cleared all cooldowns for *${t.name}*.`, null, msgId);
    }

    case "clearallcooldowns": {
      const fs = require("fs"), path = require("path");
      const filePath = path.join(__dirname, "../../data/cooldowns.json");
      try { fs.writeFileSync(filePath, "{}"); } catch {}
      return replyText(ctx, "Cleared ALL cooldowns.", null, msgId);
    }

    case "setbotname": {
      const name = args.join(" ");
      if (!name) return replyText(ctx, "Provide a name.", null, msgId);
      try { await ctx.telegram.setMyName(name); return replyText(ctx, `Bot name set to: *${name}*`, null, msgId); }
      catch (e) { return replyText(ctx, `Failed: ${e.message}`, null, msgId); }
    }

    case "setbotdesc": {
      const desc = args.join(" ");
      if (!desc) return replyText(ctx, "Provide a description.", null, msgId);
      try { await ctx.telegram.setMyDescription(desc); return replyText(ctx, "Bot description updated!", null, msgId); }
      catch (e) { return replyText(ctx, `Failed: ${e.message}`, null, msgId); }
    }

    case "setbotshortdesc": {
      const desc = args.join(" ");
      try { await ctx.telegram.setMyShortDescription(desc); return replyText(ctx, "Short description updated!", null, msgId); }
      catch (e) { return replyText(ctx, `Failed: ${e.message}`, null, msgId); }
    }

    case "sendmessage": {
      const targetId = args[0];
      const text = args.slice(1).join(" ");
      if (!targetId || !text) return replyText(ctx, "Usage: `.sendmessage <userId> <message>`", null, msgId);
      try { await ctx.telegram.sendMessage(targetId, text); return replyText(ctx, "Message sent!", null, msgId); }
      catch (e) { return replyText(ctx, `Failed: ${e.message}`, null, msgId); }
    }

    case "pinmessage": {
      if (!ctx.message?.reply_to_message) return replyText(ctx, "Reply to a message to pin it.", null, msgId);
      try {
        await ctx.telegram.pinChatMessage(ctx.chat.id, ctx.message.reply_to_message.message_id);
        return replyText(ctx, "Message pinned!", null, msgId);
      } catch (e) { return replyText(ctx, `Failed: ${e.message}`, null, msgId); }
    }

    case "unpinall": {
      try { await ctx.telegram.unpinAllChatMessages(ctx.chat.id); return replyText(ctx, "All messages unpinned!", null, msgId); }
      catch (e) { return replyText(ctx, `Failed: ${e.message}`, null, msgId); }
    }

    case "chatinfo": {
      try {
        const chat = await ctx.telegram.getChat(args[0] || ctx.chat.id);
        return replyText(ctx, [
          `*Chat Info*`,
          `ID: \`${chat.id}\``,
          `Title: ${chat.title || chat.first_name || "N/A"}`,
          `Type: ${chat.type}`,
          `Username: @${chat.username || "none"}`,
          `Members: ${chat.members_count || "N/A"}`,
        ].join("\n"), null, msgId);
      } catch (e) { return replyText(ctx, `Failed: ${e.message}`, null, msgId); }
    }

    case "kick": {
      const t = await getTarget();
      if (!t) return replyText(ctx, "Reply to user.", null, msgId);
      try {
        await ctx.telegram.banChatMember(ctx.chat.id, t.id);
        await ctx.telegram.unbanChatMember(ctx.chat.id, t.id);
        return replyText(ctx, `Kicked *${t.name}*.`, null, msgId);
      } catch (e) { return replyText(ctx, `Failed: ${e.message}`, null, msgId); }
    }

    case "ban": {
      const t = await getTarget();
      if (!t) return replyText(ctx, "Reply to user.", null, msgId);
      try { await ctx.telegram.banChatMember(ctx.chat.id, t.id); return replyText(ctx, `Banned *${t.name}*.`, null, msgId); }
      catch (e) { return replyText(ctx, `Failed: ${e.message}`, null, msgId); }
    }

    case "mute": {
      const t = await getTarget();
      const dur = parseInt(args[0]) || 60;
      if (!t) return replyText(ctx, "Reply to user.", null, msgId);
      try {
        await ctx.telegram.restrictChatMember(ctx.chat.id, t.id, { permissions: { can_send_messages: false }, until_date: Math.floor(Date.now()/1000) + dur*60 });
        return replyText(ctx, `Muted *${t.name}* for ${dur} minutes.`, null, msgId);
      } catch (e) { return replyText(ctx, `Failed: ${e.message}`, null, msgId); }
    }

    case "unmute": {
      const t = await getTarget();
      if (!t) return replyText(ctx, "Reply to user.", null, msgId);
      try {
        await ctx.telegram.restrictChatMember(ctx.chat.id, t.id, { permissions: { can_send_messages: true, can_send_media_messages: true, can_send_polls: true, can_send_other_messages: true } });
        return replyText(ctx, `Unmuted *${t.name}*.`, null, msgId);
      } catch (e) { return replyText(ctx, `Failed: ${e.message}`, null, msgId); }
    }

    case "promote": {
      const t = await getTarget();
      if (!t) return replyText(ctx, "Reply to user.", null, msgId);
      try {
        await ctx.telegram.promoteChatMember(ctx.chat.id, t.id, { can_manage_chat: true, can_delete_messages: true, can_ban_users: true, can_pin_messages: true });
        return replyText(ctx, `Promoted *${t.name}* to admin.`, null, msgId);
      } catch (e) { return replyText(ctx, `Failed: ${e.message}`, null, msgId); }
    }

    case "demote": {
      const t = await getTarget();
      if (!t) return replyText(ctx, "Reply to user.", null, msgId);
      try {
        await ctx.telegram.promoteChatMember(ctx.chat.id, t.id, { can_manage_chat: false, can_delete_messages: false, can_ban_users: false, can_pin_messages: false });
        return replyText(ctx, `Demoted *${t.name}*.`, null, msgId);
      } catch (e) { return replyText(ctx, `Failed: ${e.message}`, null, msgId); }
    }

    case "antilink_on": {
      DB.setChatSetting(String(ctx.chat.id), "antilink", true);
      return replyText(ctx, "Anti-link enabled.", null, msgId);
    }

    case "antilink_off": {
      DB.setChatSetting(String(ctx.chat.id), "antilink", false);
      return replyText(ctx, "Anti-link disabled.", null, msgId);
    }

    case "anticap_on": {
      DB.setChatSetting(String(ctx.chat.id), "anticap", true);
      return replyText(ctx, "Anti-caps enabled.", null, msgId);
    }

    case "anticap_off": {
      DB.setChatSetting(String(ctx.chat.id), "anticap", false);
      return replyText(ctx, "Anti-caps disabled.", null, msgId);
    }

    case "antispam_on": {
      DB.setChatSetting(String(ctx.chat.id), "antispam", true);
      return replyText(ctx, "Anti-spam enabled.", null, msgId);
    }

    case "antispam_off": {
      DB.setChatSetting(String(ctx.chat.id), "antispam", false);
      return replyText(ctx, "Anti-spam disabled.", null, msgId);
    }

    case "setwelcome": {
      const msg = args.join(" ");
      DB.setChatSetting(String(ctx.chat.id), "welcomeMsg", msg);
      return replyText(ctx, `Welcome message set to:\n${msg}`, null, msgId);
    }

    case "welcome_on": {
      DB.setChatSetting(String(ctx.chat.id), "welcome", true);
      return replyText(ctx, "Welcome messages enabled.", null, msgId);
    }

    case "welcome_off": {
      DB.setChatSetting(String(ctx.chat.id), "welcome", false);
      return replyText(ctx, "Welcome messages disabled.", null, msgId);
    }

    case "deletedb": {
      const t = await getTarget();
      if (!t) return replyText(ctx, "Reply to user.", null, msgId);
      const files = ["users","economy","pokemon","cooldowns","inventory","rpg","cards","achievements","pokedexSeen"];
      for (const file of files) {
        try {
          const fs = require("fs"), path = require("path");
          const filePath = path.join(__dirname, `../../data/${file}.json`);
          const d = JSON.parse(fs.readFileSync(filePath, "utf8") || "{}");
          delete d[t.id];
          fs.writeFileSync(filePath, JSON.stringify(d, null, 2));
        } catch {}
      }
      return replyText(ctx, `Deleted all data for user \`${t.id}\` (${t.name}).`, null, msgId);
    }

    case "setcurrency": {
      process.env.CURRENCY_SYMBOL = args[0] || "💎";
      return replyText(ctx, `Currency symbol set to: ${args[0] || "💎"}`, null, msgId);
    }

    case "setprefix": {
      process.env.BOT_PREFIX = args[0] || ".";
      return replyText(ctx, `Prefix set to: \`${args[0] || "."}\``, null, msgId);
    }

    case "getchatid":
      return replyText(ctx, `Chat ID: \`${ctx.chat.id}\`\nUser ID: \`${ctx.from.id}\``, null, msgId);

    case "admins": {
      try {
        const admins = await ctx.telegram.getChatAdministrators(ctx.chat.id);
        const list = admins.map(a => `${a.status === "creator" ? "👑" : "⭐"} ${a.user.first_name || a.user.username}`).join("\n");
        return replyText(ctx, `*Chat Admins:*\n\n${list}`, null, msgId);
      } catch (e) { return replyText(ctx, `Failed: ${e.message}`, null, msgId); }
    }

    case "invite": {
      try {
        const link = await ctx.telegram.exportChatInviteLink(ctx.chat.id);
        return replyText(ctx, `*Invite Link:*\n${link}`, null, msgId);
      } catch (e) { return replyText(ctx, `Failed: ${e.message}`, null, msgId); }
    }

    case "lockgroup": {
      try {
        await ctx.telegram.setChatPermissions(ctx.chat.id, { can_send_messages: false });
        return replyText(ctx, "Group locked.", null, msgId);
      } catch (e) { return replyText(ctx, `Failed: ${e.message}`, null, msgId); }
    }

    case "unlockgroup": {
      try {
        await ctx.telegram.setChatPermissions(ctx.chat.id, { can_send_messages: true, can_send_media_messages: true, can_send_polls: true, can_send_other_messages: true });
        return replyText(ctx, "Group unlocked.", null, msgId);
      } catch (e) { return replyText(ctx, `Failed: ${e.message}`, null, msgId); }
    }

    case "clearinventory": {
      const t = await getTarget();
      if (!t) return replyText(ctx, "Reply to user.", null, msgId);
      const fs = require("fs"), path = require("path");
      const filePath = path.join(__dirname, "../../data/inventory.json");
      try { const d = JSON.parse(fs.readFileSync(filePath, "utf8") || "{}"); d[t.id] = {}; fs.writeFileSync(filePath, JSON.stringify(d, null, 2)); } catch {}
      return replyText(ctx, `Cleared *${t.name}*'s inventory.`, null, msgId);
    }

    case "clearwarnings": {
      const t = await getTarget();
      if (!t) return replyText(ctx, "Reply to user.", null, msgId);
      DB.saveWarns(String(ctx.chat.id), t.id, []);
      return replyText(ctx, `Cleared warnings for *${t.name}*.`, null, msgId);
    }

    case "info":
    case "ownerhelp": {
      return replyText(ctx, [
        `*Owner Commands (${OWNER_ID})*`,
        ``,
        `*Economy:*`,
        `.give/.addcoins - Add coins`,
        `.take/.removecoins - Remove coins`,
        `.setcoins - Set exact wallet`,
        `.addbank - Add to bank`,
        `.addxp - Add XP`,
        `.setlevel - Set level`,
        `.setprestige - Set prestige`,
        `.reseteconomy - Reset eco`,
        ``,
        `*Pokemon:*`,
        `.givepokemon <name> - Give Pokemon`,
        `.giveballs [qty] - Give Poke Balls`,
        `.givemasterball [qty] - Give Master Balls`,
        `.giveitem <item> <qty> - Give item`,
        `.setpokemonlevel <slot> <level>`,
        `.clearparty - Clear party`,
        `.clearpc - Clear PC`,
        `.resetpokedex - Reset Pokedex`,
        `.resetpokemon - Full reset`,
        ``,
        `*User Management:*`,
        `.botban - Ban from bot`,
        `.botunban - Unban from bot`,
        `.userinfo - View user data`,
        `.resetuser - Reset user`,
        `.deletedb - Delete all user data`,
        `.allusers - Count users`,
        `.allgroups - Count groups`,
        `.topbalance - Top balances`,
        `.clearcooldowns - Clear user CDs`,
        `.clearallcooldowns - Clear all CDs`,
        `.clearinventory - Clear inventory`,
        `.clearwarnings - Clear warns`,
        ``,
        `*Bot Management:*`,
        `.broadcast <msg> - DM all users`,
        `.groupbroadcast <msg> - Msg all groups`,
        `.join <link> - Join a group`,
        `.leave [chatId] - Leave group`,
        `.ping - Check bot status`,
        `.uptime - Bot uptime`,
        `.stats - Bot statistics`,
        `.restart - Restart bot`,
        `.eval <code> - Evaluate JS`,
        `.shell <cmd> - Run shell command`,
        `.sendmessage <id> <msg> - Send message`,
        `.setbotname <name> - Set bot name`,
        `.setbotdesc <desc> - Set description`,
        `.getchatid - Get chat/user IDs`,
        `.chatinfo [id] - Get chat info`,
        ``,
        `*Group Settings:*`,
        `.antilink_on/off`,
        `.anticap_on/off`,
        `.antispam_on/off`,
        `.welcome_on/off`,
        `.setwelcome <msg>`,
        `.pinmessage - Pin replied msg`,
        `.unpinall - Unpin all`,
        `.lockgroup / .unlockgroup`,
        `.admins - List admins`,
        `.invite - Get invite link`,
        `.kick / .ban / .mute / .unmute`,
        `.promote / .demote`,
        `.setcurrency <symbol>`,
        `.setprefix <prefix>`,
      ].join("\n"), null, msgId);
    }

    default:
      return; // silently ignore unknown owner actions
  }
}

module.exports = { handleOwner, isOwner };
