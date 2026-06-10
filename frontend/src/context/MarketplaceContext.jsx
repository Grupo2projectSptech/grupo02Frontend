/**
 * MarketplaceContext.jsx
 * Centraliza os dados de produtos e vendas do Mercado Livre e Shopee.
 * Vendas criadas aqui são espelhadas no formato do vendaService
 * para que Dashboard e Vendas as enxerguem automaticamente.
 */
import { createContext, useContext, useState, useCallback } from 'react';

// ── Produtos iniciais ─────────────────────────────────────────────────────────
const INIT_ML = [
  {
    id: 'MLB3245678901', sku: 'JBL-T510BT-BLK',
    title: 'Fone de Ouvido Bluetooth JBL Tune 510BT',
    category: 'Fones de Ouvido', price: 219.90, originalPrice: 299.90,
    stock: 47, sold: 312, status: 'active',
    listing: 'gold_special', freeShipping: true, logistic: 'fulfillment',
    health: 92, rating: 4.7, reviews: 248,
    visits7: 1840, visits30: 7230,
  },
  {
    id: 'MLB2134567890', sku: 'NIKE-AM270-42-WHT',
    title: 'Tênis Nike Air Max 270 Masculino',
    category: 'Tênis', price: 589.99, originalPrice: 749.99,
    stock: 12, sold: 87, status: 'active',
    listing: 'gold_premium', freeShipping: true, logistic: 'xd_drop_off',
    health: 85, rating: 4.5, reviews: 73,
    visits7: 620, visits30: 2940,
  },
  {
    id: 'MLB1987654321', sku: 'SAM-GW6C-47-BLK',
    title: 'Smartwatch Samsung Galaxy Watch 6 Classic 47mm',
    category: 'Smartwatches', price: 1349.00, originalPrice: 1699.00,
    stock: 5, sold: 34, status: 'active',
    listing: 'gold_special', freeShipping: true, logistic: 'fulfillment',
    health: 97, rating: 4.9, reviews: 31,
    visits7: 390, visits30: 1580,
  },
  {
    id: 'MLB4512378654', sku: 'TGS-TSB912-GRY',
    title: 'Mochila para Notebook Targus 15.6" Citylite',
    category: 'Mochilas', price: 159.90, originalPrice: 199.90,
    stock: 0, sold: 201, status: 'paused',
    listing: 'gold_special', freeShipping: false, logistic: 'drop_off',
    health: 61, rating: 4.3, reviews: 165,
    visits7: 210, visits30: 980,
  },
  {
    id: 'MLB5634891230', sku: 'TX3-EC3-BKRD',
    title: 'Cadeira Gamer ThunderX3 EC3 Preta e Vermelha',
    category: 'Cadeiras Gamer', price: 849.00, originalPrice: 1099.00,
    stock: 8, sold: 56, status: 'active',
    listing: 'gold_premium', freeShipping: true, logistic: 'xd_drop_off',
    health: 88, rating: 4.6, reviews: 49,
    visits7: 450, visits30: 1820,
  },
];

