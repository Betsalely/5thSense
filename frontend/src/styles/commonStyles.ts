import { StyleSheet} from "react-native";

export const commonStyles = StyleSheet.create({
    screen: {
        flex: 1,
        backgroundColor: "#353535"
    },

    menuFrame: {
        position: "absolute",
        bottom: 24,
        left: 16,
        right: 16,
        flexDirection: "row",
        flexWrap: "nowrap",
        alignItems: "center",
        justifyContent: "center",
        paddingVertical: 8,
        paddingHorizontal: 12,
        overflow: "hidden",
        borderRadius: 200,

        shadowColor: "#000",
        shadowOffset: {
            width: -8,
            height: -10,
        },
        shadowOpacity: 0.37,
        shadowRadius: 46,
        elevation: 12,
    },

    menuButton: {
        flex: 1,
        minWidth: 0,
        height: "100%",
        alignItems: "center",
        justifyContent: "center",
    },

    menuTitle: {
        fontSize: 20,
        lineHeight: 24,
        fontFamily: "Inter-Regular",
        color: "#ffffff",
        textAlign: "center",
        fontWeight: "regular"
    },
});