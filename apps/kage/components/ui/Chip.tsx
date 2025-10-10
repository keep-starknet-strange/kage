import { XStack, XStackProps, Text, styled } from 'tamagui';

interface ChipProps extends XStackProps {
  label: string;
  selected?: boolean;
  icon?: React.ReactNode;
}

const Container = styled(XStack, {
  alignItems: 'center',
  paddingHorizontal: '$md',
  paddingVertical: '$xs',
  borderRadius: '$pill',
  gap: '$xs',
  borderWidth: 1,
});

export const Chip = ({ label, selected, icon, ...props }: ChipProps) => (
  <Container
    backgroundColor={selected ? '$accent' : 'transparent'}
    borderColor={selected ? '$accent' : '$border'}
    {...props}
  >
    {icon}
    <Text fontSize={13} fontFamily="Inter_500Medium" color={selected ? '$background' : '$color'}>
      {label}
    </Text>
  </Container>
);
