export type BeerItem = {
  id: string;
  name: string;
  style: string;
  abv: string;
  price: string;
  rating: number;
  description: string;
};

export type StoreItem = {
  id: string;
  name: string;
  tag: string;
  short: string;
  description: string;
  address: string;
  rating: number;
  beers: BeerItem[];
};

export type BeerWithStore = BeerItem & {
  storeId: string;
  storeName: string;
  storeShort: string;
  storeAddress: string;
};

export const stores: StoreItem[] = [
  {
    id: "1",
    name: "Apoena Cervejaria",
    tag: "R$ 5 off",
    short: "AC",
    description:
      "Cervejaria artesanal com foco em receitas autorais e rotulos sazonais.",
    address: "CLS 112, Bloco B, Asa Sul - Brasilia, DF",
    rating: 4.8,
    beers: [
      {
        id: "apoena-pilsen",
        name: "Apoena Pilsen",
        style: "Pilsen",
        abv: "4.8%",
        price: "R$ 13,90",
        rating: 4.6,
        description: "Leve, refrescante e com final seco para consumo diario.",
      },
      {
        id: "apoena-ipa",
        name: "Apoena IPA",
        style: "India Pale Ale",
        abv: "6.2%",
        price: "R$ 18,90",
        rating: 4.8,
        description: "Amargor presente, notas citricas e aroma intenso de lupo.",
      },
      {
        id: "apoena-weiss",
        name: "Apoena Weiss",
        style: "Wheat Beer",
        abv: "5.2%",
        price: "R$ 16,90",
        rating: 4.7,
        description: "Corpo macio com notas de banana e cravo tipicas do estilo.",
      },
      {
        id: "apoena-stout",
        name: "Apoena Stout",
        style: "Dry Stout",
        abv: "5.6%",
        price: "R$ 19,90",
        rating: 4.7,
        description: "Tostada, com cafe e chocolate amargo no retrogosto.",
      },
    ],
  },
  {
    id: "2",
    name: "Cruls",
    tag: "Frete gratis",
    short: "CR",
    description:
      "Taproom moderno com selecao rotativa de chopes e cervejas em lata.",
    address: "CLN 210, Bloco C, Asa Norte - Brasilia, DF",
    rating: 4.7,
    beers: [
      {
        id: "cruls-session-ipa",
        name: "Cruls Session IPA",
        style: "Session IPA",
        abv: "4.5%",
        price: "R$ 15,90",
        rating: 4.5,
        description: "Aromatica, citrica e com baixo teor alcoolico para long session.",
      },
      {
        id: "cruls-red-ale",
        name: "Cruls Red Ale",
        style: "Red Ale",
        abv: "5.1%",
        price: "R$ 16,90",
        rating: 4.6,
        description: "Caramelo equilibrado e amargor medio para beber facil.",
      },
      {
        id: "cruls-porter",
        name: "Cruls Porter",
        style: "Porter",
        abv: "5.9%",
        price: "R$ 18,50",
        rating: 4.7,
        description: "Escura e aveludada com notas de cacau e torra suave.",
      },
      {
        id: "cruls-lager",
        name: "Cruls Lager",
        style: "Lager",
        abv: "4.3%",
        price: "R$ 14,90",
        rating: 4.4,
        description: "Limpa, clara e muito refrescante para qualquer ocasiao.",
      },
    ],
  },
  {
    id: "3",
    name: "QuatroPoderes",
    tag: "Ate R$ 10",
    short: "QP",
    description:
      "Loja especializada em kits de degustacao e harmonizacao com petiscos.",
    address: "SCLS 303, Bloco D, Asa Sul - Brasilia, DF",
    rating: 4.6,
    beers: [
      {
        id: "qp-apa",
        name: "QP APA",
        style: "American Pale Ale",
        abv: "5.3%",
        price: "R$ 17,90",
        rating: 4.6,
        description: "Notas citricas e de maracuja com amargor elegante.",
      },
      {
        id: "qp-belgian",
        name: "QP Belgian",
        style: "Belgian Blond",
        abv: "6.4%",
        price: "R$ 20,90",
        rating: 4.7,
        description: "Frutada, levemente condimentada e com final seco.",
      },
      {
        id: "qp-sour",
        name: "QP Sour",
        style: "Catharina Sour",
        abv: "4.2%",
        price: "R$ 19,50",
        rating: 4.5,
        description: "Acida na medida com fruta tropical e alta drinkability.",
      },
      {
        id: "qp-brown-ale",
        name: "QP Brown Ale",
        style: "Brown Ale",
        abv: "5.8%",
        price: "R$ 18,90",
        rating: 4.6,
        description: "Toffee e castanhas em corpo medio e final suave.",
      },
    ],
  },
  {
    id: "4",
    name: "Galpao 17",
    tag: "Combo do dia",
    short: "G17",
    description:
      "Emporio com foco em rotulos locais, nacionais e importados.",
    address: "SIA Trecho 17, Lote 4 - Brasilia, DF",
    rating: 4.9,
    beers: [
      {
        id: "g17-pils",
        name: "Galpao Pils",
        style: "Pilsner",
        abv: "4.7%",
        price: "R$ 14,90",
        rating: 4.7,
        description: "Amargor limpo e herbal com final seco e crocante.",
      },
      {
        id: "g17-hazy-ipa",
        name: "Galpao Hazy IPA",
        style: "Hazy IPA",
        abv: "6.0%",
        price: "R$ 22,90",
        rating: 4.9,
        description: "Macia, turva e super aromatica com perfil tropical.",
      },
      {
        id: "g17-dubbel",
        name: "Galpao Dubbel",
        style: "Belgian Dubbel",
        abv: "6.8%",
        price: "R$ 23,50",
        rating: 4.8,
        description: "Maltada com notas de frutas escuras e especiarias.",
      },
      {
        id: "g17-sour",
        name: "Galpao Sour",
        style: "Fruit Sour",
        abv: "4.4%",
        price: "R$ 20,90",
        rating: 4.6,
        description: "Acidez refrescante com fruta vermelha e final limpo.",
      },
    ],
  },
];

export function getStoreById(id: string) {
  return stores.find((store) => store.id === id);
}

export function getAllBeers(): BeerWithStore[] {
  return stores.flatMap((store) =>
    store.beers.map((beer) => ({
      ...beer,
      storeId: store.id,
      storeName: store.name,
      storeShort: store.short,
      storeAddress: store.address,
    }))
  );
}

export function getBeerById(id: string) {
  return getAllBeers().find((beer) => beer.id === id);
}
