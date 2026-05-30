import { useEffect, useState } from "react";
import { AppState, AppStateStatus } from "react-native";

export function usePrivacyScreen() {
  const [isProtected, setIsProtected] =
    useState(false);

  useEffect(() => {
    const handleStateChange = (
      nextState: AppStateStatus
    ) => {
      if (
        nextState === "background" ||
        nextState === "inactive"
      ) {
        setIsProtected(true);
        return;
      }

      if (nextState === "active") {
        setIsProtected(false);
      }
    };

    const subscription =
      AppState.addEventListener(
        "change",
        handleStateChange
      );

    return () => {
      subscription.remove();
    };
  }, []);

  return {
    isProtected,
  };
}