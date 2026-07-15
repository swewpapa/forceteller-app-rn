import { useEffect, useRef, type ReactElement } from 'react';
import { View } from 'react-native';
import { useIsFocused } from '@react-navigation/native';
import { usePopoverRegistry } from './popover-context';
import { dismissPopover } from './popover-dismiss';
import type { PopoverPlacement } from './popover-position';

export type PopoverProps = {
  id: string;
  visible: boolean;
  message: string;
  placement?: PopoverPlacement;
  onDismiss?: () => void;
  children: ReactElement;
};

export function Popover({
  id,
  visible,
  message,
  placement = 'bottom-end',
  onDismiss,
  children,
}: PopoverProps) {
  const anchorRef = useRef<View>(null);
  const { register, unregister } = usePopoverRegistry();
  const isFocused = useIsFocused();

  useEffect(() => {
    // popover는 현재 페이지에 종속 — 화면이 focus 아니면(탭 이동·스택 push) 등록 해제.
    if (!visible || !isFocused) {
      unregister(id);
      return;
    }
    const node = anchorRef.current;
    if (!node) return;
    node.measureInWindow((x, y, width, height) => {
      register({
        id,
        rect: { x, y, width, height },
        message,
        placement,
        onDismiss: () => {
          dismissPopover(id);
          onDismiss?.();
        },
      });
    });
    return () => unregister(id);
  }, [visible, isFocused, id, message, placement, onDismiss, register, unregister]);

  return (
    <View ref={anchorRef} collapsable={false}>
      {children}
    </View>
  );
}
