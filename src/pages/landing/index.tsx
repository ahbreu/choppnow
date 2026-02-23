import React from "react";
import { ScrollView, Text, TouchableOpacity, View } from "react-native";
import { style } from "./styles";

type Category = {
  id: string;
  label: string;
  short: string;
};

type Store = {
  id: string;
  name: string;
  tag: string;
  short: string;
};

type Beers = {
  id: string;
  name: string;
  tag: string;
  short: string;
};

type LandingProps = {
  onRequestLogin?: () => void;
};

const categories: Category[] = [
  { id: "cervejarias", label: "Cervejarias", short: "CV" },
  { id: "cervejas", label: "Cervejas", short: "CJ" }
];

const stores: Store[] = [
  { id: "1", name: "Apoena Cervejaria", tag: "R$ 5 off", short: "AC" },
  { id: "2", name: "Cruls", tag: "Frete gratis", short: "CR" },
  { id: "3", name: "QuatroPoderes", tag: "Ate R$ 10", short: "QP" },
  { id: "4", name: "Galpão 17", tag: "Combo do dia", short: "G17" },
];

const beers: Beers[] = [
  { id: "1", name: "Cerveja Apoena", tag: "Cerveja nova!", short: "CA" },
  { id: "2", name: "Red IPA", tag: "Frete gratis", short: "RI" },
  { id: "3", name: "Roleta Russa", tag: "Ate R$ 10", short: "RR" },
  { id: "4", name: "Fiapinho", tag: "Combo do dia", short: "FP" },
];

const bottomTabs = [
  { id: "home", label: "Inicio", short: "IN" },
  { id: "search", label: "Busca", short: "BU" },
  { id: "orders", label: "Pedidos", short: "PD" },
  { id: "profile", label: "Perfil", short: "PF" },
];

export default function Landing({ onRequestLogin }: LandingProps) {
  return (
    <View style={style.container}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={style.contentContainer}
      >
        <View style={style.headerRow}>
          <Text style={style.addressText}>Entrega em Asa Sul, Brasilia</Text>
          <TouchableOpacity style={style.notificationButton}>
            <Text style={style.notificationIcon}>NL</Text>
            <View style={style.notificationBadge}>
              <Text style={style.notificationBadgeText}>5</Text>
            </View>
          </TouchableOpacity>
        </View>

        <View style={style.greetingRow}>
          <Text style={style.greetingText}>Ola, visitante</Text>
          <TouchableOpacity style={style.loginChip} onPress={onRequestLogin}>
            <Text style={style.loginChipText}>Entrar</Text>
          </TouchableOpacity>
        </View>

        <Text style={style.guestHelperText}>Voce pode explorar tudo, mas sem finalizar compra.</Text>

        <View style={style.categoriesGrid}>
          {categories.map((item) => (
            <TouchableOpacity key={item.id} style={style.categoryCard}>
              <View style={style.categoryIcon}>
                <Text style={style.categoryIconText}>{item.short}</Text>
              </View>
              <Text style={style.categoryLabel}>{item.label}</Text>
            </TouchableOpacity>
          ))}
        </View>

        <View style={style.bannerCard}>
          <Text style={style.bannerOverline}>choppnow</Text>
          <Text style={style.bannerTitle}>Precos bons para descobrir sua proxima loja favorita</Text>
          <Text style={style.bannerSubtitle}>Ative o login para pedir e acompanhar entregas em tempo real.</Text>
          <TouchableOpacity style={style.bannerButton} onPress={onRequestLogin}>
            <Text style={style.bannerButtonText}>Entrar para comprar</Text>
          </TouchableOpacity>
        </View>

        <View style={style.sectionHeader}>
          <Text style={style.sectionTitle}>Ultimas lojas</Text>
          <TouchableOpacity>
            <Text style={style.sectionAction}>Ver mais</Text>
          </TouchableOpacity>
        </View>

        <View style={style.storeRow}>
          {stores.map((store) => (
            <TouchableOpacity key={store.id} style={style.storeCard}>
              <View style={style.storeLogo}>
                <Text style={style.storeLogoText}>{store.short}</Text>
              </View>
              <Text style={style.storeName}>{store.name}</Text>
              <Text style={style.storeTag}>{store.tag}</Text>
            </TouchableOpacity>
          ))}
        </View>

        <View style={style.sectionHeader}>
          <Text style={style.sectionTitle}>Ultimas cervejas</Text>
          <TouchableOpacity>
            <Text style={style.sectionAction}>Ver mais</Text>
          </TouchableOpacity>
        </View>

        <View style={style.beersRow}>
          {beers.map((store) => (
            <TouchableOpacity key={store.id} style={style.storeCard}>
              <View style={style.storeLogo}>
                <Text style={style.storeLogoText}>{store.short}</Text>
              </View>
              <Text style={style.storeName}>{store.name}</Text>
              <Text style={style.storeTag}>{store.tag}</Text>
            </TouchableOpacity>
          ))}
        </View>
      </ScrollView>

      <View style={style.bottomBar}>
        {bottomTabs.map((tab, index) => {
          const isActive = index === 0;
          return (
            <TouchableOpacity key={tab.id} style={style.bottomItem}>
              <View style={[style.bottomIcon, isActive ? style.bottomIconActive : null]}>
                <Text style={[style.bottomIconText, isActive ? style.bottomIconTextActive : null]}>
                  {tab.short}
                </Text>
              </View>
              <Text style={[style.bottomLabel, isActive ? style.bottomLabelActive : null]}>
                {tab.label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
}
