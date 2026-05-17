import { Redirect, useLocalSearchParams } from 'expo-router';

export default function CalculatorRedirect() {
  const params = useLocalSearchParams();
  return <Redirect href={{ pathname: '/(app)/calculator', params }} />;
}
