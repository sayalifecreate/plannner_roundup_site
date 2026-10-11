// ==========================================
// グローバル変数 & 初期化
// ==========================================
window.allProducts = [];
const HOMEPAGE_DISPLAY_COUNT = 8;
const ITEMS_PER_PAGE = 12;
let currentPage = 1;

// ダミー画像（画像準備中）の共通フォールバックURL
// 修正後
const FALLBACK_IMAGE = 'https://via.placeholder.com/400x400/f1f5f9/94a3b8?text=NO+IMAGE';
document.addEventListener('DOMContentLoaded', async () => {
  initHeaderAndDrawers();
  initSearchModal();
  initDrawerMenu();
  initDrawerTabs();
  await loadDataJson();
  initSortSelect(); // 並び替えイベントリスナー設定
});

// ==========================================
// 代表色名への正規化・集約関数（detail.jsと完全同期）
// ==========================================
function normalizeColorName(colorStr) {
  if (!colorStr) return '';

  const rawLower = String(colorStr).toLowerCase();
  if (['ピンク', 'pink', '桃', 'ジル＆ジャック', 'ジル&ジャック', '桜花弁'].some(k => rawLower.includes(k))) {
    return 'ピンク';
  }

  let clean = String(colorStr)
    .replace(/[［\[【（\(].*?[］\]】）\)]/g, '')     .replace(/[［\]\[\]【】（）\(\)]/g, '')
    .replace(/(直営店限定|Web限定|公式限定|限定|店舗限定)/gi, '')
    .replace(/[\s ]+/g, ' ')
    .trim();

  const lower = clean.toLowerCase();

  if (['赤', 'レッド', 'red', 'ワイン', 'wine', 'ボルドー', 'bordeaux', 'バーガンディー', 'burgundy', 'ベリー', 'berry', 'ルビー', 'ruby', 'ローズ', 'rose', 'crimson'].some(k => lower.includes(k))) {
    return 'レッド';
  }
  if (['緑', 'グリーン', 'green', 'カーキ', 'khaki', 'オリーブ', 'olive', 'エメラルド', 'ライム', 'ブルーグリーン', 'ネオングリーン', 'teal','ジル'].some(k => lower.includes(k))) {
    return 'グリーン';
  }
  if (['ラベンダー', 'lavender'].some(k => lower.includes(k))) {
    return 'ラベンダー';
  }
  if (['グレージュ', 'greige'].some(k => lower.includes(k))) {
    return 'グレージュ';
  }
  if (['ミント', 'mint'].some(k => lower.includes(k))) {
    return 'ミント';
  }
  if (['白', 'ホワイト', 'white', 'アイボリー', 'ivory', 'クリア','ベッドタイムストーリー'].some(k => lower.includes(k))) {
    return 'ホワイト';
  }
  if (['黒', 'ブラック', 'black', 'チャコール', 'charcoal'].some(k => lower.includes(k))) {
    return 'ブラック';
  }
  if (['灰', 'グレー', 'grey', 'gray', 'シルバー', 'silver', 'ホワイトグレー', 'ライトグレー', 'ダークグレー'].some(k => lower.includes(k))) {
    return 'シルバー';
  }
  if (['茶', 'ブラウン', 'brown'].some(k => lower.includes(k))) {
    return 'ブラウン';
  }
  if (['ベージュ', 'beige', 'ナチュラル', 'リネン', 'クリーム', 'キャメル', 'モカ', 'テラコッタ'].some(k => lower.includes(k))) {
    return 'ベージュ';
  }
  if (['ネイビー', 'navy', 'インディゴ', 'indigo', '紺'].some(k => lower.includes(k))) {
    return 'ネイビー';
  }
  if (['青', 'ブルー', 'blue', 'スカイ', 'sky', 'ライトブルー', 'サックス', '楓'].some(k => lower.includes(k))) {
    return 'ライトブルー';
  }
  if (['黄', 'イエロー', 'yellow', 'マスタード', 'mustard', 'ネオンイエロー'].some(k => lower.includes(k))) {
    return 'イエロー';
  }
  if (['橙', 'オレンジ', 'orange', 'コーラル', 'coral','タンジェリン','tangerine','永寿'].some(k => lower.includes(k))) {
    return 'オレンジ';
  }
  if (['紫', 'パープル', 'purple', 'バイオレット', 'violet'].some(k => lower.includes(k))) {
    return 'パープル';
  }
  if (['ピンク', 'pink', '桃'].some(k => lower.includes(k))) {
    return 'ピンク';
  }
  if (['金', 'ゴールド', 'gold'].some(k => lower.includes(k))) {
    return 'ゴールド';
  }

  return 'その他';
}

