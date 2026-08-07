import { StyleSheet} from "react-native";

export const indexStyles = StyleSheet.create({
    topFrame: {
        backgroundColor: "transparent",
        padding: 10,
        minHeight: "30%",
    },

    map: {
        backgroundColor: "transparent",
        borderRadius: 25,
        minHeight: 228,
        width: "100%",
    },

    centerFrame: {
        backgroundColor: "transparent",
        padding: 10,
        minHeight: "40%",
    },

    bottomFrame: {
        display: "flex",
        backgroundColor: "transparent",
        flexDirection: "row",
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

    distanceSubTitle: {
        textAlign: "left",
        fontSize: 24,
        fontFamily: "InstrumentSans-Regular",
        color: "#ffffff",
    },

    
});