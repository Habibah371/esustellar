import { renderHook } from "@testing-library/react-native";
import { usePrivacyScreen } from "../hooks/usePrivacyScreen";

describe("usePrivacyScreen", () => {
  it("initializes correctly", () => {
    const { result } = renderHook(() => usePrivacyScreen());
    expect(result.current.isProtected).toBe(false);
  });
});