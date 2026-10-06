import * as Location from 'expo-location';
import * as TaskManager from 'expo-task-manager';
import { Button, StyleSheet, View } from 'react-native';

const LOCATION_TASK_NAME = 'background-location-task';

const requestPermissions = async () => {
  const { status: foregroundStatus } = await Location.requestForegroundPermissionsAsync();
 if (foregroundStatus === 'granted') {
  console.log('Foreground location permission granted');
    const { status: backgroundStatus } = await Location.requestBackgroundPermissionsAsync();
    if (backgroundStatus === 'granted') {
      console.log('Background location permission granted');
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
    const { locations } = data as { locations?: Location.LocationObject[] };

    if (locations?.length) {
      // do something with the locations captured in the background
      console.log('Background location update', locations);
    }
  }
});

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
});

export default PermissionsButton;