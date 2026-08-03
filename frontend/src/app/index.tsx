import { Pressable, StyleSheet, Text, View } from "react-native";
import { MenuView } from '@react-native-menu/menu';
import { useFonts } from "expo-font";
import { useRouter } from "expo-router";

import MapIcon from "@/assets/icons/map.svg";
import SettingsIcon from "@/assets/icons/settings.svg";
import AdminIcon from "@/assets/icons/admin.svg";

import { commonStyles } from "@/styles/common";

/*

[ API SERVER ]
SERVER: 209.38.89.2
PORT:   8000

*/

export default function Page() {
  const router = useRouter();

  const [fontsLoaded] = useFonts({
    "InstrumentSans-Regular": require("../assets/fonts/InstrumentSans-VariableFont_wdth,wght.ttf"),
    "Inter-Regular": require("../assets/fonts/Inter-VariableFont_opsz,wght.ttf")
  });

  const onDestChanged = async ({ nativeEvent }: any) => {
    try{
      switch (nativeEvent.event) {
        case 'edit':
          console.log('Edit selected');
          break;
        case 'share':
          console.log('Share selected');
          break;
        case 'delete':
          console.log('Delete selected');
          break;
      }

    } catch (error) {
      console.log(error);
    }
  };

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

        <View style={styles.destFrame}>
          <MenuView
            actions={[
              { id: 'edit', title: 'Edit' },
              { id: 'share', title: 'Share' },
              { id: 'delete', title: 'Delete' },
            ]}
            onPressAction={onDestChanged}
            shouldOpenOnLongPress={false}
          >
            <View style={styles.destBtn}>
              <Text style={styles.destTitle}>Test Destination 1</Text>
            </View>
          </MenuView>
        </View>
      </View>

      <View style={commonStyles.menuFrame}>

        <Pressable style={commonStyles.menuButton} onPress={() => router.push("/")}>
          <MapIcon width={36} height={36} fill="#000352"/>
          <Text style={commonStyles.menuTitle}>Map</Text>
        </Pressable>

        <Pressable style={commonStyles.menuButton} onPress={() => router.push("/settings")}>
          <SettingsIcon width={36} height={36} fill="#000352"/>
          <Text style={commonStyles.menuTitle}>Settings</Text>
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
    display: "flex",
    backgroundColor: "transparent",
    flexDirection: "row"
  },
  distanceFrame: {
    backgroundColor: "transparent",
    padding: 20,
    textAlign: "left",
    flex: 0.5,
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
  destFrame: {
    backgroundColor: "transparent",
    padding: 20,
    textAlign: "right",
    flex: 1,
  },
  destTitle: {
    textAlign: "right",
    fontSize: 20,
    fontWeight: "bold",
    fontFamily: "InstrumentSans-Regular",
    color: "#ffffff",
  },
  destBtn: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#2563eb',
    borderRadius: 8,
  }
});