const INIT_SHOPEE = [
  {
    id: 23456789, sku: 'JBL-T510BT-BLK',
    title: 'Fone de Ouvido Bluetooth JBL Tune 510BT',
    category: 'Fones & Headsets', price: 219.90, originalPrice: 299.90,
    stock: 47, sold: 289, status: 'NORMAL',
    boosted: true, likes: 1240,
    rating: 4.8, reviews: 198,
    dist: [0, 2, 5, 18, 173],
    visits7: 2100, visits30: 8400,
    logistics: ['Correios PAC', 'Jadlog', 'JadLog Expresso'],
  },
  {
    id: 34567891, sku: 'NIKE-AM270-42-WHT',
    title: 'Tênis Nike Air Max 270 Masculino',
    category: 'Calçados Masculinos', price: 589.99, originalPrice: 749.99,
    stock: 12, sold: 78, status: 'NORMAL',
    boosted: false, likes: 430,
    rating: 4.4, reviews: 61,
    dist: [0, 1, 3, 22, 35],
    visits7: 680, visits30: 3200,
    logistics: ['Correios PAC', 'Jadlog'],
  },
  {
    id: 45678912, sku: 'SAM-GW6C-47-BLK',
    title: 'Smartwatch Samsung Galaxy Watch 6 Classic',
    category: 'Smartwatches', price: 1319.00, originalPrice: 1699.00,
    stock: 5, sold: 29, status: 'NORMAL',
    boosted: true, likes: 891,
    rating: 4.9, reviews: 27,
    dist: [0, 0, 1, 3, 23],
    visits7: 420, visits30: 1700,
    logistics: ['Jadlog Expresso', 'Correios SEDEX'],
  },
  {
    id: 56789123, sku: 'TGS-TSB912-GRY',
    title: 'Mochila para Notebook Targus 15.6" Citylite',
    category: 'Bolsas & Mochilas', price: 159.90, originalPrice: 199.90,
    stock: 0, sold: 185, status: 'BANNED',
    boosted: false, likes: 770,
    rating: 4.2, reviews: 143,
    dist: [2, 5, 14, 62, 60],
    visits7: 230, visits30: 1010,
    logistics: ['Correios PAC'],
  },
  {
    id: 67891234, sku: 'TX3-EC3-BKRD',
    title: 'Cadeira Gamer ThunderX3 EC3',
    category: 'Cadeiras Gamer', price: 849.00, originalPrice: 1099.00,
    stock: 8, sold: 51, status: 'NORMAL',
    boosted: false, likes: 310,
    rating: 4.5, reviews: 44,
    dist: [0, 1, 4, 15, 24],
    visits7: 510, visits30: 2040,
    logistics: ['Jadlog', 'Transportadora Própria'],
  },
];

// ── Vendas mock iniciais no formato do vendaService ───────────────────────────
// Gera vendas históricas realistas para alimentar o Dashboard logo de início
function gerarVendasIniciais() {
  const hoje = new Date();
  const vendas = [];
  let idCounter = 9000;

  const produtos = [
    { nome: 'Fone JBL Tune 510BT',   preco: 219.90, custo: 98.00,  tipo: 'Mercado Livre', sku: 'JBL-T510BT-BLK'    },
    { nome: 'Tênis Nike Air Max 270', preco: 589.99, custo: 280.00, tipo: 'Mercado Livre', sku: 'NIKE-AM270-42-WHT'  },
    { nome: 'Galaxy Watch 6 Classic', preco: 1349.00,custo: 750.00, tipo: 'Mercado Livre', sku: 'SAM-GW6C-47-BLK'   },
    { nome: 'Mochila Targus 15.6"',   preco: 159.90, custo: 65.00,  tipo: 'Mercado Livre', sku: 'TGS-TSB912-GRY'    },
    { nome: 'Cadeira Gamer TX3 EC3',  preco: 849.00, custo: 420.00, tipo: 'Mercado Livre', sku: 'TX3-EC3-BKRD'       },
    { nome: 'Fone JBL Tune 510BT',   preco: 219.90, custo: 98.00,  tipo: 'Shopee',        sku: 'JBL-T510BT-BLK'    },
    { nome: 'Tênis Nike Air Max 270', preco: 589.99, custo: 280.00, tipo: 'Shopee',        sku: 'NIKE-AM270-42-WHT'  },
    { nome: 'Galaxy Watch 6 Classic', preco: 1319.00,custo: 750.00, tipo: 'Shopee',        sku: 'SAM-GW6C-47-BLK'   },
  ];

  // 6 meses atrás até hoje
  for (let diasAtras = 180; diasAtras >= 0; diasAtras -= Math.floor(Math.random() * 3) + 1) {
    const data = new Date(hoje);
    data.setDate(data.getDate() - diasAtras);
    const qtdVendasDia = Math.floor(Math.random() * 4) + 1;

    for (let v = 0; v < qtdVendasDia; v++) {
      const p = produtos[Math.floor(Math.random() * produtos.length)];
      const qtd = Math.floor(Math.random() * 3) + 1;
      const tarifa = p.tipo === 'Mercado Livre' ? p.preco * 0.11 : p.preco * 0.14;
      const imposto = 6;
      const freteFlex = p.tipo === 'Mercado Livre' ? (Math.random() > 0.5 ? 12.90 : 0) : 0;
      const motoboy = 0;
      const operacional = 3.50;

      vendas.push({
        id: idCounter++,
        data: data.toISOString().slice(0, 10),
        nomeProduto: p.nome,
        tipo: p.tipo,
        quantidade: qtd,
        custoUnidade: p.custo,
        valorVenda: p.preco * qtd,
        idPedido: `${p.tipo === 'Mercado Livre' ? 'MLB' : 'SPE'}${Math.floor(Math.random() * 9000000) + 1000000}`,
        motoboy,
        freteFlex,
        freteVenda: freteFlex,
        tarifa: tarifa * qtd,
        imposto,
        operacional,
        _fromMarketplace: true,
      });
    }
  }

  return vendas;
}

