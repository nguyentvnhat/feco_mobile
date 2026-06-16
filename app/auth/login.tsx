import { router } from 'expo-router';
import { Image } from 'expo-image';
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
import { authService, useAuth } from '@/src/features/auth';

export default function LoginScreen() {
  const { setSession } = useAuth();
  const { t } = useTranslation();
  const [loginInput, setLoginInput] = useState('');
  const [password, setPassword] = useState('');
  const [loginError, setLoginError] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [formError, setFormError] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleSignIn() {
    setLoginError('');
    setPasswordError('');
    setFormError('');

    let valid = true;
    if (!loginInput.trim()) {
      setLoginError(t('auth.login.errors.loginRequired'));
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
        login: loginInput.trim(),
        password,
      });

      if (response.success && response.token) {
        await setSession(response.token, response.refreshToken);
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
    <SafeAreaView className="flex-1 bg-white">
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        className="flex-1">
        <ScrollView
          keyboardShouldPersistTaps="handled"
          className="flex-1"
          contentContainerStyle={{ flexGrow: 1, justifyContent: 'center' }}>
          <View className="mx-auto w-full max-w-md px-6 py-10">
            <Image
              source={require('@/assets/images/logo.png')}
              contentFit="contain"
              style={{ width: 180, height: 84, alignSelf: 'center', marginTop: 24 }}
            />
            <Text className="mt-2 text-center text-sm text-slate-600">
              {t('auth.login.subtitle')}
            </Text>

            <View className="mt-10 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm shadow-slate-900/5">
              <View>
                <Text className="mb-1.5 text-xs font-medium uppercase tracking-wide text-slate-500">
                  {t('auth.login.loginLabel')}
                </Text>
                <TextInput
                  className={`rounded-lg border bg-white px-3 py-3 text-base text-slate-900 placeholder:text-slate-400 ${
                    loginError ? 'border-red-500' : 'border-slate-200'
                  }`}
                  placeholder={t('auth.login.loginPlaceholder')}
                  autoFocus
                  keyboardType="default"
                  autoCapitalize="none"
                  autoCorrect={false}
                  editable={!loading}
                  value={loginInput}
                  onChangeText={(t) => {
                    setLoginInput(t);
                    if (loginError) setLoginError('');
                  }}
                />
                {loginError ? (
                  <Text className="mt-1.5 text-sm text-red-600">{loginError}</Text>
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
                  loading ? 'bg-green-300' : 'bg-green-500 active:bg-green-600'
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
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
