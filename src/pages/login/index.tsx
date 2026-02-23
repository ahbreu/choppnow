import React, { useEffect, useState } from "react";
import { Image, Text, TextInput, TouchableOpacity, View } from "react-native";
import { useGoogleRequest } from "../../services/auth/google";
import Logo from "../../assets/logo.png";
import { style } from "./styles";

type LoginStep = "email" | "password";
type LoginProps = {
    onContinueAsGuest?: () => void;
};

export default function Login({ onContinueAsGuest }: LoginProps) {
    const { request, response, promptAsync } = useGoogleRequest();
    const [step, setStep] = useState<LoginStep>("email");
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");

    useEffect(() => {
        if (response?.type === "success") {
            console.log("Google auth success", response);
        }
    }, [response]);

    function handleContinueWithEmail() {
        setStep("password");
    }

    function handleBackToEmail() {
        setStep("email");
        setPassword("");
    }

    function handleContinueAsGuest() {
        onContinueAsGuest?.();
    }

    return (
        <View style={style.container}>
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
                            disabled={!request}
                            onPress={() => promptAsync()}
                        >
                            <Text style={style.secondaryButtonText}>Continuar com Google</Text>
                        </TouchableOpacity>

                        <TouchableOpacity style={style.guestButton} onPress={handleContinueAsGuest}>
                            <Text style={style.guestButtonText}>Continuar sem login</Text>
                        </TouchableOpacity>
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

                        <TouchableOpacity style={style.primaryButton}>
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
