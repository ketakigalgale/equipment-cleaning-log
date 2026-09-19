import { describe, expect, it } from "vitest";
import { buildPaginationMeta, parsePaginationParams } from "../src/lib/pagination";

describe("parsePaginationParams", () => {
  it("defaults to page 1, limit 10 when nothing is provided", () => {
    expect(parsePaginationParams({})).toEqual({ page: 1, limit: 10, skip: 0 });
  });

  it("parses valid string query params", () => {
    expect(parsePaginationParams({ page: "3", limit: "20" })).toEqual({ page: 3, limit: 20, skip: 40 });
  });

  it("computes skip correctly for page > 1", () => {
    expect(parsePaginationParams({ page: "5", limit: "10" }).skip).toBe(40);
  });

  it("clamps limit to the maximum of 100", () => {
    expect(parsePaginationParams({ limit: "500" }).limit).toBe(100);
  });

  it("falls back to defaults for non-numeric input", () => {
    expect(parsePaginationParams({ page: "abc", limit: "xyz" })).toEqual({ page: 1, limit: 10, skip: 0 });
  });

  it("falls back to defaults for zero or negative values", () => {
    expect(parsePaginationParams({ page: "0", limit: "-5" })).toEqual({ page: 1, limit: 10, skip: 0 });
  });

  it("falls back to defaults for non-integer values", () => {
    expect(parsePaginationParams({ page: "1.5" })).toEqual({ page: 1, limit: 10, skip: 0 });
  });
});

describe("buildPaginationMeta", () => {
  it("computes totalPages by rounding up", () => {
    expect(buildPaginationMeta(25, 1, 10)).toEqual({ page: 1, limit: 10, total: 25, totalPages: 3 });
  });

  it("returns totalPages 0 when there are no results", () => {
    expect(buildPaginationMeta(0, 1, 10)).toEqual({ page: 1, limit: 10, total: 0, totalPages: 0 });
  });

  it("returns totalPages 1 when results fit exactly in one page", () => {
    expect(buildPaginationMeta(10, 1, 10)).toEqual({ page: 1, limit: 10, total: 10, totalPages: 1 });
  });
});
