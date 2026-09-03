import React from 'react';
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
  View,
  StyleSheet,
} from 'react-native';
import { useFocusEffect, useRouter } from 'expo-router';
import { Eye, EyeOff, HardHat, LogOut, Package, User as UserIcon, UserPlus } from 'lucide-react-native';
import { buyerDemoLogin, buyerLogin, buyerLogout, buyerRegister, getStoredBuyer, type BuyerUser } from '../../src/lib/buyer-auth';
import { colors, radius, shadow } from '../../src/theme';

// Espejo de packages/frontend/src/app/account/page.tsx +
// account/register/page.tsx (ver ADR-006), unificados en una sola pantalla:
// la tab "Perfil" es el único lugar de auth en el árbol de mobile (el Header
// ya asume esto — ver su comentario), así que en vez de sumar rutas nuevas
// (app/account/*) se extiende esta misma pantalla con un toggle login/registro,
// siguiendo el patrón que ya tenía (antes con login demo de CompanyUser, ahora
// con la cuenta real de comprador). Reemplaza el login demo de CompanyUser que
// tenía este archivo (ver CHANGELOG 0.6.0) — mobile es solo el flujo de
// comprador, no tiene pantallas de backoffice que dependan de esa sesión.
type Mode = 'login' | 'register';

export default function ProfileScreen() {
  const router = useRouter();
  const [buyer, setBuyer] = React.useState<BuyerUser | null | undefined>(undefined);
  const [mode, setMode] = React.useState<Mode>('login');

  const [firstName, setFirstName] = React.useState('');
  const [lastName, setLastName] = React.useState('');
  const [email, setEmail] = React.useState('');
  const [password, setPassword] = React.useState('');
  const [showPwd, setShowPwd] = React.useState(false);
  const [error, setError] = React.useState('');
  const [loading, setLoading] = React.useState(false);
  const [demoLoading, setDemoLoading] = React.useState(false);

  const refresh = React.useCallback(() => {
    getStoredBuyer().then(setBuyer);
  }, []);

  useFocusEffect(
    React.useCallback(() => {
      refresh();
    }, [refresh]),
  );

  async function handleSubmit() {
    setError('');
    setLoading(true);
    try {
      if (mode === 'login') {
        await buyerLogin(email, password);
      } else {
        await buyerRegister({ firstName, lastName, email, password });
      }
      refresh();
    } catch (err: any) {
      setError(err?.response?.data?.message ?? (mode === 'login' ? 'Credenciales inválidas' : 'No pudimos crear tu cuenta'));
    } finally {
      setLoading(false);
    }
  }

  async function handleDemoLogin() {
    setError('');
    setDemoLoading(true);
    try {
      await buyerDemoLogin('comprador@obraya.com');
      refresh();
    } catch (err: any) {
      setError(err?.response?.data?.message ?? 'Login demo falló');
    } finally {
      setDemoLoading(false);
    }
  }

  async function handleLogout() {
    await buyerLogout();
    refresh();
  }

  if (buyer === undefined) {
    return (
      <View style={styles.screen}>
        <ActivityIndicator color={colors.primary} style={{ marginTop: 60 }} />
      </View>
    );
  }

  if (buyer) {
    return (
      <View style={styles.screen}>
        <View style={styles.content}>
          <View style={styles.avatar}>
            <UserIcon size={32} color={colors.primary} />
          </View>
          <Text style={styles.name}>{buyer.firstName} {buyer.lastName}</Text>
          <Text style={styles.email}>{buyer.email}</Text>

          <TouchableOpacity style={styles.ordersBtn} onPress={() => router.push('/(tabs)/my-orders')}>
            <Package size={16} color={colors.slate700} />
            <Text style={styles.ordersText}>Mis pedidos</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.logoutBtn} onPress={handleLogout}>
            <LogOut size={16} color={colors.red500} />
            <Text style={styles.logoutText}>Cerrar sesión</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  return (
    <KeyboardAvoidingView style={styles.screen} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.logoWrap}>
          {mode === 'login' ? <HardHat size={30} color={colors.white} /> : <UserPlus size={30} color={colors.white} />}
        </View>
        <Text style={styles.title}>{mode === 'login' ? 'Ingresá a tu cuenta' : 'Creá tu cuenta'}</Text>
        <Text style={styles.subtitle}>
          {mode === 'login' ? 'Seguí tus pedidos y comprá más rápido.' : 'Rápido y simple, para hacer seguimiento de tus pedidos.'}
        </Text>

        <View style={styles.card}>
          {mode === 'register' && (
            <View style={styles.row2}>
              <View style={styles.fieldHalf}>
                <Text style={styles.fieldLabel}>Nombre</Text>
                <TextInput
                  value={firstName}
                  onChangeText={setFirstName}
                  placeholder="Juan"
                  placeholderTextColor={colors.slate400}
                  style={styles.input}
                />
              </View>
              <View style={styles.fieldHalf}>
                <Text style={styles.fieldLabel}>Apellido</Text>
                <TextInput
                  value={lastName}
                  onChangeText={setLastName}
                  placeholder="García"
                  placeholderTextColor={colors.slate400}
                  style={styles.input}
                />
              </View>
            </View>
          )}

          <View style={styles.field}>
            <Text style={styles.fieldLabel}>Email</Text>
            <TextInput
              value={email}
              onChangeText={setEmail}
              placeholder="tu@email.com"
              placeholderTextColor={colors.slate400}
              autoCapitalize="none"
              keyboardType="email-address"
              style={styles.input}
            />
          </View>

          <View style={styles.field}>
            <Text style={styles.fieldLabel}>Contraseña</Text>
            <View style={styles.pwdRow}>
              <TextInput
                value={password}
                onChangeText={setPassword}
                placeholder={mode === 'register' ? 'Mínimo 8 caracteres' : '••••••••'}
                placeholderTextColor={colors.slate400}
                secureTextEntry={!showPwd}
                style={[styles.input, { flex: 1 }]}
              />
              <TouchableOpacity style={styles.eyeBtn} onPress={() => setShowPwd((v) => !v)}>
                {showPwd ? <EyeOff size={16} color={colors.slate400} /> : <Eye size={16} color={colors.slate400} />}
              </TouchableOpacity>
            </View>
          </View>

          {error ? <Text style={styles.error}>{error}</Text> : null}

          <TouchableOpacity disabled={loading} style={[styles.submitBtn, loading && styles.btnDisabled]} onPress={handleSubmit}>
            <Text style={styles.submitBtnText}>
              {loading ? (mode === 'login' ? 'Verificando...' : 'Creando cuenta...') : mode === 'login' ? 'Ingresar' : 'Crear cuenta'}
            </Text>
          </TouchableOpacity>

          {mode === 'login' && (
            <TouchableOpacity disabled={demoLoading} style={[styles.demoBtn, demoLoading && styles.btnDisabled]} onPress={handleDemoLogin}>
              <Text style={styles.demoBtnText}>{demoLoading ? 'Entrando...' : 'Probar con cuenta demo'}</Text>
            </TouchableOpacity>
          )}

          <TouchableOpacity style={styles.switchModeBtn} onPress={() => { setError(''); setMode(mode === 'login' ? 'register' : 'login'); }}>
            <Text style={styles.switchModeText}>
              {mode === 'login' ? '¿No tenés cuenta? ' : '¿Ya tenés cuenta? '}
              <Text style={styles.switchModeLink}>{mode === 'login' ? 'Creá una cuenta' : 'Ingresá'}</Text>
            </Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.slate50 },
  content: { flexGrow: 1, alignItems: 'center', padding: 24, paddingTop: 60 },
  avatar: { width: 72, height: 72, borderRadius: 36, backgroundColor: '#fff7ed', alignItems: 'center', justifyContent: 'center', marginBottom: 16 },
  name: { fontSize: 19, fontWeight: '700', color: colors.slate900 },
  email: { fontSize: 13, color: colors.slate500, marginTop: 4 },
  ordersBtn: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 24, backgroundColor: colors.slate100, paddingHorizontal: 20, paddingVertical: 12, borderRadius: 999 },
  ordersText: { color: colors.slate700, fontWeight: '700', fontSize: 13 },
  logoutBtn: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 12, borderWidth: 1, borderColor: '#fecaca', paddingHorizontal: 20, paddingVertical: 12, borderRadius: 999 },
  logoutText: { color: colors.red500, fontWeight: '700', fontSize: 13 },
  logoWrap: { width: 64, height: 64, borderRadius: 20, backgroundColor: colors.primary, alignItems: 'center', justifyContent: 'center', marginBottom: 16, ...shadow.card },
  title: { fontSize: 22, fontWeight: '800', color: colors.slate900, textAlign: 'center' },
  subtitle: { fontSize: 13, color: colors.slate400, marginTop: 4, marginBottom: 24, textAlign: 'center' },
  card: { width: '100%', maxWidth: 360, backgroundColor: colors.white, borderRadius: radius.card, padding: 20, ...shadow.card },
  row2: { flexDirection: 'row', gap: 12 },
  fieldHalf: { flex: 1, marginBottom: 14 },
  field: { marginBottom: 14 },
  fieldLabel: { fontSize: 11, fontWeight: '600', color: colors.slate500, textTransform: 'uppercase', marginBottom: 6, letterSpacing: 0.3 },
  input: { backgroundColor: colors.slate100, borderRadius: 12, paddingHorizontal: 14, paddingVertical: 12, fontSize: 14, color: colors.slate900 },
  pwdRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  eyeBtn: { padding: 8 },
  error: { fontSize: 13, color: colors.red500, backgroundColor: '#fef2f2', borderRadius: 12, padding: 12, marginBottom: 14 },
  submitBtn: { backgroundColor: colors.primary, paddingVertical: 15, borderRadius: 12, alignItems: 'center', marginTop: 2 },
  submitBtnText: { color: colors.white, fontWeight: '700', fontSize: 15 },
  demoBtn: { backgroundColor: colors.slate100, paddingVertical: 13, borderRadius: 12, alignItems: 'center', marginTop: 10 },
  demoBtnText: { color: colors.slate600, fontWeight: '700', fontSize: 13 },
  btnDisabled: { opacity: 0.6 },
  switchModeBtn: { alignItems: 'center', marginTop: 20 },
  switchModeText: { fontSize: 13, color: colors.slate400 },
  switchModeLink: { color: colors.primary, fontWeight: '700' },
});
