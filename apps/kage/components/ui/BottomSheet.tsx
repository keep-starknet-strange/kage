import { PropsWithChildren } from 'react';
import { Sheet, SheetProps, View } from 'tamagui';

interface BottomSheetProps extends SheetProps {
  onClose?: () => void;
}

export const BottomSheet = ({ children, onClose, ...props }: PropsWithChildren<BottomSheetProps>) => (
  <Sheet
    modal
    dismissOnSnapToBottom
    snapPointsMode="fit"
    animation="medium"
    onOpenChange={(open: boolean) => {
      if (!open) onClose?.();
    }}
    {...props}
  >
    <Sheet.Overlay animation="lazy" enterStyle={{ opacity: 0 }} exitStyle={{ opacity: 0 }} />
    <Sheet.Frame
      padding="$lg"
      borderTopLeftRadius="$xl"
      borderTopRightRadius="$xl"
      backgroundColor="$surfaceElevated"
      gap="$lg"
    >
      <View height={4} width={36} alignSelf="center" borderRadius="$pill" backgroundColor="$border" />
      {children}
    </Sheet.Frame>
  </Sheet>
);
