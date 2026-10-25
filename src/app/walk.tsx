import PermissionsButton from "@/components/permissions-button";
import Constants from "expo-constants";
import * as Location from "expo-location";
import * as Notifications from "expo-notifications";
import { useEffect, useRef, useState } from "react"; // CHANGED: added useRef
import { Button, Platform, StyleSheet, Text, View } from "react-native"; // CHANGED: added Button

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldPlaySound: false,
    shouldSetBadge: false,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

async function registerForPushNotificationsAsync() {
  let token;

  if (Platform.OS === "android") {
    await Notifications.setNotificationChannelAsync("myNotificationChannel", {
      name: "A channel is needed for the permissions prompt to appear",
      importance: Notifications.AndroidImportance.MAX,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: "#FF231F7C",
    });
  }

  const { status: existingStatus } = await Notifications.getPermissionsAsync();
  let finalStatus = existingStatus;
  if (existingStatus !== "granted") {
    const { status } = await Notifications.requestPermissionsAsync();
    finalStatus = status;
  }
  if (finalStatus !== "granted") {
    alert("Failed to get push token for push notification!");
    return;
  }
  // Learn more about projectId:
  // https://docs.expo.dev/push-notifications/push-notifications-setup/#configure-projectid
  // EAS projectId is used here.
  try {
    const projectId =
      Constants?.expoConfig?.extra?.eas?.projectId ??
      Constants?.easConfig?.projectId;
    if (!projectId) {
      throw new Error("Project ID not found");
    }
    token = (
      await Notifications.getExpoPushTokenAsync({
        projectId,
      })
    ).data;
    console.log(token);
  } catch (e) {
    token = `${e}`;
  }

  return token;
}

const GOAL_SECONDS = 60; // ADDED

