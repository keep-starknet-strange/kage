import { Input as TamaguiInput, InputProps, styled } from 'tamagui';

const StyledInput = styled(TamaguiInput, {
  height: 52,
  borderRadius: '$md',
  borderWidth: 1.5,
  borderColor: '$border',
  paddingHorizontal: '$md',
  fontFamily: 'Inter_500Medium',
  fontSize: 16,
  color: '$color',
  backgroundColor: '$surface',
  focusStyle: {
    borderColor: '$accent',
  },
});

export const Input = (props: InputProps) => {
  return <StyledInput {...props} />;
};
