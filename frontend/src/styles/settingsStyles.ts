import { StyleSheet} from "react-native";

export const settingsStyles = StyleSheet.create({
    sectionFrame: {
        backgroundColor: "transparent",
        padding: 10,
        minHeight: "30%",
        borderWidth: 1,
        borderColor: "#ffffff",
        borderRadius: 25,
    },

    sectionTitle: {
        textAlign: "left",
        fontSize: 32,
        fontWeight: "bold",
        fontFamily: "InstrumentSans-Regular",
        color: "#ffffff",
    },

    redButton: {
        color: "#ff0000",
        padding: 10,
        borderRadius: 10,
        alignItems: "center",
        justifyContent: "center",
        borderColor: "#ff0000",
        borderWidth: 1,
    },

    blueButton: {
        color: "#0000ff",
        padding: 10,
        borderRadius: 10,
        alignItems: "center",
        justifyContent: "center",
        borderColor: "#0000ff",
        borderWidth: 1,
    },

    yellowButton: {
        color: "#ffff00",
        padding: 10,
        borderRadius: 10,
        alignItems: "center",
        justifyContent: "center",
        borderColor: "#ffff00",
        borderWidth: 1,
    },

    greenButton: {
        color: "#00ff00",
        padding: 10,
        borderRadius: 10,
        alignItems: "center",
        justifyContent: "center",
        borderColor: "#00ff00",
        borderWidth: 1,
    },
});