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
      <View style={[styles.wrapper, { backgroundColor: theme.colors.overlay }]}> 
        <Pressable style={styles.backdrop} onPress={handleClose} />
        <View
          style={[
            styles.sheet,
            {
              backgroundColor: theme.colors.surface,
              borderColor: theme.colors.border,
            },
          ]}
        >
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
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
  },
  sheet: {
    paddingHorizontal: 24,
    paddingVertical: 24,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    borderWidth: 1,
    shadowColor: '#141824',
    shadowOffset: { width: 0, height: -8 },
    shadowOpacity: 0.06,
  },
  handle: {
    width: 44,
    height: 4,
    alignSelf: 'center',
    borderRadius: 999,
    marginBottom: 16,
  },
});
