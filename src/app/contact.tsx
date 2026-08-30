import { Linking, Pressable, StyleSheet, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { ThemedText } from "@/components/themed-text";
import { ThemedView } from "@/components/themed-view";
import { MaxContentWidth } from "@/constants/theme";
import { useTheme } from "@/hooks/use-theme";

export default function ContactScreen() {
  const theme = useTheme();
  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      <SafeAreaView style={styles.content}>
        <ThemedText type="title">Contact</ThemedText>
        <ThemedText themeColor="textSecondary">
          Need help with a diagnosis or your account?
        </ThemedText>
        <ThemedView type="backgroundElement" style={styles.card}>
          <ThemedText type="subtitle">TeaLeaf support</ThemedText>
          <ThemedText themeColor="textSecondary">
            Send us a note and our team will get back to you.
          </ThemedText>
          <Pressable
            onPress={() => void Linking.openURL("mailto:support@tealeaf.app")}
          >
            <ThemedText style={styles.link}>support@tealeaf.app</ThemedText>
          </Pressable>
        </ThemedView>
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
  card: { padding: 20, borderRadius: 18, gap: 10 },
  link: { color: "#1E6B52", fontWeight: "700", marginTop: 4 },
});
