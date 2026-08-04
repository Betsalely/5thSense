import { View, Text } from "react-native";
import { useFonts } from "expo-font";

// Styles
import { commonStyles } from "@/styles/commonStyles";
import { indexStyles } from "@/styles/indexStyles";

// UI Components
import NavigationBar from "@/components/NavigationBar";

export default function MapPage() {
    return (
        <View style={commonStyles.screen}>
            <View style={indexStyles.topFrame}>
                <View style={indexStyles.map}>
                    {/* Map content goes here */}
                </View>
            </View>

            <View style={indexStyles.centerFrame}>
                {/* Center content goes here */}
            </View>

            <View style={indexStyles.bottomFrame}>
                <View style={indexStyles.distanceFrame}>
                    <Text style={indexStyles.distanceTitle}>50 m</Text>
                    <Text style={indexStyles.distanceSubTitle}>turn left</Text>
                </View>
            </View>

            {/* NavigationBar UI component: /components/NavigationBar.tsx */}
            <NavigationBar />
        </View>
    );
}