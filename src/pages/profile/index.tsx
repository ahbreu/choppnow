import React, { useMemo, useState } from "react";
import { ScrollView, Text, TextInput, TouchableOpacity, View } from "react-native";
import AppBottomNav from "../../components/app-bottom-nav";
import ThemeToggle from "../../components/theme-toggle";
import { OrderItemRecord } from "../../data/orders";
import { StoreItem, getAllBeers, getStoreById } from "../../data/stores";
import { UserProfile, demoUsers } from "../../data/users";
import { AppTheme, ThemeMode } from "../../global/themes";
import { createStyles } from "./styles";

export type SellerProductDraft = {
  name: string;
  style: string;
  abv: string;
  price: string;
  description: string;
  ibu: number;
};

type ProfileProps = {
  theme: AppTheme;
  themeMode: ThemeMode;
  onToggleTheme?: () => void;
  currentUser: UserProfile | null;
  storesData: StoreItem[];
  orders: OrderItemRecord[];
  onRequestLogin?: () => void;
  onUseDemoAccount?: (userId: string) => void;
  onSignOut?: () => void;
  onOpenStore?: (storeId: string) => void;
  onOpenBeer?: (beerId: string) => void;
  onAddProduct?: (draft: SellerProductDraft) => void;
  onAdvanceOrder?: (orderId: string) => void;
  onOpenHome?: () => void;
  onOpenSearch?: () => void;
  onOpenOrders?: () => void;
};

