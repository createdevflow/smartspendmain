// components/SwipeTabsWrapper.js
import React, { useRef } from "react";
import { View, PanResponder } from "react-native";
import { useNavigation, useRoute } from "@react-navigation/native";

const TAB_ORDER = ["Home", "Books", "Transactions", "Settings"];
const SWIPE_THRESHOLD = 50;

export default function SwipeTabsWrapper({ children }) {
  const navigation = useNavigation();
  const route = useRoute();
  const currentName = route.name;

  const panResponder = useRef(
    PanResponder.create({
      onMoveShouldSetPanResponder: (_, gestureState) => {
        const { dx, dy } = gestureState;
        return Math.abs(dx) > Math.abs(dy) && Math.abs(dx) > 10;
      },
      onPanResponderRelease: (_, gestureState) => {
        const { dx } = gestureState;
        const currentIndex = TAB_ORDER.indexOf(currentName);
        if (currentIndex === -1) return;

        if (dx < -SWIPE_THRESHOLD && currentIndex < TAB_ORDER.length - 1) {
          const next = TAB_ORDER[currentIndex + 1];
          navigation.navigate(next);
        } else if (dx > SWIPE_THRESHOLD && currentIndex > 0) {
          const prev = TAB_ORDER[currentIndex - 1];
          navigation.navigate(prev);
        }
      },
    })
  ).current;

  return (
    <View style={{ flex: 1 }} {...panResponder.panHandlers}>
      {children}
    </View>
  );
}
