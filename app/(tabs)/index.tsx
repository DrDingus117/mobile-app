import { Image } from 'expo-image';
import { Platform, StyleSheet } from 'react-native';

import { HelloWave } from '@/components/hello-wave';
import ParallaxScrollView from '@/components/parallax-scroll-view';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { useResponsive } from '@/hooks/use-responsive';
import { Link } from 'expo-router';

export default function HomeScreen() {
  const { isTablet, isLandscape } = useResponsive();

  return (
    <ParallaxScrollView
      headerBackgroundColor={{ light: '#A1CEDC', dark: '#1D3D47' }}
      headerImage={
        <Image
          source={require('@/assets/images/partial-react-logo.png')}
          style={styles.reactLogo}
        />
      }>

      <ThemedView
        style={[
          styles.titleContainer,
          isTablet && styles.tabletContainer,
          isLandscape && styles.landscapeContainer,
        ]}>
        <ThemedText
          type="title"
          accessibilityRole="header">
          Welcome!
        </ThemedText>
        <HelloWave />
      </ThemedView>

      <ThemedView
        style={[
          styles.stepContainer,
          isTablet && styles.tabletContainer,
          isLandscape && styles.landscapeContainer,
        ]}>
        <ThemedText type="subtitle">Step 1: Try it</ThemedText>

        <ThemedText>
          Edit{' '}
          <ThemedText type="defaultSemiBold">
            app/(tabs)/index.tsx
          </ThemedText>{' '}
          to see changes. Press{' '}
          <ThemedText type="defaultSemiBold">
            {Platform.select({
              ios: 'cmd + d',
              android: 'cmd + m',
              web: 'F12',
            })}
          </ThemedText>{' '}
          to open developer tools.
        </ThemedText>
      </ThemedView>

      <ThemedView
        style={[
          styles.stepContainer,
          isTablet && styles.tabletContainer,
          isLandscape && styles.landscapeContainer,
        ]}>

        <Link
          href="/modal"
          accessibilityRole="button"
          accessibilityLabel="Open the Explore information">

          <Link.Trigger>
            <ThemedText type="subtitle">Step 2: Explore</ThemedText>
          </Link.Trigger>

          <Link.Preview />

          <Link.Menu>
            <Link.MenuAction
              title="Action"
              icon="cube"
              onPress={() => alert('Action pressed')}
            />

            <Link.MenuAction
              title="Share"
              icon="square.and.arrow.up"
              onPress={() => alert('Share pressed')}
            />

            <Link.Menu
              title="More"
              icon="ellipsis">

              <Link.MenuAction
                title="Delete"
                icon="trash"
                destructive
                onPress={() => alert('Delete pressed')}
              />
            </Link.Menu>
          </Link.Menu>
        </Link>

        <ThemedText>
          Tap the Explore tab to learn more about what&apos;s included in this starter app.
        </ThemedText>
      </ThemedView>

      <ThemedView
        style={[
          styles.stepContainer,
          isTablet && styles.tabletContainer,
          isLandscape && styles.landscapeContainer,
        ]}>

        <ThemedText type="subtitle">Step 3: Get a fresh start</ThemedText>

        <ThemedText>
          When you&apos;re ready, run{' '}
          <ThemedText type="defaultSemiBold">
            npm run reset-project
          </ThemedText>{' '}
          to get a fresh{' '}
          <ThemedText type="defaultSemiBold">
            app
          </ThemedText>{' '}
          directory.
        </ThemedText>

      </ThemedView>

    </ParallaxScrollView>
  );
}

const styles = StyleSheet.create({
  titleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },

  stepContainer: {
    gap: 8,
    marginBottom: 12,
  },

  tabletContainer: {
    maxWidth: 700,
    alignSelf: 'center',
    width: '100%',
  },

  landscapeContainer: {
    paddingHorizontal: 24,
  },

  reactLogo: {
    height: 178,
    width: 290,
    bottom: 0,
    left: 0,
    position: 'absolute',
  },
});