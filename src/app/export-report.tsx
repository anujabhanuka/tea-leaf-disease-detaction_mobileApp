import { useState } from "react";
import {
    ActivityIndicator,
    Alert,
    Pressable,
    Share,
    StyleSheet,
    View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { ThemedText } from "@/components/themed-text";
import { ThemedView } from "@/components/themed-view";
import { MaxContentWidth } from "@/constants/theme";
import { useScanLocations } from "@/context/scan-locations";
import { useTheme } from "@/hooks/use-theme";
import { confidencePercent } from "@/utils/confidence";

export default function ExportReportScreen() {
  const theme = useTheme();
  const { locations } = useScanLocations();
  const [loading, setLoading] = useState(false);

  async function exportReport() {
    setLoading(true);
    try {
      const report = [
        "TeaLeaf analysis report",
        "",
        ...locations.map(
          (item) =>
            `${item.timestamp} | ${item.disease} | ${confidencePercent(item.confidence)}% | ${item.latitude}, ${item.longitude}`,
        ),
      ].join("\n");
      await Share.share({ title: "TeaLeaf analysis report", message: report });
    } catch {
      Alert.alert("Export failed", "Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      <SafeAreaView style={styles.content}>
        <ThemedText type="title">Export report</ThemedText>
        <ThemedText themeColor="textSecondary">
          Create a shareable summary of your saved leaf analyses.
        </ThemedText>
        <ThemedView type="backgroundElement" style={styles.summary}>
          <ThemedText type="subtitle">
            {locations.length} analyses ready
          </ThemedText>
          <ThemedText themeColor="textSecondary">
            Includes disease, confidence, timestamp, and scan coordinates.
          </ThemedText>
        </ThemedView>
        <Pressable
          style={styles.button}
          onPress={exportReport}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <ThemedText style={styles.buttonText}>Export report</ThemedText>
          )}
        </Pressable>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: {
    flex: 1,
    width: "100%",
    maxWidth: MaxContentWidth,
    alignSelf: "center",
    padding: 24,
    gap: 16,
  },
  summary: { padding: 20, borderRadius: 18, gap: 8 },
  button: {
    minHeight: 54,
    borderRadius: 15,
    backgroundColor: "#1E6B52",
    alignItems: "center",
    justifyContent: "center",
  },
  buttonText: { color: "#fff", fontWeight: "700", fontSize: 16 },
});
