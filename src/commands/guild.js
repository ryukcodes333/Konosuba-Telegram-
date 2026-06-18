const DB = require("../database/db");
const KB = require("../utils/keyboards");
const { formatNumber } = require("../utils/helpers");

const CS = process.env.CURRENCY_SYMBOL || "💎";

async function handleGuild(ctx, action, args = []) {
  const id = String(ctx.from.id);
  const name = ctx.from.first_name || "User";
  const reply = (t, kb) => ctx.callbackQuery
    ? ctx.editMessageText(t, { parse_mode: "Markdown", ...kb })
    : ctx.reply(t, { parse_mode: "Markdown", ...kb });

  switch (action) {
    case "info": {
      const g = DB.getUserGuild(id);
      if (!g) return reply("❌ You're not in a guild\\!\n\nCreate one with \\.createguild <name> or join one with \\.joinguild <name>", KB.guildMenu());
      return reply(`🏰 *Guild: ${g.name}*\n\n👑 Leader: ${g.leader === id ? "You" : "Another member"}\n👥 Members: ${g.members?.length || 0}/20\n⭐ Level: ${g.level || 1}\n✨ XP: ${g.xp || 0}\n💰 Treasury: ${CS} ${formatNumber(g.coins || 0)}\n\n📝 ${g.description || "No description yet"}`, KB.guildMenu());
    }
    case "top": {
      const all = DB.getAllGuilds();
      const sorted = Object.entries(all).sort(([,a],[,b])=>(b.xp||0)-(a.xp||0)).slice(0,10);
      if (!sorted.length) return reply("🏰 No guilds exist yet\\!\n\nCreate one with \\.createguild <name>", KB.guildMenu());
      const list = sorted.map(([n,g],i)=>`${i+1}\\. *${n}* — Lv\\.${g.level||1} | ${g.members?.length||0} members`).join("\n");
      return reply(`🏆 *Top Guilds*\n\n${list}`, KB.guildMenu());
    }
    case "create_prompt":
      return reply("🏰 *Create a Guild*\n\nSend your guild name:\n\nUsage: `.createguild <name>`\nCost: " + CS + " 1,000", KB.guildMenu());
    case "leave": {
      const g = DB.getUserGuild(id);
      if (!g) return reply("❌ You're not in a guild\\.", KB.guildMenu());
      if (g.leader === id) return reply("❌ You're the guild leader\\! Transfer leadership first\\.", KB.guildMenu());
      g.members = (g.members || []).filter(m => m !== id);
      DB.saveGuild(g.name, g);
      return reply(`👋 You left *${g.name}*\\.`, KB.guildMenu());
    }
    default:
      return reply("❓ Unknown guild action\\.", KB.guildMenu());
  }
}

async function handleGuildCommand(ctx, command, args) {
  const id = String(ctx.from.id);
  const eco = DB.getEconomy(id);

  if (command === "createguild") {
    const guildName = args.join(" ");
    if (!guildName || guildName.length < 3) return ctx.reply("❌ Usage: `.createguild <name>`\nName must be 3+ characters.");
    if (DB.getUserGuild(id)) return ctx.reply("❌ You're already in a guild. Leave first with `.leaveguild`");
    if (DB.getGuild(guildName)) return ctx.reply(`❌ Guild *${guildName}* already exists.`, { parse_mode: "Markdown" });
    if (eco.wallet < 1000) return ctx.reply(`❌ Creating a guild costs ${CS} 1,000.\nYour wallet: ${CS} ${formatNumber(eco.wallet)}`);
    DB.saveEconomy(id, { wallet: eco.wallet - 1000 });
    DB.saveGuild(guildName, { leader: id, members: [id], level: 1, xp: 0, coins: 0, description: "A new guild", createdAt: Date.now() });
    return ctx.reply(`🏰 *Guild Created: ${guildName}*!\n\n👑 You are the leader!\nMembers: 1/20\n\nInvite members with \`.guildinvite @user\``, { parse_mode: "Markdown", ...KB.guildMenu() });
  }

  if (command === "joinguild") {
    const guildName = args.join(" ");
    if (!guildName) return ctx.reply("❌ Usage: `.joinguild <name>`");
    if (DB.getUserGuild(id)) return ctx.reply("❌ You're already in a guild. Leave first with `.leaveguild`");
    const g = DB.getGuild(guildName);
    if (!g) return ctx.reply(`❌ Guild *${guildName}* doesn't exist.`, { parse_mode: "Markdown" });
    if ((g.members?.length || 0) >= 20) return ctx.reply(`❌ Guild *${guildName}* is full (20/20).`, { parse_mode: "Markdown" });
    g.members = [...(g.members || []), id];
    DB.saveGuild(guildName, g);
    return ctx.reply(`✅ Joined *${guildName}*!\nMembers: ${g.members.length}/20`, { parse_mode: "Markdown", ...KB.guildMenu() });
  }

  if (command === "leaveguild") {
    const g = DB.getUserGuild(id);
    if (!g) return ctx.reply("❌ You're not in a guild.");
    if (g.leader === id) return ctx.reply("❌ You're the leader! Transfer leadership first.");
    g.members = (g.members || []).filter(m => m !== id);
    DB.saveGuild(g.name, g);
    return ctx.reply(`👋 You left *${g.name}*.`, { parse_mode: "Markdown" });
  }
}

module.exports = { handleGuild, handleGuildCommand };
