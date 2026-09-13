export interface MockProperty {
  id: string;
  code: string;
  title: string;
  description: string;
  price: number;
  type: 'SALE' | 'RENT';
  status: 'AVAILABLE' | 'SOLD' | 'RENTED';
  bedrooms: number;
  bathrooms: number;
  suites: number;
  parking: number;
  area: number;
  photos: string[];
  location: string;
  category: 'Residencial' | 'Comercial' | 'Rural';
  propertyType: string; // Casa, Apartamento, Cobertura, Sala Comercial, Sítio etc
  amenities: string[]; // Piscina, Condomínio fechado, Mobiliado, etc
  featured?: boolean;
}

export const mockProperties: MockProperty[] = [
  // ===================== IMOVEIS À VENDA (SALE) =====================
  {
    id: 'prop-s-1',
    code: 'CA0012',
    title: 'Mansão Suspensa com Vista Mar',
    description: 'Uma obra de arte arquitetônica localizada no ponto mais alto do morro.',
    price: 12500000,
    type: 'SALE',
    status: 'AVAILABLE',
    bedrooms: 5,
    suites: 5,
    bathrooms: 7,
    parking: 4,
    area: 650,
    location: 'Morro das Antenas, Garopaba',
    category: 'Residencial',
    propertyType: 'Casa de Condomínio',
    amenities: ['Piscina', 'Churrasqueira', 'De frente para o mar', 'Condomínio fechado', 'Novo', 'Espaço gourmet', 'Ar condicionado', 'Móveis planejados', 'Adega', 'Aquecimento solar', 'Closet', 'Cozinha gourmet', 'Jacuzzi', 'Alarme', 'Circuito TV'],
    featured: true,
    photos: [
      'https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?auto=format&fit=crop&q=80&w=1200',
      'https://images.unsplash.com/photo-1600607687920-4e2a09cf159d?auto=format&fit=crop&q=80&w=1200',
    ],
  },
  {
    id: 'prop-s-2',
    code: 'CA0024',
    title: 'Casa Contemporânea Pé na Areia',
    description: 'O luxo de acordar e pisar na areia. Projeto assinado com automação completa.',
    price: 18900000,
    type: 'SALE',
    status: 'AVAILABLE',
    bedrooms: 6,
    suites: 4,
    bathrooms: 8,
    parking: 6,
    area: 820,
    location: 'Praia do Rosa, Imbituba',
    category: 'Residencial',
    propertyType: 'Casa',
    amenities: ['Piscina', 'De frente para o mar', 'Mobiliado', 'Varanda gourmet', 'Residência inteligente', 'Elevador', 'Energia solar', 'Deck molhado', 'Mezanino', 'Fechadura digital'],
    featured: true,
    photos: [
      'https://images.unsplash.com/photo-1512917774080-9991f1c4c750?auto=format&fit=crop&q=80&w=1200',
      'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&q=80&w=1200',
    ],
  },
  {
    id: 'prop-s-3',
    code: 'FA0015',
    title: 'Sítio Alto Padrão - Refúgio Verde',
    description: 'Propriedade cercada de mata nativa, ideal para turismo ecológico ou haras.',
    price: 8500000,
    type: 'SALE',
    status: 'AVAILABLE',
    bedrooms: 4,
    suites: 2,
    bathrooms: 5,
    parking: 10,
    area: 45000, // área gigante (rural)
    location: 'Siriú, Garopaba',
    category: 'Rural',
    propertyType: 'Sítio / Chácara',
    amenities: ['Piscina', 'Salão de jogos', 'Usado', 'Açude', 'Celeiro', 'Nascente', 'Pomar', 'Árvores frutíferas', 'Lareira'],
    photos: [
      'https://images.unsplash.com/photo-1500382017468-9049fed747ef?auto=format&fit=crop&q=80&w=1200',
      'https://images.unsplash.com/photo-1600047509807-ba8f99d2cdde?auto=format&fit=crop&q=80&w=1200',
    ],
  },
  {
    id: 'prop-s-4',
    code: 'CO0032',
    title: 'Cobertura Duplex Ultra Luxo',
    description: 'Cobertura exclusiva no centro, com piscina privativa de borda infinita.',
    price: 6200000,
    type: 'SALE',
    status: 'AVAILABLE',
    bedrooms: 3,
    suites: 3,
    bathrooms: 4,
    parking: 3,
    area: 320,
    location: 'Centro, Garopaba',
    category: 'Residencial',
    propertyType: 'Cobertura',
    amenities: ['Piscina', 'Churrasqueira', 'Mobiliado', 'Aceita permuta', 'Salão de festas', 'Armário cozinha', 'Banheira hidromassagem', 'Terraço'],
    photos: [
      'https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?auto=format&fit=crop&q=80&w=1200',
      'https://images.unsplash.com/photo-1502672260266-1c1e5250ad40?auto=format&fit=crop&q=80&w=1200',
    ],
  },
  {
    id: 'prop-s-5',
    code: 'CM0010',
    title: 'Prédio Comercial Premium',
    description: 'Prédio comercial de esquina, vitrines imensas, ideal para grandes marcas.',
    price: 9800000,
    type: 'SALE',
    status: 'AVAILABLE',
    bedrooms: 0,
    suites: 0,
    bathrooms: 6,
    parking: 12,
    area: 550,
    location: 'Centro, Garopaba',
    category: 'Comercial',
    propertyType: 'Prédio Comercial',
    amenities: ['Novo', 'Estacionamento Visitantes', 'Elevador'],
    photos: [
      'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?auto=format&fit=crop&q=80&w=1200',
      'https://images.unsplash.com/photo-1497366216548-37526070297c?auto=format&fit=crop&q=80&w=1200',
    ],
  },

  // ===================== IMOVEIS PARA ALUGUEL (RENT) =====================
  {
    id: 'prop-r-1',
    code: 'AL0102',
    title: 'Residência Térrea de Luxo',
    description: 'Aluguel de temporada inesquecível. Espaço amplo, área gourmet completa.',
    price: 45000,
    type: 'RENT',
    status: 'AVAILABLE',
    bedrooms: 4,
    suites: 4,
    bathrooms: 5,
    parking: 4,
    area: 420,
    location: 'Praia do Rosa, Imbituba',
    category: 'Residencial',
    propertyType: 'Casa',
    amenities: ['Piscina', 'Mobiliado', 'Churrasqueira', 'Condomínio fechado', 'Ar condicionado', 'Jardim', 'Lavanderia', 'Portão eletrônico'],
    featured: true,
    photos: [
      'https://images.unsplash.com/photo-1501183638710-841dd1904471?auto=format&fit=crop&q=80&w=1200',
      'https://images.unsplash.com/photo-1564013799919-ab600027ffc6?auto=format&fit=crop&q=80&w=1200',
    ],
  },
  {
    id: 'prop-r-2',
    code: 'AL0204',
    title: 'Loja Corporativa Beira-Mar',
    description: 'Ponto comercial excelente para restaurante de luxo de frente para o mar.',
    price: 18000,
    type: 'RENT',
    status: 'AVAILABLE',
    bedrooms: 0,
    suites: 0,
    bathrooms: 4,
    parking: 8,
    area: 380,
    location: 'Beira Mar, Garopaba',
    category: 'Comercial',
    propertyType: 'Loja',
    amenities: ['Semimobiliado', 'De frente para o mar', 'Usado'],
    photos: [
      'https://images.unsplash.com/photo-1512918728675-ed5a9ecdebfd?auto=format&fit=crop&q=80&w=1200',
      'https://images.unsplash.com/photo-1497366216548-37526070297c?auto=format&fit=crop&q=80&w=1200',
    ],
  },
  {
    id: 'prop-r-3',
    code: 'AL0550',
    title: 'Fazenda Histórica',
    description: 'Para quem busca paz e exclusividade. Madeiras nobres, lago de carpas.',
    price: 32000,
    type: 'RENT',
    status: 'AVAILABLE',
    bedrooms: 5,
    suites: 3,
    bathrooms: 6,
    parking: 10,
    area: 50000,
    location: 'Siriú, Garopaba',
    category: 'Rural',
    propertyType: 'Fazenda',
    amenities: ['Mobiliado', 'Lago', 'Horta', 'Riacho', 'Caseiro', 'Cercas'],
    photos: [
      'https://images.unsplash.com/photo-1583608205776-bfd35f0d9f83?auto=format&fit=crop&q=80&w=1200',
      'https://images.unsplash.com/photo-1588880331179-bc9b93a8cb65?auto=format&fit=crop&q=80&w=1200',
    ],
  },
  {
    id: 'prop-r-5',
    code: 'AL0999',
    title: 'Oásis Particular',
    description: 'Propriedade inteira murada garantindo sigilo absoluto.',
    price: 55000,
    type: 'RENT',
    status: 'AVAILABLE',
    bedrooms: 6,
    suites: 6,
    bathrooms: 8,
    parking: 8,
    area: 950,
    location: 'Praia do Silveira, Garopaba',
    category: 'Residencial',
    propertyType: 'Casa',
    amenities: ['Mobiliado', 'Piscina', 'Condomínio fechado', 'Sala de cinema', 'Sala de jogos'],
    featured: true,
    photos: [
      'https://images.unsplash.com/photo-1510798831971-661eb04b3739?auto=format&fit=crop&q=80&w=1200',
      'https://images.unsplash.com/photo-1574362848149-11496d93a7c7?auto=format&fit=crop&q=80&w=1200',
    ],
  },
];
