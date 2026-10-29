import * as Location from "expo-location";
import * as TaskManager from "expo-task-manager";
import { Button, StyleSheet, View } from "react-native";

const LOCATION_TASK_NAME = "background-location-task";

const requestPermissions = async () => {
  const { status: foregroundStatus } =
    await Location.requestForegroundPermissionsAsync();

  console.log("foregroundStatus", foregroundStatus);
  if (foregroundStatus === "granted") {
    const { status: backgroundStatus } =
      await Location.requestBackgroundPermissionsAsync();
    console.log("backgroundStatus", backgroundStatus);

    if (backgroundStatus === "granted") {
      await Location.startLocationUpdatesAsync(LOCATION_TASK_NAME, {
        accuracy: Location.Accuracy.Balanced,
      });
    }
  }
};

const PermissionsButton = () => (
  <View style={styles.container}>
    <Button onPress={requestPermissions} title="Enable background location" />
  </View>
);

TaskManager.defineTask(LOCATION_TASK_NAME, async ({ data, error }) => {
  if (error) {
    // Error occurred - check `error.message` for more details.
    return;
  }
  if (data) {
    const { locations } = data as { locations: Location.LocationObject[] };
    // do something with the locations captured in the background
    console.log(locations);
  }
});

const styles = StyleSheet.create({
  container: {
    // REMOVED: flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
});

export default PermissionsButton;