export default function Profile({
  theme,
  themeMode,
  onToggleTheme,
  currentUser,
  storesData,
  orders,
  onRequestLogin,
  onUseDemoAccount,
  onSignOut,
  onOpenStore,
  onOpenBeer,
  onAddProduct,
  onAdvanceOrder,
  onOpenHome,
  onOpenSearch,
  onOpenOrders,
}: ProfileProps) {
  const style = useMemo(() => createStyles(theme), [theme]);
  const allBeers = useMemo(() => getAllBeers(storesData), [storesData]);
  const [draft, setDraft] = useState<SellerProductDraft>({
    name: "",
    style: "",
    abv: "",
    price: "",
    description: "",
    ibu: 30,
  });

  const favoriteBeers = currentUser
    ? allBeers.filter((beer) => currentUser.favoriteBeerIds.includes(beer.id))
    : [];
  const favoriteStores = currentUser
    ? storesData.filter((store) => currentUser.favoriteStoreIds.includes(store.id))
    : [];

  const sellerStore =
    currentUser?.role === "seller" && currentUser.sellerStoreId
      ? getStoreById(storesData, currentUser.sellerStoreId)
      : undefined;

  const sellerOrders =
    currentUser?.role === "seller" && currentUser.sellerStoreId
      ? orders.filter((order) => order.storeId === currentUser.sellerStoreId)
      : [];

  function handlePublishProduct() {
    if (!draft.name || !draft.style || !draft.abv || !draft.price || !draft.description) {
      return;
    }

    onAddProduct?.(draft);
    setDraft({
      name: "",
      style: "",
      abv: "",
      price: "",
      description: "",
      ibu: 30,
    });
  }

  return (
    <View style={style.container}>
      <ThemeToggle theme={theme} mode={themeMode} onToggle={onToggleTheme} />

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={style.contentContainer}>
        {!currentUser ? (
          <>
            <View style={style.headerCard}>
              <View style={style.avatar}>
                <Text style={style.avatarText}>GS</Text>
              </View>
              <Text style={style.title}>Perfil de visitante</Text>
              <Text style={style.subtitle}>
                Entre com uma conta de teste para validar fluxos de compra (Pedro) ou de venda (Apoena).
              </Text>
            </View>

            <Text style={style.sectionTitle}>Contas de teste</Text>
            {demoUsers.map((user) => (
              <View key={user.id} style={style.credentialsBox}>
                <Text style={style.credentialsTitle}>{user.name}</Text>
                <Text style={style.credentialsText}>Email: {user.email}</Text>
                <Text style={style.credentialsText}>Senha: {user.password}</Text>
                <TouchableOpacity style={style.actionButton} onPress={() => onUseDemoAccount?.(user.id)}>
                  <Text style={style.actionButtonText}>Entrar nesta conta</Text>
                </TouchableOpacity>
              </View>
            ))}

            <TouchableOpacity style={style.secondaryButton} onPress={onRequestLogin}>
              <Text style={style.secondaryButtonText}>Ir para tela de login</Text>
            </TouchableOpacity>
          </>
        ) : (
          <>
            <View style={style.headerCard}>
              <View style={style.avatar}>
                <Text style={style.avatarText}>{currentUser.avatarInitials}</Text>
              </View>
              <Text style={style.title}>{currentUser.name}</Text>
              <Text style={style.subtitle}>{currentUser.headline}</Text>
              <View style={style.badgeRow}>
                <View style={style.badge}>
                  <Text style={style.badgeText}>
                    {currentUser.role === "buyer" ? "Comprador" : "Vendedor"}
                  </Text>
                </View>
                <View style={style.badge}>
                  <Text style={style.badgeText}>
                    {currentUser.notificationsEnabled ? "Notificacoes ativas" : "Notificacoes off"}
                  </Text>
                </View>
              </View>
            </View>

            <Text style={style.sectionTitle}>Configuracoes</Text>
            <View style={style.card}>
              <Text style={style.cardTitle}>Contato</Text>
              <Text style={style.cardText}>{currentUser.email}</Text>
              <Text style={style.cardText}>{currentUser.phone}</Text>
              <Text style={style.cardText}>{currentUser.address}</Text>
            </View>
            <View style={style.card}>
              <Text style={style.cardTitle}>Experiencia recomendada</Text>
              <Text style={style.cardText}>Tema validavel em tempo real, pedidos, favoritos e navegacao rapida.</Text>
              <Text style={style.cardText}>Conta ativa: {currentUser.role === "buyer" ? "modo compra" : "modo gestao da cervejaria"}</Text>
            </View>

            <Text style={style.sectionTitle}>Cervejarias favoritas</Text>
            {favoriteStores.map((store) => (
              <TouchableOpacity key={store.id} style={style.listButton} onPress={() => onOpenStore?.(store.id)}>
                <Text style={style.listButtonTitle}>{store.name}</Text>
                <Text style={style.listButtonSubtitle}>Avaliacao {store.rating.toFixed(1)} / 5.0</Text>
              </TouchableOpacity>
            ))}
            {favoriteStores.length === 0 ? (
              <View style={style.card}>
                <Text style={style.cardText}>Nenhuma cervejaria favorita configurada.</Text>
              </View>
            ) : null}

            <Text style={style.sectionTitle}>Cervejas favoritas</Text>
            {favoriteBeers.map((beer) => (
              <TouchableOpacity key={beer.id} style={style.listButton} onPress={() => onOpenBeer?.(beer.id)}>
                <Text style={style.listButtonTitle}>{beer.name}</Text>
                <Text style={style.listButtonSubtitle}>
                  {beer.style} - {beer.storeName} - Avaliacao {beer.rating.toFixed(1)}
                </Text>
              </TouchableOpacity>
            ))}
            {favoriteBeers.length === 0 ? (
              <View style={style.card}>
                <Text style={style.cardText}>Nenhuma cerveja favorita configurada.</Text>
              </View>
            ) : null}

            {currentUser.role === "buyer" ? (
              <View style={style.card}>
                <Text style={style.cardTitle}>Perfil comprador</Text>
                <Text style={style.cardText}>
                  Use a tela de cervejas para comprar. Os pedidos vao aparecer automaticamente na aba Pedidos.
                </Text>
              </View>
            ) : null}

            {currentUser.role === "seller" && sellerStore ? (
              <>
                <Text style={style.sectionTitle}>Sua cervejaria</Text>
                <TouchableOpacity style={style.card} onPress={() => onOpenStore?.(sellerStore.id)}>
                  <Text style={style.cardTitle}>{sellerStore.name}</Text>
                  <Text style={style.cardText}>{sellerStore.description}</Text>
                  <Text style={style.cardText}>{sellerStore.address}</Text>
                </TouchableOpacity>

                <Text style={style.sectionTitle}>Cadastrar nova cerveja</Text>
                <View style={style.card}>
                  <TextInput
                    placeholder="Nome da cerveja"
                    placeholderTextColor={theme.colors.textMuted}
                    value={draft.name}
                    onChangeText={(value) => setDraft((prev) => ({ ...prev, name: value }))}
                    style={style.input}
                  />
                  <TextInput
                    placeholder="Estilo"
                    placeholderTextColor={theme.colors.textMuted}
                    value={draft.style}
                    onChangeText={(value) => setDraft((prev) => ({ ...prev, style: value }))}
                    style={style.input}
                  />
                  <TextInput
                    placeholder="Teor alcoolico (ex: 5.5%)"
                    placeholderTextColor={theme.colors.textMuted}
                    value={draft.abv}
                    onChangeText={(value) => setDraft((prev) => ({ ...prev, abv: value }))}
                    style={style.input}
                  />
                  <TextInput
                    placeholder="Preco (ex: R$ 19,90)"
                    placeholderTextColor={theme.colors.textMuted}
                    value={draft.price}
                    onChangeText={(value) => setDraft((prev) => ({ ...prev, price: value }))}
                    style={style.input}
                  />
                  <TextInput
                    placeholder="IBU (ex: 35)"
                    placeholderTextColor={theme.colors.textMuted}
                    value={String(draft.ibu)}
                    onChangeText={(value) =>
                      setDraft((prev) => ({
                        ...prev,
                        ibu: Number.isNaN(Number(value)) ? prev.ibu : Number(value),
                      }))
                    }
                    keyboardType="numeric"
                    style={style.input}
                  />
                  <TextInput
                    placeholder="Descricao"
                    placeholderTextColor={theme.colors.textMuted}
                    value={draft.description}
                    onChangeText={(value) => setDraft((prev) => ({ ...prev, description: value }))}
                    style={[style.input, style.textArea]}
                    multiline
                  />
                  <Text style={style.helperText}>
                    Ao publicar, o novo produto passa a aparecer em busca, catalogo e na sua cervejaria.
                  </Text>
                  <TouchableOpacity style={style.actionButton} onPress={handlePublishProduct}>
                    <Text style={style.actionButtonText}>Publicar produto</Text>
                  </TouchableOpacity>
                </View>

                <Text style={style.sectionTitle}>Produtos publicados</Text>
                {sellerStore.beers.map((beer) => (
                  <TouchableOpacity key={beer.id} style={style.listButton} onPress={() => onOpenBeer?.(beer.id)}>
                    <Text style={style.listButtonTitle}>{beer.name}</Text>
                    <Text style={style.listButtonSubtitle}>
                      {beer.style} - {beer.price} - IBU {beer.ibu}
                    </Text>
                  </TouchableOpacity>
                ))}

                <Text style={style.sectionTitle}>Pedidos da sua cervejaria</Text>
                {sellerOrders.map((order) => (
                  <View key={order.id} style={style.card}>
                    <Text style={style.cardTitle}>Pedido #{order.id}</Text>
                    <Text style={style.cardText}>Status atual: {order.status}</Text>
                    <Text style={style.cardText}>Criado em {order.createdAt}</Text>
                    {order.status !== "Entregue" ? (
                      <TouchableOpacity style={style.actionButton} onPress={() => onAdvanceOrder?.(order.id)}>
                        <Text style={style.actionButtonText}>Avancar status</Text>
                      </TouchableOpacity>
                    ) : null}
                  </View>
                ))}
                {sellerOrders.length === 0 ? (
                  <View style={style.card}>
                    <Text style={style.cardText}>Nenhum pedido vinculado a esta cervejaria.</Text>
                  </View>
                ) : null}
              </>
            ) : null}

            <TouchableOpacity style={style.secondaryButton} onPress={onSignOut}>
              <Text style={style.secondaryButtonText}>Sair desta conta</Text>
            </TouchableOpacity>
          </>
        )}
      </ScrollView>

      <AppBottomNav
        theme={theme}
        activeTab="profile"
        onOpenHome={onOpenHome}
        onOpenSearch={onOpenSearch}
        onOpenOrders={onOpenOrders}
        onOpenProfile={() => undefined}
      />
    </View>
  );
}

