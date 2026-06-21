import { createNavigationContainerRef } from '@react-navigation/native';
import type { RootStackParamList } from './types';

/** Lets root-level overlays (chapter break, ending) drive navigation. */
export const navigationRef = createNavigationContainerRef<RootStackParamList>();

export function resetTo(name: keyof RootStackParamList): void {
  if (navigationRef.isReady()) {
    navigationRef.reset({ index: 0, routes: [{ name: name as never }] });
  }
}
