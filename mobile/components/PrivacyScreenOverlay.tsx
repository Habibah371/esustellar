import React from "react";
import {
  View,
  Text,
  Image,
} from "react-native";

type Props = {
  visible: boolean;
};

export default function PrivacyScreenOverlay({
  visible,
}: Props) {
  if (!visible) return null;

  return (
    <View
      pointerEvents="none"
      className="
        absolute
        top-0
        left-0
        right-0
        bottom-0
        z-[9999]
        items-center
        justify-center
        bg-black
      "
    >
      <Image
        source={require("../assets/logo.png")}
        resizeMode="contain"
        style={{
          width: 120,
          height: 120,
        }}
      />

      <Text
        className="
          mt-4
          text-white
          text-2xl
          font-bold
        "
      >
        EsuStellar
      </Text>
    </View>
  );
}