export default function WalkScreen() {
  const [location, setLocation] = useState<Location.LocationObject | null>(
    null,
  );
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [expoPushToken, setExpoPushToken] = useState("");
  const [channels, setChannels] = useState<Notifications.NotificationChannel[]>(
    [],
  );
  const [notification, setNotification] = useState<
    Notifications.Notification | undefined
  >(undefined);

  const [seconds, setSeconds] = useState(0); // ADDED
  const [walkActive, setWalkActive] = useState(false); // ADDED
  const [paused, setPaused] = useState(false); // ADDED
  const [status, setStatus] = useState(""); // ADDED
  const [permissionGranted, setPermissionGranted] = useState(false); // ADDED
  const pauseReminderId = useRef<string | null>(null); // ADDED
  const goalSent = useRef(false); // ADDED
  const pausedRef = useRef(false); // ADDED: tracks "currently paused" so a quick Resume/Stop is noticed

  useEffect(() => {
    async function getCurrentLocation() {
      let { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== "granted") {
        setErrorMsg("Permission to access location was denied");
        return;
      }

      let location = await Location.getCurrentPositionAsync({});
      console.log(location);
      const { latitude, longitude } = location.coords;
      console.log(latitude, longitude);
      setLocation(location);
    }

    async function setupNotification() {
      await registerForPushNotificationsAsync().then( // CHANGED: added await
        (token) => token && setExpoPushToken(token),
      );

      // ADDED: save the permission result and show a status message
      const { status: permStatus } = await Notifications.getPermissionsAsync();
      if (permStatus === "granted") {
        setPermissionGranted(true);
        setStatus("Notifications are enabled.");
      } else {
        setPermissionGranted(false);
        setStatus("Notifications are disabled. Reminders will not appear.");
      }

      if (Platform.OS === "android") {
        Notifications.getNotificationChannelsAsync().then((value) =>
          setChannels(value ?? []),
        );
      }
      const notificationListener =
        Notifications.addNotificationReceivedListener((notification) => {
          setNotification(notification);
        });

      const responseListener =
        Notifications.addNotificationResponseReceivedListener((response) => {
          console.log(response);
        });

      return () => {
        notificationListener.remove();
        responseListener.remove();
      };
    }

    getCurrentLocation();
    setupNotification();
  }, []);

  // ADDED: timer, counts up only while a walk is active and not paused
  useEffect(() => {
    if (!walkActive || paused) return;
    const id = setInterval(() => setSeconds((s) => s + 1), 1000);
    return () => clearInterval(id);
  }, [walkActive, paused]);

  // ADDED: sends the goal notification once when progress reaches 60
  useEffect(() => {
    if (walkActive && !paused && seconds >= GOAL_SECONDS && !goalSent.current) {
      goalSent.current = true;
      setStatus("Walking goal reached!");
      if (permissionGranted) {
        Notifications.scheduleNotificationAsync({
          content: {
            title: "Goal Reached",
            body: "Great job! You completed your walking goal.",
          },
          trigger: null,
        });
      }
    }
  }, [seconds, walkActive, paused, permissionGranted]);

  // ADDED: walk functions
  const startWalk = () => {
    setSeconds(0);
    goalSent.current = false;
    pausedRef.current = false;
    setPaused(false);
    setWalkActive(true);
  };

  const cancelPauseReminder = async () => {
    if (!pauseReminderId.current) return;
    await Notifications.cancelScheduledNotificationAsync(pauseReminderId.current);
    await Notifications.cancelAllScheduledNotificationsAsync(); // backup in case the single cancel is ignored
    pauseReminderId.current = null;
    setStatus("Pause reminder canceled.");
  };

  const pauseWalk = async () => {
    setPaused(true);
    pausedRef.current = true;
    if (!permissionGranted) return;
    const id = await Notifications.scheduleNotificationAsync({
      content: {
        title: "Walk Paused",
        body: "Your walk is still paused. Open the app when you are ready to continue.",
      },
      trigger: {
        type: Notifications.SchedulableTriggerInputTypes.TIME_INTERVAL,
        seconds: 10,
      },
    });
    // if the user resumed or stopped while scheduling was still finishing,
    // cancel the reminder right away instead of saving it
    if (!pausedRef.current) {
      await Notifications.cancelScheduledNotificationAsync(id);
      setStatus("Pause reminder canceled.");
      return;
    }
    pauseReminderId.current = id;
    setStatus("Pause reminder scheduled.");
  };

  const resumeWalk = async () => {
    setPaused(false);
    pausedRef.current = false;
    await cancelPauseReminder();
  };

  const stopWalk = async () => {
    setWalkActive(false);
    setPaused(false);
    pausedRef.current = false;
    await cancelPauseReminder();
  };

  let text = "Waiting...";
  if (errorMsg) {
    text = errorMsg;
  } else if (location) {
    const { latitude, longitude } = location?.coords ?? {
      latitude: "N/A",
      longitude: "N/A",
    };

    text = `Latitude: ${latitude}, Longitude: ${longitude}`;
  }

  return (
    <View style={styles.container}>
      <PermissionsButton title="Start Walk" />
      <Text style={styles.paragraph}>{text}</Text>
      {/* ADDED: required goal, progress, and status lines */}
      <Text>Goal: {GOAL_SECONDS} seconds</Text>
      <Text>Progress: {seconds} seconds</Text>
      <Text>{status}</Text>
      {/* ADDED: walk controls, remove if your existing buttons call these functions */}
      <View style={{ flexDirection: "row" }}>
        {!walkActive && <Button title="Start" onPress={startWalk} />}
        {walkActive && !paused && <Button title="Pause" onPress={pauseWalk} />}
        {walkActive && paused && <Button title="Resume" onPress={resumeWalk} />}
        {walkActive && <Button title="Stop" onPress={stopWalk} />}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  paragraph: {
    fontSize: 18,
    textAlign: "center",
    alignItems: "center",
    justifyContent: "center",
    flex: 1,
    marginTop: 20,
  },
});