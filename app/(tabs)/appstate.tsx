import AsyncStorage from "@react-native-async-storage/async-storage";
import React, { useEffect, useRef, useState } from "react";
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

  const appState = useRef(AppState.currentState);

  // Load saved data when the screen opens
  useEffect(() => {
    loadData();
  }, []);

  // Save text whenever it changes
  useEffect(() => {
    AsyncStorage.setItem("savedText", text);
  }, [text]);

  // Save fetched result whenever it changes
  useEffect(() => {
    AsyncStorage.setItem("savedResult", result);
  }, [result]);

  // Listen for app state changes
  useEffect(() => {
    const subscription = AppState.addEventListener(
      "change",
      handleAppStateChange
    );

    return () => subscription.remove();
  }, []);

  const handleAppStateChange = async (nextAppState: AppStateStatus) => {
    if (
      appState.current === "active" &&
      (nextAppState === "background" || nextAppState === "inactive")
    ) {
      setStatus("Paused");
    }

    if (
      appState.current.match(/inactive|background/) &&
      nextAppState === "active"
    ) {
      await loadData();
      setStatus("Resumed");
    }

    appState.current = nextAppState;
  };

  const loadData = async () => {
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
    }
  };

  const fetchData = async () => {
    setStatus("Fetching...");

    try {
      const response = await fetch(
        "https://jsonplaceholder.typicode.com/todos/1"
      );

      const data = await response.json();

      setResult(data.title);

      // Save immediately
      await AsyncStorage.setItem("savedText", text);
      await AsyncStorage.setItem("savedResult", data.title);

      setStatus("Finished");
    } catch (error) {
      setResult("Failed to fetch data.");
      setStatus("Failed");
    }
  };

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

      <Text style={styles.text}>App State: {appState.current}</Text>
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