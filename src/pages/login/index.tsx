import React, { useEffect, useMemo, useState } from "react";
import { Image, Text, TextInput, TouchableOpacity, View } from "react-native";
import ThemeToggle from "../../components/theme-toggle";
import { AppTheme, ThemeMode } from "../../global/themes";
import Logo from "../../assets/logo.png";
import { createStyles } from "./styles";

type LoginStep = "email" | "password";
type LoginHelperAccount = {
  id: string;
  name: string;
  email: string;
  password: string;
};

type LoginProps = {
  onContinueAsGuest?: () => void;
  onSignIn?: (email: string, password: string) => boolean | Promise<boolean>;
  onSignInWithGoogle?: () => void;
  helperAccounts?: LoginHelperAccount[];
  canSignInWithGoogle?: boolean;
  isGoogleLoading?: boolean;
  googleStatusMessage?: string | null;
  authStatusMessage?: string | null;
  theme: AppTheme;
  themeMode: ThemeMode;
  onToggleTheme?: () => void;
};

export default function Login({
  onContinueAsGuest,
  onSignIn,
  onSignInWithGoogle,
  helperAccounts = [],
  canSignInWithGoogle = false,
  isGoogleLoading = false,
  googleStatusMessage = null,
  authStatusMessage = null,
  theme,
  themeMode,
  onToggleTheme,
}: LoginProps) {
  const [step, setStep] = useState<LoginStep>("email");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const style = useMemo(() => createStyles(theme), [theme]);

  function handleContinueWithEmail() {
    setError("");
    setStep("password");
  }

  function handleBackToEmail() {
    setStep("email");
    setPassword("");
    setError("");
  }

  function handleContinueAsGuest() {
    setError("");
    onContinueAsGuest?.();
  }

  function handleGoogleSignIn() {
    setError("");
    onSignInWithGoogle?.();
  }

  async function handleSignIn() {
    const signedIn = await onSignIn?.(email, password);
    if (!signedIn) {
      setError("Credenciais invalidas. Use uma das contas de teste.");
    }
  }

  const googleButtonLabel = isGoogleLoading
    ? "Conectando com Google..."
    : canSignInWithGoogle
      ? "Continuar com Google"
      : "Google indisponivel";

  return (
    <View style={style.container}>
      <ThemeToggle theme={theme} mode={themeMode} onToggle={onToggleTheme} />

      <View style={style.topPanel}>
        <Image source={Logo} style={style.logo} resizeMode="contain" />
      </View>

      <View style={style.loginPanel}>
        {step === "email" ? (
          <>
            <Text style={style.title}>Entrar na Choppnow</Text>
            <Text style={style.subtitle}>Use seu e-mail para continuar</Text>

            <TextInput
              placeholder="Seu e-mail"
              placeholderTextColor={style.placeholder.color}
              style={style.input}
              value={email}
              onChangeText={setEmail}
              keyboardType="email-address"
              autoCapitalize="none"
              autoCorrect={false}
            />

            <TouchableOpacity style={style.primaryButton} onPress={handleContinueWithEmail}>
              <Text style={style.primaryButtonText}>Continuar com e-mail</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={style.secondaryButton}
              disabled={!canSignInWithGoogle || isGoogleLoading}
              onPress={handleGoogleSignIn}
            >
              <Text style={style.secondaryButtonText}>{googleButtonLabel}</Text>
            </TouchableOpacity>

            {googleStatusMessage ? <Text style={style.helperText}>{googleStatusMessage}</Text> : null}
            {authStatusMessage ? <Text style={style.helperText}>{authStatusMessage}</Text> : null}

            <TouchableOpacity style={style.guestButton} onPress={handleContinueAsGuest}>
              <Text style={style.guestButtonText}>Continuar sem login</Text>
            </TouchableOpacity>

            <View style={style.helperCard}>
              <Text style={style.helperTitle}>Contas de teste</Text>
              {helperAccounts.length > 0 ? (
                helperAccounts.map((account) => (
                  <Text key={account.id} style={style.helperText}>
                    {account.name}: {account.email} / {account.password}
                  </Text>
                ))
              ) : (
                <>
                  <Text style={style.helperText}>Comprador: pedro@choppnow.app / pedro123</Text>
                  <Text style={style.helperText}>Vendedor: apoena@choppnow.app / apoena123</Text>
                </>
              )}
            </View>
          </>
        ) : (
          <>
            <Text style={style.title}>Digite sua senha</Text>
            <Text style={style.subtitle}>{email || "Seu e-mail"}</Text>

            <TextInput
              placeholder="Sua senha"
              placeholderTextColor={style.placeholder.color}
              style={style.input}
              value={password}
              onChangeText={setPassword}
              secureTextEntry
            />

            {error ? <Text style={style.errorText}>{error}</Text> : null}
            {!error && authStatusMessage ? <Text style={style.errorText}>{authStatusMessage}</Text> : null}

            <TouchableOpacity style={style.primaryButton} onPress={handleSignIn}>
              <Text style={style.primaryButtonText}>Entrar</Text>
            </TouchableOpacity>

            <TouchableOpacity style={style.backButton} onPress={handleBackToEmail}>
              <Text style={style.backButtonText}>Voltar</Text>
            </TouchableOpacity>
          </>
        )}
      </View>
    </View>
  );
}
