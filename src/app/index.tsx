import { File } from "expo-file-system";
import * as ImagePicker from "expo-image-picker";
import * as Location from "expo-location";
import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Image,
  KeyboardAvoidingView,
  Linking,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  TextInput,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { ThemedText } from "@/components/themed-text";
import { ThemedView } from "@/components/themed-view";
import { BottomTabInset, MaxContentWidth } from "@/constants/theme";
import { useAuth } from "@/context/auth";
import { useScanLocations } from "@/context/scan-locations";
import { useTheme } from "@/hooks/use-theme";
import { confidencePercent } from "@/utils/confidence";

const API_URL = "http://192.168.1.4:5000";
type HistoryItem = {
  id: number;
  disease: string;
  confidence: number;
  timestamp: string;
  latitude?: number;
  longitude?: number;
};
type RecommendedVideo = {
  url: string;
  title: string;
  channel: string;
};

//  YouTube links
const RECOMMENDATION_VIDEOS: Record<string, RecommendedVideo[]> = {
  "Brown Blight": ["https://www.youtube.com/watch?v=K0CWatXwjZc"],
  "Gray Blight": ["https://www.youtube.com/watch?v=K0CWatXwjZc"],
  "Tea Algal Leaf Spot": ["https://www.youtube.com/watch?v=Gi4Fqmp-iWI"],
  "White Spot": ["https://www.youtube.com/watch?v=QO6mIJenoJs&t=67s"],
  "Red Leaf Spot": ["https://www.youtube.com/watch?v=Gi4Fqmp-iWI"],
  "Healthy leaf": ["https://www.youtube.com/watch?v=XHD-iGmIzrw"],
};

function getYoutubeThumbnail(url: string) {
  const videoId = url.match(/(?:v=|youtu\.be\/)([\w-]{11})/)?.[1];
  return videoId ? `https://img.youtube.com/vi/${videoId}/mqdefault.jpg` : "";
}

