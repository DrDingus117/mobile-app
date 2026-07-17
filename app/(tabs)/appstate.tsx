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

  const appState = useRef(AppState.currentState);

  // Load saved text when the screen opens
  useEffect(() => {
    loadText();
  }, []);

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
      await AsyncStorage.setItem("savedText", text);
    }

    if (
      appState.current.match(/inactive|background/) &&
      nextAppState === "active"
    ) {
      loadText();
    }

    appState.current = nextAppState;
  };

  const loadText = async () => {
    const savedText = await AsyncStorage.getItem("savedText");

    if (savedText !== null) {
      setText(savedText);
    }
  };

  const fetchData = async () => {
    try {
      const response = await fetch(
        "https://jsonplaceholder.typicode.com/todos/1"
      );
      const data = await response.json();
      setResult(data.title);
    } catch (error) {
      setResult("Failed to fetch data.");
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