// ── Context ───────────────────────────────────────────────────────────────────
const MarketplaceContext = createContext(null);

export function MarketplaceProvider({ children }) {
  const [mlProducts, setMlProducts]       = useState(INIT_ML);
  const [shopeeProducts, setShopeeProducts] = useState(INIT_SHOPEE);
  const [mkVendas, setMkVendas]           = useState(gerarVendasIniciais);

  // Operações ML
  const updateMlProduct = useCallback((id, data) =>
    setMlProducts(prev => prev.map(p => p.id === id ? { ...p, ...data } : p)), []);

  const deleteMlProduct = useCallback((id) =>
    setMlProducts(prev => prev.filter(p => p.id !== id)), []);

  const addMlProduct = useCallback((data) =>
    setMlProducts(prev => [...prev, { ...data, id: `MLB${Date.now()}`, sold: 0, rating: 0, reviews: 0, health: 50, visits7: 0, visits30: 0 }]), []);

  // Operações Shopee
  const updateShopeeProduct = useCallback((id, data) =>
    setShopeeProducts(prev => prev.map(p => p.id === id ? { ...p, ...data } : p)), []);

  const deleteShopeeProduct = useCallback((id) =>
    setShopeeProducts(prev => prev.filter(p => p.id !== id)), []);

  const addShopeeProduct = useCallback((data) =>
    setShopeeProducts(prev => [...prev, { ...data, id: Date.now(), sold: 0, rating: 0, reviews: 0, likes: 0, dist: [0,0,0,0,0], visits7: 0, visits30: 0, logistics: ['Correios PAC'] }]), []);

  // Adiciona venda do marketplace no pool compartilhado
  const addMkVenda = useCallback((venda) => {
    setMkVendas(prev => [...prev, { ...venda, id: Date.now(), _fromMarketplace: true }]);
  }, []);

  // Remove venda do marketplace
  const deleteMkVenda = useCallback((id) => {
    setMkVendas(prev => prev.filter(v => v.id !== id));
  }, []);

  // Totais rápidos para badges no sidebar
  const mlActiveCount = mlProducts.filter(p => p.status === 'active').length;
  const shopeeActiveCount = shopeeProducts.filter(p => p.status === 'NORMAL').length;
  const semEstoqueCount = [...mlProducts, ...shopeeProducts].filter(p => (p.stock ?? p.available_quantity) === 0).length;

  return (
    <MarketplaceContext.Provider value={{
      mlProducts, shopeeProducts, mkVendas,
      updateMlProduct, deleteMlProduct, addMlProduct,
      updateShopeeProduct, deleteShopeeProduct, addShopeeProduct,
      addMkVenda, deleteMkVenda,
      mlActiveCount, shopeeActiveCount, semEstoqueCount,
    }}>
      {children}
    </MarketplaceContext.Provider>
  );
}

export const useMarketplace = () => useContext(MarketplaceContext);
