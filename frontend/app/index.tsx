import { StyleSheet, Text, View } from "react-native";
import { useFonts } from "expo-font";

export default function Page() {
  const [fontsLoaded] = useFonts({
    "InstrumentSans-Regular": require("../assets/fonts/InstrumentSans-VariableFont_wdth,wght.ttf")
  });
  return (
    <View style={styles.screen}>
      <View style={styles.topFrame}>
        <View style={styles.map}>

        </View>
      </View>
      
      <View style={styles.centerFrame}>

      </View>

      <View style={styles.bottomFrame}>
        <View style={styles.distanceFrame}>
          <Text style={styles.distanceTitle}>50 m</Text>
          <Text style={styles.distanceSubtitle}>turn left</Text>
        </View>
      </View>

    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: "#353535"
  },

  topFrame: {
    backgroundColor: "transparent",
    padding: 10,
    minHeight: "30%",
  },
  map: {
    backgroundColor: "#D9D9D9",
    borderRadius: 25,
    minHeight: 228,
    width: "100%"
  },

  centerFrame: {
    backgroundColor: "transparent",
    padding: 20,
    minHeight: "40%",
  },

  bottomFrame: {
    backgroundColor: "transparent",
  },
  distanceFrame: {
    backgroundColor: "transparent",
    padding: 20,
    textAlign: "left",
  },
  distanceTitle: {
    textAlign: "left",
    fontSize: 32,
    fontWeight: "bold",
    fontFamily: "InstrumentSans-Regular",
    color: "#ffffff",
  },
  distanceSubtitle: {
    textAlign: "left",
    fontSize: 24,
    fontFamily: "InstrumentSans-Regular",
    color: "#ffffff",
  },  
});