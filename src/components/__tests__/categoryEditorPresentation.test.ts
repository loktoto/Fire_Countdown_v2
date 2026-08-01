import { categoryIconOptionKey } from "../categoryEditorPresentation";

describe("category editor presentation", () => {
  it("uses icon identity rather than a potentially duplicated user-facing label", () => {
    const legacySalaryIcon = { label: "Salary", value: "cash" };
    const salaryEmojiPreset = { label: "Salary", value: "emoji:\\u{1F4B5}" };

    expect(categoryIconOptionKey(legacySalaryIcon)).not.toBe(
      categoryIconOptionKey(salaryEmojiPreset),
    );
  });
});