// ==========================================
// データの読み込み & 描画分け
// ==========================================
async function loadDataJson() {
  try {
    const response = await fetch('./data.json');
    if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
    
    window.allProducts = await response.json();

    const pathName = window.location.pathname;
    const isHomePage = pathName.endsWith('index.html') || pathName.endsWith('/') || !pathName.includes('.html');

    if (isHomePage) {
      const shuffled = shuffleArray(window.allProducts);
      renderProductCards(shuffled.slice(0, HOMEPAGE_DISPLAY_COUNT));
    } else {
      // URLパラメータから商品絞り込み
      const urlParams = new URLSearchParams(window.location.search);
      let filteredProducts = filterProductsByParams(window.allProducts, urlParams);

      // 初期選択されているソートの反映
      const sortSelect = document.getElementById('sort-select');
      if (sortSelect && sortSelect.value) {
        filteredProducts = sortProducts(filteredProducts, sortSelect.value);
      }
      
      renderPaginatedProducts(filteredProducts, 1);
    }

    // 取得したデータをもとに各種メニュー・ドロワーを描画
    renderMenuFromData(window.allProducts);
    renderDrawerFromData(window.allProducts);

  } catch (error) {
    console.error('データ読み込みエラー:', error);
    const container = document.getElementById('product-list');
    if (container) {
      container.innerHTML = '<p style="text-align:center; padding:40px;">商品の読み込みに失敗しました。</p>';
    }
  }
}

// 配列シャッフル用ユーティリティ
function shuffleArray(array) {
  const clone = [...array];
  for (let i = clone.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [clone[i], clone[j]] = [clone[j], clone[i]];
  }
  return clone;
}

// ==========================================
// 並び替え（ソート）機能
// ==========================================
function sortProducts(products, sortKey) {
  const list = [...products];

  const getMinPrice = (p) => {
    if (p.variants && Array.isArray(p.variants) && p.variants.length > 0) {
      const prices = p.variants.map(v => v.price_jpy).filter(n => typeof n === 'number' && !isNaN(n));
      return prices.length > 0 ? Math.min(...prices) : Infinity;
    }
    return typeof p.price_jpy === 'number' ? p.price_jpy : Infinity;
  };

  return list.sort((a, b) => {
    switch (sortKey) {
      case 'brand-asc':
        return (a.brand_name || '').localeCompare(b.brand_name || '', 'ja');

      case 'product-asc':
        return (a.product_name || '').localeCompare(b.product_name || '', 'ja');

      case 'price-asc':
        return getMinPrice(a) - getMinPrice(b);

      case 'price-desc':
        return getMinPrice(b) - getMinPrice(a);

      case 'weight-asc':
        return (parseFloat(a.weight_g) || Infinity) - (parseFloat(b.weight_g) || Infinity);

      case 'month-asc':
        return (parseInt(a.start_month) || 99) - (parseInt(b.start_month) || 99);

      case 'pages-desc':
        return (parseInt(b.total_pages) || 0) - (parseInt(a.total_pages) || 0);

      case 'default':
      default:
        return (a.id || 0) - (b.id || 0);
    }
  });
}

function initSortSelect() {
  const sortSelect = document.getElementById('sort-select');
  if (!sortSelect) return;

  sortSelect.addEventListener('change', (e) => {
    const urlParams = new URLSearchParams(window.location.search);
    const filteredProducts = filterProductsByParams(window.allProducts, urlParams);
    const sortedProducts = sortProducts(filteredProducts, e.target.value);
    renderPaginatedProducts(sortedProducts, 1);
  });
}