export default function HomeScreen() {
  const theme = useTheme();
  const { addLocation, replaceLocations } = useScanLocations();
  const { token, hydrated, setToken } = useAuth();
  const [registering, setRegistering] = useState(false),
    [username, setUsername] = useState(""),
    [password, setPassword] = useState(""),
    [email, setEmail] = useState(""),
    [mobile, setMobile] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [focusedField, setFocusedField] = useState<
    "username" | "password" | null
  >(null);
  const [image, setImage] = useState<ImagePicker.ImagePickerAsset | null>(null);
  const [imageLocation, setImageLocation] =
    useState<Location.LocationObject | null>(null);
  const [result, setResult] = useState<{
      disease: string;
      confidence: number;
    } | null>(null),
    [history, setHistory] = useState<HistoryItem[]>([]);
  const [videos, setVideos] = useState<RecommendedVideo[]>([]);
  const [loading, setLoading] = useState(false),
    [error, setError] = useState("");

  useEffect(() => {
    if (token) void loadHistory(token);
  }, [token]);
  useEffect(() => {
    if (result?.disease) setVideos(RECOMMENDATION_VIDEOS[result.disease] ?? []);
    else setVideos([]);
  }, [result?.disease]);
  async function loadHistory(accessToken: string) {
    try {
      const response = await fetch(`${API_URL}/history`, {
        headers: { Authorization: `Bearer ${accessToken}` },
      });
      if (response.ok) {
        const nextHistory: HistoryItem[] =
          (await response.json()).history ?? [];
        setHistory(nextHistory);
        const serverLocations = nextHistory
          .filter((item) => item.latitude != null && item.longitude != null)
          .map((item) => ({
            id: String(item.id),
            latitude: item.latitude as number,
            longitude: item.longitude as number,
            disease: item.disease,
            confidence: item.confidence,
            timestamp: item.timestamp,
          }));
        if (serverLocations.length) await replaceLocations(serverLocations);
      }
    } catch {
      setError("Could not connect to the server. Check the API URL.");
    }
  }
  async function submitCredentials() {
    if (
      !username.trim() ||
      !password ||
      (registering && (!email.trim() || !mobile.trim()))
    ) {
      setError(
        registering
          ? "Enter your username, email, mobile number, and password."
          : "Enter both your username and password.",
      );
      return;
    }
    if (registering && !/^\S+@\S+\.\S+$/.test(email.trim())) {
      setError("Enter a valid email address.");
      return;
    }
    setLoading(true);
    setError("");
    try {
      const response = await fetch(
        `${API_URL}${registering ? "/register" : "/login"}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            username: username.trim(),
            password,
            ...(registering
              ? { email: email.trim(), mobile: mobile.trim() }
              : {}),
          }),
        },
      );
      const data = await response.json();
      if (!response.ok) throw new Error(data.error ?? "Request failed");
      if (registering) {
        setRegistering(false);
        Alert.alert("Account created", "You can now sign in to scan a leaf.");
      } else setToken(data.access_token);
    } catch (requestError) {
      setError(
        requestError instanceof Error
          ? requestError.message
          : "Something went wrong.",
      );
    } finally {
      setLoading(false);
    }
  }
  async function useSelectedImage(picked: ImagePicker.ImagePickerResult) {
    if (picked.canceled) return;
    const selectedImage = picked.assets[0];
    setImage(selectedImage);
    setResult(null);
    setError("");

    try {
      const locationPermission =
        await Location.requestForegroundPermissionsAsync();
      if (!locationPermission.granted) {
        setError("Location access was denied. This scan will not be pinned.");
        setImageLocation(null);
        return;
      }
      setImageLocation(
        await Location.getCurrentPositionAsync({
          accuracy: Location.Accuracy.Balanced,
        }),
      );
    } catch {
      setError("Could not read your location. The image is ready to analyze.");
      setImageLocation(null);
    }
  }

  async function chooseImage() {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      Alert.alert(
        "Photo access needed",
        "Allow photo access to choose a tea leaf image.",
      );
      return;
    }
    await useSelectedImage(
      await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ["images"],
        quality: 0.85,
        allowsEditing: true,
        aspect: [4, 3],
      }),
    );
  }

  async function captureImage() {
    const permission = await ImagePicker.requestCameraPermissionsAsync();
    if (!permission.granted) {
      Alert.alert(
        "Camera access needed",
        "Allow camera access to photograph a tea leaf.",
      );
      return;
    }
    await useSelectedImage(
      await ImagePicker.launchCameraAsync({
        mediaTypes: ["images"],
        quality: 0.85,
        allowsEditing: true,
        aspect: [4, 3],
      }),
    );
  }

  function openImageOptions() {
    Alert.alert("Add leaf photo", "Choose how you want to add the image.", [
      { text: "Take photo", onPress: () => void captureImage() },
      { text: "Choose from gallery", onPress: () => void chooseImage() },
      { text: "Cancel", style: "cancel" },
    ]);
  }

  async function analyzeImage() {
    if (!image || !token) return;
    setLoading(true);
    setError("");
    try {
      const formData = new FormData();
      const filename = image.fileName ?? "tea-leaf.jpg";
      if (Platform.OS === "web") {
        const imageResponse = await fetch(image.uri);
        const imageBlob = await imageResponse.blob();
        formData.append("image", imageBlob, filename);
      } else {
        const imageFile = new File(image.uri);
        formData.append("image", imageFile, filename);
      }
      if (imageLocation) {
        formData.append("latitude", String(imageLocation.coords.latitude));
        formData.append("longitude", String(imageLocation.coords.longitude));
      }
      const response = await fetch(`${API_URL}/predict`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
        body: formData,
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error ?? "Analysis failed");
      setResult({ disease: data.disease, confidence: data.confidence });
      if (imageLocation) {
        await addLocation({
          latitude: imageLocation.coords.latitude,
          longitude: imageLocation.coords.longitude,
          disease: data.disease,
          confidence: data.confidence,
        });
      }
      await loadHistory(token);
    } catch (requestError) {
      setError(
        requestError instanceof Error
          ? requestError.message
          : "Something went wrong.",
      );
    } finally {
      setLoading(false);
    }
  }
  if (!hydrated)
    return (
      <ThemedView style={styles.container}>
        <View style={styles.loadingScreen}>
          <ActivityIndicator color="#1E6B52" size="large" />
        </View>
      </ThemedView>
    );
  if (!token)
    return (
      <ThemedView style={styles.container}>
        <KeyboardAvoidingView
          style={styles.keyboardArea}
          behavior={Platform.OS === "ios" ? "padding" : undefined}
        >
          <ScrollView
            contentContainerStyle={styles.authScrollContent}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
          >
            <SafeAreaView style={styles.safeArea}>
              <View style={styles.authHeader}>
                <View style={styles.logo}>
                  <ThemedText style={styles.logoText}>TL</ThemedText>
                </View>
                <ThemedText type="title">TeaLeaf</ThemedText>
                <ThemedText themeColor="textSecondary">
                  Plant health, made clear.
                </ThemedText>
              </View>
              <View style={styles.authCard}>
                <ThemedText type="subtitle">
                  {registering ? "Create your account" : "Welcome back"}
                </ThemedText>
                <ThemedText themeColor="textSecondary">
                  {registering
                    ? "Save your leaf analysis history."
                    : "Sign in to analyze and track your tea leaves."}
                </ThemedText>
                <ThemedText style={styles.fieldLabel}>Username</ThemedText>
                <TextInput
                  placeholder="Enter your username"
                  placeholderTextColor={theme.textSecondary}
                  value={username}
                  onChangeText={setUsername}
                  autoCapitalize="none"
                  autoCorrect={false}
                  autoComplete="username"
                  returnKeyType="next"
                  onFocus={() => setFocusedField("username")}
                  onBlur={() => setFocusedField(null)}
                  style={[
                    styles.input,
                    {
                      color: theme.text,
                      borderColor:
                        focusedField === "username"
                          ? "#1E6B52"
                          : theme.backgroundSelected,
                    },
                  ]}
                />
                {registering && (
                  <>
                    <ThemedText style={styles.fieldLabel}>Email</ThemedText>
                    <TextInput
                      placeholder="you@example.com"
                      placeholderTextColor={theme.textSecondary}
                      value={email}
                      onChangeText={setEmail}
                      autoCapitalize="none"
                      autoCorrect={false}
                      autoComplete="email"
                      keyboardType="email-address"
                      onFocus={() => setFocusedField(null)}
                      style={[
                        styles.input,
                        {
                          color: theme.text,
                          borderColor: theme.backgroundSelected,
                        },
                      ]}
                    />
                    <ThemedText style={styles.fieldLabel}>
                      Mobile number
                    </ThemedText>
                    <TextInput
                      placeholder="Enter your mobile number"
                      placeholderTextColor={theme.textSecondary}
                      value={mobile}
                      onChangeText={setMobile}
                      keyboardType="phone-pad"
                      autoComplete="tel"
                      style={[
                        styles.input,
                        {
                          color: theme.text,
                          borderColor: theme.backgroundSelected,
                        },
                      ]}
                    />
                  </>
                )}
                <View style={styles.passwordLabelRow}>
                  <ThemedText style={styles.fieldLabel}>Password</ThemedText>
                  <ThemedText type="small" themeColor="textSecondary">
                    At least 6 characters
                  </ThemedText>
                </View>
                <View style={styles.passwordInputWrap}>
                  <TextInput
                    placeholder="Enter your password"
                    placeholderTextColor={theme.textSecondary}
                    value={password}
                    onChangeText={setPassword}
                    secureTextEntry={!showPassword}
                    autoComplete={
                      registering ? "new-password" : "current-password"
                    }
                    onFocus={() => setFocusedField("password")}
                    onBlur={() => setFocusedField(null)}
                    style={[
                      styles.input,
                      styles.passwordInput,
                      {
                        color: theme.text,
                        borderColor:
                          focusedField === "password"
                            ? "#1E6B52"
                            : theme.backgroundSelected,
                      },
                    ]}
                  />
                  <Pressable
                    onPress={() => setShowPassword(!showPassword)}
                    style={styles.passwordToggle}
                    hitSlop={8}
                  >
                    <ThemedText style={styles.linkText}>
                      {showPassword ? "Hide" : "Show"}
                    </ThemedText>
                  </Pressable>
                </View>
                {!!error && (
                  <ThemedText style={styles.error}>{error}</ThemedText>
                )}
                <Pressable
                  style={styles.primaryButton}
                  onPress={submitCredentials}
                  disabled={loading}
                >
                  {loading ? (
                    <ActivityIndicator color="#fff" />
                  ) : (
                    <ThemedText style={styles.buttonText}>
                      {registering ? "Create account" : "Sign in"}
                    </ThemedText>
                  )}
                </Pressable>
                <Pressable
                  onPress={() => {
                    setRegistering(!registering);
                    setError("");
                  }}
                  style={styles.switchButton}
                >
                  <ThemedText themeColor="textSecondary">
                    {registering
                      ? "Already have an account? "
                      : "New to TeaLeaf? "}
                    <ThemedText style={styles.linkText}>
                      {registering ? "Sign in" : "Create one"}
                    </ThemedText>
                  </ThemedText>
                </Pressable>
              </View>
            </SafeAreaView>
          </ScrollView>
        </KeyboardAvoidingView>
      </ThemedView>
    );
  return (
    <ScrollView
      style={{ backgroundColor: theme.background }}
      contentContainerStyle={styles.scrollContent}
    >
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.topBar}>
          <View>
            <ThemedText type="subtitle">Good to see you</ThemedText>
            <ThemedText themeColor="textSecondary">
              Ready to check a leaf?
            </ThemedText>
          </View>
          <Pressable onPress={() => setToken(null)}>
            <ThemedText style={styles.linkText}>Sign out</ThemedText>
          </Pressable>
        </View>
        <View style={styles.hero}>
          <View style={styles.heroCopy}>
            <ThemedText style={styles.eyebrow}>LEAF DIAGNOSTICS</ThemedText>
            <ThemedText style={styles.heroTitle}>
              Find what your{"\n"}tea plant needs.
            </ThemedText>
            <ThemedText themeColor="textSecondary">
              A quick image scan can reveal signs of common disease.
            </ThemedText>
          </View>
          <ThemedText style={styles.leafMark}>✦</ThemedText>
        </View>
        <View style={styles.sectionHeader}>
          <ThemedText type="subtitle">New analysis</ThemedText>
          <ThemedText themeColor="textSecondary">01 / 01</ThemedText>
        </View>
        <Pressable
          style={[styles.uploadBox, { borderColor: theme.backgroundSelected }]}
          onPress={openImageOptions}
        >
          {image ? (
            <Image source={{ uri: image.uri }} style={styles.preview} />
          ) : (
            <>
              <View style={styles.uploadIcon}>
                <ThemedText style={styles.plus}>+</ThemedText>
              </View>
              <ThemedText style={styles.uploadTitle}>
                Choose a leaf photo
              </ThemedText>
              <ThemedText themeColor="textSecondary">
                Use a clear, well-lit image
              </ThemedText>
            </>
          )}
        </Pressable>
        {image && (
          <Pressable style={styles.changeButton} onPress={openImageOptions}>
            <ThemedText style={styles.linkText}>
              Choose a different photo
            </ThemedText>
          </Pressable>
        )}
        {!!error && <ThemedText style={styles.error}>{error}</ThemedText>}
        <Pressable
          style={[styles.primaryButton, (!image || loading) && styles.disabled]}
          onPress={analyzeImage}
          disabled={!image || loading}
        >
          {loading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <ThemedText style={styles.buttonText}>Analyze leaf →</ThemedText>
          )}
        </Pressable>
        {result && (
          <View style={styles.resultCard}>
            <ThemedText style={styles.resultLabel}>ANALYSIS RESULT</ThemedText>
            <ThemedText type="subtitle">{result.disease}</ThemedText>
            <View style={styles.confidenceRow}>
              <ThemedText themeColor="textSecondary">Confidence</ThemedText>
              <ThemedText style={styles.confidence}>
                {confidencePercent(result.confidence)}%
              </ThemedText>
            </View>
            <View style={styles.progressTrack}>
              <View
                style={[
                  styles.progress,
                  { width: `${confidencePercent(result.confidence)}%` },
                ]}
              />
            </View>
          </View>
        )}
        {result && (
          <View style={styles.videoSection}>
            <View style={styles.videoHeader}>
              <View>
                <ThemedText type="subtitle">
                  Learn about {result.disease}
                </ThemedText>
                <ThemedText themeColor="textSecondary" type="small">
                  Recommended care videos
                </ThemedText>
              </View>
            </View>
            {videos.length > 0 ? (
              videos.map((video) => (
                <Pressable
                  key={video.url}
                  style={styles.videoCard}
                  onPress={() => void Linking.openURL(video.url)}
                >
                  {getYoutubeThumbnail(video.url) ? (
                    <Image
                      source={{ uri: getYoutubeThumbnail(video.url) }}
                      style={styles.videoThumbnail}
                    />
                  ) : (
                    <View style={styles.videoPlaceholder}>
                      <ThemedText style={styles.playIcon}>▶</ThemedText>
                    </View>
                  )}
                  <View style={styles.videoInfo}>
                    <ThemedText numberOfLines={2} style={styles.videoTitle}>
                      {video.title}
                    </ThemedText>
                    <ThemedText type="small" themeColor="textSecondary">
                      {video.channel}
                    </ThemedText>
                  </View>
                </Pressable>
              ))
            ) : (
              <Pressable
                style={styles.youtubeSearchButton}
                onPress={() =>
                  void Linking.openURL(
                    `https://www.youtube.com/results?search_query=${encodeURIComponent(`tea leaf ${result.disease} treatment`)}`,
                  )
                }
              >
                <ThemedText style={styles.buttonText}>
                  Watch {result.disease} videos on YouTube
                </ThemedText>
              </Pressable>
            )}
          </View>
        )}
        <View style={styles.historyHeader}>
          <ThemedText type="subtitle">Recent analyses</ThemedText>
          <ThemedText themeColor="textSecondary">
            {history.length} saved
          </ThemedText>
        </View>
        {history.length === 0 ? (
          <ThemedText themeColor="textSecondary" style={styles.empty}>
            Your saved results will appear here.
          </ThemedText>
        ) : (
          history.slice(0, 4).map((item) => (
            <View key={item.id} style={styles.historyRow}>
              <View style={styles.historyDot} />
              <View style={styles.historyInfo}>
                <ThemedText>{item.disease}</ThemedText>
                <ThemedText themeColor="textSecondary" type="small">
                  {new Date(item.timestamp).toLocaleDateString()}
                </ThemedText>
              </View>
              <ThemedText style={styles.confidence}>
                {confidencePercent(item.confidence)}%
              </ThemedText>
            </View>
          ))
        )}
      </SafeAreaView>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  loadingScreen: { flex: 1, alignItems: "center", justifyContent: "center" },
  keyboardArea: { flex: 1 },
  authScrollContent: {
    flexGrow: 1,
    justifyContent: "center",
    paddingVertical: 16,
  },
  safeArea: {
    flex: 1,
    width: "100%",
    maxWidth: MaxContentWidth,
    alignSelf: "center",
    paddingHorizontal: 24,
    paddingBottom: BottomTabInset + 16,
  },
  scrollContent: { flexGrow: 1 },
  authHeader: {
    alignItems: "center",
    paddingTop: 72,
    paddingBottom: 40,
    gap: 8,
  },
  logo: {
    width: 56,
    height: 56,
    borderRadius: 18,
    backgroundColor: "#1E6B52",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 8,
  },
  logoText: { color: "#F4D35E", fontSize: 22, fontWeight: "800" },
  authCard: {
    gap: 16,
    padding: 24,
    borderRadius: 24,
    backgroundColor: "#F0F0F3",
    width: "100%",
    alignSelf: "center",
    maxWidth: 480,
  },
  fieldLabel: { fontWeight: "700", marginBottom: -10 },
  passwordLabelRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: -10,
  },
  passwordInputWrap: { position: "relative", justifyContent: "center" },
  passwordInput: { paddingRight: 72 },
  passwordToggle: { position: "absolute", right: 16, paddingVertical: 8 },
  input: {
    height: 52,
    borderWidth: 1,
    borderRadius: 14,
    paddingHorizontal: 16,
    fontSize: 16,
    backgroundColor: "#fff",
  },
  primaryButton: {
    minHeight: 54,
    borderRadius: 15,
    backgroundColor: "#1E6B52",
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 20,
  },
  buttonText: { color: "#fff", fontWeight: "700", fontSize: 16 },
  switchButton: { alignItems: "center" },
  linkText: { color: "#1E6B52", fontWeight: "700" },
  error: { color: "#B42318", lineHeight: 20 },
  topBar: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingTop: 20,
    paddingBottom: 28,
  },
  hero: {
    backgroundColor: "#DCEFE4",
    borderRadius: 24,
    padding: 24,
    minHeight: 190,
    flexDirection: "row",
    overflow: "hidden",
  },
  heroCopy: { flex: 1, gap: 10, justifyContent: "center" },
  eyebrow: {
    color: "#1E6B52",
    fontSize: 11,
    fontWeight: "800",
    letterSpacing: 1.5,
  },
  heroTitle: {
    color: "#153E32",
    fontSize: 32,
    lineHeight: 36,
    fontWeight: "800",
  },
  leafMark: {
    color: "#1E6B52",
    fontSize: 100,
    position: "absolute",
    right: 18,
    bottom: -22,
    opacity: 0.3,
  },
  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingTop: 30,
    paddingBottom: 14,
  },
  uploadBox: {
    borderWidth: 1.5,
    borderStyle: "dashed",
    borderRadius: 20,
    minHeight: 210,
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    overflow: "hidden",
  },
  uploadIcon: {
    width: 48,
    height: 48,
    borderRadius: 16,
    backgroundColor: "#F4D35E",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 4,
  },
  plus: { color: "#153E32", fontSize: 28, lineHeight: 30 },
  uploadTitle: { fontWeight: "700", fontSize: 17 },
  preview: { width: "100%", height: 240 },
  changeButton: { alignItems: "center", paddingVertical: 12 },
  disabled: { opacity: 0.45 },
  resultCard: {
    marginTop: 20,
    padding: 20,
    borderRadius: 20,
    backgroundColor: "#FFF6D8",
    gap: 10,
  },
  resultLabel: {
    color: "#806E1A",
    fontSize: 11,
    fontWeight: "800",
    letterSpacing: 1.2,
  },
  confidenceRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: 4,
  },
  confidence: { color: "#1E6B52", fontWeight: "800" },
  progressTrack: {
    height: 8,
    borderRadius: 4,
    backgroundColor: "#E8DFAF",
    overflow: "hidden",
  },
  progress: { height: "100%", backgroundColor: "#1E6B52", borderRadius: 4 },
  videoSection: { marginTop: 24, gap: 12 },
  videoHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  videoCard: {
    flexDirection: "row",
    gap: 12,
    padding: 10,
    borderRadius: 16,
    backgroundColor: "#F0F0F3",
    alignItems: "center",
  },
  videoThumbnail: {
    width: 116,
    height: 70,
    borderRadius: 10,
    backgroundColor: "#D8D8D8",
  },
  videoPlaceholder: {
    width: 116,
    height: 70,
    borderRadius: 10,
    backgroundColor: "#DCEFE4",
    alignItems: "center",
    justifyContent: "center",
  },
  playIcon: { color: "#1E6B52", fontSize: 22 },
  videoInfo: { flex: 1, gap: 5 },
  videoTitle: { fontWeight: "700", lineHeight: 20 },
  youtubeSearchButton: {
    minHeight: 48,
    borderRadius: 14,
    backgroundColor: "#1E6B52",
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 16,
  },
  historyHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingTop: 34,
    paddingBottom: 12,
  },
  empty: { paddingVertical: 14 },
  historyRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 13,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: "#D8D8D8",
  },
  historyDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: "#F4D35E",
    marginRight: 12,
  },
  historyInfo: { flex: 1, gap: 3 },
});
