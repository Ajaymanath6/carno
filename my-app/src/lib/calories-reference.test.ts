import test from "node:test";
import assert from "node:assert/strict";
import {
  estimateMealKcalReference,
  parseGramsFromMeal,
  resolveReferenceFoodId,
} from "./calories-reference";
import { parseBasicPortionFromText } from "./portion";

test("parseGramsFromMeal parses quantity + g", () => {
  assert.equal(parseGramsFromMeal({ rawText: "meal", quantity: "200", unit: "g" }), 200);
});

test("parseGramsFromMeal parses kg", () => {
  const grams = parseGramsFromMeal({ rawText: "", quantity: "0.25", unit: "kg" });
  assert.ok(grams != null);
  assert.ok(Math.abs(grams - 250) < 0.001);
});

test("parseGramsFromMeal parses eggs from raw text", () => {
  assert.equal(parseGramsFromMeal({ rawText: "Had 7 eggs", quantity: null, unit: null }), 350);
});

test("parseGramsFromMeal parses piece count for apples", () => {
  assert.equal(parseGramsFromMeal({ rawText: "4 apples", quantity: null, unit: null }), 728);
});

test("parseGramsFromMeal parses inline mass in raw text", () => {
  assert.equal(
    parseGramsFromMeal({ rawText: "Chicken breast 150g", quantity: null, unit: null }),
    150,
  );
});

test("resolveReferenceFoodId matches chicken typo alias", () => {
  assert.equal(resolveReferenceFoodId("grilled chiken thigh"), "chicken");
});

test("resolveReferenceFoodId prefers longer alias red meat", () => {
  assert.equal(resolveReferenceFoodId("red meat burger"), "beef");
});

test("estimateMealKcalReference returns kcal for known food + grams", () => {
  const kcal = estimateMealKcalReference({
    id: "1",
    rawText: "200 g chicken breast",
    quantity: "200",
    unit: "g",
    foodNameNormalized: "chicken breast",
  });
  assert.equal(kcal, Math.round((200 * 165) / 100));
});

test("estimateMealKcalReference returns null without grams", () => {
  const kcal = estimateMealKcalReference({
    id: "2",
    rawText: "some mystery stew",
    quantity: null,
    unit: null,
    foodNameNormalized: "stew",
  });
  assert.equal(kcal, null);
});

test("estimateMealKcalReference returns null without known food", () => {
  const kcal = estimateMealKcalReference({
    id: "3",
    rawText: "200 g quinoa salad",
    quantity: "200",
    unit: "g",
    foodNameNormalized: "quinoa salad",
  });
  assert.equal(kcal, null);
});

test("parseBasicPortionFromText parses 200g without space", () => {
  assert.deepEqual(parseBasicPortionFromText("Chicken 200g"), { quantity: "200", unit: "g" });
});

test("parseBasicPortionFromText parses lbs as lb", () => {
  assert.deepEqual(parseBasicPortionFromText("Beef 2lbs"), { quantity: "2", unit: "lb" });
});

test("parseBasicPortionFromText parses eggs", () => {
  assert.deepEqual(parseBasicPortionFromText("7 eggs"), { quantity: "7", unit: "eggs" });
});

test("parseBasicPortionFromText parses fruit piece count", () => {
  assert.deepEqual(parseBasicPortionFromText("4 apple"), { quantity: "4", unit: "apple" });
});

test("parseBasicPortionFromText normalizes gm to g", () => {
  assert.deepEqual(parseBasicPortionFromText("400 gm beef"), { quantity: "400", unit: "g" });
});

test("parseBasicPortionFromText parses tablespoon", () => {
  assert.deepEqual(parseBasicPortionFromText("1 tablespoon ghee"), {
    quantity: "1",
    unit: "tbsp",
  });
});

test("parseBasicPortionFromText assumes grams for leading number + food", () => {
  assert.deepEqual(parseBasicPortionFromText("550 beef"), { quantity: "550", unit: "g" });
});

test("estimateMealKcalReference assumes grams for leading number + known food", () => {
  const kcal = estimateMealKcalReference({
    id: "4",
    rawText: "550 beef",
    quantity: null,
    unit: null,
    foodNameNormalized: "beef",
  });
  assert.equal(kcal, Math.round((550 * 250) / 100));
});

test("estimateMealKcalReference computes ghee tablespoon calories", () => {
  const kcal = estimateMealKcalReference({
    id: "5",
    rawText: "1 tablespoon ghee",
    quantity: "1",
    unit: "tbsp",
    foodNameNormalized: "ghee",
  });
  assert.equal(kcal, Math.round((14 * 900) / 100));
});

test("estimateMealKcalReference computes apples by piece count", () => {
  const kcal = estimateMealKcalReference({
    id: "6",
    rawText: "4 apple",
    quantity: "4",
    unit: "apple",
    foodNameNormalized: "apple",
  });
  assert.equal(kcal, Math.round((728 * 52) / 100));
});

