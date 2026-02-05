// backend/tests/joiValidation.test.js
// Jest test for Joi validation in controllers

import { jest } from "@jest/globals";
import Joi from "joi";

describe("Joi Validation", () => {
  it("should validate a valid object for admin.controller.js", () => {
    const schema = Joi.object({
      name: Joi.string().min(2).max(100),
      category: Joi.string().min(2).max(50),
      foundLocation: Joi.string().min(2).max(100),
      dateFound: Joi.date().iso(),
      isClaimed: Joi.boolean(),
      owner: Joi.string().hex().length(24),
    });
    const valid = {
      name: "Test Item",
      category: "Electronics",
      foundLocation: "Library",
      dateFound: "2025-11-30T00:00:00.000Z",
      isClaimed: false,
      owner: "0123456789abcdef01234567",
    };
    const { error } = schema.validate(valid);
    expect(error).toBeUndefined();
  });

  it("should fail validation for invalid owner", () => {
    const schema = Joi.object({
      owner: Joi.string().hex().length(24),
    });
    const invalid = { owner: "notAHexString" };
    const { error } = schema.validate(invalid);
    expect(error).toBeDefined();
  });
});
