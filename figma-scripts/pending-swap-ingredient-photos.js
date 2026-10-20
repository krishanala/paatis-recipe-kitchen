// Pending Figma update for "Paati's Muruku Kitchen — Game Stage"
// fileKey: D92o5ppaITPUDEWiCd9KHs
// Swaps the user's asset sheet (confirmed 2026-10-13) into the ingredient and jar components.
// Blocked by the Figma Starter plan MCP call limit. Three steps, ordered so the art never goes blank:
//
// STEP 1 — run the STEP 1 block below with use_figma. It adds an empty "Photo" rectangle UNDER the
//          existing art (no visual change) and returns the IDs in this order:
//          water-pot, spices, rice-flour, urad-dal, muruku-jar (Jar · Fill=Full)
// STEP 2 — upload_assets { fileKey, count: 5, nodeIds: <the 5 IDs>, scaleMode: "FIT" },
//          then POST each PNG (Content-Type: image/png) to its URL, in the same order:
//          assets/ingredients/water-pot.png, spices.png, rice-flour.png, urad-dal.png, muruku-jar.png
// STEP 3 — run the STEP 3 block with use_figma to remove the old drawn art, leaving only the photos.
//
// Every Store, Kadai and Cook instance updates on its own because they are instances of these components.

// ===== STEP 1 =====
const G = id => figma.getNodeByIdAsync(id);
const jarSet = await G("4:247");
const jarFull = jarSet.children.find(c => c.name === "Fill=Full");
const targets = [[await G("4:100"), 120, 120], [await G("4:89"), 120, 120], [await G("4:69"), 120, 120], [await G("4:75"), 120, 120], [jarFull, 140, 180]];
const photoIds = [];
for (const [comp, w, h] of targets) {
  let r = comp.findChild(n => n.name === "Photo");
  if (!r) { r = figma.createRectangle(); r.name = "Photo"; r.resize(w, h); r.fills = []; comp.insertChild(0, r); r.x = 0; r.y = 0; }
  r.constraints = { horizontal: "SCALE", vertical: "SCALE" };
  photoIds.push(r.id);
}
return { photoIds, order: ["water-pot", "spices", "rice-flour", "urad-dal", "muruku-jar"] };

// ===== STEP 3 (separate use_figma call, after the upload) =====
// const G = id => figma.getNodeByIdAsync(id);
// const jarSet = await G("4:247");
// const comps = [await G("4:100"), await G("4:89"), await G("4:69"), await G("4:75"), jarSet.children.find(c => c.name === "Fill=Full")];
// const removed = [];
// for (const c of comps) {
//   const photo = c.findChild(n => n.name === "Photo");
//   if (!photo || !photo.fills.length) throw new Error(`${c.name}: photo not uploaded yet — keeping the old art`);
//   for (const ch of [...c.children]) if (ch !== photo) { removed.push(ch.id); ch.remove(); }
//   c.description = "Photo asset from the user's asset sheet (2026-10-13).";
// }
// const water = comps[0]; await water.screenshot();
// return { removed: removed.length };
