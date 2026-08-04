import { View, Text } from "react-native";
import Svg, { Path } from "react-native-svg";
import { useFonts } from "expo-font";

import { commonStyles } from "@/styles/commonStyles";
import { indexStyles } from "@/styles/indexStyles";

import NavigationBar from "@/components/NavigationBar";

export default function MapPage() {
  return (
    <View style={commonStyles.screen}>
      <View style={indexStyles.topFrame}>
        <View style={[indexStyles.map, { backgroundColor: "transparent" }]}>
        </View>
      </View>

      <View style={[indexStyles.centerFrame, { justifyContent: "center", alignItems: "center" }]}>
        <View
          style={{
            shadowColor: "#000",
            shadowOffset: { width: 0, height: 4 },
            shadowOpacity: 0.35,
            shadowRadius: 6,
            elevation: 8,
          }}
        >
          <Svg width={70} height={80} viewBox="0 0 70 80">
            {/* Kite-shaped navigation cursor: tip at top, concave notch at back */}
            <Path
              d="M35 0 L70 68 L35 54 L0 68 Z"
              fill="#F2F2F2"
              stroke="#D8D8D8"
              strokeWidth={1}
              strokeLinejoin="round"
            />
          </Svg>
        </View>
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