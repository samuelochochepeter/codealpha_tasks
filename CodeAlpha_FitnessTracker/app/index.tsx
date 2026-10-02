import React, { useCallback, useState } from 'react';
import { Alert, FlatList, KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { useFocusEffect } from 'expo-router';
import { useSQLiteContext } from 'expo-sqlite';
import { Activity, ActivityInput, User, createUser, loginUser, deleteActivity, getGoal, listActivities, localDate, saveActivity, setGoal, weekDates } from '../src/database';
import { colors as c } from '../src/theme';

type Tab = 'Today' | 'Log' | 'History' | 'Goals';
const types = ['Walking', 'Running', 'Cycling', 'Strength', 'Yoga', 'Other'];
const dayNames = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
const onlyDigits = (s: string) => s.replace(/[^0-9]/g, '');
const blankForm = (): ActivityInput => ({ date: localDate(), type: 'Walking', minutes: 0, calories: 0, steps: 0, notes: '' });

export default function App() {
  const [user, setUser] = useState<User | null>(null);
  return user ? <FitnessTracker key={user.id} user={user} onLogout={() => setUser(null)} /> : <AuthScreen onLogin={setUser} />;
}

function AuthScreen({ onLogin }: { onLogin: (user: User) => void }) {
  const db = useSQLiteContext();
  const [mode, setMode] = useState<'login' | 'register'>('login');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const submit = async () => {
    setError(''); setMessage('');
    if (mode === 'register' && password !== confirm) { setError('The passwords do not match.'); return; }
    setBusy(true);
    try {
      if (mode === 'register') {
        await createUser(db, name, email, password);
        setMode('login'); setName(''); setPassword(''); setConfirm('');
        setMessage('Account created! Sign in below to open your dashboard.');
      } else {
        const account = await loginUser(db, email, password);
        setPassword(''); onLogin(account);
      }
    } catch (err) { setError(err instanceof Error ? err.message : String(err)); }
    finally { setBusy(false); }
  };
  return <KeyboardAvoidingView style={styles.authRoot} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
    <ScrollView contentContainerStyle={styles.authContent} keyboardShouldPersistTaps="handled">
      <View style={styles.authHero}>
        <View style={styles.authOrb} />
        <View style={styles.brandLine}><View style={styles.authBrand}><Text style={styles.authLogo}>P</Text></View><Text style={styles.brandName}>pulse<Text style={{ color: '#66E1C3' }}>log.</Text></Text></View>
        <Text style={styles.authKicker}>MOVE MORE · FEEL BETTER</Text>
        <Text style={styles.authHeroTitle}>Your progress, one day at a time.</Text>
        <Text style={styles.authHeroBody}>A simple home for your workouts, habits, and weekly wins.</Text>
      </View>
      <View style={styles.authCard}>
        <View style={styles.authTabs}>
          <Pressable style={[styles.authTab, mode === 'login' && styles.authTabActive]} onPress={() => { setMode('login'); setPassword(''); setConfirm(''); setError(''); setMessage(''); }}><Text style={[styles.authTabText, mode === 'login' && styles.authTabTextActive]}>Log in</Text></Pressable>
          <Pressable style={[styles.authTab, mode === 'register' && styles.authTabActive]} onPress={() => { setMode('register'); setPassword(''); setConfirm(''); setError(''); setMessage(''); }}><Text style={[styles.authTabText, mode === 'register' && styles.authTabTextActive]}>Create account</Text></Pressable>
        </View>
        <Text style={styles.authTitle}>{mode === 'login' ? 'Welcome back 👋' : 'Let’s get moving'}</Text>
        <Text style={styles.authSubtitle}>{mode === 'login' ? 'Sign in to continue your journey.' : 'Create your private fitness space.'}</Text>
        {!!message && <View style={styles.successBox}><Text style={styles.successText}>{message}</Text></View>}
        {!!error && <View style={styles.errorBox}><Text style={styles.errorText}>{error}</Text></View>}
        {mode === 'register' && <><Text style={styles.label}>Your name</Text><TextInput style={styles.input} value={name} onChangeText={setName} autoCapitalize="words" placeholder="Full name" accessibilityLabel="Your name" /></>}
        <Text style={styles.label}>Email address</Text>
        <TextInput style={styles.input} value={email} onChangeText={setEmail} autoCapitalize="none" keyboardType="email-address" autoComplete="email" placeholder="you@example.com" accessibilityLabel="Email address" />
        <Text style={[styles.label, { marginTop: 18 }]}>Password</Text>
        <View style={styles.passwordWrap}><TextInput style={styles.passwordInput} value={password} onChangeText={setPassword} secureTextEntry={!showPassword} autoComplete={mode === 'login' ? 'current-password' : 'new-password'} placeholder={mode === 'register' ? 'At least 8 characters' : 'Enter password'} placeholderTextColor="#99A9B4" accessibilityLabel="Password" /><Pressable onPress={() => setShowPassword(v => !v)} accessibilityLabel={showPassword ? 'Hide password' : 'Show password'}><Text style={styles.showText}>{showPassword ? 'Hide' : 'Show'}</Text></Pressable></View>
        {mode === 'register' && <><Text style={[styles.label, { marginTop: 18 }]}>Confirm password</Text><TextInput style={styles.input} value={confirm} onChangeText={setConfirm} secureTextEntry={!showPassword} placeholder="Repeat password" accessibilityLabel="Confirm password" /></>}
        <Pressable style={[styles.primary, { marginTop: 24 }, busy && { opacity: .5 }]} onPress={submit} disabled={busy}><Text style={styles.primaryText}>{busy ? 'Please wait…' : mode === 'login' ? 'Log in' : 'Create account'}</Text></Pressable>
      </View>
      <Text style={styles.authNotice}>Private to this device · No cloud sync or password recovery</Text>
      <Text style={styles.credit}>Developer Samuel Ochoche Peter</Text>
      <Text style={styles.creditSub}>CodeAlpha Internship Student</Text>
    </ScrollView>
  </KeyboardAvoidingView>;
}

function FitnessTracker({ user, onLogout }: { user: User; onLogout: () => void }) {
  const db = useSQLiteContext();
  const [tab, setTab] = useState<Tab>('Today');
  const [items, setItems] = useState<Activity[]>([]);
  const [goal, updateGoal] = useState(150);
  const [goalText, setGoalText] = useState('150');
  const [form, setForm] = useState<ActivityInput>(blankForm);
  const [editingId, setEditingId] = useState<number | undefined>();
  const [busy, setBusy] = useState(false);

  const refresh = useCallback(async () => {
    try {
      const [rows, minutes] = await Promise.all([listActivities(db, user.id), getGoal(db, user.id)]);
      setItems(rows);
      updateGoal(minutes);
      setGoalText(String(minutes));
    } catch (err) { Alert.alert('Could not load data', String(err)); }
  }, [db, user.id]);
  useFocusEffect(useCallback(() => { void refresh(); }, [refresh]));

  const today = localDate();
  const dates = weekDates();
  const todayItems = items.filter(x => x.date === today);
  const weekItems = items.filter(x => dates.includes(x.date));
  const total = (rows: Activity[], key: 'minutes' | 'calories' | 'steps') => rows.reduce((sum, row) => sum + row[key], 0);
  const weekMinutes = total(weekItems, 'minutes');
  const progress = Math.min(weekMinutes / goal, 1);
  const dailyMinutes = dates.map(date => total(items.filter(x => x.date === date), 'minutes'));
  const maxDaily = Math.max(30, ...dailyMinutes);

  const submit = async () => {
    const date = form.date.trim();
    const parsedDate = new Date(`${date}T12:00:00`);
    if (!/^\d{4}-\d{2}-\d{2}$/.test(date) || Number.isNaN(parsedDate.getTime()) || localDate(parsedDate) !== date || date > today) {
      Alert.alert('Check date', 'Enter a valid date up to today in YYYY-MM-DD format.'); return;
    }
    if (form.minutes + form.calories + form.steps === 0) { Alert.alert('Add activity', 'Enter minutes, calories, or steps.'); return; }
    if (form.minutes > 1440 || form.steps > 100000 || form.calories > 20000) { Alert.alert('Check numbers', 'One of the values looks too high.'); return; }
    setBusy(true);
    try {
      await saveActivity(db, user.id, { ...form, date, notes: form.notes.trim() }, editingId);
      setForm(blankForm()); setEditingId(undefined); await refresh(); setTab('Today');
    } catch (err) { Alert.alert('Could not save', String(err)); }
    finally { setBusy(false); }
  };

  const edit = (item: Activity) => {
    setForm({ date: item.date, type: item.type, minutes: item.minutes, calories: item.calories, steps: item.steps, notes: item.notes });
    setEditingId(item.id); setTab('Log');
  };
  const remove = (item: Activity) => Alert.alert('Delete entry?', `${item.type} on ${item.date} will be removed.`, [
    { text: 'Cancel', style: 'cancel' }, { text: 'Delete', style: 'destructive', onPress: async () => {
      try { await deleteActivity(db, user.id, item.id); await refresh(); } catch (err) { Alert.alert('Could not delete', String(err)); }
    } }
  ]);
  const saveGoal = async () => {
    const n = Number(goalText);
    if (!Number.isInteger(n) || n < 1 || n > 10080) { Alert.alert('Invalid goal', 'Enter a whole number from 1 to 10080.'); return; }
    try { await setGoal(db, user.id, n); updateGoal(n); Alert.alert('Goal saved', 'Your weekly goal has been updated.'); }
    catch (err) { Alert.alert('Could not save goal', String(err)); }
  };

  const field = (label: string, value: string, onChange: (text: string) => void, keyboardType: 'numeric' | 'default' = 'default', placeholder = '') => <View style={styles.field}>
    <Text style={styles.label}>{label}</Text><TextInput style={styles.input} value={value} onChangeText={onChange} keyboardType={keyboardType} placeholder={placeholder} placeholderTextColor="#9BA6B7" accessibilityLabel={label} />
  </View>;
  const numberField = (label: string, key: 'minutes' | 'calories' | 'steps') => field(label, form[key] ? String(form[key]) : '', text => setForm(f => ({ ...f, [key]: Number(onlyDigits(text)) || 0 })), 'numeric', '0');
  const activityRow = ({ item }: { item: Activity }) => <View style={styles.entry}>
    <View style={styles.entryIcon}><Text style={styles.entryIconText}>{item.type.slice(0, 1)}</Text></View>
    <View style={{ flex: 1 }}><Text style={styles.entryTitle}>{item.type}</Text><Text style={styles.muted}>{item.date} · {item.minutes} min · {item.steps} steps</Text>{!!item.notes && <Text style={styles.note}>{item.notes}</Text>}</View>
    <View><Pressable onPress={() => edit(item)} accessibilityLabel={`Edit ${item.type}`}><Text style={styles.link}>Edit</Text></Pressable><Pressable onPress={() => remove(item)} accessibilityLabel={`Delete ${item.type}`}><Text style={[styles.link, { color: c.danger, marginTop: 12 }]}>Delete</Text></Pressable></View>
  </View>;

  return <View style={styles.root}>
    <View style={styles.header}><View><Text style={styles.eyebrow}>YOUR FITNESS SPACE</Text><Text style={styles.title}>pulse<Text style={{ color: c.green }}>log.</Text></Text></View><View style={styles.avatar}><Text style={styles.avatarText}>{user.name.slice(0, 1).toUpperCase()}</Text></View></View>
    {tab === 'Today' && <ScrollView contentContainerStyle={styles.content}>
      <View style={styles.greeting}><Text style={styles.pageHeading}>Hi, {user.name.split(' ')[0]} 👋</Text><Text style={styles.muted}>Every move counts. Keep your momentum going.</Text></View>
      <View style={styles.hero}><View style={styles.heroOrb} /><Text style={styles.heroSmall}>TODAY’S MOVEMENT · {today}</Text><Text style={styles.heroNumber}>{total(todayItems, 'minutes')} <Text style={styles.heroUnit}>min</Text></Text><Text style={styles.heroFoot}>Active time today</Text><View style={styles.heroBadge}><Text style={styles.heroBadgeText}>✦  {todayItems.length} {todayItems.length === 1 ? 'activity' : 'activities'} logged</Text></View></View>
      <View style={styles.metrics}><View style={styles.metric}><Text style={styles.metricNum}>{total(todayItems, 'steps').toLocaleString()}</Text><Text style={styles.metricLabel}>↗  Steps logged</Text></View><View style={styles.metric}><Text style={styles.metricNum}>{total(todayItems, 'calories').toLocaleString()}</Text><Text style={styles.metricLabel}>✦  Calories logged</Text></View></View>
      <View style={styles.card}><Text style={styles.sectionKicker}>KEEP IT UP</Text><View style={styles.row}><Text style={styles.sectionTitle}>Weekly goal</Text><Text style={styles.green}>{Math.round(progress * 100)}%</Text></View><Text style={styles.muted}>{weekMinutes} of {goal} active minutes</Text><View style={styles.track}><View style={[styles.fill, { width: `${progress * 100}%` }]} /></View><Text style={styles.hint}>Monday to Sunday · Includes logged exercise minutes</Text></View>
      <View style={styles.card}><Text style={styles.sectionKicker}>YOUR RHYTHM</Text><Text style={styles.sectionTitle}>This week</Text><View style={styles.chart}>{dailyMinutes.map((n, i) => <View key={dates[i]} style={styles.barColumn}><Text style={styles.barValue}>{n || ''}</Text><View style={styles.barTrack}><View style={[styles.bar, { height: `${Math.max(n ? 8 : 0, n / maxDaily * 100)}%` }]} /></View><Text style={styles.barLabel}>{dayNames[i]}</Text></View>)}</View></View>
      <Pressable style={styles.primary} onPress={() => { setEditingId(undefined); setForm(blankForm()); setTab('Log'); }}><Text style={styles.primaryText}>+ Log an activity</Text></Pressable>
      <Text style={styles.hint}>All values are entered manually. Calories are not estimated by this app.</Text>
      <View style={styles.dashboardCredit}><Text style={styles.credit}>Developer Samuel Ochoche Peter</Text><Text style={styles.creditSub}>CodeAlpha Internship Student</Text></View>
    </ScrollView>}
    {tab === 'Log' && <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled"><Text style={styles.pageHeading}>{editingId ? 'Edit activity' : 'Log activity'}</Text><Text style={styles.muted}>Record an exercise session or manually entered steps.</Text>
      {field('Date (YYYY-MM-DD)', form.date, date => setForm(f => ({ ...f, date })), 'default', '2026-10-01')}
      <Text style={styles.label}>Activity type</Text><View style={styles.chips}>{types.map(type => <Pressable key={type} onPress={() => setForm(f => ({ ...f, type }))} style={[styles.chip, form.type === type && styles.chipSelected]}><Text style={[styles.chipText, form.type === type && styles.chipTextSelected]}>{type}</Text></Pressable>)}</View>
      {numberField('Duration (minutes)', 'minutes')}{numberField('Calories burned (manual entry)', 'calories')}{numberField('Steps (manual entry)', 'steps')}
      {field('Notes (optional)', form.notes, notes => setForm(f => ({ ...f, notes })), 'default', 'How did it go?')}
      <Pressable style={[styles.primary, busy && { opacity: .5 }]} disabled={busy} onPress={submit}><Text style={styles.primaryText}>{editingId ? 'Save changes' : 'Save activity'}</Text></Pressable>
      {!!editingId && <Pressable onPress={() => { setEditingId(undefined); setForm(blankForm()); }}><Text style={[styles.link, { textAlign: 'center', marginTop: 18 }]}>Cancel editing</Text></Pressable>}
    </ScrollView>}
    {tab === 'History' && <FlatList data={items} keyExtractor={item => String(item.id)} renderItem={activityRow} contentContainerStyle={styles.content} ListHeaderComponent={<><Text style={styles.pageHeading}>Activity history</Text><Text style={[styles.muted, { marginBottom: 18 }]}>{items.length} saved entries · newest first</Text></>} ListEmptyComponent={<View style={styles.card}><Text style={styles.sectionTitle}>No activities yet</Text><Text style={styles.muted}>Log your first activity to see it here.</Text></View>} />}
    {tab === 'Goals' && <ScrollView contentContainerStyle={styles.content}><Text style={styles.pageHeading}>Your goal</Text><View style={styles.card}><Text style={styles.sectionTitle}>Weekly active minutes</Text><Text style={styles.muted}>Set a personal target for the Monday–Sunday chart.</Text>{field('Minutes per week', goalText, text => setGoalText(onlyDigits(text)), 'numeric', '150')}<Pressable style={styles.primary} onPress={saveGoal}><Text style={styles.primaryText}>Save goal</Text></Pressable></View><View style={styles.card}><Text style={styles.sectionTitle}>Account</Text><Text style={styles.muted}>{user.name} · {user.email}</Text><Pressable onPress={onLogout} style={{ marginTop: 16 }}><Text style={styles.link}>Log out</Text></Pressable></View><View style={styles.card}><Text style={styles.sectionTitle}>About your data</Text><Text style={styles.muted}>Each account's workouts and goal are stored separately on this device. There is no cloud sync or password recovery. Removing the app may erase all accounts and data.</Text></View></ScrollView>}
    <View style={styles.nav}>{(['Today', 'Log', 'History', 'Goals'] as Tab[]).map(name => <Pressable key={name} style={styles.navItem} onPress={() => setTab(name)} accessibilityRole="tab" accessibilityState={{ selected: tab === name }}><Text style={[styles.navIcon, tab === name && styles.navActive]}>{({ Today: '◉', Log: '＋', History: '▤', Goals: '◎' } as Record<Tab, string>)[name]}</Text><Text style={[styles.navText, tab === name && styles.navActive]}>{name}</Text></Pressable>)}</View>
  </View>;
}

const styles = StyleSheet.create({
  authRoot: { flex: 1, backgroundColor: '#EDF3F7' },
  authContent: { flexGrow: 1, paddingBottom: 36 },
  authBrand: { width: 39, height: 39, borderRadius: 12, backgroundColor: '#55D9B9', alignItems: 'center', justifyContent: 'center', marginRight: 10 },
  authLogo: { fontSize: 24, color: '#10394B', fontWeight: '900' },
  authTitle: { fontSize: 24, fontWeight: '900', color: c.ink, marginTop: 3, marginBottom: 6 },
  authCard: { backgroundColor: c.surface, borderRadius: 25, padding: 21, marginTop: -42, marginHorizontal: 17, marginBottom: 16, elevation: 6, shadowColor: '#123D52', shadowOpacity: .14, shadowRadius: 16, shadowOffset: { width: 0, height: 8 } },
  authNotice: { textAlign: 'center', color: c.muted, fontSize: 11, marginTop: 6, marginBottom: 22 },
  credit: { textAlign: 'center', color: c.ink, fontSize: 12, fontWeight: '800' },
  creditSub: { textAlign: 'center', color: c.green, fontSize: 11, fontWeight: '700', marginTop: 4 },
  dashboardCredit: { paddingVertical: 24 },
  root: { flex: 1, backgroundColor: c.background, paddingTop: Platform.OS === 'android' ? 45 : 58 }, header: { paddingHorizontal: 22, paddingBottom: 15, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }, eyebrow: { fontSize: 10, fontWeight: '800', letterSpacing: 2, color: c.blue }, title: { fontSize: 26, fontWeight: '900', color: c.ink, marginTop: 3, letterSpacing: -.7 }, muted: { color: c.muted, fontSize: 13, lineHeight: 20 }, content: { padding: 20, paddingBottom: 34 }, hero: { borderRadius: 24, padding: 24, backgroundColor: '#153E53', overflow: 'hidden', minHeight: 195 }, heroSmall: { color: '#9CE3D1', fontSize: 11, letterSpacing: 1.5, fontWeight: '800' }, heroNumber: { color: '#FFFFFF', fontSize: 48, fontWeight: '900', marginTop: 16 }, heroUnit: { fontSize: 18, fontWeight: '700', color: '#BBD6DC' }, heroFoot: { color: '#BBD6DC', marginTop: 1 }, metrics: { flexDirection: 'row', gap: 12, marginVertical: 14 }, metric: { flex: 1, backgroundColor: c.surface, borderRadius: 19, padding: 17, borderWidth: 1, borderColor: '#E8F0F1' }, metricNum: { fontSize: 25, fontWeight: '900', color: c.ink, marginBottom: 4 }, card: { backgroundColor: c.surface, borderRadius: 20, padding: 19, marginBottom: 14, borderWidth: 1, borderColor: '#E8F0F1' }, row: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }, sectionTitle: { fontSize: 17, color: c.ink, fontWeight: '800', marginBottom: 6 }, green: { fontWeight: '800', color: c.green }, track: { height: 11, borderRadius: 10, backgroundColor: c.pale, overflow: 'hidden', marginTop: 18 }, fill: { height: '100%', backgroundColor: c.green, borderRadius: 10 }, hint: { fontSize: 11, color: c.muted, marginTop: 12, lineHeight: 17 }, chart: { flexDirection: 'row', justifyContent: 'space-between', height: 142, marginTop: 14 }, barColumn: { flex: 1, alignItems: 'center' }, barValue: { color: c.muted, fontSize: 10, height: 17 }, barTrack: { width: 21, flex: 1, justifyContent: 'flex-end', backgroundColor: c.background, borderRadius: 7, overflow: 'hidden' }, bar: { backgroundColor: c.green, borderRadius: 7, width: '100%' }, barLabel: { fontSize: 11, color: c.muted, marginTop: 7 }, primary: { backgroundColor: c.green, padding: 17, borderRadius: 14, alignItems: 'center', marginTop: 5 }, primaryText: { color: '#FFFFFF', fontWeight: '800', fontSize: 15 }, pageHeading: { fontSize: 25, fontWeight: '900', color: c.ink, marginBottom: 4 }, field: { marginTop: 17, marginBottom: 3 }, label: { fontWeight: '700', color: c.ink, marginBottom: 9, marginTop: 2 }, input: { backgroundColor: '#F8FAFB', borderWidth: 1, borderColor: c.border, borderRadius: 12, paddingHorizontal: 14, paddingVertical: 13, color: c.ink, fontSize: 16 }, chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 3 }, chip: { backgroundColor: c.surface, borderColor: c.border, borderWidth: 1, paddingHorizontal: 12, paddingVertical: 9, borderRadius: 18 }, chipSelected: { backgroundColor: c.green, borderColor: c.green }, chipText: { color: c.muted, fontWeight: '700' }, chipTextSelected: { color: '#FFFFFF' }, entry: { flexDirection: 'row', alignItems: 'center', gap: 12, padding: 14, marginBottom: 10, borderRadius: 16, backgroundColor: c.surface, borderWidth: 1, borderColor: '#E8F0F1' }, entryIcon: { backgroundColor: '#DDF5EA', width: 39, height: 39, borderRadius: 13, alignItems: 'center', justifyContent: 'center' }, entryIconText: { color: c.green, fontWeight: '900', fontSize: 18 }, entryTitle: { fontSize: 15, color: c.ink, fontWeight: '800', marginBottom: 3 }, note: { color: c.muted, marginTop: 4, fontSize: 12 }, link: { color: c.green, fontWeight: '700', fontSize: 12 }, nav: { flexDirection: 'row', backgroundColor: c.surface, borderTopWidth: 1, borderColor: c.border, paddingBottom: Platform.OS === 'ios' ? 20 : 8, paddingTop: 12 }, navItem: { flex: 1, alignItems: 'center', gap: 7 }, navText: { fontSize: 12, color: c.muted, fontWeight: '700' }, navActive: { color: c.green }, navDot: { height: 4, width: 4, borderRadius: 4, backgroundColor: 'transparent' },
  authHero: { backgroundColor: '#102E45', paddingTop: Platform.OS === 'ios' ? 66 : 54, paddingHorizontal: 27, paddingBottom: 77, overflow: 'hidden' },
  authOrb: { position: 'absolute', width: 245, height: 245, borderRadius: 125, right: -80, top: -80, borderWidth: 44, borderColor: '#1B4960' },
  brandLine: { flexDirection: 'row', alignItems: 'center', marginBottom: 33 },
  brandName: { color: '#FFFFFF', fontSize: 24, fontWeight: '900' },
  authKicker: { color: '#68E1C2', fontSize: 10, fontWeight: '900', letterSpacing: 2, marginBottom: 12 },
  authHeroTitle: { color: '#FFFFFF', fontSize: 31, lineHeight: 39, fontWeight: '900', maxWidth: 310 },
  authHeroBody: { color: '#BCD0DC', fontSize: 13, lineHeight: 20, marginTop: 11, maxWidth: 280 },
  authTabs: { flexDirection: 'row', backgroundColor: '#EFF4F5', padding: 4, borderRadius: 12, marginBottom: 24 },
  authTab: { flex: 1, alignItems: 'center', paddingVertical: 11, borderRadius: 10 },
  authTabActive: { backgroundColor: '#FFFFFF', elevation: 2 },
  authTabText: { color: '#728A97', fontSize: 13, fontWeight: '700' },
  authTabTextActive: { color: '#174157', fontWeight: '900' },
  authSubtitle: { color: c.muted, fontSize: 13, marginBottom: 21 },
  successBox: { backgroundColor: '#E5F7EF', padding: 12, borderRadius: 11, marginBottom: 12 },
  successText: { color: '#117956', fontSize: 12, fontWeight: '700', lineHeight: 18 },
  errorBox: { backgroundColor: '#FFF0F0', padding: 12, borderRadius: 11, marginBottom: 12 },
  errorText: { color: '#AF3442', fontSize: 12, fontWeight: '700', lineHeight: 18 },
  passwordWrap: { backgroundColor: '#F8FAFB', borderWidth: 1, borderColor: c.border, borderRadius: 12, flexDirection: 'row', alignItems: 'center', paddingRight: 15 },
  passwordInput: { flex: 1, paddingHorizontal: 14, paddingVertical: 13, fontSize: 16, color: c.ink },
  showText: { color: c.green, fontSize: 12, fontWeight: '800' },
  avatar: { width: 42, height: 42, borderRadius: 14, backgroundColor: '#DDF5EA', justifyContent: 'center', alignItems: 'center' },
  avatarText: { color: c.green, fontWeight: '900', fontSize: 19 },
  greeting: { marginBottom: 18 },
  heroOrb: { width: 205, height: 205, borderRadius: 105, position: 'absolute', top: -63, right: -60, borderWidth: 34, borderColor: '#205367' },
  heroBadge: { alignSelf: 'flex-start', backgroundColor: '#286379', paddingVertical: 7, paddingHorizontal: 12, borderRadius: 20, marginTop: 18 },
  heroBadgeText: { color: '#D7F8E9', fontWeight: '800', fontSize: 11 },
  metricLabel: { color: c.green, fontSize: 11, fontWeight: '800' },
  sectionKicker: { color: c.green, fontSize: 9, fontWeight: '900', letterSpacing: 1.8, marginBottom: 7 },
  navIcon: { color: c.muted, fontSize: 19, fontWeight: '800' },
});
