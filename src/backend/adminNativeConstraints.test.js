import test from "node:test";
import assert from "node:assert/strict";
import {
  isSavedSelectValueMissing,
  nativeInvalidToastMessage,
  numberInputStep,
} from "./adminNativeConstraints.js";

const DIFFICULTY_OPTIONS = ["Easy", "Medium", "Hard"];

test("number fields accept decimals unless a field sets its own step", () => {
  assert.equal(numberInputStep("number", undefined), "any");
  assert.equal(numberInputStep("number", "0.1"), "0.1");
  assert.equal(numberInputStep("text", undefined), undefined);
});

test("a saved select value outside the option list is kept", () => {
  assert.equal(isSavedSelectValueMissing(DIFFICULTY_OPTIONS, "Moderate"), true);
  assert.equal(isSavedSelectValueMissing(DIFFICULTY_OPTIONS, "Easy–Medium"), true);
  assert.equal(isSavedSelectValueMissing(DIFFICULTY_OPTIONS, "Medium"), false);
  assert.equal(isSavedSelectValueMissing(DIFFICULTY_OPTIONS, ""), false);
  assert.equal(isSavedSelectValueMissing(undefined, "Moderate"), true);
});

test("native validation toast names the field and includes the browser message", () => {
  assert.equal(
    nativeInvalidToastMessage("Difficulty*", "Please select an item in the list."),
    "Difficulty: Please select an item in the list."
  );
  assert.equal(
    nativeInvalidToastMessage(
      "Rating (1-5)",
      "Please enter a valid value. The two nearest valid values are 4 and 5."
    ),
    "Rating (1-5): Please enter a valid value. The two nearest valid values are 4 and 5."
  );
  assert.equal(nativeInvalidToastMessage("", ""), "A field: invalid value");
});
