import { useEffect, useRef, useCallback, useState, useMemo } from "react";
import Svg, { Path, Defs, LinearGradient, RadialGradient, Stop, Circle, G } from "react-native-svg";
import {
  View,
  Text,
  Animated,
  Easing,
  StyleSheet,
  PanResponder,
  GestureResponderEvent,
  PanResponderGestureState,
} from "react-native";
import { Magnetometer } from 'expo-sensors';

import { commonStyles } from "@/styles/commonStyles";
import { indexStyles } from "@/styles/indexStyles";
import { vibrate, type VibrationStrength } from '@/vibration/haptics';
import NavigationBar from '@/components/NavigationBar';
import { request_MapsIdPath } from '@/api/api_maps_id_path';
import { router, useLocalSearchParams, Redirect } from "expo-router";

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

const GRID_WIDTH = 8;
const GRID_HEIGHT = 8;
const ARRIVAL_THRESHOLD = 0.5;
const HEADING_CONE_DEGREES = 15;
const MINIMAP_SIZE = 150;

const START = { x: 0, y: 0 };
const END = { x: 7, y: 7 };

const JOYSTICK_BASE_SIZE = 132;
const JOYSTICK_KNOB_SIZE = 56;
const JOYSTICK_MAX_RADIUS = (JOYSTICK_BASE_SIZE - JOYSTICK_KNOB_SIZE) / 2;
const MOVEMENT_SPEED_CELLS_PER_SEC = 2.2;
const MOVEMENT_TICK_MS = 50;

const JOYSTICK_VISIBLE = true;
const HEADING_SMOOTHING_ALPHA = 0.18;
const GRID_PAN_PADDING = 8;

const AnimatedG = Animated.createAnimatedComponent(View);
const AnimatedCircle = Animated.createAnimatedComponent(Text);

const normalizeAngle = (deg: number) => {
  const wrapped = deg % 360;
  return wrapped < 0 ? wrapped + 360 : wrapped;
};

const shortestAngleDelta = (from: number, to: number) => {
  const diff = normalizeAngle(to - from);
  return diff > 180 ? diff - 360 : diff;
};

const angularDistance = (a: number, b: number) => Math.abs(shortestAngleDelta(a, b));

