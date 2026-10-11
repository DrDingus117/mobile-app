import * as Location from 'expo-location';
import * as TaskManager from 'expo-task-manager';
import { Button, Platform, StyleSheet, View } from 'react-native';

const LOCATION_TASK_NAME = 'background-location-task';

TaskManager.defineTask(LOCATION_TASK_NAME, async ({ data, error }) => {
  if (error) {
    console.warn('Background location error:', error.message);
    return;
  }

  const { locations } = (data ?? {}) as { locations?: Location.LocationObject[] };
  if (locations?.length) {
    // do something with the locations captured in the background
    console.log('Background location update', locations);
  }
});

const requestPermissions = async () => {
  const { status: foregroundStatus } = await Location.requestForegroundPermissionsAsync();
  if (foregroundStatus !== 'granted') {
    return;
  }
  console.log('Foreground location permission granted');

  if (Platform.OS === 'web') {
    console.log('Background location is not supported on web');
    return;
  }

  const { status: backgroundStatus } = await Location.requestBackgroundPermissionsAsync();
  if (backgroundStatus !== 'granted') {
    return;
  }
  console.log('Background location permission granted');

  await Location.startLocationUpdatesAsync(LOCATION_TASK_NAME, {
    accuracy: Location.Accuracy.Balanced,
  });
};

const PermissionsButton = () => (
  <View style={styles.container}>
    <Button onPress={requestPermissions} title={`Enable background location (${Platform.OS})`} />
  </View>
);

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
});

export default PermissionsButton;