import { useMemo } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { FontAwesomeIcon } from '@fortawesome/react-native-fontawesome';
import type { IconDefinition } from '@fortawesome/fontawesome-svg-core';
import { faHouse } from '@fortawesome/pro-solid-svg-icons/faHouse';
import { faCalendar } from '@fortawesome/pro-solid-svg-icons/faCalendar';
import { faCrown } from '@fortawesome/pro-solid-svg-icons/faCrown';
import { faEllipsis } from '@fortawesome/pro-solid-svg-icons/faEllipsis';
import { faHouse as faHouseLight } from '@fortawesome/pro-light-svg-icons/faHouse';
import { faCalendar as faCalendarLight } from '@fortawesome/pro-light-svg-icons/faCalendar';
import { faCrown as faCrownLight } from '@fortawesome/pro-light-svg-icons/faCrown';
import { faEllipsis as faEllipsisLight } from '@fortawesome/pro-light-svg-icons/faEllipsis';
import type { BottomTabBarProps } from '@react-navigation/bottom-tabs';
import { useAppColors, type ModeColors } from '@/shared/theme';
import type { RootTabParamList } from './navigation-types';

type TabIconSet = { active: IconDefinition; inactive: IconDefinition };

/** Selected → FA Pro Solid, unselected → FA Pro Light (matches the design). */
const TAB_ICONS: Record<keyof RootTabParamList, TabIconSet> = {
  Home: { active: faHouse, inactive: faHouseLight },
  Today: { active: faCalendar, inactive: faCalendarLight },
  Premium: { active: faCrown, inactive: faCrownLight },
  More: { active: faEllipsis, inactive: faEllipsisLight },
};

export function AppTabBar({
  state,
  descriptors,
  navigation,
}: BottomTabBarProps) {
  const colors = useAppColors();
  const insets = useSafeAreaInsets();
  const styles = useMemo(
    () => makeStyles(colors, insets.bottom),
    [colors, insets.bottom],
  );

  return (
    <View style={styles.bar}>
      {state.routes.map((route, index) => {
        const { options } = descriptors[route.key];
        const label =
          typeof options.title === 'string' ? options.title : route.name;
        const focused = state.index === index;
        const icons = TAB_ICONS[route.name as keyof RootTabParamList];
        const color = focused ? colors.text.default : colors.text.muted;

        const onPress = () => {
          const event = navigation.emit({
            type: 'tabPress',
            target: route.key,
            canPreventDefault: true,
          });
          if (!focused && !event.defaultPrevented) {
            navigation.navigate(route.name);
          }
        };

        return (
          <Pressable
            key={route.key}
            accessibilityRole="button"
            accessibilityState={{ selected: focused }}
            accessibilityLabel={label}
            onPress={onPress}
            style={styles.tab}
          >
            <FontAwesomeIcon
              icon={focused ? icons.active : icons.inactive}
              size={20}
              color={color}
            />
            <Text
              style={[
                styles.label,
                focused ? styles.labelActive : styles.labelInactive,
              ]}
            >
              {label}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

function makeStyles(colors: ModeColors, bottomInset: number) {
  return StyleSheet.create({
    bar: {
      flexDirection: 'row',
      backgroundColor: colors.background.surface,
      borderTopWidth: 1,
      borderTopColor: colors.stroke.subtle,
      paddingBottom: bottomInset,
    },
    tab: {
      flex: 1,
      height: 52,
      alignItems: 'center',
      justifyContent: 'center',
      gap: 4,
    },
    label: {
      fontSize: 10,
      lineHeight: 12,
      fontWeight: '500',
      letterSpacing: -0.2,
    },
    labelActive: {
      color: colors.text.default,
    },
    labelInactive: {
      color: colors.text.muted,
    },
  });
}