export default function MapPage() {
  const { mapId, destinationId } = useLocalSearchParams();

  if (!mapId || !destinationId) {
    const [brokenHook, setBrokenHook] = useState(true);
    return <Redirect href={"/destination"} />;
  }

  const rotation = useRef(new Animated.Value(0)).current;
  const rotationValueRef = useRef(0);

  const mapRotation = useRef(new Animated.Value(0)).current;
  const mapRotationValueRef = useRef(0);

  const cameraPan = useRef(new Animated.ValueXY()).current;

  const vibrationRunId = useRef(0);
  const isCorrectRef = useRef(false);

  const virtualPos = useRef({ x: START.x, y: START.y });
  const currentHeadingRef = useRef(0);

  const safePathRef = useRef<[number, number][]>([]);
  const targetIndexRef = useRef(0);

  const [safePath, setSafePathState] = useState<[number, number][]>([]);

  const joystickKnobPan = useRef(new Animated.ValueXY()).current;
  const joystickVectorRef = useRef({ x: 0, y: 0 });
  const movementIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const gridPatternPath = useMemo(() => {
    const min = -GRID_PAN_PADDING;
    const maxX = GRID_WIDTH + GRID_PAN_PADDING;
    const maxY = GRID_HEIGHT + GRID_PAN_PADDING;
    const segments: string[] = [];
    for (let x = min; x <= maxX; x += 1) {
      segments.push(`M${x} ${min} L${x} ${maxY}`);
    }
    for (let y = min; y <= maxY; y += 1) {
      segments.push(`M${min} ${y} L${maxX} ${y}`);
    }
    return segments.join(' ');
  }, []);

  const radarPulse = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const pulseLoop = Animated.loop(
      Animated.timing(radarPulse, {
        toValue: 1,
        duration: 1800,
        easing: Easing.out(Easing.ease),
        useNativeDriver: false,
      }),
    );
    pulseLoop.start();
    return () => {
      pulseLoop.stop();
    };
  }, [radarPulse]);

  const pulseRadius = radarPulse.interpolate({ inputRange: [0, 1], outputRange: [0.4, 3.2] });
  const pulseOpacity = radarPulse.interpolate({ inputRange: [0, 1], outputRange: [0.6, 0] });

  const currentMapId = Number(mapId);

  const applySafePath = useCallback((path: [number, number][]) => {
    if (!path || path.length === 0) {
      return;
    }
    safePathRef.current = path;
    targetIndexRef.current = 0;
    setSafePathState(path);
  }, []);

  const stopVibration = useCallback(() => {
    vibrationRunId.current += 1;
  }, []);

  const loopVibration = useCallback(
    async (strength: VibrationStrength) => {
      stopVibration();
      const currentRunId = vibrationRunId.current;
      try {
        while (vibrationRunId.current === currentRunId) {
          await vibrate(strength);
          if (vibrationRunId.current !== currentRunId) break;
          await sleep(50);
        }
      } catch (error) {
        stopVibration();
      }
    },
    [stopVibration],
  );

  useEffect(() => {
    let cancelled = false;
    const fetchPath = async () => {
      try {
        const response = await request_MapsIdPath(currentMapId, START.x, START.y, END.x, END.y);
        if (!response || !response.path || response.path.length === 0) {
          return;
        }

        const orderedPath = [...response.path].reverse();

        if (!cancelled) {
          applySafePath(orderedPath);
        }
      } catch (err) {
      }
    };
    fetchPath();
    return () => {
      cancelled = true;
    };
  }, [applySafePath, currentMapId]);

  useEffect(() => {
    if (safePath.length > 0 && (safePath[0][0] !== START.x || safePath[0][1] !== START.y)) {
    }
  }, [safePath]);

  const stopMovementLoop = useCallback(() => {
    if (movementIntervalRef.current) {
      clearInterval(movementIntervalRef.current);
      movementIntervalRef.current = null;
    }
  }, []);

  const startMovementLoop = useCallback(() => {
    if (movementIntervalRef.current) return;

    movementIntervalRef.current = setInterval(() => {
      const { x: vx, y: vy } = joystickVectorRef.current;
      if (vx === 0 && vy === 0) return;

      const deltaSeconds = MOVEMENT_TICK_MS / 1000;

      const theta = currentHeadingRef.current * (Math.PI / 180);
      const rotatedVx = vx * Math.cos(theta) - vy * Math.sin(theta);
      const rotatedVy = vx * Math.sin(theta) + vy * Math.cos(theta);

      const nextX = virtualPos.current.x + rotatedVx * MOVEMENT_SPEED_CELLS_PER_SEC * deltaSeconds;
      const nextY = virtualPos.current.y + rotatedVy * MOVEMENT_SPEED_CELLS_PER_SEC * deltaSeconds;

      virtualPos.current = { x: nextX };

      cameraPan.setValue({ x: nextX, y: nextY });

      const path = safePathRef.current;
      const idx = targetIndexRef.current;
      if (path.length > 0 && idx < path.length) {
        const target = path[idx];
        if (target && target.length >= 2) {
          const distToTarget = Math.hypot(target[0] - nextX, target[1] - nextY);

          if (distToTarget < ARRIVAL_THRESHOLD && idx < path.length - 1) {
            targetIndexRef.current = idx + 1;
          }
        }
      }
    }, MOVEMENT_TICK_MS);
  }, [cameraPan]);

  const resetJoystick = useCallback(() => {
    joystickVectorRef.current = { x: 0, y: 0 };
    stopMovementLoop();
    Animated.spring(joystickKnobPan, {
      toValue: { x: 0, y: 0 },
      useNativeDriver: true,
      friction: 5,
    }).start();
  }, [joystickKnobPan, stopMovementLoop]);

  const handleJoystickMove = useCallback(
    (_evt: GestureResponderEvent, gestureState: PanResponderGestureState) => {
      const { dx, dy } = gestureState;
      const distance = Math.hypot(dx, dy);
      const clampedDistance = Math.min(distance, JOYSTICK_MAX_RADIUS);
      const angle = Math.atan2(dy, dx);

      const knobX = Math.cos(angle) * clampedDistance;
      const knobY = Math.sin(angle) * clampedDistance;

      joystickKnobPan.setValue({ x: knobX, y: knobY });

      joystickVectorRef.current = {
        x: knobX / JOYSTICK_MAX_RADIUS,
        y: knobY / JOYSTICK_MAX_RADIUS,
      };
    },
    [joystickKnobPan],
  );

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: () => true,
      onPanResponderGrant: () => {
        startMovementLoop();
      },
      onPanResponderMove: handleJoystickMove(),
      onPanResponderRelease: resetJoystick,
      onPanResponderTerminate: resetJoystick,
    }),
  ).current;

  useEffect(() => {
    return () => {
      stopMovementLoop();
    };
  }, [stopMovementLoop]);

  useEffect(() => {
    let subscription: { remove: () => void } | null = null;
    let smoothedHeading = 0;
    let hasInitializedHeading = false;

    try {
      Magnetometer.setUpdateInterval(100);

      subscription = Magnetometer.addListener(({ x, y }) => {
        if (typeof x !== 'number' || typeof y !== 'number') {
          return;
        }

        const rawHeading = normalizeAngle(Math.atan2(y, x) * (180 / Math.PI));

        if (!hasInitializedHeading) {
          smoothedHeading = rawHeading;
          hasInitializedHeading = true;
        } else {
          const smoothingDelta = shortestAngleDelta(smoothedHeading, rawHeading);
          smoothedHeading = normalizeAngle(smoothedHeading + smoothingDelta * HEADING_SMOOTHING_ALPHA);
        }

        const heading = smoothedHeading;
        currentHeadingRef.current = heading;

        const path = safePathRef.current;
        const idx = targetIndexRef.current;
        const hasActiveTarget = path.length > 0 && idx < path.length;

        let targetAngle = 0;

        if (hasActiveTarget) {
          const target = path[idx];
          if (!target || target.length < 2) return;

          const [tx, ty] = target;
          const dx = tx - virtualPos.current.x;
          const dy = ty - virtualPos.current.y;
          targetAngle = normalizeAngle(Math.atan2(dx, -dy) * (180 / Math.PI));

          const diff = angularDistance(targetAngle, heading);
          const isPointingCorrectly = diff <= HEADING_CONE_DEGREES;

          if (isPointingCorrectly && !isCorrectRef.current) {
            isCorrectRef.current = true;
            loopVibration('success');
          } else if (!isPointingCorrectly && isCorrectRef.current) {
            isCorrectRef.current = false;
            stopVibration();
          }
        } else if (isCorrectRef.current) {
          isCorrectRef.current = false;
          stopVibration();
        }

        const rawRotation = normalizeAngle(targetAngle - heading);
        const currentMod = normalizeAngle(rotationValueRef.current);
        const delta = shortestAngleDelta(currentMod, rawRotation);
        rotationValueRef.current += delta;

        Animated.timing(rotation, {
          toValue: rotationValueRef.current,
          duration: 100,
          easing: Easing.linear,
          useNativeDriver: true,
        }).start();

        const rawMapRot = normalizeAngle(-heading);
        const currentMapMod = normalizeAngle(mapRotationValueRef.current);
        const mapDelta = shortestAngleDelta(currentMapMod, rawMapRot);
        mapRotationValueRef.current += mapDelta;

        Animated.timing(mapRotation, {
          toValue: mapRotationValueRef.current,
          duration: 100,
          easing: Easing.linear,
          useNativeDriver: true,
        }).start();
      });
    } catch (err) {
    }

    return () => {
      if (subscription) {
        subscription.remove();
      }
      stopVibration();
    };
  }, [rotation, mapRotation, loopVibration, stopVibration]);

  const rotateInterpolate = rotation.interpolate({
    inputRange: [0, 360],
    outputRange: ["0deg", "360deg"],
  });

  const mapRotateInterpolate = mapRotation.interpolate({
    inputRange: [0, 360],
    outputRange: ["0deg", "360deg"],
  });

  const worldOffsetX = cameraPan.x.interpolate({
    inputRange: [0, GRID_WIDTH],
    outputRange: [GRID_WIDTH / 2, GRID_WIDTH / 2 - GRID_WIDTH],
  });

  const worldOffsetY = cameraPan.y.interpolate({
    inputRange: [0, GRID_HEIGHT],
    outputRange: [GRID_HEIGHT / 2, GRID_HEIGHT / 2 - GRID_HEIGHT],
  });

  const needsAnchor =
    safePath.length > 0 && (safePath[0][0] !== START.x || safePath[0][1] !== START.y);

  const visualPathPoints: [number, number][] = needsAnchor
    ? [[START.x, START.y] as [number, number], ...safePath]
    : safePath;

  const pathData =
    visualPathPoints.length > 0
      ? visualPathPoints.map((p, i) => `${i === 0 ? 'M' : 'L'}${p[0]} ${p[1]}`).join(' ')
      : undefined;

  return (
    <View style={commonStyles.screen}>
      <View style={indexStyles.topFrame}>

        <View style={indexStyles.hudPanel}>
          <Text style={indexStyles.hudLabel}>TARGET DISTANCE</Text>
          <Text style={indexStyles.hudValue}>12.4m</Text>
          <Text style={indexStyles.hudSubValue}>turn left</Text>
        </View>

        <View style={localStyles.miniMapContainer}>
          <Animated.View
            style={[
              StyleSheet.absoluteFill,
              { transform: [{ rotate: mapRotateInterpolate }] }
            ]}
          >
            <Svg
              width={MINIMAP_SIZE}
              height={MINIMAP_SIZE}
              viewBox={`0 0 ${GRID_WIDTH} ${GRID_HEIGHT}`}
              style={StyleSheet.absoluteFill}
            >
              <Defs>
                <RadialGradient id="radarGlow" cx="50%" cy="50%" r="50%">
                  <Stop offset="0" stopColor="#5cbdb9" stopOpacity={0.5} />
                  <Stop offset="1" stopColor="#5cbdb9" stopOpacity={0} />
                </RadialGradient>
                <LinearGradient id="pathGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                  <Stop offset="0" stopColor="#26ac49" stopOpacity={0.9} />
                  <Stop offset="1" stopColor="#5cbdb9" stopOpacity={1} />
                </LinearGradient>
              </Defs>

              <AnimatedG translateX={worldOffsetX} translateY={worldOffsetY}>
                <Path
                  d={gridPatternPath}
                  stroke="rgba(92, 189, 185, 0.16)"
                  strokeWidth={0.045}
                />

                {pathData && (
                  <>
                    <Path
                      d={pathData}
                      stroke="#5cbdb9"
                      strokeOpacity={0.25}
                      strokeWidth={1.4}
                      strokeLinecap="round"
                      fill="none"
                      vectorEffect="non-scaling-stroke"
                    />
                    <Path
                      d={pathData}
                      stroke="url(#pathGradient)"
                      strokeWidth={0.6}
                      strokeDasharray="0.45 0.35"
                      strokeLinecap="round"
                      fill="none"
                      vectorEffect="non-scaling-stroke"
                    />
                  </>
                )}
              </AnimatedG>

              <Circle cx={GRID_WIDTH / 2} cy={GRID_HEIGHT / 2} r={2.4} fill="url(#radarGlow)" />
              <AnimatedCircle
                cx={GRID_WIDTH / 2}
                cy={GRID_HEIGHT / 2}
                r={pulseRadius}
                stroke="#5cbdb9"
                strokeWidth={0.12}
                fill="none"
                opacity={pulseOpacity}
              />
              <Circle
                cx={GRID_WIDTH / 2}
                cy={GRID_HEIGHT / 2}
                r={0.34}
                fill="#fbe3e8"
                stroke="#5cbdb9"
                strokeWidth={0.14}
              />
            </Svg>
          </Animated.View>
        </View>

      </View>

      <View style={indexStyles.centerFrame}>
        <View style={localStyles.centerStack}>
          <Animated.View
            style={{
              transform: [{ rotate: rotateInterpolate }],
              transformOrigin: "center center",
              shadowColor: "#2C3E50",
              shadowOffset: { width: 0, height: 12 },
              shadowOpacity: 0.08,
              shadowRadius: 24,
              elevation: 8,
            }}
          >
            <Svg width={150} height={171} viewBox="0 0 70 80">
              <Defs>
                <LinearGradient id="cursorGradient" x1="0" y1="0" x2="0" y2="1">
                  <Stop offset="0" stopColor="#26ac49" stopOpacity={1} />
                  <Stop offset="1" stopColor="#ffffff" stopOpacity={1} />
                </LinearGradient>
              </Defs>
              <Path
                d="M35 0 L70 68 L35 54 L0 68 Z"
                fill="url(#cursorGradient)"
                stroke="#5cbdb9"
                strokeWidth={1.5}
                strokeLinejoin="round"
              />
            </Svg>
          </Animated.View>

          <View
            style={[localStyles.joystickBase, !JOYSTICK_VISIBLE && localStyles.joystickHidden]}
            {...panResponder.panHandlers}
          >
            <Animated.View
              style={[
                localStyles.joystickKnob,
                !JOYSTICK_VISIBLE && localStyles.joystickHidden,
                { transform: joystickKnobPan.getTranslateTransform() },
              ]}
            />
          </View>
        </View>
      </View>

      <View style={indexStyles.bottomFrame}>
        <View style={indexStyles.distanceFrame}>
          <Text style={indexStyles.distanceTitle}>50 m</Text>
          <Text style={indexStyles.distanceSubTitle}>turn left</Text>
        </View>
      </View>

      <NavigationBar />
    </View>
  );
}

const localStyles = StyleSheet.create({
  miniMapContainer: {
    width: MINIMAP_SIZE,
    height: MINIMAP_SIZE,
    backgroundColor: '#ffffff',
    borderRadius: MINIMAP_SIZE / 2,
    overflow: 'hidden',
    position: 'relative',
    shadowColor: "#2C3E50",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.05,
    shadowRadius: 16,
    elevation: 6,
  },
  centerStack: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  joystickBase: {
    marginTop: 28,
    width: JOYSTICK_BASE_SIZE,
    height: JOYSTICK_BASE_SIZE,
    borderRadius: JOYSTICK_BASE_SIZE / 2,
    backgroundColor: 'rgba(92, 189, 185, 0.12)',
    borderWidth: 1.5,
    borderColor: 'rgba(92, 189, 185, 0.35)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  joystickKnob: {
    width: JOYSTICK_KNOB_SIZE,
    height: JOYSTICK_KNOB_SIZE,
    borderRadius: JOYSTICK_KNOB_SIZE / 2,
    backgroundColor: '#5cbdb9',
    shadowColor: "#2C3E50",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 4,
  },
  joystickHidden: {
    opacity: 0,
  },
});