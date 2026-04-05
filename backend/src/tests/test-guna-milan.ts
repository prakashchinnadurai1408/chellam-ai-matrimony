// ==========================================
// GUNA MILAN VERIFICATION TEST SCRIPT
// Run: npx ts-node src/tests/test-guna-milan.ts
// ==========================================

import { computeGunaMilan } from "../services/astrology/ashtakoota";

function runTest(
  label: string,
  boyNak: string, boyRas: string,
  girlNak: string, girlRas: string
) {
  try {
    const result = computeGunaMilan(boyNak, boyRas, girlNak, girlRas);
    const pct = Math.round((result.total_score / 36) * 100);
    let quality = "Low";
    if (pct >= 85) quality = "Excellent";
    else if (pct >= 65) quality = "Good";
    else if (pct >= 45) quality = "Average";

    console.log(`\n=== ${label} ===`);
    console.log(`Boy:  ${boyNak} / ${boyRas}`);
    console.log(`Girl: ${girlNak} / ${girlRas}`);
    console.log(`Score: ${result.total_score}/36 (${pct}%) — ${quality} — ${result.is_recommended ? "RECOMMENDED ✅" : "NOT RECOMMENDED ❌"}`);
    console.log(`Breakdown:`);
    console.log(`  Varna:       ${result.breakdown.varna.points}/${result.breakdown.varna.max}`);
    console.log(`  Vashya:      ${result.breakdown.vashya.points}/${result.breakdown.vashya.max}`);
    console.log(`  Tara:        ${result.breakdown.tara.points}/${result.breakdown.tara.max}`);
    console.log(`  Yoni:        ${result.breakdown.yoni.points}/${result.breakdown.yoni.max}`);
    console.log(`  Graha Maitri:${result.breakdown.graha_maitri.points}/${result.breakdown.graha_maitri.max}`);
    console.log(`  Gana:        ${result.breakdown.gana.points}/${result.breakdown.gana.max}`);
    console.log(`  Bhakoot:     ${result.breakdown.bhakoot.points}/${result.breakdown.bhakoot.max}`);
    console.log(`  Nadi:        ${result.breakdown.nadi.points}/${result.breakdown.nadi.max}`);
    
    if (result.breakdown.nadi.points === 0) console.log(`  ⚠ NADI DOSHA DETECTED`);
    if (result.breakdown.bhakoot.points === 0) console.log(`  ⚠ BHAKOOT DOSHA DETECTED`);
  } catch (e: any) {
    console.log(`\n=== ${label} ===`);
    console.log(`❌ ERROR: ${e.message}`);
  }
}

console.log("============================================");
console.log("   CHELLAM MATRIMONY — GUNA MILAN TESTS");
console.log("============================================");

// Test 1: High compatibility — different Nadis, same Gana combination
runTest("Test 1: High Compatibility Pair",
  "Ashwini", "Mesha",     // Boy: Aadi Nadi, Deva Gana, Horse
  "Bharani", "Vrishabha"  // Girl: Madhya Nadi, Manav Gana, Elephant
);

// Test 2: Nadi Dosha scenario — same Nadi (both Aadi)
runTest("Test 2: Nadi Dosha Scenario",
  "Ashwini", "Mesha",     // Boy: Aadi Nadi
  "Ardra", "Mithuna"      // Girl: Aadi Nadi — SAME!
);

// Test 3: All Rakshasa Gana combination
runTest("Test 3: Rakshasa + Deva incompatibility",
  "Krittika", "Mesha",    // Boy: Rakshasa
  "Ashwini", "Mesha"      // Girl: Deva
);

// Test 4: Same Nakshatra (extreme case)
runTest("Test 4: Identical Nakshatras",
  "Rohini", "Vrishabha",
  "Rohini", "Vrishabha"
);

// Test 5: Diverse pair for balanced scoring
runTest("Test 5: Cross-Region Pair",
  "Pushya", "Karka",       // Boy: Madhya Nadi, Deva, Sheep
  "Revati", "Meena"        // Girl: Antya Nadi, Deva, Elephant
);

// Test 6: Invalid input (should throw error)
runTest("Test 6: Invalid Nakshatra",
  "InvalidStar", "Mesha",
  "Ashwini", "Mesha"
);

console.log("\n============================================");
console.log("   ALL TESTS COMPLETE");
console.log("============================================");
