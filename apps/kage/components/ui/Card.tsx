import { styled, YStack, YStackProps } from 'tamagui';

export interface CardProps extends YStackProps {
  glass?: boolean;
}

const BaseCard = styled(YStack, {
  padding: '$md',
  borderRadius: '$lg',
  backgroundColor: '$surfaceElevated',
  gap: '$sm',
  shadowColor: 'rgba(0,0,0,0.4)',
  shadowOpacity: 0.6,
  shadowOffset: { width: 0, height: 6 },
  shadowRadius: 18,
  elevation: 2,
});

export const Card = ({ glass, ...props }: CardProps) => {
  return <BaseCard backgroundColor={glass ? '$glass' : '$surfaceElevated'} {...props} />;
};
