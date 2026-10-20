import Constants from 'expo-constants';
import * as Location from 'expo-location';
import * as Notifications from 'expo-notifications';
import * as SQLite from 'expo-sqlite';
import * as TaskManager from 'expo-task-manager';
import { useCallback, useEffect, useState } from 'react';
import { Button, FlatList, Platform, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';


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

  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync('myNotificationChannel', {
      name: 'A channel is needed for the permissions prompt to appear',
      importance: Notifications.AndroidImportance.MAX,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: '#FF231F7C',
    });
  }

  const { status: existingStatus } = await Notifications.getPermissionsAsync();
  let finalStatus = existingStatus;
  if (existingStatus !== 'granted') {
    const { status } = await Notifications.requestPermissionsAsync();
    finalStatus = status;
  }
  if (finalStatus !== 'granted') {
    alert('Failed to get push token for push notification!');
    return;
  }
  // Learn more about projectId:
  // https://docs.expo.dev/push-notifications/push-notifications-setup/#configure-projectid
  // EAS projectId is used here.
  try {
    const projectId =
      Constants?.expoConfig?.extra?.eas?.projectId ?? Constants?.easConfig?.projectId;
    if (!projectId) {
      throw new Error('Project ID not found');
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

const TASK_NAME = 'walk-location-task';
const OLD_TASK_NAME = 'background-location-task';
const isWeb = Platform.OS === 'web';
type WalkState = 'idle' | 'tracking' | 'paused';
type WalkRecord = { id: number; latitude: number; longitude: number; timestamp: number };

// ---------- Local storage (SQLite, saved on the device) ----------
let dbPromise: Promise<SQLite.SQLiteDatabase> | null = null;
function getDb() {
  if (!dbPromise) {
    dbPromise = (async () => {
      const db = await SQLite.openDatabaseAsync('walk.db');
      await db.execAsync(`
        CREATE TABLE IF NOT EXISTS records (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          latitude REAL NOT NULL,
          longitude REAL NOT NULL,
          timestamp INTEGER NOT NULL
        );
        CREATE TABLE IF NOT EXISTS kv (key TEXT PRIMARY KEY, value TEXT NOT NULL);
      `);
      return db;
    })();
  }
  return dbPromise;
}

async function getStoredState(): Promise<WalkState> {
  const db = await getDb();
  const row = await db.getFirstAsync<{ value: string }>(
    "SELECT value FROM kv WHERE key = 'walkState'"
  );
  return (row?.value as WalkState) ?? 'idle';
}

async function setStoredState(state: WalkState) {
  const db = await getDb();
  await db.runAsync(
    "INSERT INTO kv (key, value) VALUES ('walkState', ?) ON CONFLICT(key) DO UPDATE SET value = excluded.value",
    state
  );
}

async function loadRecords(): Promise<WalkRecord[]> {
  const db = await getDb();
  return db.getAllAsync<WalkRecord>('SELECT * FROM records ORDER BY id DESC');
}

// ---------- Background task (runs even when the app is minimized) ----------
if (!isWeb) {
  TaskManager.defineTask(TASK_NAME, async ({ data, error }) => {
    if (error) return;
    const { locations } = (data ?? {}) as { locations?: Location.LocationObject[] };
    if (!locations?.length) return;
    // Never record unless a walk is actively being tracked.
    if ((await getStoredState()) !== 'tracking') return;
    const db = await getDb();
    for (const loc of locations) {
      await db.runAsync(
        'INSERT INTO records (latitude, longitude, timestamp) VALUES (?, ?, ?)',
        loc.coords.latitude,
        loc.coords.longitude,
        loc.timestamp
      );
    }
  });
}

async function startUpdates() {
  await Location.startLocationUpdatesAsync(TASK_NAME, {
    accuracy: Location.Accuracy.Balanced,
    distanceInterval: 5,
    timeInterval: 5000,
    pausesUpdatesAutomatically: false,
    showsBackgroundLocationIndicator: true,
    foregroundService: {
      notificationTitle: 'Walk in progress',
      notificationBody: 'Recording your location. Open the app to pause or stop.',
    },
  });
}

async function stopUpdates() {
  const running = await Location.hasStartedLocationUpdatesAsync(TASK_NAME).catch(() => false);
  if (running) await Location.stopLocationUpdatesAsync(TASK_NAME);
}

// ---------- Screen ----------
const DENIED_MSG =
  'Location access is required to use the tracking features. Please allow location access in your device settings.';
const BG_DENIED_MSG =
  'Background ("Allow all the time") location access is required to keep tracking while the app is minimized. ' +
  DENIED_MSG;
const WEB_MSG = 'Walk tracking runs on the phone app. On web you can only use Get Location.';

export default function WalkScreen() {
  const [status, setStatus] = useState<WalkState>('idle');
  const [coords, setCoords] = useState<{ latitude: number; longitude: number } | null>(null);
  const [records, setRecords] = useState<WalkRecord[]>([]);
  const [message, setMessage] = useState('');
  const [expoPushToken, setExpoPushToken] = useState('');
  const [channels, setChannels] = useState<Notifications.NotificationChannel[]>([]);
  const [notification, setNotification] = useState<Notifications.Notification | undefined>(undefined);
  

  const refresh = useCallback(async () => {
    if (isWeb) return;
    try {
      let s = await getStoredState();
      if (s === 'tracking') {
        const running = await Location.hasStartedLocationUpdatesAsync(TASK_NAME).catch(() => false);
        if (!running) s = 'idle';
      }
      const r = await loadRecords();
      setStatus(s);
      setRecords(r);
      if (s === 'tracking' && r.length) {
        setCoords({ latitude: r[0].latitude, longitude: r[0].longitude });
      }
    } catch (e) {
      setMessage(`Storage error: ${String(e)}`);
    }
  }, []);

  useEffect(() => {
    const initialRefresh = setTimeout(() => {
      void refresh();
    }, 0);
    const id = setInterval(refresh, 2000);
    return () => {
      clearTimeout(initialRefresh);
      clearInterval(id);
    };
  }, [refresh]);

  useEffect(() => {
    async function setupNotifications() {
      registerForPushNotificationsAsync().then(token => token && setExpoPushToken(token));

        if (Platform.OS === 'android') {
          Notifications.getNotificationChannelsAsync().then(value => setChannels(value ?? []));
        }
        const notificationListener = Notifications.addNotificationReceivedListener(notification => {
          setNotification(notification);
        });

        const responseListener = Notifications.addNotificationResponseReceivedListener(response => {
          console.log(response);
        });

        return () => {
          notificationListener.remove();
          responseListener.remove();
        };
    }

    // calling the async function to setup notifications
    setupNotifications();
  }, []);
  const onGetLocation = async () => {
    const fg = await Location.requestForegroundPermissionsAsync();
    if (fg.status !== 'granted') {
      setMessage(DENIED_MSG);
      return;
    }
    const pos = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
    setMessage('');
    setCoords({ latitude: pos.coords.latitude, longitude: pos.coords.longitude });
  };

  const onStart = async () => {
    if (isWeb) return setMessage(WEB_MSG);
    const fg = await Location.requestForegroundPermissionsAsync();
    if (fg.status !== 'granted') return setMessage(DENIED_MSG);
    const bg = await Location.requestBackgroundPermissionsAsync();
    if (bg.status !== 'granted') return setMessage(BG_DENIED_MSG);

    // Stop the old test task from the permissions button, if it is still registered.
    const old = await Location.hasStartedLocationUpdatesAsync(OLD_TASK_NAME).catch(() => false);
    if (old) await Location.stopLocationUpdatesAsync(OLD_TASK_NAME);

    setMessage('');
    await setStoredState('tracking');
    await startUpdates();
    refresh();
  };

  const onPause = async () => {
    await setStoredState('paused'); // set first so late updates are ignored
    await stopUpdates();
    refresh();
  };

  const onResume = async () => {
    await setStoredState('tracking');
    await startUpdates();
    refresh();
  };

  const onStop = async () => {
    await setStoredState('idle');
    await stopUpdates();
    refresh();
  };

  const onClear = async () => {
    const db = await getDb();
    await db.runAsync('DELETE FROM records');
    refresh();
  };

  const header = (
    <View>
      <Text style={styles.title}>Walk Tracker</Text>

      <View style={styles.privacy}>
        <Text style={styles.privacyTitle}>Privacy notice</Text>
        <Text style={styles.privacyText}>
          • This app collects latitude, longitude, date and time.{'\n'}
          • Location is collected only while a walk is being tracked.{'\n'}
          • Records are stored locally on your device.{'\n'}
          • You can pause or stop tracking at any time.
        </Text>
      </View>

      <Text style={styles.status}>Status: {status.toUpperCase()}</Text>
      <Text style={styles.text}>Latitude: {coords ? coords.latitude.toFixed(6) : '—'}</Text>
      <Text style={styles.text}>Longitude: {coords ? coords.longitude.toFixed(6) : '—'}</Text>
      {message !== '' && <Text style={styles.error}>{message}</Text>}

      <View style={styles.row}>
        <Button title="Get Location" onPress={onGetLocation} />
        <Button title="Start Walk" onPress={onStart} disabled={status !== 'idle'} />
      </View>
      <View style={styles.row}>
        <Button title="Pause" onPress={onPause} disabled={status !== 'tracking'} />
        <Button title="Resume" onPress={onResume} disabled={status !== 'paused'} />
        <Button title="Stop Walk" color="#c0392b" onPress={onStop} disabled={status === 'idle'} />
      </View>

      <View style={styles.row}>
        <Text style={styles.subtitle}>Saved records ({records.length})</Text>
        <Button title="Clear" onPress={onClear} disabled={records.length === 0} />
      </View>
    </View>
  );

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <FlatList
        data={records}
        keyExtractor={(r) => String(r.id)}
        ListHeaderComponent={header}
        ListEmptyComponent={<Text style={styles.text}>No records yet.</Text>}
        renderItem={({ item }) => (
          <Text style={styles.record}>
            {new Date(item.timestamp).toLocaleString()} — {item.latitude.toFixed(5)},{' '}
            {item.longitude.toFixed(5)}
          </Text>
        )}
        contentContainerStyle={styles.content}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#ffffff' },
  content: { padding: 16 },
  title: { fontSize: 24, fontWeight: '700', color: '#111', marginBottom: 8 },
  privacy: { backgroundColor: '#eef4ff', padding: 10, borderRadius: 8, marginBottom: 12 },
  privacyTitle: { fontWeight: '700', color: '#111', marginBottom: 4 },
  privacyText: { fontSize: 13, color: '#222', lineHeight: 19 },
  status: { fontWeight: '600', color: '#111', marginBottom: 4 },
  text: { color: '#111' },
  error: { color: '#c0392b', marginVertical: 8 },
  row: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginVertical: 8 },
  subtitle: { fontSize: 16, fontWeight: '600', color: '#111' },
  record: { fontSize: 12, color: '#111', paddingVertical: 2 },
});