// URLパラメータに基づいて商品を絞り込む関数
function filterProductsByParams(products, params) {
  const getDecoded = (key) => {
    const val = params.get(key);
    return val ? decodeURIComponent(val).trim() : null;
  };

  const paramSize = getDecoded('size');
  const paramColor = getDecoded('color');
  const paramLayout = getDecoded('layout');
  const paramStart = getDecoded('start');
  const paramBrand = getDecoded('brand');
  const paramSeries = getDecoded('series');

  if (!paramSize && !paramColor && !paramLayout && !paramStart && !paramBrand && !paramSeries) {
    return products;
  }

  return products.filter(product => {
    const variants = (product.variants && Array.isArray(product.variants) && product.variants.length > 0)
      ? product.variants
      : [product];

    if (paramBrand) {
      const pBrand = (product.brand_name || '').trim();
      if (pBrand !== paramBrand) return false;
    }

    if (paramSeries) {
      const pSeries = (product.series_name || '').trim();
      if (pSeries !== paramSeries) return false;
    }

    if (paramSize) {
      const hasSize = variants.some(v => {
        const vSize = (v.size || product.size || '').trim();
        return vSize === paramSize;
      });
      if (!hasSize) return false;
    }

    if (paramColor) {
      const targetNormalizedColor = normalizeColorName(paramColor);
      const hasColor = variants.some(v => {
        const targetStr = `${v.color || ''} ${product.product_name || ''}`;
        return normalizeColorName(targetStr) === targetNormalizedColor;
      });
      if (!hasColor) return false;
    }

    if (paramLayout) {
      const badges = getAllLayoutBadges(product).map(b => b.text.trim());
      if (!badges.includes(paramLayout)) return false;
    }

    if (paramStart) {
      if (paramStart.includes('月始まり')) {
        const monthNum = parseInt(paramStart, 10);
        if (product.start_month !== monthNum) return false;
      }
    }

    return true;
  });
}

// ==========================================
// サブタイプ（タグ一覧）取得ロジック
// ==========================================
function getAllLayoutBadges(p) {
  const badges = [];
  const addedTexts = new Set();
  let hasEmptySubtype = false;

  const isValid = (val) => {
    if (!val) return false;
    const str = String(val).trim();
    return str !== '' && str !== '-' && str !== 'なし';
  };

  const targets = (p && p.variants && Array.isArray(p.variants) && p.variants.length > 0)
    ? p.variants
    : (p ? [p] : []);

  targets.forEach(item => {
    let itemHasSubtype = false;

    if (isValid(item.daily_sub_type)) {
      const text = item.daily_sub_type.trim();
      if (!addedTexts.has(text)) {
        badges.push({ text: text, type: 'daily' });
        addedTexts.add(text);
      }
      itemHasSubtype = true;
    }

    if (isValid(item.weekly_sub_type)) {
      const text = item.weekly_sub_type.trim();
      if (!addedTexts.has(text)) {
        badges.push({ text: text, type: 'weekly' });
        addedTexts.add(text);
      }
      itemHasSubtype = true;
    }

    if (!itemHasSubtype) {
      hasEmptySubtype = true;
    }
  });

  if (hasEmptySubtype && !addedTexts.has('マンスリー')) {
    badges.push({ text: 'マンスリー', type: 'monthly' });
  }

  return badges;
}

