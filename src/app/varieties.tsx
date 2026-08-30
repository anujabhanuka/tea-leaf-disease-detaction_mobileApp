import { Ionicons } from "@expo/vector-icons";
import { Pressable, ScrollView, StyleSheet, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { ThemedText } from "@/components/themed-text";
import { ThemedView } from "@/components/themed-view";
import { MaxContentWidth } from "@/constants/theme";
import { useTheme } from "@/hooks/use-theme";

const conditions = [
  {
    name: "Healthy leaf",
    detail:
      "No visible signs of disease. Plant is thriving and ready for harvest.",
    color: "#22c55e", // Green
    icon: "leaf",
  },
  {
    name: "Brown Blight",
    detail:
      "Fungal infection causing large, brown, dead patches on mature leaves.",
    color: "#f59e0b", // Amber
    icon: "warning",
  },
  {
    name: "Gray Blight",
    detail: "Irregular grayish spots with distinct dark brown margins.",
    color: "#737373", // Gray
    icon: "water",
  },
  {
    name: "Tea Algal Leaf Spot",
    detail: "Raised, fuzzy orange or green spots caused by parasitic algae.",
    color: "#f43f5e", // Rose
    icon: "bug",
  },
  {
    name: "White Spot",
    detail: "Small, circular pale spots often surrounded by a dark ring.",
    color: "#8b5cf6", // Purple
    icon: "radio-button-off",
  },
  {
    name: "Red Leaf Spot",
    detail:
      "Reddish-brown lesions that can spread rapidly in humid conditions.",
    color: "#ef4444", // Red
    icon: "alert-circle",
  },
];

export default function VarietiesScreen() {
  const theme = useTheme();

  return (
    <ScrollView
      style={{ backgroundColor: theme.background }}
      contentContainerStyle={styles.content}
    >
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <ThemedText type="title">Disease Reference</ThemedText>
          <ThemedText themeColor="textSecondary" style={styles.subtitle}>
            A guide to common tea plant conditions and their identifying
            symptoms.
          </ThemedText>
        </View>

        <View style={styles.list}>
          {conditions.map((condition, index) => (
            <Pressable key={index}>
              {({ pressed }) => (
                <ThemedView
                  type="backgroundElement"
                  style={[
                    styles.card,
                    { borderColor: theme.backgroundSelected },
                    pressed && styles.cardPressed, // Adds a subtle click effect
                  ]}
                >
                  {/* Colored Icon Badge */}
                  <View
                    style={[
                      styles.iconBadge,
                      { backgroundColor: `${condition.color}15` },
                    ]}
                  >
                    <Ionicons
                      name={condition.icon as any}
                      size={22}
                      color={condition.color}
                    />
                  </View>

                  {/* Text Content */}
                  <View style={styles.cardContent}>
                    <ThemedText type="subtitle" style={styles.cardTitle}>
                      {condition.name}
                    </ThemedText>
                    <ThemedText
                      themeColor="textSecondary"
                      style={styles.cardDetail}
                    >
                      {condition.detail}
                    </ThemedText>
                  </View>

                  {/* Right Arrow */}
                  <Ionicons
                    name="chevron-forward"
                    size={20}
                    color={theme.textSecondary}
                    style={styles.chevron}
                  />
                </ThemedView>
              )}
            </Pressable>
          ))}
        </View>
      </SafeAreaView>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  content: {
    flexGrow: 1,
  },
  container: {
    width: "100%",
    maxWidth: MaxContentWidth,
    alignSelf: "center",
    padding: 24,
  },
  header: {
    marginBottom: 24,
    gap: 8,
  },
  subtitle: {
    lineHeight: 22,
  },
  list: {
    gap: 12, // Spacing between cards
  },
  card: {
    flexDirection: "row",
    alignItems: "center",
    padding: 16,
    borderRadius: 20,
    borderWidth: 1, // Adds a subtle border
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2, // For Android shadow
  },
  cardPressed: {
    opacity: 0.7,
    transform: [{ scale: 0.98 }], // Shrinks slightly when tapped
  },
  iconBadge: {
    width: 48,
    height: 48,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 16,
  },
  cardContent: {
    flex: 1, // Takes up remaining space so text wraps properly
    gap: 4,
  },
  cardTitle: {
    fontSize: 17,
  },
  cardDetail: {
    fontSize: 14,
    lineHeight: 20,
  },
  chevron: {
    marginLeft: 8,
    opacity: 0.5,
  },
});
