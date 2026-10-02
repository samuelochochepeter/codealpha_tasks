import { Stack } from 'expo-router';
import { SQLiteProvider } from 'expo-sqlite';
import { StatusBar } from 'expo-status-bar';
import { initializeDatabase } from '../src/database';

export default function RootLayout() {
  return <SQLiteProvider databaseName="pulselog.db" onInit={initializeDatabase}>
    <StatusBar style="dark" />
    <Stack screenOptions={{ headerShown: false }} />
  </SQLiteProvider>;
}
