import test from "node:test";
import assert from "node:assert/strict";
import { cleanProgrammeTitle, generateProgrammeDraft, generatedProgrammeSchema } from "./demo-generator";
import { indicatorStatus } from "./monitoring";

test("instruction text becomes a professional girls education title", () => {
  const input = "Generate a programme for girl child education";
  assert.equal(cleanProgrammeTitle(input), "Girls’ Education and Empowerment Programme");
  assert.equal(generateProgrammeDraft(input).title, "Girls’ Education and Empowerment Programme");
  assert.doesNotMatch(cleanProgrammeTitle(input), /generate|create|make|develop/i);
});

test("generated fallback satisfies the runtime programme schema", () => {
  assert.doesNotThrow(() => generatedProgrammeSchema.parse(generateProgrammeDraft("Develop a school retention initiative for adolescent girls in rural communities.")));
});

test("indicator thresholds are deterministic", () => {
  assert.equal(indicatorStatus(100, 100), "ON_TRACK");
  assert.equal(indicatorStatus(75, 100), "AT_RISK");
  assert.equal(indicatorStatus(74.99, 100), "OFF_TRACK");
  assert.equal(indicatorStatus(0, 100, false), "NO_DATA");
});
