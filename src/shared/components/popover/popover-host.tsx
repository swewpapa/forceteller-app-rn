import { useState } from 'react';
import {
  Pressable,
  StyleSheet,
  View,
  useWindowDimensions,
  type LayoutChangeEvent,
} from 'react-native';
import { FontAwesomeIcon } from '@fortawesome/react-native-fontawesome';
import { faXmark } from '@fortawesome/pro-light-svg-icons/faXmark';
import { Typography } from '@/shared/components/typography';
import { useAppColors } from '@/shared/theme';
import { usePopoverRegistry } from './popover-context';
import { computePopover } from './popover-position';

const GAP = 4;
const EDGE = 8;
const CARET_SIZE = 8;
const CLOSE_ICON_SIZE = 14;

/**
 * 화면 최상위 popover 오버레이. `pointerEvents="box-none"`로 레이어 자체는 터치를 통과시키고,
 * 자식 말풍선만 터치를 받는다(뒤 화면 조작을 막지 않음).
 *
 * 색 토큰 주: Figma는 어두운 primary 배경(#191919) + 흰 텍스트를 지정한다. 스펙이 가정한
 * `background.primary`/`text.onPrimary`는 생성 토큰에 존재하지 않아(background 그룹=default/
 * surface/inset/highlight/alert, text 그룹에 on-color 멤버 없음), DS가 제공하는 정식 on-color
 * 쌍인 `primary.primary`(day=gray900=#191919, night=white) + `primary.onPrimary`로 대체했다.
 * Typography의 `color` prop은 `keyof ModeColors['text']`만 받아 on-primary를 표현할 수 없어,
 * 텍스트/아이콘 색은 `primary.onPrimary`를 style 탈출구로 주입한다.
 */
export function PopoverHost() {
  const { entry, unregister } = usePopoverRegistry();
  const colors = useAppColors();
  const { width: screenWidth } = useWindowDimensions();
  const [bubbleWidth, setBubbleWidth] = useState(0);

  if (!entry) return null;

  const measured = bubbleWidth > 0;
  const pos = measured
    ? computePopover(entry.rect, {
        placement: entry.placement,
        screenWidth,
        bubbleWidth,
        gap: GAP,
        edgePadding: EDGE,
      })
    : null;

  // caret은 말풍선 상단 flat 영역에 머물도록 라운드 코너 밖으로 새지 않게 clamp한다.
  const caretLeft = pos
    ? Math.max(EDGE, Math.min(pos.caretLeft - CARET_SIZE / 2, bubbleWidth - EDGE - CARET_SIZE))
    : 0;

  const handleLayout = (e: LayoutChangeEvent) => {
    const w = e.nativeEvent.layout.width;
    if (w !== bubbleWidth) setBubbleWidth(w);
  };

  const handleDismiss = () => {
    entry.onDismiss?.();
    unregister(entry.id);
  };

  return (
    <View style={StyleSheet.absoluteFill} pointerEvents="box-none">
      <View
        onLayout={handleLayout}
        style={[
          styles.bubble,
          { maxWidth: screenWidth - EDGE * 2, backgroundColor: colors.primary.primary },
          // 측정 전엔 화면 밖으로 숨겨 깜빡임 방지(자연 폭 측정용으로 렌더는 유지).
          pos ? { top: pos.top, left: pos.left } : styles.hidden,
        ]}
      >
        <View
          pointerEvents="none"
          style={[styles.caret, { left: caretLeft, backgroundColor: colors.primary.primary }]}
        />
        <Typography
          variant="label-sm"
          style={[styles.message, { color: colors.primary.onPrimary }]}
        >
          {entry.message}
        </Typography>
        <Pressable
          onPress={handleDismiss}
          accessibilityRole="button"
          accessibilityLabel="닫기"
          hitSlop={8}
        >
          <FontAwesomeIcon icon={faXmark} size={CLOSE_ICON_SIZE} color={colors.primary.onPrimary} />
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  bubble: {
    position: 'absolute',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
  },
  hidden: {
    top: -9999,
    opacity: 0,
  },
  message: {
    flexShrink: 1,
  },
  caret: {
    position: 'absolute',
    top: -CARET_SIZE / 2,
    width: CARET_SIZE,
    height: CARET_SIZE,
    transform: [{ rotate: '45deg' }],
  },
});
