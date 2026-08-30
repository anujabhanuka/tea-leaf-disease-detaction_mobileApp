import { Redirect } from "expo-router";
import { useEffect } from "react";

import { useAuth } from "@/context/auth";

export default function LogoutScreen() {
  const { setToken } = useAuth();
  useEffect(() => setToken(null), [setToken]);
  return <Redirect href="/" />;
}