// ==========================================
// 商品カード描画処理
// ==========================================
function renderProductCards(products) {
  const container = document.getElementById('product-list');
  if (!container) return;

  if (products.length === 0) {
    container.innerHTML = '<p style="text-align:center; grid-column: 1/-1; padding: 60px 0; color: #666;">該当する商品が見つかりませんでした。</p>';
    return;
  }

  const favorites = JSON.parse(localStorage.getItem('favorites') || '[]');

  container.innerHTML = products.map(product => {
    const colors = [];
    if (product.variants && Array.isArray(product.variants)) {
      product.variants.forEach(v => {
        const targetStr = `${v.color || ''} ${product.product_name || ''}`;
        const norm = normalizeColorName(targetStr);
        if (norm && !colors.includes(norm)) colors.push(norm);
      });
    }

    const prices = product.variants
      ? product.variants.map(v => v.price_jpy).filter(p => typeof p === 'number' && !isNaN(p))
      : [];
    let priceText = '価格情報なし';
    if (prices.length > 0) {
      const minPrice = Math.min(...prices);
      const maxPrice = Math.max(...prices);
      priceText = minPrice === maxPrice
        ? `¥${minPrice.toLocaleString()} <span class="tax-text">(税込)</span>`
        : `¥${minPrice.toLocaleString()} 〜 ¥${maxPrice.toLocaleString()} <span class="tax-text">(税込)</span>`;
    }

    const rawMainImg = product.image_url || (product.variants && product.variants[0]?.image_url) || '';

    let actualImgUrl = '';
    if (rawMainImg) {
      if (typeof rawMainImg === 'string' && rawMainImg.includes('src=')) {
        const match = rawMainImg.match(/src=["'](.*?)["']/);
        actualImgUrl = match ? match[1] : '';
      } else {
        actualImgUrl = rawMainImg;
      }
    }

    if (!actualImgUrl || actualImgUrl === 'なし' || actualImgUrl.trim() === '') {
      actualImgUrl = FALLBACK_IMAGE;
    }

    const badges = getAllLayoutBadges(product);
    const badgeHtml = `<div class="badge-container">` + 
      badges.map(b => `<span class="badge badge-layout badge-${b.type}">${escapeHTML(b.text)}</span>`).join('') +
      `</div>`;

    const maxSwatches = 5;
    const visibleColors = colors.slice(0, maxSwatches);
    const extraCount = colors.length - maxSwatches;
    const swatchesHtml = visibleColors.map(color => {
      return `<span class="color-dot" title="${escapeHTML(color)}" style="background-color: ${getColorCode(color)};"></span>`;
    }).join('') + (extraCount > 0 ? `<span class="more-count">+${extraCount}</span>` : '');

    const isFav = favorites.includes(String(product.id));
    const activeClass = isFav ? 'is-active' : '';

    return `
      <a href="detail.html?id=${product.id}" class="product-card" data-id="${product.id}">
        <button type="button" 
                class="card-fav-btn ${activeClass}" 
                aria-label="お気に入り"
                onclick="toggleFavorite(event, '${product.id}');">
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"></path>
          </svg>
        </button>

        <div class="card-image-wrapper">
          <img src="${actualImgUrl}" 
               alt="NO IMAGE" 
               loading="lazy" 
               onerror="this.onerror=null; this.src='${FALLBACK_IMAGE}';">
          ${badgeHtml || ''}
        </div>

        <div class="card-content">
          <div class="brand-info">
            <span class="brand-name">${escapeHTML(product.brand_name || '')}</span>
          </div>
          <h3 class="product-title">${escapeHTML(product.product_name || '名称未設定')}</h3>
          
          <div class="color-swatches">
            ${swatchesHtml || ''}
          </div>

          <div class="price-tag">${priceText || ''}</div>
        </div>
      </a>
    `;
  }).join('');
}

// お気に入り切り替え処理
function toggleFavorite(event, productId) {
  event.preventDefault();
  event.stopPropagation();

  const strId = String(productId);
  let favorites = JSON.parse(localStorage.getItem('favorites') || '[]');
  const button = event.currentTarget;
  const index = favorites.indexOf(strId);

  if (index >= 0) {
    favorites.splice(index, 1);
    button.classList.remove('is-active');
  } else {
    favorites.push(strId);
    button.classList.add('is-active');
  }

  localStorage.setItem('favorites', JSON.stringify(favorites));
}

// ページネーション処理
function renderPaginatedProducts(products, page = 1) {
  currentPage = page;
  const startIndex = (page - 1) * ITEMS_PER_PAGE;
  const endIndex = startIndex + ITEMS_PER_PAGE;
  const paginatedItems = products.slice(startIndex, endIndex);

  renderProductCards(paginatedItems);
  renderPaginationControls(products.length, page);
}

function renderPaginationControls(totalItems, currentPage) {
  const paginationContainer = document.getElementById('pagination');
  if (!paginationContainer) return;

  const totalPages = Math.ceil(totalItems / ITEMS_PER_PAGE);
  if (totalPages <= 1) {
    paginationContainer.innerHTML = '';
    return;
  }

  let html = '';

  if (currentPage > 1) {
    html += `<button type="button" class="page-btn" onclick="changePage(${currentPage - 1})">＜</button>`;
  }

  for (let i = 1; i <= totalPages; i++) {
    const activeClass = i === currentPage ? 'active' : '';
    html += `<button type="button" class="page-btn ${activeClass}" onclick="changePage(${i})">${i}</button>`;
  }

  if (currentPage < totalPages) {
    html += `<button type="button" class="page-btn" onclick="changePage(${currentPage + 1})">＞</button>`;
  }

  paginationContainer.innerHTML = html;
}

function changePage(page) {
  const urlParams = new URLSearchParams(window.location.search);
  let filteredProducts = filterProductsByParams(window.allProducts, urlParams);

  const sortSelect = document.getElementById('sort-select');
  if (sortSelect && sortSelect.value) {
    filteredProducts = sortProducts(filteredProducts, sortSelect.value);
  }

  renderPaginatedProducts(filteredProducts, page);
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

// ==========================================
// ユーティリティ関数（detail.jsと完全同一）
// ==========================================
function getColorCode(cName) {
  if (!cName) return '#e5e7eb';

  let normalizedName = String(cName)
    .replace(/ /g, ' ')
    .trim();
  
  const lowerName = normalizedName.toLowerCase();

  const colorMap = {
    'シルバー': '#C0C0C0', '銀': '#C0C0C0','グレージュ': '#B9B1A8',
    'ゴールド': '#D4AF37', '金': '#E4C068',
    'グリーン': '#2A9D8F', 'カーキ': '#556B2F',
    'レッド': '#E63946', 'ピンク': '#FFB6C1', 'オレンジ': '#F4A261',
    'ブラウン': '#8B4513', 'ベージュ': '#E8DABE', 'イエロー': '#E9C46A',
    'ブルー': '#457B9D', 'スカイブルー': '#A8DADC', 'ライトブルー': '#A8DADC', 'ネイビー': '#1D3557',
    'パープル': '#6A0572', 'ホワイト': '#FFFFFF', 'グレー': '#94A3B8', 'ブラック': '#000000',
    'ミント': '#A8E6CF','ラベンダー': '#c5b3d3','その他': '#9E9E9E'
  };

  const baseColorCategoryMap = [
    { keywords: ['ピンク', 'pink', 'ローズ', 'rose','ジル＆ジャック', 'ジル&ジャック', '桜花弁'], hex: '#FFC0CB' },
    { keywords: ['赤', 'レッド', 'red'], hex: '#E63946' },
    { keywords: ['ワイン', 'バーガンディー', 'burgundy'], hex: '#80273F' },
    { keywords: ['青', 'ブルー', 'blue', 'ネイビー'], hex: '#0000FF' },
    { keywords: ['緑', 'グリーン', 'green', 'カーキ', 'teal','ジル'], hex: '#008000' },
    { keywords: ['黄', 'イエロー', 'yellow'], hex: '#FFFF00' },
    { keywords: ['茶', 'ブラウン', 'brown','ラテ'], hex: '#8B4513' },
    { keywords: ['紫', 'パープル', 'purple'], hex: '#800080' },
    { keywords: ['ラベンダー','lavender'], hex: '#c5b3d3' },
    { keywords: ['黒', 'ブラック', 'black', 'チャコール'], hex: '#000000' },
    { keywords: ['白', 'ホワイト', 'white', 'クリア'], hex: '#FFFFFF' },
    { keywords: ['灰', 'グレー', 'grey', 'gray', 'シルバー'], hex: '#808080' },
    { keywords: ['橙', 'オレンジ', 'orange','タンジェリン','tangerine'], hex: '#FFA500' },
    { keywords: ['ミント', 'mint'], hex: '#A8E6CF' },
    { keywords: ['ベージュ', 'beige', 'アイボリー', 'ivory','ベッドタイムストーリー'], hex: '#F4E0C4' },
    { keywords: ['グレージュ', 'greige'], hex: '#B9B1A8' },
    { keywords: ['金', 'ゴールド', 'gold'], hex: '#E4C068' }
  ];

  if (colorMap[normalizedName]) return colorMap[normalizedName];

  const cleanName = normalizedName.split(/[［\[\(\（\s]/)[0];
  if (colorMap[cleanName]) return colorMap[cleanName];

  const matchedKey = Object.keys(colorMap).find(key => 
    cleanName.toLowerCase().includes(key.toLowerCase()) || key.toLowerCase().includes(cleanName.toLowerCase())
  );
  if (matchedKey) return colorMap[matchedKey];

  const words = lowerName.split(/\s+/);
  let category = null;

  for (let i = words.length - 1; i >= 0; i--) {
    const word = words[i];
    category = baseColorCategoryMap.find(cat =>
      cat.keywords.some(kw => word.includes(kw.toLowerCase()))
    );
    if (category) break;
  }

  if (!category) {
    category = baseColorCategoryMap.find(cat =>
      cat.keywords.some(kw => lowerName.includes(kw.toLowerCase()))
    );
  }

  if (category) {
    return category.hex;
  }

  const autoColor = autoParseColor(cleanName);
  if (autoColor && autoColor !== '#000000') {
    return autoColor;
  }

  return '#e5e7eb';
}

function autoParseColor(colorName) {
  try {
    const ctx = document.createElement('canvas').getContext('2d');
    ctx.fillStyle = '#123456';
    ctx.fillStyle = colorName;
    
    if (ctx.fillStyle === '#123456') {
      return null;
    }

    const computedColor = ctx.fillStyle;
    
    if (computedColor.startsWith('#')) {
      return computedColor;
    } else if (computedColor.startsWith('rgb')) {
      const rgb = computedColor.match(/\d+/g);
      if (rgb && rgb.length >= 3) {
        return '#' + rgb.slice(0, 3).map(x => parseInt(x).toString(16).padStart(2, '0')).join('');
      }
    }
  } catch (e) {
    return null;
  }
  return null;
}

function escapeHTML(str) {
  if (!str) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

// ==========================================
// 検索モーダル & ドロワー連携
// ==========================================
function initSearchModal() {
  const openTrigger = document.getElementById('open-search-trigger') || document.getElementById('open-keyword-search');
  const closeBtn = document.getElementById('close-search-btn');
  const modal = document.getElementById('search-modal');
  const keywordInput = document.getElementById('modal-keyword-input') || document.getElementById('keyword-input');
  const form = document.getElementById('search-filter-form');
  const resetBtn = document.getElementById('reset-filter-btn');
  const submitBtn = document.getElementById('submit-search-btn');

  openTrigger?.addEventListener('click', () => {
    modal?.classList.add('is-open');
    document.getElementById('keyword-search-overlay')?.classList.add('is-open');
    setTimeout(() => keywordInput?.focus(), 300);
    updateMatchCount();
  });

  closeBtn?.addEventListener('click', () => {
    modal?.classList.remove('is-open');
    document.getElementById('keyword-search-overlay')?.classList.remove('is-open');
  });

  document.getElementById('close-keyword-search')?.addEventListener('click', () => {
    document.getElementById('keyword-search-overlay')?.classList.remove('is-open');
  });

  form?.addEventListener('change', updateMatchCount);
  keywordInput?.addEventListener('input', updateMatchCount);

  resetBtn?.addEventListener('click', () => {
    form?.reset();
    if (keywordInput) keywordInput.value = '';
    updateMatchCount();
  });

  submitBtn?.addEventListener('click', () => {
    modal?.classList.remove('is-open');
    if (!window.location.pathname.includes('list.html')) {
      window.location.href = 'list.html';
    }
  });
}

function getSelectedFilters() {
  const form = document.getElementById('search-filter-form');
  const keyword = (document.getElementById('modal-keyword-input') || document.getElementById('keyword-input'))?.value.trim().toLowerCase() || '';
  const getCheckedValues = (name) => {
    if (!form) return [];
    return Array.from(form.querySelectorAll(`input[name="${name}"]:checked`)).map(cb => cb.value);
  };

  return {
    keyword,
    formats: getCheckedValues('format'),
    sizes: getCheckedValues('size'),
    brands: getCheckedValues('brand')
  };
}

function updateMatchCount() {
  const filters = getSelectedFilters();
  const matchedProducts = (window.allProducts || []).filter(product => {
    if (filters.keyword) {
      const pName = (product.product_name || '').toLowerCase();
      const bName = (product.brand_name || '').toLowerCase();
      if (!pName.includes(filters.keyword) && !bName.includes(filters.keyword)) return false;
    }
    if (filters.formats.length > 0) {
      const layouts = getAllLayoutBadges(product).map(b => b.text);
      if (!filters.formats.some(f => layouts.includes(f))) return false;
    }
    if (filters.sizes.length > 0 && !filters.sizes.includes(product.size)) return false;
    if (filters.brands.length > 0 && !filters.brands.includes(product.brand_name)) return false;
    return true;
  });

  const countSpan = document.getElementById('match-count') || document.getElementById('adv-match-count');
  if (countSpan) countSpan.textContent = matchedProducts.length;
}

function renderMenuFromData(products) {
  const brandsSet = new Set();
  products.forEach(p => {
    if (p.brand_name) brandsSet.add(p.brand_name.trim());
  });

  const sortedBrands = Array.from(brandsSet).sort((a, b) => a.localeCompare(b));

  const quickBrandList = document.getElementById('quick-brand-list');
  if (quickBrandList) {
    quickBrandList.innerHTML = sortedBrands.map(brand => 
      `<li><a href="list.html?brand=${encodeURIComponent(brand)}" class="quick-link">${escapeHTML(brand)}</a></li>`
    ).join('');
  }

  const advBrandList = document.getElementById('adv-brand-list');
  if (advBrandList) {
    advBrandList.innerHTML = sortedBrands.map(brand => 
      `<label class="check-item"><input type="checkbox" name="brand" value="${escapeHTML(brand)}"> ${escapeHTML(brand)}</label>`
    ).join('');
  }
}

function initHeaderAndDrawers() {
  const openAdvFilterBtn = document.getElementById('open-advanced-filter');
  const closeAdvFilterBtn = document.getElementById('close-advanced-filter');
  const advFilterPanel = document.getElementById('advanced-filter-panel');

  openAdvFilterBtn?.addEventListener('click', () => {
    advFilterPanel?.classList.add('is-open');
  });

  closeAdvFilterBtn?.addEventListener('click', () => {
    advFilterPanel?.classList.remove('is-open');
  });
}

// ==========================================
// ドロワーメニュー制御 & 描画
// ==========================================
function initDrawerMenu() {
  const openBtn = document.getElementById('open-menu-btn');
  const closeBtn = document.getElementById('close-menu-btn');
  const drawer = document.getElementById('drawer-menu');
  const overlay = document.getElementById('drawer-overlay');

  const openDrawer = () => {
    drawer?.classList.add('is-open');
    overlay?.classList.add('is-open');
    document.body.style.overflow = 'hidden';
  };

  const closeDrawer = () => {
    drawer?.classList.remove('is-open');
    overlay?.classList.remove('is-open');
    document.body.style.overflow = '';
  };

  openBtn?.addEventListener('click', openDrawer);
  closeBtn?.addEventListener('click', closeDrawer);
  overlay?.addEventListener('click', closeDrawer);
}

function initDrawerTabs() {
  const tabBtns = document.querySelectorAll('.drawer-menu .tab-btn');
  const tabPanes = document.querySelectorAll('.drawer-menu .tab-pane');

  tabBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      const targetId = btn.getAttribute('data-tab');

      tabBtns.forEach(b => b.classList.remove('active'));
      tabPanes.forEach(p => p.classList.remove('active'));

      btn.classList.add('active');
      document.getElementById(targetId)?.classList.add('active');
    });
  });
}

function renderDrawerFromData(products) {
  if (!products || !Array.isArray(products)) return;

  const colorSet = new Set();
  const sizeSet = new Set();
  const layoutSet = new Set();
  const monthSet = new Set();
  const daySet = new Set();
  const brandCounts = {};
  const seriesCounts = {};

  products.forEach(p => {
    const variants = (p.variants && Array.isArray(p.variants) && p.variants.length > 0)
      ? p.variants
      : [p];

    if (p.brand_name && String(p.brand_name).trim() !== '') {
      const bName = String(p.brand_name).trim();
      brandCounts[bName] = (brandCounts[bName] || 0) + 1;
    }

    if (p.series_name && String(p.series_name).trim() !== '') {
      const sName = String(p.series_name).trim();
      seriesCounts[sName] = (seriesCounts[sName] || 0) + 1;
    }

    if (p.start_month) monthSet.add(p.start_month);
    if (p.start_dayofweek) {
      const dw = String(p.start_dayofweek);
      if (dw.includes('月') || dw === 'mon') daySet.add('月曜始まり');
      else if (dw.includes('日') || dw === 'sun') daySet.add('日曜始まり');
    }

    let hasSubtype = false;

    variants.forEach(v => {
      const colorTarget = `${v.color || ''} ${p.product_name || ''}`;
      const normalized = normalizeColorName(colorTarget);
      if (normalized) {
        colorSet.add(normalized);
      }

      const sz = v.size || p.size;
      if (sz && String(sz).trim() !== '') {
        sizeSet.add(String(sz).trim());
      }

      if (v.daily_sub_type && String(v.daily_sub_type).trim() !== '' && v.daily_sub_type !== '-') {
        layoutSet.add(String(v.daily_sub_type).trim());
        hasSubtype = true;
      }
      if (v.weekly_sub_type && String(v.weekly_sub_type).trim() !== '' && v.weekly_sub_type !== '-') {
        layoutSet.add(String(v.weekly_sub_type).trim());
        hasSubtype = true;
      }
    });

    if (!hasSubtype) {
      layoutSet.add('マンスリー');
    }
  });

  // COLOR (カラーボタン) の描画
  const colorContainer = document.getElementById('drawer-color-list');
  if (colorContainer) {
    const sortedColors = Array.from(colorSet).sort((a, b) => {
      if (a === 'その他') return 1;
      if (b === 'その他') return -1;

      const codeA = getColorCode(a);
      const codeB = getColorCode(b);
      const hueA = getHueFromHex(codeA);
      const hueB = getHueFromHex(codeB);

      return hueA - hueB;
    });

    colorContainer.innerHTML = sortedColors.map(color => `
      <button type="button" class="color-circle" style="background-color: ${getColorCode(color)};" title="${escapeHTML(color)}" onclick="location.href='list.html?color=${encodeURIComponent(color)}'"></button>
    `).join('');
  }

  // SIZE (サイズ)
  const sizeContainer = document.getElementById('drawer-size-list');
  if (sizeContainer) {
    sizeContainer.innerHTML = Array.from(sizeSet).map(size => `
      <button type="button" class="filter-chip" onclick="location.href='list.html?size=${encodeURIComponent(size)}'">${escapeHTML(size)}</button>
    `).join('');
  }

  // LAYOUT (レイアウト)
  const layoutContainer = document.getElementById('drawer-layout-list');
  if (layoutContainer) {
    const sortedLayouts = Array.from(layoutSet).sort((a, b) => a.localeCompare(b, 'ja'));

    layoutContainer.innerHTML = sortedLayouts.map(layout => `
      <button type="button" class="layout-box" onclick="location.href='list.html?layout=${encodeURIComponent(layout)}'">${escapeHTML(layout)}</button>
    `).join('');
  }

  // MONTH (始まり月)
  const monthContainer = document.getElementById('drawer-month-list');
  if (monthContainer) {
    const sortedMonths = Array.from(monthSet)
      .map(start => {
        const str = String(start);
        if (str.includes('T') || str.includes('-')) {
          const date = new Date(str);
          if (!isNaN(date.getTime())) {
            return `${date.getMonth() + 1}月始まり`;
          }
        }
        const match = str.match(/\d+/);
        return match ? `${parseInt(match[0], 10)}月始まり` : str;
      })
      .filter((val, idx, self) => self.indexOf(val) === idx)
      .sort((a, b) => parseInt(a) - parseInt(b));

    monthContainer.innerHTML = sortedMonths.map(start => `
      <button type="button" class="filter-chip" onclick="location.href='list.html?start=${encodeURIComponent(start)}'">${escapeHTML(start)}</button>
    `).join('');
  }

  // DAY (始まり曜日)
  const dayContainer = document.getElementById('drawer-day-list');
  if (dayContainer) {
    const sortedDays = Array.from(daySet);
    dayContainer.innerHTML = sortedDays.map(start => `
      <button type="button" class="filter-chip" onclick="location.href='list.html?start=${encodeURIComponent(start)}'">${escapeHTML(start)}</button>
    `).join('');
  }

  // BRAND (ブランド)
  const brandContainer = document.getElementById('drawer-brand-list');
  if (brandContainer) {
    const sortedBrands = Object.keys(brandCounts).sort((a, b) => a.localeCompare(b));
    brandContainer.innerHTML = sortedBrands.map(brand => `
      <li>
        <a href="list.html?brand=${encodeURIComponent(brand)}">
          <span>${escapeHTML(brand)}</span>
          <span class="count">(${brandCounts[brand]})</span>
        </a>
      </li>
    `).join('');
  }

  // SERIES (シリーズ)
  const seriesContainer = document.getElementById('drawer-series-list');
  if (seriesContainer) {
    const sortedSeries = Object.keys(seriesCounts).sort((a, b) => a.localeCompare(b));
    seriesContainer.innerHTML = sortedSeries.map(series => `
      <li>
        <a href="list.html?series=${encodeURIComponent(series)}">
          <span>${escapeHTML(series)}</span>
          <span class="count">(${seriesCounts[series]})</span>
        </a>
      </li>
    `).join('');
  }
}

/**
 * HEXカラーコードから色相（Hue: 0〜360）を取得する関数
 */
function getHueFromHex(hex) {
  if (!hex || hex === '#ccc' || hex === '#cccccc' || hex === '#e5e7eb') return 999;

  let c = hex.replace('#', '');
  if (c.length === 3) {
    c = c.split('').map(x => x + x).join('');
  }
  const r = parseInt(c.substring(0, 2), 16) / 255;
  const g = parseInt(c.substring(2, 4), 16) / 255;
  const b = parseInt(c.substring(4, 6), 16) / 255;

  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  let h = 0;

  if (max === min) {
    return 360;
  }

  const d = max - min;
  switch (max) {
    case r: h = (g - b) / d + (g < b ? 6 : 0); break;
    case g: h = (b - r) / d + 2; break;
    case b: h = (r - g) / d + 4; break;
  }
  return h * 60;
}