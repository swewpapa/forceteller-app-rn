import { useState, type ReactNode } from 'react';
import {
  Pressable,
  StyleSheet,
  TextInput,
  View,
  type BlurEvent,
  type FocusEvent,
  type StyleProp,
  type TextInputProps,
  type ViewStyle,
} from 'react-native';
import { FontAwesomeIcon } from '@fortawesome/react-native-fontawesome';
import { faCircleXmark } from '@fortawesome/pro-solid-svg-icons/faCircleXmark';
import { useAppColors } from '@/shared/theme';
import { typographyStyles } from '../typography';
import { buildTextFieldStyle } from './text-field-style';

export type TextFieldProps = Omit<
  TextInputProps,
  | 'style'
  | 'value'
  | 'onChangeText'
  | 'placeholder'
  | 'placeholderTextColor'
  | 'editable'
  | 'onFocus'
  | 'onBlur'
> & {
  value: string;
  onChangeText: (text: string) => void;
  placeholder?: string;
  error?: boolean;
  disabled?: boolean;
  clearable?: boolean;
  leading?: ReactNode;
  trailing?: ReactNode;
  onFocus?: (e: FocusEvent) => void;
  onBlur?: (e: BlurEvent) => void;
  /** 컨테이너 레이아웃 전용 탈출구(margin/width 등). 병합 마지막. */
  style?: StyleProp<ViewStyle>;
};

/** 디자인 시스템 TextField(controlled). 상태(default/focused/error/disabled) + clearable + leading/trailing 슬롯. */
export function TextField({
  value,
  onChangeText,
  placeholder,
  error = false,
  disabled = false,
  clearable = true,
  leading,
  trailing,
  onFocus,
  onBlur,
  style,
  ...rest
}: TextFieldProps) {
  const colors = useAppColors();
  const [focused, setFocused] = useState(false);
  const { container, inputColor, placeholderColor } = buildTextFieldStyle(
    { error, focused, disabled },
    colors,
  );
  const showClear = clearable && focused && value.length > 0 && !disabled;

  return (
    <View style={[container, style]}>
      {leading}
      <TextInput
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor={placeholderColor}
        editable={!disabled}
        onFocus={(e) => {
          setFocused(true);
          onFocus?.(e);
        }}
        onBlur={(e) => {
          setFocused(false);
          onBlur?.(e);
        }}
        style={[styles.input, { color: inputColor }]}
        {...rest}
      />
      {trailing}
      {showClear && (
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="지우기"
          hitSlop={8}
          // onPress가 아닌 onPressIn: 클리어 탭 시 TextInput blur가 먼저 발생해
          // focused=false로 버튼이 언마운트되면 onPress가 안 불리는 RN 레이스를 회피.
          onPressIn={() => onChangeText('')}
        >
          <FontAwesomeIcon icon={faCircleXmark} size={16} color={colors.text.subtle} />
        </Pressable>
      )}
    </View>
  );
}

const bodyLg = typographyStyles['body-lg'];

const styles = StyleSheet.create({
  // body-lg에서 lineHeight를 제외해 적용한다: TextInput은 lineHeight가 걸리면 텍스트가
  // 입력 박스 높이 기준으로 세로 중앙 정렬되지 않는다(<Text>(Typography)는 정상이라 거긴 유지).
  // 정적값을 StyleSheet로 분리해 no-inline-styles 경고도 방지(색만 동적이라 인라인 유지).
  input: {
    fontSize: bodyLg.fontSize,
    fontFamily: bodyLg.fontFamily,
    fontWeight: bodyLg.fontWeight,
    letterSpacing: bodyLg.letterSpacing,
    flex: 1,
    padding: 0,
  },
});
