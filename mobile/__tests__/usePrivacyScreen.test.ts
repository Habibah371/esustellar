import { renderHook } from
  "@testing-library/react-hooks";

describe("usePrivacyScreen", () => {
  it("initializes correctly", () => {
    const { result } =
      renderHook(() =>
        usePrivacyScreen()
      );

    expect(
      result.current.isProtected
    ).toBe(false);
  });
});