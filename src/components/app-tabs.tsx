import { NativeTabs } from "expo-router/unstable-native-tabs";
import { useColorScheme } from "react-native";

import { Colors } from "@/constants/theme";
import { useAuth } from "@/context/auth";

export default function AppTabs() {
  const scheme = useColorScheme();
  const colors = Colors[scheme === "unspecified" ? "light" : scheme];
  const { token } = useAuth();

  return (
    <NativeTabs
      backgroundColor={colors.background}
      indicatorColor={colors.backgroundElement}
      labelStyle={{ selected: { color: colors.text } }}
    >
      <NativeTabs.Trigger name="index">
        <NativeTabs.Trigger.Label>Home</NativeTabs.Trigger.Label>
        <NativeTabs.Trigger.Icon
          src={require("@/assets/images/tabIcons/home.png")}
          renderingMode="template"
        />
      </NativeTabs.Trigger>

      {token && (
        <NativeTabs.Trigger name="varieties">
          <NativeTabs.Trigger.Label>Varieties</NativeTabs.Trigger.Label>
          <NativeTabs.Trigger.Icon
            src={require("@/assets/images/tabIcons/explore.png")}
            renderingMode="template"
          />
        </NativeTabs.Trigger>
      )}

      {token && (
        <NativeTabs.Trigger name="export-report">
          <NativeTabs.Trigger.Label>Export report</NativeTabs.Trigger.Label>
          <NativeTabs.Trigger.Icon
            src={require("@/assets/images/tabIcons/explore.png")}
            renderingMode="template"
          />
        </NativeTabs.Trigger>
      )}

      {token && (
        <NativeTabs.Trigger name="contact">
          <NativeTabs.Trigger.Label>Contact</NativeTabs.Trigger.Label>
          <NativeTabs.Trigger.Icon
            src={require("@/assets/images/tabIcons/explore.png")}
            renderingMode="template"
          />
        </NativeTabs.Trigger>
      )}
    </NativeTabs>
  );
}
