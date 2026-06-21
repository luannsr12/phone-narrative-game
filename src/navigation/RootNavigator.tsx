import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import type { RootStackParamList } from './types';

import { LockScreen } from '@/screens/LockScreen';
import { NameScreen } from '@/screens/NameScreen';
import { RestoreScreen } from '@/screens/RestoreScreen';
import { HomeScreen } from '@/screens/HomeScreen';
import { MessagesScreen } from '@/screens/MessagesScreen';
import { NewChatScreen } from '@/screens/NewChatScreen';
import { ChatScreen } from '@/screens/ChatScreen';
import { ContactsScreen } from '@/screens/ContactsScreen';
import { ContactProfileScreen } from '@/screens/ContactProfileScreen';
import { ProfileScreen } from '@/screens/ProfileScreen';
import { FilesScreen } from '@/screens/FilesScreen';
import { FileDetailScreen } from '@/screens/FileDetailScreen';
import { GalleryScreen } from '@/screens/GalleryScreen';
import { CallsScreen } from '@/screens/CallsScreen';
import { DialingScreen } from '@/screens/DialingScreen';
import { TimelineScreen } from '@/screens/TimelineScreen';
import { NewsScreen } from '@/screens/NewsScreen';
import { SocialScreen } from '@/screens/SocialScreen';
import { MemoryGameScreen } from '@/screens/MemoryGameScreen';
import { BrowserScreen } from '@/screens/BrowserScreen';
import { BankScreen } from '@/screens/BankScreen';
import { StoryViewerScreen } from '@/screens/StoryViewerScreen';
import { SocialProfileScreen } from '@/screens/SocialProfileScreen';
import { SocialPostScreen } from '@/screens/SocialPostScreen';
import { BlogScreen } from '@/screens/BlogScreen';
import { BlogComposeScreen } from '@/screens/BlogComposeScreen';
import { BlogPreviewScreen } from '@/screens/BlogPreviewScreen';
import { BlogDetailScreen } from '@/screens/BlogDetailScreen';
import { SettingsScreen } from '@/screens/SettingsScreen';

const Stack = createNativeStackNavigator<RootStackParamList>();

/** Opening an app from the launcher fades/scales up; drilling in slides. */
const openApp = { animation: 'fade_from_bottom' } as const;
const drillIn = { animation: 'slide_from_right' } as const;

export function RootNavigator(_props: { started: boolean }) {
  return (
    <Stack.Navigator
      // A real phone always boots locked — even mid-game.
      initialRouteName="Lock"
      screenOptions={{ headerShown: false, contentStyle: { backgroundColor: '#0B0E13' } }}
    >
      <Stack.Screen name="Lock" component={LockScreen} options={{ animation: 'fade' }} />
      <Stack.Screen name="Name" component={NameScreen} options={{ animation: 'fade' }} />
      <Stack.Screen name="Restore" component={RestoreScreen} options={{ animation: 'slide_from_right' }} />
      <Stack.Screen name="Home" component={HomeScreen} options={{ animation: 'fade' }} />
      <Stack.Screen name="Messages" component={MessagesScreen} options={openApp} />
      <Stack.Screen name="NewChat" component={NewChatScreen} options={drillIn} />
      <Stack.Screen name="Chat" component={ChatScreen} options={drillIn} />
      <Stack.Screen name="Contacts" component={ContactsScreen} options={openApp} />
      <Stack.Screen name="ContactProfile" component={ContactProfileScreen} options={drillIn} />
      <Stack.Screen name="Profile" component={ProfileScreen} options={drillIn} />
      <Stack.Screen name="Files" component={FilesScreen} options={openApp} />
      <Stack.Screen name="FileDetail" component={FileDetailScreen} options={drillIn} />
      <Stack.Screen name="Gallery" component={GalleryScreen} options={openApp} />
      <Stack.Screen name="Calls" component={CallsScreen} options={openApp} />
      <Stack.Screen name="Dialing" component={DialingScreen} options={{ animation: 'fade' }} />
      <Stack.Screen name="Timeline" component={TimelineScreen} options={openApp} />
      <Stack.Screen name="News" component={NewsScreen} options={openApp} />
      <Stack.Screen name="Social" component={SocialScreen} options={openApp} />
      <Stack.Screen name="MemoryGame" component={MemoryGameScreen} options={openApp} />
      <Stack.Screen name="Browser" component={BrowserScreen} options={openApp} />
      <Stack.Screen name="Bank" component={BankScreen} options={openApp} />
      <Stack.Screen name="SocialProfile" component={SocialProfileScreen} options={drillIn} />
      <Stack.Screen name="SocialPost" component={SocialPostScreen} options={drillIn} />
      <Stack.Screen name="StoryViewer" component={StoryViewerScreen} options={{ animation: 'fade' }} />
      <Stack.Screen name="Blog" component={BlogScreen} options={openApp} />
      <Stack.Screen name="BlogCompose" component={BlogComposeScreen} options={drillIn} />
      <Stack.Screen name="BlogPreview" component={BlogPreviewScreen} options={drillIn} />
      <Stack.Screen name="BlogDetail" component={BlogDetailScreen} options={drillIn} />
      <Stack.Screen name="Settings" component={SettingsScreen} options={openApp} />
    </Stack.Navigator>
  );
}
