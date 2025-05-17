// Log module loading
Hooks.once("init", () => {
  console.log("NPC Name Hider | Initializing module");
});

// Add reveal/hide button to D&D 5e Actor sheets
Hooks.on("renderActorSheet", (sheet, html, data) => {
  console.log("NPC Name Hider | renderActorSheet triggered:", {
    actorName: data.actor?.name,
    actorType: data.actor?.type,
    sheetClass: sheet.constructor.name,
    isDnd5e: sheet.actor?.system?.type != null
  });
  if (!game.user.isGM) return;
  const actor = sheet.actor;
  if (!actor || actor.type === "character") return;

  // Ensure html is jQuery
  const $html = html instanceof jQuery ? html : $(html);

  // Get reveal state
  const isRevealed = actor.getFlag("npc-name-hider", "nameRevealed") ?? false;
  const buttonText = isRevealed ? "Hide Name" : "Reveal Name";

  // Create button
  const button = $(`<button type="button" class="npc-name-toggle">${buttonText}</button>`);

  // Target D&D 5e sheet header
  let header = $html.find(".window-header, .sheet-header, .dnd5e.sheet.actor .window-header, .dnd5e.sheet.actor .header");
  if (!header.length) {
    console.error("NPC Name Hider | No header found for actor:", actor.name, "Sheet class:", sheet.constructor.name);
    console.log("NPC Name Hider | Sheet HTML snippet:", $html.prop("outerHTML").substring(0, 500));
    return;
  }

  header.append(button);
  console.log("NPC Name Hider | Button added for actor:", actor.name);

  // Button click handler
  button.on("click", async (event) => {
    event.preventDefault();
    const newState = !isRevealed;
    await actor.setFlag("npc-name-hider", "nameRevealed", newState);
    button.text(newState ? "Hide Name" : "Reveal Name");
    ui.notifications.info(`Name ${newState ? "revealed" : "hidden"} for ${actor.name}`);
    console.log("NPC Name Hider | Toggled name reveal to:", newState, "for actor:", actor.name);
  });
});

// Hide names in chat messages
Hooks.on("renderChatMessageHTML", (message, html, data) => {
  console.log("NPC Name Hider | renderChatMessageHTML triggered:", {
    actorName: message.actor?.name,
    actorType: message.actor?.type
  });
  if (!message.actor || message.actor.type === "character") return;
  if (game.user.isGM) return;

  const isRevealed = message.actor.getFlag("npc-name-hider", "nameRevealed") ?? false;
  if (!isRevealed) {
    const sender = html.querySelector(".message-sender");
    if (sender) {
      sender.textContent = "Unknown Creature";
      console.log("NPC Name Hider | Hid chat name for actor:", message.actor.name);
    }
  }
});

// Hide names in combat tracker
Hooks.on("renderCombatTracker", (tracker, html, data) => {
  console.log("NPC Name Hider | renderCombatTracker triggered:", {
    hasCombatants: !!data.combatants,
    combatantCount: data.combatants ? data.combatants.length : 0
  });
  if (game.user.isGM) return;
  if (!data.combatants) {
    console.log("NPC Name Hider | No combatants available in combat tracker");
    return;
  }

  const $html = html instanceof jQuery ? html : $(html);
  for (const combatant of data.combatants) {
    if (combatant.actor?.type !== "character") {
      const isRevealed = combatant.actor.getFlag("npc-name-hider", "nameRevealed") ?? false;
      if (!isRevealed) {
        const element = $html.find(`[data-combatant-id="${combatant.id}"] .token-name`);
        if (element.length) {
          element.text("Unknown Creature");
          console.log("NPC Name Hider | Hid combat tracker name for actor:", combatant.actor.name);
        }
      }
    }
  }
});

// Set default hidden state for new actors
Hooks.on("createActor", async (actor, options, userId) => {
  console.log("NPC Name Hider | createActor triggered:", {
    actorName: actor.name,
    actorType: actor.type
  });
  if (actor.type !== "character" && actor.getFlag("npc-name-hider", "nameRevealed") == null) {
    await actor.setFlag("npc-name-hider", "nameRevealed", false);
    console.log("NPC Name Hider | Set default hidden state for actor:", actor.name);
  }
});