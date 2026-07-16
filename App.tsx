import { StatusBar } from 'expo-status-bar';
import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  Animated,
  Easing,
  Pressable,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';

type Recipe = {
  id: string;
  title: string;
  subtitle: string;
  time: number;
  accent: string;
  glow: string;
  temperature: string;
};

const RECIPES: Recipe[] = [
  {
    id: 'eggs',
    title: 'Soft Eggs',
    subtitle: 'Jammy centers, silky finish',
    time: 390,
    accent: '#ff8f52',
    glow: '#ffd4b5',
    temperature: '6:30 simmer',
  },
  {
    id: 'salmon',
    title: 'Salmon Fillet',
    subtitle: 'Tender middle, crisp edges',
    time: 480,
    accent: '#ff6b6b',
    glow: '#ffc8bb',
    temperature: '8:00 pan roast',
  },
  {
    id: 'pasta',
    title: 'Fresh Pasta',
    subtitle: 'Al dente with bounce',
    time: 180,
    accent: '#f4b73f',
    glow: '#ffe9a8',
    temperature: '3:00 boil',
  },
  {
    id: 'cookies',
    title: 'Cookies',
    subtitle: 'Chewy center, golden rim',
    time: 720,
    accent: '#8f5d45',
    glow: '#d6b9a8',
    temperature: '12:00 bake',
  },
];

const formatTime = (totalSeconds: number) => {
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
};

const clamp = (value: number, min: number, max: number) => Math.min(Math.max(value, min), max);

