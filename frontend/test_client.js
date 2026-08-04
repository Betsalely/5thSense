const { io } = require("socket.io-client");

const PI_IP = "192.168.68.69";
const socket = io(`http://${PI_IP}:3000`);

socket.on("connect", () => {
    console.log(`Connected to Raspberry Pi! Client ID: ${socket.id}`);
    console.log("Waiting for real ESP32 data...");
});

socket.on("esp32_data", (data) => {
    console.log("--- Real ESP32 Data Received ---");
    console.log(JSON.stringify(data, null, 2));
});

socket.on("disconnect", () => {
    console.log("Disconnected from Raspberry Pi");
});