import { router } from 'expo-router';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { authService } from '@/src/features/auth/auth.service';

export default function LoginScreen() {
  const { t } = useTranslation();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [emailError, setEmailError] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [formError, setFormError] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleSignIn() {
    setEmailError('');
    setPasswordError('');
    setFormError('');

    let valid = true;
    if (!email.trim()) {
      setEmailError(t('auth.login.errors.emailRequired'));
      valid = false;
    }
    if (!password) {
      setPasswordError(t('auth.login.errors.passwordRequired'));
      valid = false;
    }
    if (!valid) return;

    setLoading(true);
    try {
      const response = await authService.login({
        login: email.trim(),
        password,
      });

      if (response.success) {
        router.replace('/(main)');
        return;
      }

      setFormError(response.message || t('auth.login.errors.signInFailed'));
    } catch {
      setFormError(t('auth.login.errors.unknown'));
    } finally {
      setLoading(false);
    }
  }

  return (
    <SafeAreaView className="flex-1 bg-slate-100">
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        className="flex-1">
        <ScrollView
          keyboardShouldPersistTaps="handled"
          className="flex-1"
          contentContainerStyle={{ flexGrow: 1, justifyContent: 'center' }}>
          <View className="mx-auto w-full max-w-md px-6 py-10">
            <Text className="text-center text-2xl font-semibold tracking-tight text-slate-900">
              {t('auth.login.title')}
            </Text>
            <Text className="mt-2 text-center text-sm text-slate-600">
              {t('auth.login.subtitle')}
            </Text>

            <View className="mt-10 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm shadow-slate-900/5">
              <View>
                <Text className="mb-1.5 text-xs font-medium uppercase tracking-wide text-slate-500">
                  {t('auth.login.emailLabel')}
                </Text>
                <TextInput
                  className={`rounded-lg border bg-white px-3 py-3 text-base text-slate-900 placeholder:text-slate-400 ${
                    emailError ? 'border-red-500' : 'border-slate-200'
                  }`}
                  placeholder={t('auth.login.emailPlaceholder')}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  autoCorrect={false}
                  editable={!loading}
                  value={email}
                  onChangeText={(t) => {
                    setEmail(t);
                    if (emailError) setEmailError('');
                  }}
                />
                {emailError ? (
                  <Text className="mt-1.5 text-sm text-red-600">{emailError}</Text>
                ) : null}
              </View>

              <View className="mt-5">
                <Text className="mb-1.5 text-xs font-medium uppercase tracking-wide text-slate-500">
                  {t('auth.login.passwordLabel')}
                </Text>
                <TextInput
                  className={`rounded-lg border bg-white px-3 py-3 text-base text-slate-900 placeholder:text-slate-400 ${
                    passwordError ? 'border-red-500' : 'border-slate-200'
                  }`}
                  placeholder={t('auth.login.passwordPlaceholder')}
                  secureTextEntry
                  editable={!loading}
                  value={password}
                  onChangeText={(t) => {
                    setPassword(t);
                    if (passwordError) setPasswordError('');
                  }}
                />
                {passwordError ? (
                  <Text className="mt-1.5 text-sm text-red-600">{passwordError}</Text>
                ) : null}
              </View>

              <Pressable
                className={`mt-8 items-center justify-center rounded-lg py-3.5 ${
                  loading ? 'bg-slate-400' : 'bg-slate-900 active:bg-slate-800'
                }`}
                disabled={loading}
                onPress={handleSignIn}>
                {loading ? (
                  <ActivityIndicator color="#f8fafc" />
                ) : (
                  <Text className="text-base font-semibold text-white">{t('auth.login.submit')}</Text>
                )}
              </Pressable>
              {formError ? <Text className="mt-3 text-sm text-red-600">{formError}</Text> : null}
            </View>

            <Text className="mt-8 text-center text-xs text-slate-500">
              {t('auth.login.internalOnly')}
            </Text>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
