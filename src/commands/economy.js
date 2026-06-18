const DB = require("../database/db");
const KB = require("../utils/keyboards");
const { rand, pickRandom, formatNumber, formatTime, MARKET_ITEMS } = require("../utils/helpers");

const CS = process.env.CURRENCY_SYMBOL || "💎";
const COOLDOWNS = { daily: 86400000, weekly: 604800000, monthly: 2592000000, work: 3600000, beg: 600000, crime: 1800000, fish: 900000, dig: 900000, rob: 1800000, heist: 7200000 };

function checkCd(id, cmd) {
  const cd = DB.getCooldown(id, cmd);
  return cd > Date.now() ? formatTime(cd - Date.now()) : null;
}

async function handleEconomy(ctx, action, args = []) {
  const id = String(ctx.from.id);
  const eco = DB.getEconomy(id);
  const user = DB.getUser(id);
  const name = ctx.from.first_name || "User";
  const reply = (t, kb) => ctx.callbackQuery ? ctx.editMessageText(t, { parse_mode: "Markdown", ...kb }) : ctx.reply(t, { parse_mode: "Markdown", ...kb });

  switch (action) {
    case "balance": {
      const text = `💰 *Balance — ${name}*\n\n👛 Wallet: ${CS} ${formatNumber(eco.wallet)}\n🏦 Bank: ${CS} ${formatNumber(eco.bank)} / ${formatNumber(eco.bankLimit)}\n💳 Loan: ${CS} ${formatNumber(eco.loan)}`;
      return reply(text, KB.backAndRefresh("balance", "main"));
    }
    case "profile": {
      const lvl = Math.max(1, Math.floor(Math.sqrt((user.xp || 0) / 50)));
      const text = `👤 *Profile — ${name}*\n\n⭐ Level: ${lvl}\n✨ XP: ${formatNumber(user.xp || 0)}\n👛 Wallet: ${CS} ${formatNumber(eco.wallet)}\n🏦 Bank: ${CS} ${formatNumber(eco.bank)}\n🌟 Prestige: ${eco.prestige || 0}`;
      return reply(text, KB.backAndRefresh("profile", "main"));
    }
    case "rank": {
      const all = DB.getAllUsers();
      const sorted = Object.entries(all).sort(([,a],[,b]) => (b.xp||0)-(a.xp||0));
      const pos = sorted.findIndex(([uid]) => uid === id) + 1;
      return reply(`📊 *Your Rank:* #${pos} of ${sorted.length}\n✨ XP: ${formatNumber(user.xp || 0)}`, KB.back());
    }
    case "daily": {
      const cd = checkCd(id, "daily");
      if (cd) return reply(`⏳ Daily reward on cooldown!\nTry again in *${cd}*`, KB.back("economy"));
      const reward = parseInt(process.env.DAILY_REWARD || "200") + rand(0, 100);
      DB.saveEconomy(id, { wallet: eco.wallet + reward, totalEarned: (eco.totalEarned||0)+reward });
      DB.setCooldown(id, "daily", COOLDOWNS.daily);
      DB.saveUser(id, { xp: (user.xp||0)+10 });
      return reply(`🌅 *Daily Reward!*\n\n+${CS} ${formatNumber(reward)}!\n👛 Wallet: ${CS} ${formatNumber(eco.wallet + reward)}`, KB.economyMenu());
    }
    case "weekly": {
      const cd = checkCd(id, "weekly");
      if (cd) return reply(`⏳ Weekly on cooldown! Try again in *${cd}*`, KB.back("economy"));
      const reward = parseInt(process.env.WEEKLY_REWARD || "1000") + rand(0, 500);
      DB.saveEconomy(id, { wallet: eco.wallet + reward, totalEarned: (eco.totalEarned||0)+reward });
      DB.setCooldown(id, "weekly", COOLDOWNS.weekly);
      return reply(`📅 *Weekly Reward!*\n\n+${CS} ${formatNumber(reward)}!\n👛 Wallet: ${CS} ${formatNumber(eco.wallet + reward)}`, KB.economyMenu());
    }
    case "monthly": {
      const cd = checkCd(id, "monthly");
      if (cd) return reply(`⏳ Monthly on cooldown! Try again in *${cd}*`, KB.back("economy"));
      const reward = parseInt(process.env.MONTHLY_REWARD || "5000") + rand(0, 1000);
      DB.saveEconomy(id, { wallet: eco.wallet + reward, totalEarned: (eco.totalEarned||0)+reward });
      DB.setCooldown(id, "monthly", COOLDOWNS.monthly);
      return reply(`📆 *Monthly Reward!*\n\n+${CS} ${formatNumber(reward)}!\n👛 Wallet: ${CS} ${formatNumber(eco.wallet + reward)}`, KB.economyMenu());
    }
    case "work": {
      const cd = checkCd(id, "work");
      if (cd) return reply(`⏳ Work on cooldown! Try again in *${cd}*`, KB.back("economy"));
      const jobs = ["developer 💻","designer 🎨","doctor 🏥","teacher 📚","chef 🍳","streamer 🎮","trader 📈","musician 🎵","writer ✍️","architect 🏗️"];
      const earned = rand(parseInt(process.env.WORK_MIN||"50"), parseInt(process.env.WORK_MAX||"300"));
      DB.saveEconomy(id, { wallet: eco.wallet + earned, totalEarned: (eco.totalEarned||0)+earned });
      DB.setCooldown(id, "work", COOLDOWNS.work);
      DB.saveUser(id, { xp: (user.xp||0)+5 });
      return reply(`💼 You worked as a *${pickRandom(jobs)}* and earned ${CS} ${formatNumber(earned)}!\n\n👛 Wallet: ${CS} ${formatNumber(eco.wallet + earned)}`, KB.economyMenu());
    }
    case "beg": {
      const cd = checkCd(id, "beg");
      if (cd) return reply(`⏳ Beg on cooldown! Try again in *${cd}*`, KB.back("economy"));
      DB.setCooldown(id, "beg", COOLDOWNS.beg);
      if (Math.random() < 0.3) return reply(`😢 You begged but were ignored...`, KB.economyMenu());
      const earned = rand(parseInt(process.env.BEG_MIN||"10"), parseInt(process.env.BEG_MAX||"100"));
      DB.saveEconomy(id, { wallet: eco.wallet + earned, totalEarned: (eco.totalEarned||0)+earned });
      return reply(`🤲 You received ${CS} ${formatNumber(earned)} from a kind stranger!\n\n👛 Wallet: ${CS} ${formatNumber(eco.wallet + earned)}`, KB.economyMenu());
    }
    case "crime": {
      const cd = checkCd(id, "crime");
      if (cd) return reply(`⏳ Crime on cooldown! Try again in *${cd}*`, KB.back("economy"));
      const crimes = ["pickpocketing","hacking","scamming","selling fake goods","robbing a vending machine"];
      DB.setCooldown(id, "crime", COOLDOWNS.crime);
      if (Math.random() < parseFloat(process.env.CRIME_FAIL_CHANCE||"0.35")) {
        const fine = rand(50, 200);
        DB.saveEconomy(id, { wallet: Math.max(0, eco.wallet - fine) });
        return reply(`🚔 You got caught ${pickRandom(crimes)} and were fined ${CS} ${formatNumber(fine)}!\n\n👛 Wallet: ${CS} ${formatNumber(Math.max(0, eco.wallet - fine))}`, KB.economyMenu());
      }
      const earned = rand(parseInt(process.env.CRIME_MIN||"100"), parseInt(process.env.CRIME_MAX||"800"));
      DB.saveEconomy(id, { wallet: eco.wallet + earned, totalEarned: (eco.totalEarned||0)+earned });
      return reply(`🦹 You successfully committed ${pickRandom(crimes)} and got away with ${CS} ${formatNumber(earned)}!\n\n👛 Wallet: ${CS} ${formatNumber(eco.wallet + earned)}`, KB.economyMenu());
    }
    case "fish": {
      const cd = checkCd(id, "fish");
      if (cd) return reply(`⏳ Fish on cooldown! Try again in *${cd}*`, KB.back("economy"));
      const inv = DB.getInventory(id);
      if (!inv["Fishing Rod"]) return reply(`❌ You need a *Fishing Rod* from the market!\n\nUse the Market button to buy one.`, KB.economyMenu());
      DB.setCooldown(id, "fish", COOLDOWNS.fish);
      const fish = ["🐟 Common Fish","🐠 Tropical Fish","🐡 Puffer Fish","🦈 Shark","🐙 Octopus","🦞 Lobster","🐋 Whale \\(wow\\!\\)"];
      const prices = [30, 80, 60, 300, 200, 150, 2000];
      if (Math.random() < 0.2) return reply("🎣 You went fishing but caught nothing...", KB.economyMenu());
      const idx = Math.floor(Math.pow(Math.random(), 2) * fish.length);
      DB.saveEconomy(id, { wallet: eco.wallet + prices[idx], totalEarned: (eco.totalEarned||0)+prices[idx] });
      return reply(`🎣 You caught *${fish[idx]}*!\nSold for ${CS} ${formatNumber(prices[idx])}.\n\n👛 Wallet: ${CS} ${formatNumber(eco.wallet + prices[idx])}`, KB.economyMenu());
    }
    case "dig": {
      const cd = checkCd(id, "dig");
      if (cd) return reply(`⏳ Dig on cooldown! Try again in *${cd}*`, KB.back("economy"));
      const inv = DB.getInventory(id);
      if (!inv["Shovel"]) return reply(`❌ You need a *Shovel* from the market!\n\nUse the Market button to buy one.`, KB.economyMenu());
      DB.setCooldown(id, "dig", COOLDOWNS.dig);
      const finds = ["💰 Buried Coins","💎 Diamond","🪙 Old Coin","💍 Gold Ring","📦 Mystery Box"];
      const vals = [50, 500, 20, 300, 200];
      if (Math.random() < 0.15) return reply("⛏️ You dug for hours but found nothing...", KB.economyMenu());
      const idx = Math.floor(Math.pow(Math.random(), 1.5) * finds.length);
      DB.saveEconomy(id, { wallet: eco.wallet + vals[idx], totalEarned: (eco.totalEarned||0)+vals[idx] });
      return reply(`⛏️ You found *${finds[idx]}*!\nValue: ${CS} ${formatNumber(vals[idx])}.\n\n👛 Wallet: ${CS} ${formatNumber(eco.wallet + vals[idx])}`, KB.economyMenu());
    }
    case "heist": {
      const cd = checkCd(id, "heist");
      if (cd) return reply(`⏳ Heist on cooldown! Try again in *${cd}*`, KB.back("economy"));
      DB.setCooldown(id, "heist", COOLDOWNS.heist);
      if (Math.random() < 0.4) {
        const lost = rand(200, 1000);
        DB.saveEconomy(id, { wallet: Math.max(0, eco.wallet - lost) });
        return reply(`💥 Heist failed! You lost ${CS} ${formatNumber(lost)} in expenses.\n\n👛 Wallet: ${CS} ${formatNumber(Math.max(0, eco.wallet - lost))}`, KB.economyMenu());
      }
      const earned = rand(1000, 5000);
      DB.saveEconomy(id, { wallet: eco.wallet + earned, totalEarned: (eco.totalEarned||0)+earned });
      return reply(`💰 *Heist Successful!*\n\nYour crew pulled it off!\n+${CS} ${formatNumber(earned)}!\n\n👛 Wallet: ${CS} ${formatNumber(eco.wallet + earned)}`, KB.economyMenu());
    }
    case "depositall": {
      const space = eco.bankLimit - eco.bank;
      if (space <= 0) return reply("❌ Your bank is full! Upgrade your bank limit.", KB.economyMenu());
      const deposited = Math.min(eco.wallet, space);
      if (deposited <= 0) return reply("❌ Nothing in your wallet to deposit.", KB.economyMenu());
      DB.saveEconomy(id, { wallet: eco.wallet - deposited, bank: eco.bank + deposited });
      return reply(`✅ Deposited ${CS} ${formatNumber(deposited)} into your bank.\n\n🏦 Bank: ${CS} ${formatNumber(eco.bank + deposited)} / ${formatNumber(eco.bankLimit)}`, KB.economyMenu());
    }
    case "withdrawall": {
      if (eco.bank <= 0) return reply("❌ Your bank is empty.", KB.economyMenu());
      DB.saveEconomy(id, { wallet: eco.wallet + eco.bank, bank: 0 });
      return reply(`✅ Withdrew ${CS} ${formatNumber(eco.bank)} from your bank.\n\n👛 Wallet: ${CS} ${formatNumber(eco.wallet + eco.bank)}`, KB.economyMenu());
    }
    case "market": {
      const list = MARKET_ITEMS.map(it => `• *${it.name}* — ${CS} ${it.price}\n  _${it.desc}_`).join("\n");
      return reply(`🛒 *Market*\n\n${list}\n\nUse \`.buy <item name>\` to purchase`, KB.back("economy"));
    }
    case "inventory": {
      const inv = DB.getInventory(id);
      const items = Object.entries(inv);
      if (!items.length) return reply("🎒 Your inventory is empty.\n\nUse the Market to shop!", KB.economyMenu());
      const list = items.map(([n, q]) => `• ${n} ×${q}`).join("\n");
      return reply(`🎒 *Inventory*\n\n${list}`, KB.back("economy"));
    }
    case "topmoney": {
      const all = DB.getAllEconomy();
      const sorted = Object.entries(all).map(([uid, e]) => ({ uid, total: (e.wallet||0)+(e.bank||0) })).sort((a,b)=>b.total-a.total).slice(0,10);
      const list = sorted.map((u,i) => `${i+1}. User ${u.uid.slice(-4)} — ${CS} ${formatNumber(u.total)}`).join("\n");
      return reply(`💰 *Top 10 Richest*\n\n${list||"No data yet"}`, KB.back("economy"));
    }
    case "cooldowns": {
      const cds = DB.getAllCooldowns(id);
      if (!Object.keys(cds).length) return reply("✅ No active cooldowns!", KB.economyMenu());
      const list = Object.entries(cds).map(([cmd, end]) => `• .${cmd} — ${formatTime(end - Date.now())}`).join("\n");
      return reply(`⏳ *Your Cooldowns*\n\n${list}`, KB.back("economy"));
    }
    case "bankupgrade": {
      const cost = 1000 + Math.floor(eco.bankLimit / 1000) * 500;
      if (eco.wallet < cost) return reply(`❌ Need ${CS} ${formatNumber(cost)} to upgrade.\nYour wallet: ${CS} ${formatNumber(eco.wallet)}`, KB.economyMenu());
      DB.saveEconomy(id, { wallet: eco.wallet - cost, bankLimit: eco.bankLimit + 2000 });
      return reply(`✅ Bank upgraded!\nNew limit: ${CS} ${formatNumber(eco.bankLimit + 2000)}`, KB.economyMenu());
    }
    case "prestige": {
      const required = 100000 * ((eco.prestige||0) + 1);
      const total = (eco.wallet||0) + (eco.bank||0);
      if (total < required) return reply(`🌟 *Prestige ${eco.prestige||0}*\n\nNeed ${CS} ${formatNumber(required)} total.\nYou have: ${CS} ${formatNumber(total)}`, KB.economyMenu());
      DB.saveEconomy(id, { wallet: 500, bank: 0, prestige: (eco.prestige||0)+1 });
      return reply(`🌟 *Prestige Up!* Now Prestige ${(eco.prestige||0)+1}!\nBalance reset with fresh start bonus.`, KB.economyMenu());
    }
    default:
      return reply("❓ Unknown economy action.", KB.economyMenu());
  }
}

module.exports = { handleEconomy };
