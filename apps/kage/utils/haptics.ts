import * as Haptics from 'expo-haptics';

export const vibrateSelection = () => Haptics.selectionAsync();
export const vibrateSuccess = () => Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
export const vibrateWarning = () => Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
export const vibrateError = () => Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
