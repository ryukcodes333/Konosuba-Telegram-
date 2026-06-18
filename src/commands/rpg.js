const DB = require("../database/db");
const KB = require("../utils/keyboards");
const { rand, pickRandom, formatNumber, RPG_ITEMS } = require("../utils/helpers");

const CS = process.env.CURRENCY_SYMBOL || "💎";

async function handleRpg(ctx, action) {
  const id = String(ctx.from.id);
  const rpg = DB.getRpg(id);
  const eco = DB.getEconomy(id);
  const reply = (t, kb) => ctx.callbackQuery
    ? ctx.editMessageText(t, { parse_mode: "Markdown", ...kb })
    : ctx.reply(t, { parse_mode: "Markdown", ...kb });

  function checkCd(cmd) {
    const cd = DB.getCooldown(id, `rpg_${cmd}`);
    return cd > Date.now();
  }

  switch (action) {
    case "stats": {
      const wb = rpg.equipped?.weapon ? RPG_ITEMS.weapons.find(w => w.name === rpg.equipped.weapon)?.atk || 0 : 0;
      const ab = rpg.equipped?.armor ? RPG_ITEMS.armor.find(a => a.name === rpg.equipped.armor)?.def || 0 : 0;
      return reply(`⚔️ *RPG Stats*\n\n🧙 Class: ${rpg.class}\n⭐ Level: ${rpg.level}\n✨ XP: ${rpg.xp}/${rpg.level * 100}\n❤️ HP: ${rpg.hp}/${rpg.maxHp}\n⚔️ ATK: ${rpg.atk} \\(\\+${wb}\\)\n🛡 DEF: ${rpg.def} \\(\\+${ab}\\)\n\n🗡 Weapon: ${rpg.equipped?.weapon || "None"}\n🛡 Armor: ${rpg.equipped?.armor || "None"}`, KB.rpgMenu());
    }
    case "hunt": {
      if (checkCd("hunt")) return reply("⏳ Hunt on cooldown\\! Try again in 10 min.", KB.rpgMenu());
      DB.setCooldown(id, "rpg_hunt", 10 * 60 * 1000);
      const monster = pickRandom(RPG_ITEMS.monsters);
      const wb = rpg.equipped?.weapon ? RPG_ITEMS.weapons.find(w => w.name === rpg.equipped.weapon)?.atk || 0 : 0;
      const ab = rpg.equipped?.armor ? RPG_ITEMS.armor.find(a => a.name === rpg.equipped.armor)?.def || 0 : 0;
      const myAtk = rpg.atk + wb, myDef = rpg.def + ab;
      let myHp = rpg.hp, monHp = monster.hp;
      const log = [];
      for (let r = 1; r <= 10 && myHp > 0 && monHp > 0; r++) {
        const dmgDealt = Math.max(1, rand(myAtk - 5, myAtk + 10) - monster.def);
        const dmgTaken = Math.max(1, rand(monster.atk - 5, monster.atk) - myDef);
        monHp -= dmgDealt; myHp -= dmgTaken;
        log.push(`R${r}: dealt ${dmgDealt}, took ${dmgTaken}`);
      }
      if (myHp <= 0) { DB.saveRpg(id, { hp: 1 }); return reply(`💀 *Defeated by ${monster.name}\\!*\n\n${log.slice(-2).join("\n")}\n\nUse a Potion to recover\\!`, KB.rpgMenu()); }
      const gold = monster.gold();
      const newXp = rpg.xp + monster.xp;
      const leveled = newXp >= rpg.level * 100;
      DB.saveRpg(id, { hp: Math.min(rpg.maxHp, myHp), xp: leveled ? 0 : newXp, level: leveled ? rpg.level + 1 : rpg.level, maxHp: leveled ? rpg.maxHp + 10 : rpg.maxHp });
      DB.saveEconomy(id, { wallet: eco.wallet + gold });
      return reply(`⚔️ *${monster.name} defeated\\!*\n\n${log.slice(-2).join("\n")}\n\n🏆 \\+${monster.xp} XP | \\+${CS} ${gold}\n${leveled ? `\n🎉 *LEVEL UP\\! Now Level ${rpg.level + 1}\\!*` : ""}\n❤️ HP: ${Math.min(rpg.maxHp, myHp)}/${rpg.maxHp}`, KB.rpgMenu());
    }
    case "boss": {
      if (rpg.level < 10) return reply("❌ Need Level 10\\+ to fight a boss\\!", KB.rpgMenu());
      if (checkCd("boss")) return reply("⏳ Boss on cooldown\\! Try again in 4h.", KB.rpgMenu());
      DB.setCooldown(id, "rpg_boss", 4 * 60 * 60 * 1000);
      const boss = pickRandom(RPG_ITEMS.bosses);
      const myAtk = rpg.atk + rpg.level * 2;
      let myHp = rpg.hp, bossHp = boss.hp;
      for (let r = 0; r < 20 && myHp > 0 && bossHp > 0; r++) { bossHp -= Math.max(1, rand(myAtk - 10, myAtk + 20) - boss.def); myHp -= Math.max(1, rand(boss.atk - 20, boss.atk)); }
      if (myHp <= 0) { DB.saveRpg(id, { hp: 1 }); return reply(`💀 Defeated by *${boss.name}*\\!\n\nTrain more and try again\\!`, KB.rpgMenu()); }
      const gold = boss.gold();
      DB.saveRpg(id, { hp: myHp, xp: rpg.xp + boss.xp });
      DB.saveEconomy(id, { wallet: eco.wallet + gold });
      return reply(`🏆 *BOSS DEFEATED: ${boss.name}\\!*\n\n\\+${boss.xp} XP | \\+${CS} ${formatNumber(gold)}\n❤️ HP remaining: ${myHp}`, KB.rpgMenu());
    }
    case "raid": {
      if (rpg.level < 15) return reply("❌ Need Level 15\\+ for a raid\\!", KB.rpgMenu());
      if (checkCd("raid")) return reply("⏳ Raid on cooldown\\! 6h cooldown.", KB.rpgMenu());
      DB.setCooldown(id, "rpg_raid", 6 * 60 * 60 * 1000);
      if (Math.random() < 0.4) return reply("💥 *Raid Failed\\!*\n\nYour party was overwhelmed\\. Try again with better gear\\!", KB.rpgMenu());
      const reward = rand(2000, 8000);
      DB.saveEconomy(id, { wallet: eco.wallet + reward });
      return reply(`⚔️ *RAID VICTORY\\!*\n\nYour party cleared the raid dungeon\\!\n💰 Loot: ${CS} ${formatNumber(reward)}\n\\+500 XP`, KB.rpgMenu());
    }
    case "dungeon": {
      if (checkCd("dungeon")) return reply("⏳ Dungeon on cooldown\\! 2h cooldown.", KB.rpgMenu());
      DB.setCooldown(id, "rpg_dungeon", 2 * 60 * 60 * 1000);
      const floors = rand(1, 10);
      const reward = floors * rand(100, 300);
      if (Math.random() < 0.3) return reply(`🏰 *Dungeon Failed \\(Floor ${floors}\\)*\n\nDefeated on floor ${floors}\\. \\+${floors * 25} XP`, KB.rpgMenu());
      DB.saveEconomy(id, { wallet: eco.wallet + reward });
      DB.saveRpg(id, { xp: rpg.xp + floors * 50 });
      return reply(`🏰 *Dungeon Cleared\\! \\(${floors} floors\\)*\n\n\\+${floors * 50} XP | \\+${CS} ${formatNumber(reward)}`, KB.rpgMenu());
    }
    case "quest":
      return reply(`📜 *Active Quests*\n\n1\\. 👹 Defeat 20 monsters\n2\\. 🏰 Clear 5 dungeons\n3\\. 👹 Defeat a boss\n4\\. ⭐ Reach Level 20\n\n💡 Use \\.claim when done\\!`, KB.rpgMenu());
    case "skills":
      return reply(`✨ *Your Skills*\n\n${rpg.skills.map(s => `✅ ${s}`).join("\n")}\n\n🔓 Level up to learn more skills\\!`, KB.rpgMenu());
    case "forge": {
      if (!rpg.equipped?.weapon) return reply("❌ Equip a weapon first before forging\\!", KB.rpgMenu());
      const cost = rand(500, 2000);
      if (eco.wallet < cost) return reply(`❌ Forging costs ${CS} ${formatNumber(cost)}\\. Not enough funds\\.`, KB.rpgMenu());
      const bonus = rand(2, 8);
      DB.saveEconomy(id, { wallet: eco.wallet - cost });
      DB.saveRpg(id, { atk: rpg.atk + bonus });
      return reply(`⚒️ *Weapon Forged\\!*\n\nYour *${rpg.equipped.weapon}* was upgraded\\!\n\\+${bonus} ATK permanently\\!\nCost: ${CS} ${formatNumber(cost)}`, KB.rpgMenu());
    }
    case "shop": {
      const weapons = RPG_ITEMS.weapons.map(w => `⚔️ ${w.name} — ${CS} ${w.price} \\(\\+${w.atk} ATK\\)`).join("\n");
      const armor = RPG_ITEMS.armor.map(a => `🛡 ${a.name} — ${CS} ${a.price} \\(\\+${a.def} DEF\\)`).join("\n");
      return reply(`🛒 *RPG Shop*\n\n*Weapons:*\n${weapons}\n\n*Armor:*\n${armor}\n\n💡 Use \\.buy <item name> to purchase\\!`, KB.rpgMenu());
    }
    case "party":
      return reply(`👥 *RPG Party*\n\n${rpg.party?.length ? rpg.party.map(m => `• ${m}`).join("\n") : "No party members\\. Invite friends to join your party\\!"}`, KB.rpgMenu());
    default:
      return reply("❓ Unknown RPG action\\.", KB.rpgMenu());
  }
}

module.exports = { handleRpg };
