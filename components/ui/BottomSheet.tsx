import { PropsWithChildren } from 'react';
import { Modal, Pressable, StyleSheet, View } from 'react-native';
import { useTheme } from 'styled-components/native';

interface BottomSheetProps {
  open: boolean;
  onOpenChange?: (open: boolean) => void;
}

export const BottomSheet = ({ open, onOpenChange, children }: PropsWithChildren<BottomSheetProps>) => {
  const theme = useTheme();

  const handleClose = () => onOpenChange?.(false);

  return (
    <Modal
      transparent
      animationType="slide"
      visible={open}
      onRequestClose={handleClose}
    >
      <View style={styles.wrapper}>
        <Pressable style={styles.backdrop} onPress={handleClose} />
        <View style={[styles.sheet, { backgroundColor: theme.colors.surfaceElevated }]}>
          <View style={[styles.handle, { backgroundColor: theme.colors.border }]} />
          {children}
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  wrapper: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(4, 7, 9, 0.64)',
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
  },
  sheet: {
    paddingHorizontal: 24,
    paddingVertical: 24,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
  },
  handle: {
    width: 44,
    height: 4,
    alignSelf: 'center',
    borderRadius: 999,
    marginBottom: 16,
  },
});