export default function App() {
  const [selectedRecipe, setSelectedRecipe] = useState<Recipe>(RECIPES[0]);
  const [remainingSeconds, setRemainingSeconds] = useState<number>(RECIPES[0].time);
  const [isRunning, setIsRunning] = useState(false);

  const progressAnim = useRef(new Animated.Value(1)).current;
  const pulseAnim = useRef(new Animated.Value(0)).current;
  const shimmerAnim = useRef(new Animated.Value(0)).current;
  const steamOne = useRef(new Animated.Value(0)).current;
  const steamTwo = useRef(new Animated.Value(0)).current;
  const steamThree = useRef(new Animated.Value(0)).current;

  const progress = useMemo(() => {
    return clamp(remainingSeconds / selectedRecipe.time, 0, 1);
  }, [remainingSeconds, selectedRecipe.time]);

  useEffect(() => {
    Animated.timing(progressAnim, {
      toValue: progress,
      duration: 350,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: false,
    }).start();
  }, [progress, progressAnim]);

  useEffect(() => {
    if (!isRunning) {
      pulseAnim.stopAnimation();
      shimmerAnim.stopAnimation();
      steamOne.stopAnimation();
      steamTwo.stopAnimation();
      steamThree.stopAnimation();
      pulseAnim.setValue(0);
      shimmerAnim.setValue(0);
      steamOne.setValue(0);
      steamTwo.setValue(0);
      steamThree.setValue(0);
      return;
    }

    const pulseLoop = Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 1100,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 0,
          duration: 1100,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
      ])
    );

    const shimmerLoop = Animated.loop(
      Animated.timing(shimmerAnim, {
        toValue: 1,
        duration: 2400,
        easing: Easing.linear,
        useNativeDriver: true,
      })
    );

    const createSteamLoop = (value: Animated.Value, duration: number, delay: number) =>
      Animated.loop(
        Animated.sequence([
          Animated.delay(delay),
          Animated.timing(value, {
            toValue: 1,
            duration,
            easing: Easing.out(Easing.quad),
            useNativeDriver: true,
          }),
          Animated.timing(value, {
            toValue: 0,
            duration: 0,
            useNativeDriver: true,
          }),
        ])
      );

    const steamOneLoop = createSteamLoop(steamOne, 2400, 0);
    const steamTwoLoop = createSteamLoop(steamTwo, 2000, 550);
    const steamThreeLoop = createSteamLoop(steamThree, 2600, 900);

    pulseLoop.start();
    shimmerLoop.start();
    steamOneLoop.start();
    steamTwoLoop.start();
    steamThreeLoop.start();

    return () => {
      pulseLoop.stop();
      shimmerLoop.stop();
      steamOneLoop.stop();
      steamTwoLoop.stop();
      steamThreeLoop.stop();
    };
  }, [isRunning, pulseAnim, shimmerAnim, steamOne, steamTwo, steamThree]);

  useEffect(() => {
    if (!isRunning || remainingSeconds <= 0) {
      if (remainingSeconds <= 0 && isRunning) {
        setIsRunning(false);
      }
      return;
    }

    const timer = setInterval(() => {
      setRemainingSeconds((current) => {
        if (current <= 1) {
          clearInterval(timer);
          return 0;
        }
        return current - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [isRunning, remainingSeconds]);

  const ringScale = pulseAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [1, 1.08],
  });

  const ringOpacity = pulseAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0.16, 0.32],
  });

  const shimmerTranslate = shimmerAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [-180, 180],
  });

  const progressWidth = progressAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0%', '100%'],
  });

  const steamStyle = (value: Animated.Value, offset: number) => ({
    opacity: value.interpolate({
      inputRange: [0, 0.15, 0.7, 1],
      outputRange: [0, 0.35, 0.18, 0],
    }),
    transform: [
      {
        translateY: value.interpolate({
          inputRange: [0, 1],
          outputRange: [0, -115],
        }),
      },
      {
        translateX: value.interpolate({
          inputRange: [0, 0.5, 1],
          outputRange: [offset, offset + 12, offset - 8],
        }),
      },
      {
        scale: value.interpolate({
          inputRange: [0, 1],
          outputRange: [0.7, 1.3],
        }),
      },
    ],
  });

  const selectRecipe = (recipe: Recipe) => {
    setSelectedRecipe(recipe);
    setRemainingSeconds(recipe.time);
    setIsRunning(false);
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar style="dark" />
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <View style={styles.hero}>
          <Text style={styles.kicker}>Kitchen Timing</Text>
          <Text style={styles.title}>Cook each recipe right on time.</Text>
          <Text style={styles.subtitle}>
            Choose a dish, hit start, and let the motion keep the energy alive while your food finishes.
          </Text>
        </View>

        <View style={styles.timerShell}>
          <Animated.View
            style={[
              styles.timerGlow,
              {
                backgroundColor: selectedRecipe.glow,
                opacity: ringOpacity,
                transform: [{ scale: ringScale }],
              },
            ]}
          />

          <View style={styles.timerFace}>
            <Animated.View
              style={[
                styles.shimmer,
                {
                  transform: [{ translateX: shimmerTranslate }, { rotate: '18deg' }],
                  opacity: isRunning ? 0.5 : 0.2,
                },
              ]}
            />

            <View style={styles.steamWrap}>
              <Animated.View style={[styles.steam, steamStyle(steamOne, -18)]} />
              <Animated.View style={[styles.steam, steamStyle(steamTwo, 2)]} />
              <Animated.View style={[styles.steam, steamStyle(steamThree, 22)]} />
            </View>

            <Text style={styles.recipeLabel}>{selectedRecipe.title}</Text>
            <Text style={styles.countdown}>{formatTime(remainingSeconds)}</Text>
            <Text style={styles.helper}>
              {remainingSeconds === 0 ? 'Ready to plate' : selectedRecipe.temperature}
            </Text>

            <View style={styles.progressTrack}>
              <Animated.View
                style={[
                  styles.progressFill,
                  {
                    width: progressWidth,
                    backgroundColor: selectedRecipe.accent,
                  },
                ]}
              />
            </View>
          </View>
        </View>

        <View style={styles.controls}>
          <Pressable
            style={[styles.primaryButton, { backgroundColor: selectedRecipe.accent }]}
            onPress={() => {
              if (remainingSeconds === 0) {
                setRemainingSeconds(selectedRecipe.time);
              }
              setIsRunning((current) => !current);
            }}
          >
            <Text style={styles.primaryButtonText}>
              {remainingSeconds === 0 ? 'Cook Again' : isRunning ? 'Pause' : 'Start'}
            </Text>
          </Pressable>

          <Pressable
            style={styles.secondaryButton}
            onPress={() => {
              setIsRunning(false);
              setRemainingSeconds(selectedRecipe.time);
            }}
          >
            <Text style={styles.secondaryButtonText}>Reset</Text>
          </Pressable>
        </View>

        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Recipe Presets</Text>
          <Text style={styles.sectionCaption}>Tap any dish to load a tuned timer.</Text>
        </View>

        <View style={styles.recipeGrid}>
          {RECIPES.map((recipe) => {
            const active = recipe.id === selectedRecipe.id;
            return (
              <Pressable
                key={recipe.id}
                style={[
                  styles.recipeCard,
                  active && {
                    borderColor: recipe.accent,
                    backgroundColor: recipe.glow,
                  },
                ]}
                onPress={() => selectRecipe(recipe)}
              >
                <View style={[styles.recipeDot, { backgroundColor: recipe.accent }]} />
                <Text style={styles.recipeTitle}>{recipe.title}</Text>
                <Text style={styles.recipeSubtitle}>{recipe.subtitle}</Text>
                <Text style={styles.recipeTime}>{formatTime(recipe.time)}</Text>
              </Pressable>
            );
          })}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#f7eadf',
  },
  scrollContent: {
    paddingHorizontal: 22,
    paddingTop: 18,
    paddingBottom: 36,
  },
  hero: {
    gap: 10,
    marginBottom: 26,
  },
  kicker: {
    color: '#8c5c41',
    fontSize: 13,
    fontWeight: '700',
    letterSpacing: 1.3,
    textTransform: 'uppercase',
  },
  title: {
    color: '#2c1e18',
    fontSize: 34,
    lineHeight: 40,
    fontWeight: '800',
  },
  subtitle: {
    color: '#6f5649',
    fontSize: 16,
    lineHeight: 24,
  },
  timerShell: {
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 24,
  },
  timerGlow: {
    position: 'absolute',
    width: 310,
    height: 310,
    borderRadius: 999,
  },
  timerFace: {
    width: '100%',
    minHeight: 350,
    borderRadius: 34,
    backgroundColor: '#fff7f1',
    overflow: 'hidden',
    paddingHorizontal: 24,
    paddingVertical: 30,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(86, 47, 26, 0.08)',
  },
  shimmer: {
    position: 'absolute',
    width: 140,
    height: 420,
    backgroundColor: 'rgba(255,255,255,0.35)',
  },
  steamWrap: {
    position: 'absolute',
    top: 85,
    height: 140,
    width: 160,
    alignItems: 'center',
    justifyContent: 'flex-end',
  },
  steam: {
    position: 'absolute',
    bottom: 0,
    width: 38,
    height: 38,
    borderRadius: 999,
    backgroundColor: '#ffffff',
  },
  recipeLabel: {
    color: '#8c5c41',
    fontSize: 15,
    fontWeight: '700',
    letterSpacing: 0.5,
    textTransform: 'uppercase',
    marginBottom: 18,
  },
  countdown: {
    color: '#2c1e18',
    fontSize: 58,
    lineHeight: 64,
    fontWeight: '900',
    letterSpacing: 1.2,
    marginBottom: 12,
  },
  helper: {
    color: '#6f5649',
    fontSize: 16,
    marginBottom: 26,
  },
  progressTrack: {
    width: '100%',
    height: 14,
    backgroundColor: '#f0ddd0',
    borderRadius: 999,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 999,
  },
  controls: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 28,
  },
  primaryButton: {
    flex: 1,
    paddingVertical: 18,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#8f5d45',
    shadowOpacity: 0.16,
    shadowRadius: 14,
    shadowOffset: { width: 0, height: 8 },
    elevation: 2,
  },
  primaryButtonText: {
    color: '#fffdf8',
    fontSize: 17,
    fontWeight: '800',
  },
  secondaryButton: {
    width: 96,
    paddingVertical: 18,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#efe1d4',
  },
  secondaryButtonText: {
    color: '#5e4436',
    fontSize: 16,
    fontWeight: '700',
  },
  sectionHeader: {
    gap: 4,
    marginBottom: 14,
  },
  sectionTitle: {
    color: '#2c1e18',
    fontSize: 22,
    fontWeight: '800',
  },
  sectionCaption: {
    color: '#7d6254',
    fontSize: 14,
  },
  recipeGrid: {
    gap: 14,
  },
  recipeCard: {
    borderRadius: 22,
    padding: 18,
    backgroundColor: '#fff7f1',
    borderWidth: 1,
    borderColor: 'rgba(86, 47, 26, 0.07)',
  },
  recipeDot: {
    width: 12,
    height: 12,
    borderRadius: 999,
    marginBottom: 14,
  },
  recipeTitle: {
    color: '#2c1e18',
    fontSize: 19,
    fontWeight: '800',
    marginBottom: 4,
  },
  recipeSubtitle: {
    color: '#745a4c',
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 14,
  },
  recipeTime: {
    color: '#8c5c41',
    fontSize: 16,
    fontWeight: '700',
  },
});
