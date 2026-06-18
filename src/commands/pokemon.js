const DB = require("../database/db");
const KB = require("../utils/keyboards");
const { rand, getPokemonData, getRandomPokemon, pokemonCard, capitalize, STARTERS } = require("../utils/helpers");

const CS = process.env.CURRENCY_SYMBOL || "💎";
const BALL_RATES = { "Poké Ball": 0.35, "Great Ball": 0.55, "Ultra Ball": 0.75, "Master Ball": 1.0 };

async function handlePokemon(ctx, action) {
  const id = String(ctx.from.id);
  const pkData = DB.getPokemon(id);
  const eco = DB.getEconomy(id);

  const replyText = (t, kb) => ctx.callbackQuery
    ? ctx.editMessageText(t, { parse_mode: "MarkdownV2", ...kb })
    : ctx.reply(t, { parse_mode: "MarkdownV2", ...kb });

  const replyPhoto = async (imageUrl, caption, kb) => {
    if (ctx.callbackQuery) {
      try { await ctx.editMessageMedia({ type: "photo", media: imageUrl, caption, parse_mode: "MarkdownV2" }, kb); return; } catch {}
    }
    try {
      await ctx.replyWithPhoto(imageUrl, { caption, parse_mode: "MarkdownV2", ...kb });
    } catch {
      await ctx.reply(caption, { parse_mode: "MarkdownV2", ...kb });
    }
  };

  switch (action) {
    case "party": {
      if (!pkData.party.length) return replyText("❌ Your party is empty\\!\n\nChoose a starter first\\!", KB.pokemonMenu());
      const list = pkData.party.map((p, i) => `${i + 1}\\. *${capitalize(p.name)}* Lv\\.${p.level || 1} \\| HP: ${p.hp}/${p.maxHp}`).join("\n");
      return replyText(`⚔️ *Your Party \\(${pkData.party.length}/6\\)*\n\n${list}`, KB.pokemonMenu());
    }
    case "pc": {
      if (!pkData.pc.length) return replyText("📦 Your PC is empty\\.", KB.pokemonMenu());
      const list = pkData.pc.map((p, i) => `${i + 1}\\. *${capitalize(p.name)}* Lv\\.${p.level || 1}`).join("\n");
      return replyText(`💾 *PC Storage \\(${pkData.pc.length}\\)*\n\n${list}`, KB.pokemonMenu());
    }
    case "starter": {
      if (pkData.starter) return replyText(`✅ You already have a starter: *${capitalize(pkData.starter)}*\\!\n\nUse the party button to view them\\.`, KB.pokemonMenu());
      return replyText("🌟 *Choose Your Starter Pokémon\\!*\n\nSelect one below:", KB.pokemonStarterMenu());
    }
    case "hunt": {
      const cd = DB.getCooldown(id, "poke_hunt");
      if (cd > Date.now()) return replyText(`⏳ Hunt on cooldown\\! Try again soon\\.`, KB.pokemonMenu());
      DB.setCooldown(id, "poke_hunt", 5 * 60 * 1000);
      const inv = DB.getInventory(id);
      const ball = ["Master Ball", "Ultra Ball", "Great Ball", "Poké Ball"].find(b => inv[b]);
      if (!ball) return replyText(`❌ You need a Poké Ball to hunt\\!\n\nBuy one from the PokéShop\\!`, KB.pokemonMenu());
      const wild = await getRandomPokemon();
      if (!wild) return replyText("❌ No wild Pokémon appeared\\. Try again\\!", KB.pokemonMenu());
      const isCaught = Math.random() < BALL_RATES[ball];
      if (!isCaught) {
        const caption = `🌿 *A wild ${capitalize(wild.name)} appeared\\!*\n\n${pokemonCard(wild)}\n\n💨 It broke free and ran away\\!`;
        return wild.imageUrl ? replyPhoto(wild.imageUrl, caption, KB.pokemonMenu()) : replyText(caption, KB.pokemonMenu());
      }
      DB.removeItem(id, ball);
      const caught = { ...wild, level: rand(3, 30), maxHp: wild.hp, exp: 0 };
      const inParty = pkData.party.length < 6;
      if (inParty) DB.savePokemon(id, { party: [...pkData.party, caught] });
      else DB.savePokemon(id, { pc: [...pkData.pc, caught] });
      const caption = `🎉 *Caught ${capitalize(wild.name)}\\!*\n\n${pokemonCard(wild)}\n\nUsed: ${ball}\nSent to: ${inParty ? "Party" : "PC \\(party full\\)"}`;
      return wild.imageUrl ? replyPhoto(wild.imageUrl, caption, KB.pokemonMenu()) : replyText(caption, KB.pokemonMenu());
    }
    case "heal": {
      const cd = DB.getCooldown(id, "poke_heal");
      if (cd > Date.now()) return replyText("⏳ Pokémon Center on cooldown\\! Try again in 30 min\\.", KB.pokemonMenu());
      if (!pkData.party.length) return replyText("❌ No Pokémon to heal\\!", KB.pokemonMenu());
      DB.savePokemon(id, { party: pkData.party.map(p => ({ ...p, hp: p.maxHp })) });
      DB.setCooldown(id, "poke_heal", 30 * 60 * 1000);
      return replyText(`💊 *Pokémon Center\\!*\n\nAll your Pokémon have been fully healed\\! ✅`, KB.pokemonMenu());
    }
    case "shop":
      return replyText(`🏪 *PokéShop*\n\n• Poké Ball — ${CS} 100\n• Great Ball — ${CS} 250\n• Ultra Ball — ${CS} 500\n• Master Ball — ${CS} 5,000\n• Potion \\(\\+20HP\\) — ${CS} 80\n• Max Potion — ${CS} 300\n\n💡 Use \\.buy to purchase from the market\\!`, KB.pokemonMenu());
    default: {
      if (action.startsWith("starter_")) {
        const name = action.replace("starter_", "");
        if (pkData.starter) return replyText(`✅ You already chose *${capitalize(pkData.starter)}* as your starter\\!`, KB.pokemonMenu());
        if (!STARTERS.includes(name)) return replyText("❌ Invalid starter\\.", KB.pokemonStarterMenu());
        const pk = await getPokemonData(name);
        if (!pk) return replyText("❌ Could not fetch Pokémon data\\. Try again\\.", KB.pokemonStarterMenu());
        const starter = { ...pk, level: 5, maxHp: pk.hp, exp: 0, isStarter: true };
        DB.savePokemon(id, { party: [starter], starter: name });
        const caption = `🎉 *You chose ${capitalize(pk.name)} as your starter\\!*\n\n${pokemonCard(pk)}\n\n✨ Your adventure begins now\\!`;
        return pk.imageUrl ? replyPhoto(pk.imageUrl, caption, KB.pokemonMenu()) : replyText(caption, KB.pokemonMenu());
      }
      if (action.startsWith("catch_")) {
        const ballMap = { poke: "Poké Ball", great: "Great Ball", ultra: "Ultra Ball", master: "Master Ball" };
        const ball = ballMap[action.replace("catch_", "")];
        if (!ball) return replyText("❌ Invalid ball\\.", KB.pokeBallMenu());
        const inv = DB.getInventory(id);
        if (!inv[ball]) return replyText(`❌ You don't have a *${ball}*\\!\n\nBuy one from the PokéShop first\\.`, KB.pokeBallMenu());
        const wild = await getRandomPokemon();
        if (!wild) return replyText("❌ No wild Pokémon appeared\\.", KB.pokeBallMenu());
        const caught = Math.random() < BALL_RATES[ball];
        if (!caught) {
          const caption = `🌿 *A wild ${capitalize(wild.name)} appeared\\!*\n\n${pokemonCard(wild)}\n\n💨 It broke free\\! Try another ball\\.`;
          return wild.imageUrl ? replyPhoto(wild.imageUrl, caption, KB.pokeBallMenu()) : replyText(caption, KB.pokeBallMenu());
        }
        DB.removeItem(id, ball);
        const caughtPk = { ...wild, level: rand(3, 30), maxHp: wild.hp, exp: 0 };
        const inParty = pkData.party.length < 6;
        if (inParty) DB.savePokemon(id, { party: [...pkData.party, caughtPk] });
        else DB.savePokemon(id, { pc: [...pkData.pc, caughtPk] });
        const caption = `🎉 *Caught ${capitalize(wild.name)}\\!*\n\n${pokemonCard(wild)}\n\nSent to: ${inParty ? "Party" : "PC"}`;
        return wild.imageUrl ? replyPhoto(wild.imageUrl, caption, KB.pokemonMenu()) : replyText(caption, KB.pokemonMenu());
      }
      return replyText("❓ Unknown Pokémon action\\.", KB.pokemonMenu());
    }
  }
}

module.exports = { handlePokemon };
