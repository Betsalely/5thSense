import React, { useEffect, useState } from "react";
import { View, Text, TextInput, Pressable, StyleSheet, ScrollView, ActivityIndicator, Alert } from "react-native";
import { useFonts } from "expo-font";
import MapIcon from "@/assets/icons/map.svg";
import { commonStyles } from "@/styles/commonStyles";
import NavigationBar from "@/components/NavigationBar";
import { request } from "@/api/client";
import { request_Maps, MapItem } from "@/api/api_maps";

type Coordinates = {
    x: number;
    y: number;
};

type DestinationItem = {
    id: number;
    map: number;
    name: string;
    coordinates: Coordinates | number[];
    created_by: number;
    created_at: string;
};

type DestinationPayload = {
    map: number;
    name: string;
    coordinates: Coordinates | number[];
};

// Enable only after confirming the backend update contract.
const ENABLE_DESTINATION_UPDATES = false;

export default function ManageDestPage() {
    const [maps, setMaps] = useState<MapItem[]>([]);
    const [dests, setDests] = useState<DestinationItem[]>([]);

    const [selectedMap, setSelectedMap] = useState<MapItem | null>(null);
    const [selectedDest, setSelectedDest] = useState<DestinationItem | null>(null);

    const [isLoading, setIsLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);
    const [isFormVisible, setIsFormVisible] = useState(false);

    const [name, setName] = useState("");
    const [x, setX] = useState("");
    const [y, setY] = useState("");

    const [fontsLoaded] = useFonts({
        "InstrumentSans-Regular": require("../../assets/fonts/InstrumentSans-VariableFont_wdth,wght.ttf"),
        "Inter-Regular": require("../../assets/fonts/Inter-VariableFont_opsz,wght.ttf")
    });

    useEffect(() => {
        fetchMaps();
    }, []);

    useEffect(() => {
        if (!selectedMap) return;

        let active = true;

        setIsLoading(true);

        request<DestinationItem[]>(`/api/destinations/?map_id=${selectedMap.id}`)
            .then((data) => {
                if (active) setDests(data);
            })
            .catch((error) => {
                if (!active) return;

                console.error("Failed to fetch destinations:", error);
                Alert.alert("Error", "Failed to load destinations");
            })
            .finally(() => {
                if (active) setIsLoading(false);
            });

        return () => {
            active = false;
        };
    }, [selectedMap]);

    const fetchMaps = async () => {
        setIsLoading(true);

        try {
            const data = await request_Maps();
            setMaps(data);
        } catch (error) {
            console.error("Failed to fetch maps:", error);
            Alert.alert("Error", "Failed to load maps");
        } finally {
            setIsLoading(false);
        }
    };

    const fetchDests = async () => {
        if (!selectedMap) return;

        setIsLoading(true);

        try {
            const data = await request<DestinationItem[]>(`/api/destinations/?map_id=${selectedMap.id}`);
            setDests(data);
        } catch (error) {
            console.error("Failed to fetch destinations:", error);
            Alert.alert("Error", "Failed to load destinations");
        } finally {
            setIsLoading(false);
        }
    };

    const getCoordinates = (coordinates: DestinationItem["coordinates"]): Coordinates => {
        if (Array.isArray(coordinates)) {
            return {
                x: Number(coordinates[0]),
                y: Number(coordinates[1])
            };
        }

        return {
            x: Number(coordinates.x),
            y: Number(coordinates.y)
        };
    };

    const handleSelectMap = (map: MapItem) => {
        setSelectedMap(map);
        setSelectedDest(null);
        setDests([]);
        setIsFormVisible(false);
    };

    const handleBack = () => {
        if (isFormVisible) {
            setIsFormVisible(false);
            setSelectedDest(null);
            return;
        }

        setSelectedMap(null);
        setSelectedDest(null);
        setDests([]);
    };

    const handleOpenCreate = () => {
        setSelectedDest(null);
        setName("");
        setX("");
        setY("");
        setIsFormVisible(true);
    };

    const handleOpenEdit = (dest: DestinationItem) => {
        const coords = getCoordinates(dest.coordinates);

        setSelectedDest(dest);
        setName(dest.name);
        setX(String(coords.x));
        setY(String(coords.y));
        setIsFormVisible(true);
    };

    const handleSelectCoordinates = (coordinates: Coordinates) => {
        setX(String(coordinates.x));
        setY(String(coordinates.y));
    };

    const handleDelete = (id: number) => {
        Alert.alert("Confirm Deletion", "Are you sure you want to delete this destination?", [
            { text: "Cancel", style: "cancel" },
            {
                text: "Delete",
                style: "destructive",
                onPress: async () => {
                    try {
                        await request(`/api/destinations/${id}/`, {
                            method: "DELETE"
                        });

                        await fetchDests();
                    } catch (error) {
                        console.error("Failed to delete destination:", error);
                        Alert.alert("Error", "Failed to delete destination");
                    }
                }
            }
        ]);
    };

    const handleSave = async () => {
        if (isSaving || !selectedMap) return;

        if (!name.trim()) {
            Alert.alert("Validation Error", "Destination name is required");
            return;
        }

        if (!x.trim() || !y.trim()) {
            Alert.alert("Validation Error", "Coordinates are required");
            return;
        }

        const coordinateX = Number(x);
        const coordinateY = Number(y);

        if (!Number.isFinite(coordinateX) || !Number.isFinite(coordinateY)) {
            Alert.alert("Validation Error", "Coordinates must be valid numbers");
            return;
        }

        if (selectedDest && !ENABLE_DESTINATION_UPDATES) {
            Alert.alert(
                "Update Disabled",
                "Destination updates are disabled until the backend update contract is verified."
            );
            return;
        }

        const coordinates: Coordinates = {
            x: coordinateX,
            y: coordinateY
        };

        // Preserve the coordinate format returned by the backend when editing.
        const payload: DestinationPayload = {
            name: name.trim(),
            map: selectedMap.id,
            coordinates: selectedDest && Array.isArray(selectedDest.coordinates)
                ? [coordinates.x, coordinates.y]
                : coordinates
        };

        setIsSaving(true);

        try {
            if (selectedDest) {
                await request(`/api/destinations/${selectedDest.id}/`, {
                    method: "PUT",
                    body: JSON.stringify(payload)
                });
            } else {
                await request("/api/destinations/", {
                    method: "POST",
                    body: JSON.stringify(payload)
                });
            }

            setIsFormVisible(false);
            setSelectedDest(null);

            await fetchDests();
        } catch (error: any) {
            console.error("Failed to save destination:", error);
            Alert.alert("Error", error?.message || "Failed to save destination");
        } finally {
            setIsSaving(false);
        }
    };

    if (!fontsLoaded) {
        return (
            <View style={[commonStyles.screen, styles.centerLoader]}>
                <ActivityIndicator size="large" color="#5cbdb9" />
            </View>
        );
    }

    return (
        <View style={commonStyles.screen}>
            <View style={styles.container}>
                {!selectedMap ? (
                    <View style={[styles.card, { flex: 1, maxHeight: "85%" }]}>
                        <View style={styles.header}>
                            <View style={styles.iconWrapper}>
                                <MapIcon width={28} height={28} fill="#5cbdb9" />
                            </View>
                            <Text style={styles.title}>Select a Map</Text>
                        </View>

                        {isLoading ? (
                            <ActivityIndicator size="large" color="#5cbdb9" />
                        ) : (
                            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.listContent}>
                                {maps.map((map) => (
                                    <Pressable key={map.id} style={styles.mapOption} onPress={() => handleSelectMap(map)}>
                                        <View style={styles.userInfo}>
                                            <Text style={styles.userName}>{map.name}</Text>
                                            <Text style={styles.userSub}>Map ID: {map.id}</Text>
                                        </View>
                                        <Text style={styles.mapOptionText}>›</Text>
                                    </Pressable>
                                ))}

                                {maps.length === 0 && (
                                    <Text style={styles.emptyText}>No maps available.</Text>
                                )}
                            </ScrollView>
                        )}
                    </View>
                ) : isFormVisible ? (
                    <View style={[styles.card, { maxHeight: "90%" }]}>
                        <ScrollView showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
                            <View style={styles.header}>
                                <View style={styles.iconWrapper}>
                                    <MapIcon width={28} height={28} fill="#5cbdb9" />
                                </View>
                                <Text style={styles.title}>
                                    {selectedDest ? "Edit Destination" : "Create Destination"}
                                </Text>
                                <Text style={styles.userSub}>{selectedMap.name}</Text>
                            </View>

                            <View style={styles.form}>
                                <View style={styles.inputGroup}>
                                    <Text style={styles.label}>Destination Name</Text>
                                    <TextInput
                                        style={styles.input}
                                        placeholder="Enter destination name"
                                        placeholderTextColor="#A0AAB2"
                                        value={name}
                                        onChangeText={setName}
                                    />
                                </View>

                                <View style={styles.inputGroup}>
                                    <Text style={styles.label}>Coordinates</Text>

                                    <View style={styles.coordContainer}>
                                        <View style={styles.coordInputGroup}>
                                            <View style={styles.coordInput}>
                                                <Text style={styles.label}>X</Text>
                                                <TextInput
                                                    style={styles.input}
                                                    placeholder="X"
                                                    placeholderTextColor="#A0AAB2"
                                                    value={x}
                                                    onChangeText={setX}
                                                    keyboardType="numbers-and-punctuation"
                                                />
                                            </View>

                                            <View style={styles.coordInput}>
                                                <Text style={styles.label}>Y</Text>
                                                <TextInput
                                                    style={styles.input}
                                                    placeholder="Y"
                                                    placeholderTextColor="#A0AAB2"
                                                    value={y}
                                                    onChangeText={setY}
                                                    keyboardType="numbers-and-punctuation"
                                                />
                                            </View>
                                        </View>

                                        <Text style={styles.label}>Existing Coordinates</Text>

                                        {dests.length === 0 ? (
                                            <Text style={styles.emptyText}>No coordinates available.</Text>
                                        ) : (
                                            <View style={styles.coordList}>
                                                {dests.map((dest) => {
                                                    const coords = getCoordinates(dest.coordinates);
                                                    const active = Number(x) === coords.x && Number(y) === coords.y && x.trim() !== "" && y.trim() !== "";

                                                    return (
                                                        <Pressable
                                                            key={dest.id}
                                                            style={[styles.coordRow, active && styles.coordRowActive]}
                                                            onPress={() => handleSelectCoordinates(coords)}
                                                        >
                                                            <View style={styles.userInfo}>
                                                                <Text style={styles.userName}>{dest.name}</Text>
                                                                <Text style={styles.userSub}>
                                                                    X: {coords.x}  •  Y: {coords.y}
                                                                </Text>
                                                            </View>

                                                            {active && (
                                                                <Text style={styles.selectedIndicator}>✓</Text>
                                                            )}
                                                        </Pressable>
                                                    );
                                                })}
                                            </View>
                                        )}
                                    </View>
                                </View>

                                <Pressable
                                    style={[styles.button, isSaving && styles.disabledButton]}
                                    onPress={handleSave}
                                    disabled={isSaving}
                                >
                                    {isSaving ? (
                                        <ActivityIndicator color="#ffffff" />
                                    ) : (
                                        <Text style={styles.buttonText}>Save Changes</Text>
                                    )}
                                </Pressable>

                                <Pressable
                                    style={[styles.button, styles.cancelButton]}
                                    onPress={handleBack}
                                    disabled={isSaving}
                                >
                                    <Text style={[styles.buttonText, styles.cancelText]}>Cancel</Text>
                                </Pressable>
                            </View>
                        </ScrollView>
                    </View>
                ) : (
                    <View style={[styles.card, { flex: 1, maxHeight: "85%" }]}>
                        <Pressable style={styles.backButton} onPress={handleBack}>
                            <Text style={styles.backButtonText}>← Back to Maps</Text>
                        </Pressable>

                        <View style={styles.listHeader}>
                            <View style={styles.userInfo}>
                                <Text style={styles.title}>Destinations</Text>
                                <Text style={styles.userSub}>{selectedMap.name}</Text>
                            </View>

                            <Pressable style={styles.addButton} onPress={handleOpenCreate}>
                                <Text style={styles.addButtonText}>+ New</Text>
                            </Pressable>
                        </View>

                        {isLoading ? (
                            <ActivityIndicator size="large" color="#5cbdb9" style={{ marginTop: 40 }} />
                        ) : (
                            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.listContent}>
                                {dests.map((dest) => {
                                    const coords = getCoordinates(dest.coordinates);

                                    return (
                                        <View key={dest.id} style={styles.userRow}>
                                            <View style={styles.userInfo}>
                                                <Text style={styles.userName}>{dest.name}</Text>
                                                <Text style={styles.userSub}>
                                                    X: {coords.x}  •  Y: {coords.y}
                                                </Text>
                                            </View>

                                            <View style={styles.actionButtons}>
                                                <Pressable style={styles.editBtn} onPress={() => handleOpenEdit(dest)}>
                                                    <Text style={styles.editBtnText}>Edit</Text>
                                                </Pressable>

                                                <Pressable style={styles.deleteBtn} onPress={() => handleDelete(dest.id)}>
                                                    <Text style={styles.deleteBtnText}>Delete</Text>
                                                </Pressable>
                                            </View>
                                        </View>
                                    );
                                })}

                                {dests.length === 0 && (
                                    <Text style={styles.emptyText}>No destinations available.</Text>
                                )}
                            </ScrollView>
                        )}
                    </View>
                )}
            </View>

            <NavigationBar />
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        justifyContent: "center",
        alignItems: "center",
        padding: 24,
    },

    card: {
        width: "100%",
        maxWidth: 380,
        backgroundColor: "#ffffff",
        borderRadius: 24,
        padding: 24,
        shadowColor: "#2C3E50",
        shadowOffset: { width: 0,
            height: 12 },
        shadowOpacity: 0.05,
        shadowRadius: 24,
        elevation: 8,
    },
    header: {
        alignItems: "center",
        marginBottom: 24,
    },

    listHeader: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        marginBottom: 20,
    },

    iconWrapper: {
        padding: 16,
        backgroundColor: "rgba(92, 189, 185, 0.15)",
        borderRadius: 20,
        marginBottom: 16,
    },
    title: {
        fontSize: 22,
        fontWeight: "bold",
        fontFamily: "InstrumentSans-Regular",
        color: "#2C3E50",
    },
    addButton: {
        backgroundColor: "#5cbdb9",
        paddingHorizontal: 16,
        paddingVertical: 8,
        borderRadius: 8,
    },
    addButtonText: {
        color: "#fff",
        fontWeight: "bold",
        fontFamily: "InstrumentSans-Regular",
    },
    listContent: {
        gap: 12,
    },

    userRow: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        padding: 16,
        backgroundColor: "#f8fafc",
        borderRadius: 12,
        borderWidth: 1,
        borderColor: "#ebf6f5",
    },
    userInfo: {
        flex: 1,
    },

    userName: {
        fontSize: 16,
        fontWeight: "bold",
        color: "#2C3E50",
        fontFamily: "InstrumentSans-Regular",
        marginBottom: 4,
    },
    userSub: {
        fontSize: 13,
        color: "#A0AAB2",
        fontFamily: "Inter-Regular",
    },
    actionButtons: {
        flexDirection: "row",
        gap: 8,
    },
    editBtn: {
        paddingVertical: 6,
        paddingHorizontal: 12,
        backgroundColor: "rgba(92, 189, 185, 0.15)",
        borderRadius: 6,
    },
    editBtnText: {
        color: "#5cbdb9",
        fontSize: 13,
        fontWeight: "bold",
    },
    deleteBtn: {
        paddingVertical: 6,
        paddingHorizontal: 12,
        backgroundColor: "rgba(231, 76, 60, 0.1)",
        borderRadius: 6,
    },
    deleteBtnText: {
        color: "#e74c3c",
        fontSize: 13,
        fontWeight: "bold",
    },
    form: {
        gap: 16,
    },

    inputGroup: {
        gap: 6,
    },

    label: {
        fontSize: 13,
        fontWeight: "600",
        color: "#2C3E50",
        fontFamily: "Inter-Regular",
        marginLeft: 4,
    },

    input: {
        backgroundColor: "#ebf6f5",
        borderRadius: 12,
        paddingHorizontal: 16,
        height: 52,
        fontSize: 15,
        color: "#2C3E50",
        fontFamily: "Inter-Regular",
    },

    roleContainer: {
        flexDirection: "row",
        gap: 8,
    },
    roleButton: {
        flex: 1,
        height: 48,
        backgroundColor: "#f8fafc",
        borderRadius: 12,
        justifyContent: "center",
        alignItems: "center",
        borderWidth: 1,
        borderColor: "#e2e8f0",
    },
    roleButtonActive: {
        backgroundColor: "rgba(92, 189, 185, 0.15)",
        borderColor: "#5cbdb9",
    },
    roleText: {
        color: "#A0AAB2",
        fontFamily: "Inter-Regular",
        fontWeight: "600",
    },

    roleTextActive: {
        color: "#5cbdb9",
    },

    button: {
        backgroundColor: "#5cbdb9",
        height: 52,
        borderRadius: 12,
        justifyContent: "center",
        alignItems: "center",
        marginTop: 8,
    },

    buttonText: {
        color: "#ffffff",
        fontSize: 15,
        fontWeight: "bold",
        fontFamily: "InstrumentSans-Regular",
        letterSpacing: 0.5,

    },

    cancelButton: {
        backgroundColor: "transparent",
        borderWidth: 1.5,
        borderColor: "#ebf6f5",
        marginTop: 0,
    },

    cancelText: {
        color: "#A0AAB2",
    },

    centerLoader: {
        flex: 1,
        justifyContent: "center",
        alignItems: "center",
    },

    destRow: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        padding: 16,
        backgroundColor: "#f8fafc",
        borderRadius: 12,
        borderWidth: 1,
        borderColor: "#ebf6f5",
    },
    destInfo: {
        flex: 1,
        marginRight: 8,
    },
    destName: {
        fontSize: 16,
        fontWeight: "bold",
        color: "#2C3E50",
        fontFamily: "InstrumentSans-Regular",
        marginBottom: 4,
    },
    destSub: {
        fontSize: 13,
        color: "#A0AAB2",
        fontFamily: "Inter-Regular",
        marginTop: 3,
    },

    mapOption: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        padding: 14,
        backgroundColor: "#f8fafc",
        borderRadius: 12,
        borderWidth: 1,
        borderColor: "#e2e8f0",
    },
    mapOptionActive: {
        backgroundColor: "rgba(92, 189, 185, 0.15)",
        borderColor: "#5cbdb9",
    },
    mapOptionText: {
        fontSize: 14,
        fontFamily: "Inter-Regular",
        color: "#2C3E50",
    },
    mapOptionTextActive: {
        color: "#5cbdb9",
        fontWeight: "bold",
    },
    selectedIndicator: {
        color: "#5cbdb9",
        fontSize: 18,
        fontWeight: "bold",
    },

    filterContainer: {
        marginBottom: 20,
    },
    filterContent: {
        gap: 8,
        paddingRight: 4,
    },
    filterButton: {
        paddingHorizontal: 14,
        paddingVertical: 8,
        borderRadius: 8,
        backgroundColor: "#f8fafc",
        borderWidth: 1,
        borderColor: "#e2e8f0",
    },
    filterButtonActive: {
        backgroundColor: "#5cbdb9",
        borderColor: "#5cbdb9",
    },
    filterText: {
        fontSize: 13,
        color: "#A0AAB2",
        fontFamily: "Inter-Regular",
        fontWeight: "600",
    },
    filterTextActive: {
        color: "#ffffff",
    },

    disabledButton: {
        opacity: 0.6,
    },
    emptyText: {
        color: "#A0AAB2",
        fontSize: 15,
        textAlign: "center",
        marginTop: 20,
        fontFamily: "Inter-Regular",
    },
});