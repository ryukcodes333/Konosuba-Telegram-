const DB = require("../database/db");
const KB = require("../utils/keyboards");
const { rand, pickRandom, formatNumber } = require("../utils/helpers");

const CS = process.env.CURRENCY_SYMBOL || "💎";

const CARD_POOL = {
  bronze:   { icon: "🥉", color: "Bronze",   odds: 0.70, value: 50,    cost: 200   },
  silver:   { icon: "🥈", color: "Silver",   odds: 0.20, value: 200,   cost: 500   },
  gold:     { icon: "🥇", color: "Gold",     odds: 0.07, value: 750,   cost: 1200  },
  plat:     { icon: "💜", color: "Platinum", odds: 0.025,value: 2500,  cost: 3000  },
  diamond:  { icon: "💎", color: "Diamond",  odds: 0.005,value: 10000, cost: 7500  },
};

const CARD_NAMES = ["Dragon","Phoenix","Aqua","Megumin","Darkness","Kazuma","Shield Hero","Rem","Zero Two","Frieren","Anya","Levi","Gojo","Naruto","Saitama","Luffy","Goku","Vegeta","Madara","Itachi","Hinata","Mikasa","Erwin","Historia","Rimuru","Diablo","Asuna","Kirito","Emilia","Subaru","Beatrice","Puck","Nate","Eris","Wiz","Yunyun","Lalatina"];

function rollTier(tierKey) {
  const tier = CARD_POOL[tierKey];
  const name = pickRandom(CARD_NAMES);
  const power = rand(10, 100) + (tierKey === "diamond" ? 200 : tierKey === "plat" ? 100 : tierKey === "gold" ? 50 : 0);
  return { tier: tierKey, icon: tier.icon, color: tier.color, name, power, value: tier.value + rand(0, tier.value), id: Date.now() + rand(0, 9999) };
}

async function handleCards(ctx, action) {
  const id = String(ctx.from.id);
  const eco = DB.getEconomy(id);
  const cards = DB.getCards(id);
  const reply = (t, kb) => ctx.callbackQuery
    ? ctx.editMessageText(t, { parse_mode: "Markdown", ...kb })
    : ctx.reply(t, { parse_mode: "Markdown", ...kb });

  switch (action) {
    case "collection": {
      if (!cards.collection.length) return reply("🎴 Your collection is empty\\!\n\nGet packs from the Cards menu to start collecting\\!", KB.cardsMenu());
      const counts = {};
      cards.collection.forEach(c => { counts[c.color] = (counts[c.color] || 0) + 1; });
      const list = Object.entries(counts).map(([col, n]) => `• ${n}× ${col}`).join("\n");
      return reply(`🎴 *Card Collection*\n\nTotal cards: ${cards.collection.length}\n\n${list}\n\nStardust: ✨ ${formatNumber(cards.stardust)}`, KB.cardsMenu());
    }
    case "deck": {
      const deck = cards.deck || [];
      if (!deck.length) return reply("🃏 Your deck is empty\\!\n\nUse the collection and equip cards\\.", KB.cardsMenu());
      const list = deck.map(c => `${c.icon} *${c.name}* — Power: ${c.power}`).join("\n");
      return reply(`🃏 *Active Deck \\(${deck.length}/5\\)*\n\n${list}`, KB.cardsMenu());
    }
    case "stardust":
      return reply(`✨ *Stardust*\n\nYou have: ${formatNumber(cards.stardust)} ✨\n\nUse stardust to craft cards\\!\nEarn stardust by dismantling duplicates\\.\n\n💡 Use \`.dismantle <card id>\` to get stardust`, KB.cardsMenu());
    case "get_bronze":
    case "get_silver":
    case "get_gold":
    case "get_plat":
    case "get_diamond": {
      const tierKey = action.replace("get_", "");
      const tier = CARD_POOL[tierKey];
      if (eco.wallet < tier.cost) return reply(`❌ Need ${CS} ${formatNumber(tier.cost)} for a *${tier.color} Pack*\\.\nYour wallet: ${CS} ${formatNumber(eco.wallet)}`, KB.cardsMenu());
      DB.saveEconomy(id, { wallet: eco.wallet - tier.cost });
      const card = rollTier(tierKey);
      cards.collection.push(card);
      DB.saveCards(id, cards);
      return reply(`${tier.icon} *${tier.color} Pack Opened\\!*\n\nYou got: ${card.icon} *${card.name}*\nPower: ${card.power}\nValue: ${CS} ${formatNumber(card.value)}\n\n📦 Added to collection\\!`, KB.cardsMenu());
    }
    default:
      return reply("❓ Unknown cards action\\.", KB.cardsMenu());
  }
}

module.exports = { handleCards };
