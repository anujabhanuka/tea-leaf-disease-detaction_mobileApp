import AsyncStorage from "@react-native-async-storage/async-storage";
import {
    createContext,
    PropsWithChildren,
    useContext,
    useEffect,
    useState,
} from "react";

export type ScanLocation = {
  id: string;
  latitude: number;
  longitude: number;
  disease: string;
  confidence: number;
  timestamp: string;
};

type ScanLocationContextValue = {
  locations: ScanLocation[];
  addLocation: (
    location: Omit<ScanLocation, "id" | "timestamp">,
  ) => Promise<void>;
  replaceLocations: (next: ScanLocation[]) => Promise<void>;
};

const STORAGE_KEY = "tealeaf-scan-locations";
const ScanLocationContext = createContext<ScanLocationContextValue | null>(
  null,
);

export function ScanLocationProvider({ children }: PropsWithChildren) {
  const [locations, setLocations] = useState<ScanLocation[]>([]);

  useEffect(() => {
    AsyncStorage.getItem(STORAGE_KEY).then((value) => {
      if (value) setLocations(JSON.parse(value));
    });
  }, []);

  async function addLocation(location: Omit<ScanLocation, "id" | "timestamp">) {
    const next = [
      { ...location, id: `${Date.now()}`, timestamp: new Date().toISOString() },
      ...locations,
    ];
    setLocations(next);
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  }

  async function replaceLocations(next: ScanLocation[]) {
    setLocations(next);
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  }

  return (
    <ScanLocationContext.Provider
      value={{ locations, addLocation, replaceLocations }}
    >
      {children}
    </ScanLocationContext.Provider>
  );
}

export function useScanLocations() {
  const context = useContext(ScanLocationContext);
  if (!context)
    throw new Error(
      "useScanLocations must be used inside ScanLocationProvider",
    );
  return context;
}
