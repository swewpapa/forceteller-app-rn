export type AnchorRect = { x: number; y: number; width: number; height: number };

export type PopoverPlacement = 'bottom-end' | 'bottom-start' | 'bottom';

export type ComputeOpts = {
  placement: PopoverPlacement;
  screenWidth: number;
  bubbleWidth: number;
  gap: number;
  edgePadding: number;
};

export type PopoverLayout = { top: number; left: number; caretLeft: number };

export function computePopover(a: AnchorRect, o: ComputeOpts): PopoverLayout {
  const top = a.y + a.height + o.gap;
  const rawLeft =
    o.placement === 'bottom-end'
      ? a.x + a.width - o.bubbleWidth
      : o.placement === 'bottom-start'
      ? a.x
      : a.x + a.width / 2 - o.bubbleWidth / 2;
  const maxLeft = o.screenWidth - o.edgePadding - o.bubbleWidth;
  const left = Math.max(o.edgePadding, Math.min(rawLeft, maxLeft));
  const anchorCenterX = a.x + a.width / 2;
  const caretLeft = anchorCenterX - left;
  return { top, left, caretLeft };
}
