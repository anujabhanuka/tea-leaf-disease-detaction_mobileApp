import * as Location from "expo-location";
import { useEffect, useState } from "react";
import { ActivityIndicator, StyleSheet, View } from "react-native";
import MapView, { Marker, PROVIDER_DEFAULT } from "react-native-maps";
import { SafeAreaView } from "react-native-safe-area-context";

import { ThemedText } from "@/components/themed-text";
import { useScanLocations } from "@/context/scan-locations";
import { useTheme } from "@/hooks/use-theme";
import { confidencePercent } from "@/utils/confidence";

const DEFAULT_REGION = {
  latitude: 7.8731,
  longitude: 80.7718,
  latitudeDelta: 4.5,
  longitudeDelta: 4.5,
};

export default function SpredMapScreen() {
  const theme = useTheme();
  const { locations } = useScanLocations();
  const [region, setRegion] = useState(DEFAULT_REGION);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Location.getForegroundPermissionsAsync()
      .then(async ({ granted }) => {
        if (!granted) {
          setLoading(false);
          return;
        }
        const current = await Location.getCurrentPositionAsync({
          accuracy: Location.Accuracy.Balanced,
        });
        setRegion({
          ...current.coords,
          latitudeDelta: 0.08,
          longitudeDelta: 0.08,
        });
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      <SafeAreaView style={styles.header}>
        <ThemedText type="title">Spred map</ThemedText>
        <ThemedText themeColor="textSecondary">
          Your tea health observations, by place.
        </ThemedText>
      </SafeAreaView>
      <MapView
        provider={PROVIDER_DEFAULT}
        style={styles.map}
        initialRegion={region}
        region={region}
        showsUserLocation
      >
        {locations.map((location) => (
          <Marker
            key={location.id}
            coordinate={{
              latitude: location.latitude,
              longitude: location.longitude,
            }}
            title={location.disease}
            description={`${confidencePercent(location.confidence)}% confidence`}
            pinColor="#1E6B52"
          />
        ))}
      </MapView>
      <View style={styles.footer}>
        {loading ? (
          <ActivityIndicator color="#1E6B52" />
        ) : (
          <ThemedText themeColor="textSecondary">
            {locations.length} pinned{" "}
            {locations.length === 1 ? "scan" : "scans"}
          </ThemedText>
        )}
        <ThemedText type="small" themeColor="textSecondary">
          Pins are created when a leaf photo is selected.
        </ThemedText>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { paddingHorizontal: 24, paddingTop: 16, paddingBottom: 14, gap: 4 },
  map: { flex: 1, minHeight: 380 },
  footer: { paddingHorizontal: 24, paddingVertical: 18, gap: 6 },
});
