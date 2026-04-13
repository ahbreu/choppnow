export type CatalogModeRef = "stores" | "beers";

export type DiscoveryTargetType = "store" | "beer" | "catalog" | "search";

export type DiscoveryHighlight = {
  id: string;
  title: string;
  subtitle: string;
  badge: string;
  targetType: DiscoveryTargetType;
  targetId?: string;
  catalogMode?: CatalogModeRef;
};

export type DiscoveryCampaign = {
  id: string;
  kicker: string;
  title: string;
  description: string;
  ctaLabel: string;
  targetType: DiscoveryTargetType;
  catalogMode?: CatalogModeRef;
};

export type DiscoveryStoryStep = {
  id: string;
  title: string;
  description: string;
};

export type CatalogFilterCriteria = {
  minRating?: number;
  maxPrice?: number;
  minIbu?: number;
  maxIbu?: number;
  styles?: string[];
  addressIncludes?: string[];
  tagIncludes?: string[];
};

export type CatalogFilterPreset = {
  id: string;
  mode: CatalogModeRef;
  label: string;
  description: string;
  criteria: CatalogFilterCriteria;
};

export const homeHighlights: DiscoveryHighlight[] = [
  {
    id: "hl-g17-hazy",
    title: "Hazy da semana",
    subtitle: "Galpao Hazy IPA com nota 4.9",
    badge: "Destaque",
    targetType: "beer",
    targetId: "g17-hazy-ipa",
  },
  {
    id: "hl-apoena-store",
    title: "Taproom em alta",
    subtitle: "Apoena com kits para hoje",
    badge: "Local",
    targetType: "store",
    targetId: "1",
  },
  {
    id: "hl-sour-collection",
    title: "Especial Sour",
    subtitle: "Catalogo com acidas e frutadas",
    badge: "Colecao",
    targetType: "catalog",
    catalogMode: "beers",
  },
];

export const homeCampaigns: DiscoveryCampaign[] = [
  {
    id: "cp-frete",
    kicker: "Campanha",
    title: "Rotulos com frete zero",
    description: "Selecao com entrega sem custo para acelerar a primeira compra.",
    ctaLabel: "Ver cervejarias",
    targetType: "catalog",
    catalogMode: "stores",
  },
  {
    id: "cp-lupulo",
    kicker: "Curadoria",
    title: "Rota lupulada",
    description: "IPAs e APAs com perfil aromatico para quem busca amargor.",
    ctaLabel: "Abrir catalogo",
    targetType: "catalog",
    catalogMode: "beers",
  },
  {
    id: "cp-search",
    kicker: "Explorar",
    title: "Monte seu filtro",
    description: "Abra a busca para combinar estilo, faixa de IBU e cervejaria.",
    ctaLabel: "Ir para busca",
    targetType: "search",
  },
];

export const discoveryStorySteps: DiscoveryStoryStep[] = [
  {
    id: "story-01",
    title: "Descubra",
    description: "Comece pelos destaques e campanhas do dia.",
  },
  {
    id: "story-02",
    title: "Compare",
    description: "Use colecoes e filtros para reduzir as opcoes.",
  },
  {
    id: "story-03",
    title: "Escolha",
    description: "Entre no detalhe da loja ou da cerveja para decidir.",
  },
];

export const catalogFilterPresets: CatalogFilterPreset[] = [
  {
    id: "stores-top-rated",
    mode: "stores",
    label: "Mais bem avaliadas",
    description: "Lojas com nota igual ou maior que 4.8.",
    criteria: { minRating: 4.8 },
  },
  {
    id: "stores-promos",
    mode: "stores",
    label: "Promocoes",
    description: "Cervejarias com tag de desconto, frete ou combo.",
    criteria: { tagIncludes: ["off", "gratis", "combo"] },
  },
  {
    id: "stores-asa-sul",
    mode: "stores",
    label: "Asa Sul",
    description: "Lojas com entrega mais rapida na Asa Sul.",
    criteria: { addressIncludes: ["Asa Sul"] },
  },
  {
    id: "beers-light",
    mode: "beers",
    label: "Leves",
    description: "IBU ate 20 para consumo facil.",
    criteria: { maxIbu: 20 },
  },
  {
    id: "beers-hoppy",
    mode: "beers",
    label: "Lupuladas",
    description: "IBU acima de 40 para amargor marcante.",
    criteria: { minIbu: 40 },
  },
  {
    id: "beers-under-18",
    mode: "beers",
    label: "Ate R$ 18",
    description: "Rotulos com ticket de entrada mais acessivel.",
    criteria: { maxPrice: 18 },
  },
  {
    id: "beers-top-rated",
    mode: "beers",
    label: "Notas 4.7+",
    description: "Cervejas com melhor avaliacao no app.",
    criteria: { minRating: 4.7 },
  },
];
