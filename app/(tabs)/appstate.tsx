import AsyncStorage from "@react-native-async-storage/async-storage";
import { useCallback, useEffect, useRef, useState } from "react";
import {
  AppState,
  AppStateStatus,
  Button,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";

export default function AppStateScreen() {
  const [text, setText] = useState("");
  const [result, setResult] = useState("No data fetched yet.");
  const [status, setStatus] = useState("Idle");
  const [appStateLabel, setAppStateLabel] = useState<AppStateStatus>(
    AppState.currentState
  );
  const [loaded, setLoaded] = useState(false);

  const appState = useRef(AppState.currentState);
  const pollingRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const loadData = useCallback(async () => {
    try {
      const savedText = await AsyncStorage.getItem("savedText");
      const savedResult = await AsyncStorage.getItem("savedResult");

      if (savedText !== null) {
        setText(savedText);
      }

      if (savedResult !== null) {
        setResult(savedResult);
      }
    } catch (e) {
      console.log("Error loading data:", e);
    } finally {
      setLoaded(true);
    }
  }, []);

  const fetchData = useCallback(async () => {
    setStatus("Fetching... " + new Date().toLocaleTimeString());

    try {
      const response = await fetch(
        "https://jsonplaceholder.typicode.com/todos/1"
      );

      const data = await response.json();

      setResult(data.title);
      setStatus("Finished " + new Date().toLocaleTimeString());
    } catch {
      setResult("Failed to fetch data.");
      setStatus("Failed " + new Date().toLocaleTimeString());
    }
  }, []);

  const startPolling = useCallback(() => {
    if (pollingRef.current) return;

    pollingRef.current = setInterval(() => {
      fetchData();
    }, 5000);
  }, [fetchData]);

  const stopPolling = useCallback(() => {
    if (pollingRef.current) {
      clearInterval(pollingRef.current);
      pollingRef.current = null;
    }
  }, []);

  const handleAppStateChange = useCallback(
    (nextAppState: AppStateStatus) => {
      if (
        appState.current === "active" &&
        (nextAppState === "background" || nextAppState === "inactive")
      ) {
        stopPolling();
        setStatus("Paused");
      }

      if (
        appState.current.match(/inactive|background/) &&
        nextAppState === "active"
      ) {
        loadData();
        startPolling();
        setStatus("Resumed");
      }

      appState.current = nextAppState;
      setAppStateLabel(nextAppState);
    },
    [loadData, startPolling, stopPolling]
  );

  // Load saved data and start polling
  useEffect(() => {
    loadData();
    startPolling();

    return () => {
      stopPolling();
    };
  }, [loadData, startPolling, stopPolling]);

  // Listen for app state changes (only once)
  useEffect(() => {
    const subscription = AppState.addEventListener(
      "change",
      handleAppStateChange
    );

    return () => subscription.remove();
  }, [handleAppStateChange]);

  // Save text whenever it changes (after the first load finishes)
  useEffect(() => {
    if (!loaded) return;
    AsyncStorage.setItem("savedText", text).catch(() => {});
  }, [text, loaded]);

  // Save fetched result whenever it changes (after the first load finishes)
  useEffect(() => {
    if (!loaded) return;
    AsyncStorage.setItem("savedResult", result).catch(() => {});
  }, [result, loaded]);

  return (
    <View style={styles.container}>
      <Text style={styles.title}>AppState Demo</Text>

      <TextInput
        style={styles.input}
        placeholder="Type something..."
        placeholderTextColor="gray"
        value={text}
        onChangeText={setText}
      />

      <Text style={styles.text}>You typed: {text}</Text>

      <View style={styles.button}>
        <Button title="Fetch Data" onPress={fetchData} />
      </View>

      <Text style={styles.text}>Fetched: {result}</Text>

      <Text style={styles.text}>Status: {status}</Text>

      <Text style={styles.text}>App State: {appStateLabel}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  title: {
    fontSize: 28,
    fontWeight: "bold",
    marginBottom: 20,
    color: "white",
  },
  input: {
    width: "80%",
    borderWidth: 1,
    borderColor: "gray",
    borderRadius: 5,
    padding: 10,
    marginBottom: 20,
    color: "white",
  },
  button: {
    marginVertical: 20,
    width: "60%",
  },
  text: {
    color: "white",
    marginBottom: 10,
    textAlign: "center",
  },
});