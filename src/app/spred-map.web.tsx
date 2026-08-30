import { useEffect, useState } from "react";
import { ActivityIndicator, StyleSheet, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { ThemedText } from "@/components/themed-text";
import { useScanLocations } from "@/context/scan-locations";
import { useTheme } from "@/hooks/use-theme";
import { confidencePercent } from "@/utils/confidence";

export default function SpredMapWebScreen() {
  const theme = useTheme();
  const { locations } = useScanLocations();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(false);
  }, []);

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      <SafeAreaView style={styles.header}>
        <ThemedText type="title">Spred map</ThemedText>
        <ThemedText themeColor="textSecondary">
          Your tea health observations, by place.
        </ThemedText>
      </SafeAreaView>
      <View style={styles.webMap}>
        <ThemedText style={styles.mapTitle}>Scan locations</ThemedText>
        <ThemedText themeColor="textSecondary" style={styles.mapHint}>
          Interactive map pins are available in the Android and iOS app.
        </ThemedText>
        {loading ? (
          <ActivityIndicator color="#1E6B52" />
        ) : locations.length === 0 ? (
          <ThemedText themeColor="textSecondary">
            No scans pinned yet.
          </ThemedText>
        ) : (
          locations.map((location) => (
            <View key={location.id} style={styles.locationRow}>
              <View style={styles.pin} />
              <View style={styles.locationInfo}>
                <ThemedText>{location.disease}</ThemedText>
                <ThemedText type="small" themeColor="textSecondary">
                  {location.latitude.toFixed(5)},{" "}
                  {location.longitude.toFixed(5)}
                </ThemedText>
              </View>
              <ThemedText style={styles.confidence}>
                {confidencePercent(location.confidence)}%
              </ThemedText>
            </View>
          ))
        )}
      </View>
      <View style={styles.footer}>
        <ThemedText themeColor="textSecondary">
          {locations.length} pinned {locations.length === 1 ? "scan" : "scans"}
        </ThemedText>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { paddingHorizontal: 24, paddingTop: 16, paddingBottom: 14, gap: 4 },
  webMap: {
    flex: 1,
    margin: 16,
    padding: 24,
    borderRadius: 20,
    backgroundColor: "#DCEFE4",
    gap: 14,
  },
  mapTitle: { color: "#153E32", fontSize: 24, fontWeight: "800" },
  mapHint: { lineHeight: 20 },
  locationRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 14,
    paddingHorizontal: 12,
    borderRadius: 12,
    backgroundColor: "rgba(255,255,255,0.7)",
  },
  pin: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: "#1E6B52",
    marginRight: 12,
  },
  locationInfo: { flex: 1, gap: 3 },
  confidence: { color: "#1E6B52", fontWeight: "800" },
  footer: { paddingHorizontal: 24, paddingVertical: 18 },
});
