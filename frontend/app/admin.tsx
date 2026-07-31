import { TextInput, Pressable, StyleSheet, Text, View } from "react-native";
import { useFonts } from "expo-font";
import { useRouter } from "expo-router";
import React, { useState } from "react"

import MapIcon from "@/assets/icons/map.svg";
import SettingsIcon from "@/assets/icons/settings.svg";
import AdminIcon from "@/assets/icons/admin.svg";

import { commonStyles } from "@/styles/common";
import { request_Login } from "../api/login";

export default function Page() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");

  const handleLogin = async () => {
    try{
      const response = await request_Login({
        username,
        password
      });

      console.log(response);

    } catch (error) {
      console.log(error);
    }
  };

  const router = useRouter();
  
  const [fontsLoaded] = useFonts({
    "InstrumentSans-Regular": require("../assets/fonts/InstrumentSans-VariableFont_wdth,wght.ttf"),
    "Inter-Regular": require("../assets/fonts/Inter-VariableFont_opsz,wght.ttf")
  });
  return (
    <View style={styles.screen}>
      <View style={styles.loginFrame}>
        <View style={styles.titleFrame}>
          <center><AdminIcon style={styles.loginIcon} width={36} height={36} fill="white"/></center>
          <Text style={styles.titleLabel}>Landlord Page</Text>
        </View>

        <View style={styles.inputFrame}>
          <View style={styles.idFrame}>
            <Text style={styles.loginLabel}>Username</Text>
            <TextInput style={styles.loginInput} placeholder="Enter Username" onChangeText={setUsername}/>
          </View>

          <View style={styles.passwordFrame}>
            <Text style={styles.loginLabel}>Password</Text>
            <TextInput style={styles.loginInput} placeholder="Enter Password" secureTextEntry={true} onChangeText={setPassword}/>
          </View>

          <Pressable style={styles.loginButton} onPress={handleLogin}>
            <Text style={styles.loginButtonLabel}>Login</Text>
          </Pressable>
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
  loginFrame: {
    flex: 1,
    width: 300,
    height: 200,
    borderColor: "gray",
    marginBottom: 16,
    alignSelf: "center",
    justifyContent: "center",
  },
  loginLabel: {
    color: "#000352",
    fontFamily: "InstrumentSans-Regular",
    fontSize: 20,
    marginBottom: 8,
    fontWeight: "bold"
  },
  loginInput: {
    width: "100%",
    borderColor: "black",
    borderWidth: 1,
    fontSize: 16,
  },
  titleFrame: {
    backgroundColor: "#000352",
    width: "100%",
  },
  loginIcon: {
    padding: 16,
  },
  titleLabel: {
    color: "white",
    fontFamily: "InstrumentSans-Regular",
    fontSize: 20,
    marginBottom: 8,
    fontWeight: "bold",
    textAlign: "center",
  },
  inputFrame: {
    backgroundColor: "gray",
    width: "100%",
    padding: 16
  },
  idFrame: {
    backgroundColor: "gray",
    width: "100%",
    height: 50,
    borderColor: "gray",
    borderWidth: 1,
    marginBottom: 16
  },
  passwordFrame: {
    backgroundColor: "gray",
    width: "100%",
    height: 50,
    borderColor: "gray",
    borderWidth: 1,
    marginBottom: 16
  },
  loginButton: {
    width: "100%",
    backgroundColor: "#000352"
  },
  loginButtonLabel: {
    textAlign: "center",
    fontSize: 16,
    color: "white",
  },
});