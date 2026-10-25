import { ThemedText } from "@/components/themed-text";
import { ThemedView } from "@/components/themed-view";
import { useEffect, useRef, useState } from "react";
import {
  AppState,
  AppStateStatus,
  Button,
  StyleSheet,
  View,
} from "react-native";

// Mock API that resolves after a short delay
function mockFetch(): Promise<{
  userId: number;
  id: number;
  title: string;
  completed: boolean;
}> {
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve({
        userId: 1,
        id: 1,
        title: "delectus aut autem",
        completed: false,
      });
    }, 1000);
  });
}

export default function DemoScreen() {
  const [fetchCount, setFetchCount] = useState(0);
  const [lastTodo, setLastTodo] = useState<{
    userId: number;
    id: number;
    title: string;
    completed: boolean;
  } | null>(null);
  const [status, setStatus] = useState<"idle" | "polling" | "paused">("idle");
  const [lastFetch, setLastFetch] = useState<string | null>(null);

  const isPolling = useRef(false);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const appState = useRef<AppStateStatus>(AppState.currentState);

  const stopPolling = () => {
    isPolling.current = false;
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
  };

  const poll = async () => {
    if (!isPolling.current) return;
    try {
      const data = await mockFetch();
      if (!isPolling.current) return; // guard against state update after stop
      setLastTodo(data);
      setFetchCount((prev) => prev + 1);
      setLastFetch(new Date().toLocaleTimeString());
    } catch {
      // ignore errors in mock
    }
    if (isPolling.current) {
      timeoutRef.current = setTimeout(poll, 2000);
    }
  };

  const startPolling = () => {
    if (isPolling.current) return;
    isPolling.current = true;
    setStatus("polling");
    poll();
  };

  const handleStop = () => {
    stopPolling();
    setStatus("idle");
  };

  // AppState listener: pause/resume polling when app goes background/foreground
  useEffect(() => {
    const subscription = AppState.addEventListener(
      "change",
      (nextState: AppStateStatus) => {
        const prev = appState.current;
        appState.current = nextState;

        if (nextState === "background" || nextState === "inactive") {
          if (isPolling.current) {
            stopPolling();
            isPolling.current = false; // keep flag false so resume knows to restart
            setStatus("paused");
          }
        } else if (nextState === "active") {
          if (prev === "background" || prev === "inactive") {
            // Only resume if we were previously polling (paused)
            setStatus((s) => {
              if (s === "paused") {
                isPolling.current = true;
                poll();
                return "polling";
              }
              return s;
            });
          }
        }
      },
    );

    return () => {
      subscription.remove();
      stopPolling();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <ThemedView style={styles.container}>
      <ThemedText type="title">AppState Demo</ThemedText>

      {/* Counter */}
      <View style={styles.card}>
        <ThemedText type="subtitle">Fetch Count</ThemedText>
        <ThemedText style={styles.counterValue}>{fetchCount}</ThemedText>
        {lastFetch && (
          <ThemedText style={styles.meta}>Last update: {lastFetch}</ThemedText>
        )}
      </View>

      {/* Last fetched todo */}
      {lastTodo && (
        <View style={styles.card}>
          <ThemedText type="subtitle">Last Todo</ThemedText>
          <ThemedText style={styles.meta}>
            ID: {lastTodo.id} · User: {lastTodo.userId}
          </ThemedText>
          <ThemedText>{lastTodo.title}</ThemedText>
          <ThemedText style={styles.meta}>
            {lastTodo.completed ? "✓ Completed" : "○ Not completed"}
          </ThemedText>
        </View>
      )}

      {/* Status badge */}
      <View style={[styles.badge, styles[`badge_${status}`]]}>
        <ThemedText style={styles.badgeText}>
          {status === "idle" && "Idle — not polling"}
          {status === "polling" && "Polling mock API…"}
          {status === "paused" && "Paused (app backgrounded)"}
        </ThemedText>
      </View>

      {/* Controls */}
      <View style={styles.buttons}>
        <Button
          title="Start Polling"
          onPress={startPolling}
          disabled={status === "polling"}
        />
        <Button
          title="Stop"
          onPress={handleStop}
          disabled={status === "idle"}
          color="#c0392b"
        />
        <Button
          title="Reset"
          onPress={() => {
            setFetchCount(0);
            setLastTodo(null);
          }}
          color="#7f8c8d"
        />
      </View>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 24,
    gap: 20,
    justifyContent: "center",
  },
  card: {
    alignItems: "center",
    gap: 4,
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#e0e0e0",
  },
  counterValue: {
    fontSize: 64,
    fontWeight: "bold",
    lineHeight: 72,
  },
  meta: {
    fontSize: 12,
    opacity: 0.6,
  },
  badge: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 20,
    alignSelf: "center",
  },
  badge_idle: { backgroundColor: "#bdc3c7" },
  badge_polling: { backgroundColor: "#27ae60" },
  badge_paused: { backgroundColor: "#e67e22" },
  badgeText: {
    color: "#fff",
    fontWeight: "600",
    fontSize: 13,
  },
  buttons: {
    gap: 12,
  },
});
