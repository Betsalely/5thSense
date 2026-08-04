import { Pressable, StyleSheet, Text, View } from 'react-native';

// iPhone Haptics API
import { vibrate } from '@/vibration/haptics';

// Styles
import { commonStyles } from '@/styles/commonStyles';
import { settingsStyles } from '@/styles/settingsStyles';

// UI Components
import NavigationBar from '@/components/NavigationBar';

export default function SettingsPage() {
    let isVibrationStopped = true;

    const loopVibration = async (strength: string) => {
        isVibrationStopped = true;
        // Loop selected vibration strength untill next button is pressed
        
        isVibrationStopped = false;
        while (true) {
            if (isVibrationStopped) {
                break;
            }
            await vibrate(strength as any);
            await new Promise((resolve) => setTimeout(resolve, 10));
        }
    };

    const stopVibration = () => {
        isVibrationStopped = true;
    };

    return (
        <View style={commonStyles.screen}>

            <View style={settingsStyles.sectionFrame}>
                <Text style={settingsStyles.sectionTitle}>Haptics Test</Text>

                <Pressable style={settingsStyles.blueButton} onPress={() => loopVibration('light')}>
                    <Text style={settingsStyles.sectionTitle}>Vibrate: Light</Text>
                </Pressable>
                <Pressable style={settingsStyles.blueButton} onPress={() => loopVibration('medium')}>
                    <Text style={settingsStyles.sectionTitle}>Vibrate: Medium</Text>
                </Pressable>
                <Pressable style={settingsStyles.blueButton} onPress={() => loopVibration('heavy')}>
                    <Text style={settingsStyles.sectionTitle}>Vibrate: Heavy</Text>
                </Pressable>
                <Pressable style={settingsStyles.blueButton} onPress={() => loopVibration('soft')}>
                    <Text style={settingsStyles.sectionTitle}>Vibrate: Soft</Text>
                </Pressable>
                <Pressable style={settingsStyles.blueButton} onPress={() => loopVibration('rigid')}>
                    <Text style={settingsStyles.sectionTitle}>Vibrate: Rigid</Text>
                </Pressable>
                <Pressable style={settingsStyles.greenButton} onPress={() => loopVibration('success')}>
                    <Text style={settingsStyles.sectionTitle}>Vibrate: Success</Text>
                </Pressable>
                <Pressable style={settingsStyles.yellowButton} onPress={() => loopVibration('warning')}>
                    <Text style={settingsStyles.sectionTitle}>Vibrate: Warning</Text>
                </Pressable>
                <Pressable style={settingsStyles.redButton} onPress={() => loopVibration('error')}>
                    <Text style={settingsStyles.sectionTitle}>Vibrate: Error</Text>
                </Pressable>
                <Pressable style={settingsStyles.redButton} onPress={() => stopVibration()}>
                    <Text style={settingsStyles.sectionTitle}>Stop Vibration</Text>
                </Pressable>
            </View>

            {/* NavigationBar UI component: /components/NavigationBar.tsx */}
            <NavigationBar />
        </View>
    );
}