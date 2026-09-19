import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { Pagination } from "../components/Pagination";

describe("Pagination", () => {
  it("shows the current page, total pages, and total record count", () => {
    render(
      <Pagination pagination={{ page: 2, limit: 5, total: 12, totalPages: 3 }} onPageChange={() => {}} />,
    );
    expect(screen.getByText(/page 2 of 3/i)).toBeInTheDocument();
    expect(screen.getByText(/12 records/i)).toBeInTheDocument();
  });

  it("disables Previous on the first page", () => {
    render(<Pagination pagination={{ page: 1, limit: 5, total: 12, totalPages: 3 }} onPageChange={() => {}} />);
    expect(screen.getByRole("button", { name: /previous/i })).toBeDisabled();
    expect(screen.getByRole("button", { name: /next/i })).toBeEnabled();
  });

  it("disables Next on the last page", () => {
    render(<Pagination pagination={{ page: 3, limit: 5, total: 12, totalPages: 3 }} onPageChange={() => {}} />);
    expect(screen.getByRole("button", { name: /next/i })).toBeDisabled();
    expect(screen.getByRole("button", { name: /previous/i })).toBeEnabled();
  });

  it("disables both buttons when there are no results", () => {
    render(<Pagination pagination={{ page: 1, limit: 5, total: 0, totalPages: 0 }} onPageChange={() => {}} />);
    expect(screen.getByRole("button", { name: /previous/i })).toBeDisabled();
    expect(screen.getByRole("button", { name: /next/i })).toBeDisabled();
  });

  it("calls onPageChange with page + 1 when Next is clicked", () => {
    const onPageChange = vi.fn();
    render(<Pagination pagination={{ page: 2, limit: 5, total: 12, totalPages: 3 }} onPageChange={onPageChange} />);
    fireEvent.click(screen.getByRole("button", { name: /next/i }));
    expect(onPageChange).toHaveBeenCalledWith(3);
  });

  it("calls onPageChange with page - 1 when Previous is clicked", () => {
    const onPageChange = vi.fn();
    render(<Pagination pagination={{ page: 2, limit: 5, total: 12, totalPages: 3 }} onPageChange={onPageChange} />);
    fireEvent.click(screen.getByRole("button", { name: /previous/i }));
    expect(onPageChange).toHaveBeenCalledWith(1);
  });
});
