import { Pressable, StyleSheet, Text, View } from "react-native";
import { useFonts } from "expo-font";
import { useRouter } from "expo-router";

import MapIcon from "@/assets/icons/map.svg";
import SettingsIcon from "@/assets/icons/settings.svg";
import AdminIcon from "@/assets/icons/admin.svg";

import { commonStyles } from "@/styles/common";

export default function Page() {
  const router = useRouter();
  
  const [fontsLoaded] = useFonts({
    "InstrumentSans-Regular": require("../assets/fonts/InstrumentSans-VariableFont_wdth,wght.ttf"),
    "Inter-Regular": require("../assets/fonts/Inter-VariableFont_opsz,wght.ttf")
  });
  return (
    <View style={styles.screen}>

      <View style={commonStyles.menuFrame}>

        <Pressable style={commonStyles.menuButton} onPress={() => router.push("/")}>
          <MapIcon width={36} height={36} fill="#000352"/>
          <Text style={commonStyles.menuTitle}>Map</Text>
        </Pressable>

        <Pressable style={commonStyles.menuButton} onPress={() => router.push("/settings")}>
          <SettingsIcon width={36} height={36} fill="#000352"/>
          <Text style={commonStyles.menuTitle}>Settings</Text>
        </Pressable>

        <Pressable style={commonStyles.menuButton} onPress={() => router.push("/admin")}>
          <AdminIcon width={36} height={36} fill="#000352"/>
          <Text style={commonStyles.menuTitle}>Admin</Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: "#353535"
  },
  loginFrame: {
    backgroundColor: ""
  },
});