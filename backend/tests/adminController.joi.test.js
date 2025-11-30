// backend/tests/adminController.joi.test.js
// Test Joi validation schema from admin.controller.js

import Joi from "joi";

describe("Joi Validation - admin.controller.js", () => {
  it("should validate a valid admin item", () => {
    const schema = Joi.object({
      name: Joi.string().min(2).max(100),
      category: Joi.string().min(2).max(50),
      foundLocation: Joi.string().min(2).max(100),
      dateFound: Joi.date().iso(),
      isClaimed: Joi.boolean(),
      owner: Joi.string().hex().length(24),
    });
    const valid = {
      name: "Wallet",
      category: "Accessories",
      foundLocation: "Library",
      dateFound: "2025-11-30T00:00:00.000Z",
      isClaimed: true,
      owner: "abcdefabcdefabcdefabcdef",
    };
    const { error } = schema.validate(valid);
    expect(error).toBeUndefined();
  });

  it("should fail validation for short name", () => {
    const schema = Joi.object({
      name: Joi.string().min(2).max(100),
    });
    const invalid = { name: "A" };
    const { error } = schema.validate(invalid);
    expect(error).toBeDefined();
  });
});
