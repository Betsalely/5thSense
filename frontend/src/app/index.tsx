import { useEffect, useRef } from "react";
import { View, Text, Animated, Easing } from "react-native";
import Svg, { Path, Defs, LinearGradient, Stop } from "react-native-svg";
import { useFonts } from "expo-font";

import { commonStyles } from "@/styles/commonStyles";
import { indexStyles } from "@/styles/indexStyles";

import NavigationBar from "@/components/NavigationBar";

export default function MapPage() {
  const rotation = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const interval = setInterval(() => {
      const randomAngle = Math.random() * 180 - 90;
      Animated.timing(rotation, {
        toValue: randomAngle,
        duration: 800,
        easing: Easing.inOut(Easing.ease),
        useNativeDriver: true,
      }).start();
    }, 2000);

    return () => clearInterval(interval);
  }, [rotation]);

  const rotateInterpolate = rotation.interpolate({
    inputRange: [-90, 90],
    outputRange: ["-90deg", "90deg"],
  });

  return (
    <View style={commonStyles.screen}>
      <View style={indexStyles.topFrame}>
        <View style={[indexStyles.map, { backgroundColor: "transparent" }]}>
        </View>
      </View>

      <View style={[indexStyles.centerFrame, { justifyContent: "center", alignItems: "center" }]}>
        <Animated.View
          style={{
            transform: [{ rotate: rotateInterpolate }],
            transformOrigin: "center center",
            marginTop: -80,
            shadowColor: "#000",
            shadowOffset: { width: 0, height: 6 },
            shadowOpacity: 0.55,
            shadowRadius: 6,
            elevation: 8,
          }}
        >
          <Svg width={150} height={171} viewBox="0 0 70 80">
            <Defs>
              <LinearGradient id="cursorGradient" x1="0" y1="0" x2="0" y2="1">
                <Stop offset="0" stopColor="#FFFFFF" stopOpacity={1} />
                <Stop offset="1" stopColor="#C7C7C7" stopOpacity={1} />
              </LinearGradient>
            </Defs>
            <Path
              d="M35 0 L70 68 L35 54 L0 68 Z"
              fill="url(#cursorGradient)"
              stroke="#D8D8D8"
              strokeWidth={1}
              strokeLinejoin="round"
            />
          </Svg>
        </Animated.View>
      </View>

      <View style={indexStyles.bottomFrame}>
        <View style={indexStyles.distanceFrame}>
          <Text style={indexStyles.distanceTitle}>50 m</Text>
          <Text style={indexStyles.distanceSubTitle}>turn left</Text>
        </View>
      </View>

      <NavigationBar />
    </View>
  );
}