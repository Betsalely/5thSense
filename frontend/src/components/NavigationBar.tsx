import { Pressable, Text, View } from "react-native";
import { useFonts } from "expo-font";
import { RelativePathString, useRouter } from "expo-router";

import MapIcon from "@/assets/icons/map.svg";
import SettingsIcon from "@/assets/icons/settings.svg";
import AdminIcon from "@/assets/icons/admin.svg";

import { commonStyles } from "@/styles/commonStyles";

export default function NavigationBar() {
    const router = useRouter();

    const onClick = (path: string) => {
        // Future reference: Add a screen that confirms button clicks before navigating to the new page.

        router.push(path as RelativePathString);
    }

    // Load custom fonts from the folder: /assets/fonts/
    // The working directory is on src. Use "../" twice to move to the root directory.
    const [fontsLoaded] = useFonts({
        "InstrumentSans-Regular": require("../../assets/fonts/InstrumentSans-VariableFont_wdth,wght.ttf"),
        "Inter-Regular": require("../../assets/fonts/Inter-VariableFont_opsz,wght.ttf")
    });

    // NavigationBar UI component code:
    return (
        <View style={commonStyles.menuFrame}>

            {/* Map Button */}
            <Pressable style={commonStyles.menuButton} onPress={() => onClick("/")}>
                <MapIcon width={36} height={36} fill="#000352" />
                <Text style={commonStyles.menuTitle}>Map</Text>
            </Pressable>

            {/* Settings Button */}
            <Pressable style={commonStyles.menuButton} onPress={() => onClick("/settings")}>
                <SettingsIcon width={36} height={36} fill="#000352" />
                <Text style={commonStyles.menuTitle}>Settings</Text>
            </Pressable>

        </View>
    )
}