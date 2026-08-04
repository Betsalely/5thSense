import { useRef } from "react";
import { Animated, Pressable, Text, View } from "react-native";
import { RelativePathString, useRouter, usePathname } from "expo-router";

import MapIcon from "@/assets/icons/map.svg";
import SettingsIcon from "@/assets/icons/settings.svg";
import AdminIcon from "@/assets/icons/admin.svg";

import { commonStyles } from "@/styles/commonStyles";

const ACTIVE_COLOR = "#000352";
const INACTIVE_COLOR = "#9B9DB8";

type NavItem = {
    label: string;
    path: string;
    Icon: React.ComponentType<{ width: number; height: number; fill: string }>;
};

const NAV_ITEMS: NavItem[] = [
    { label: "Map", path: "/", Icon: MapIcon },
    { label: "Settings", path: "/settings", Icon: SettingsIcon },
    { label: "Admin", path: "/admin", Icon: AdminIcon },
];

function NavButton({ item, isActive, onPress }: { item: NavItem; isActive: boolean; onPress: () => void }) {
    const scale = useRef(new Animated.Value(1)).current;

    const handlePressIn = () => {
        Animated.spring(scale, {
            toValue: 0.88,
            useNativeDriver: true,
            speed: 40,
            bounciness: 6,
        }).start();
    };

    const handlePressOut = () => {
        Animated.spring(scale, {
            toValue: 1,
            useNativeDriver: true,
            speed: 40,
            bounciness: 6,
        }).start();
    };

    const color = isActive ? ACTIVE_COLOR : INACTIVE_COLOR;

    return (
        <Pressable
            style={commonStyles.menuButton}
            onPress={onPress}
            onPressIn={handlePressIn}
            onPressOut={handlePressOut}
            hitSlop={8}
        >
            <Animated.View style={{ alignItems: "center", transform: [{ scale }] }}>
                <View
                    style={{
                        paddingHorizontal: isActive ? 18 : 0,
                        paddingVertical: isActive ? 6 : 0,
                        borderRadius: 16,
                        backgroundColor: isActive ? "#EDEEFB" : "transparent",
                    }}
                >
                    <item.Icon width={26} height={26} fill={color} />
                </View>
                <Text
                    style={[
                        commonStyles.menuTitle,
                        { color, fontFamily: isActive ? "InstrumentSans-Regular" : "Inter-Regular", marginTop: 4 },
                    ]}
                >
                    {item.label}
                </Text>
            </Animated.View>
        </Pressable>
    );
}

export default function NavigationBar() {
    const router = useRouter();
    const pathname = usePathname();

    const onNavigate = (path: string) => {

        if (pathname === path) return;
        router.push(path as RelativePathString);
    };

    return (
        <View
            style={[
                commonStyles.menuFrame,
                {
                    shadowColor: "#000",
                    shadowOffset: { width: 0, height: -2 },
                    shadowOpacity: 0.08,
                    shadowRadius: 10,
                    elevation: 12,
                },
            ]}
        >
            {NAV_ITEMS.map((item) => (
                <NavButton
                    key={item.path}
                    item={item}
                    isActive={pathname === item.path}
                    onPress={() => onNavigate(item.path)}
                />
            ))}
        </View>
    );
}