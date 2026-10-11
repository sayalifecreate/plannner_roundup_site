// ==========================================
// グローバル変数 & 初期化
// ==========================================
window.allProducts = [];
const HOMEPAGE_DISPLAY_COUNT = 8;
const ITEMS_PER_PAGE = 12;
let currentPage = 1;

// ダミー画像（画像準備中）の共通フォールバックURL
const FALLBACK_IMAGE = 'https://via.placeholder.com/400x400/f1f5f9/94a3b8?text=%E7%94%BB%E5%83%8F%E6%BA%96%E2%82%99%E4%B8%AD';

document.addEventListener('DOMContentLoaded', async () => {
  initHeaderAndDrawers();
  initSearchModal();
  initDrawerMenu();
  initDrawerTabs();
  await loadDataJson();
});

// ==========================================
// 代表色名への正規化・集約関数（detail.jsと完全同期）
// ==========================================
function normalizeColorName(colorStr) {
  if (!colorStr) return '';

  // 1. 括弧除去等で文字が消える前に特定キーワード（ジル＆ジャック等）を最優先判定
  const rawLower = String(colorStr).toLowerCase();
  if (['ピンク', 'pink', '桃', 'ジル＆ジャック', 'ジル&ジャック', '桜花弁'].some(k => rawLower.includes(k))) {
    return 'ピンク';
  }

  // 2. カッコ・記号・限定表記の削除
  let clean = String(colorStr)
    .replace(/[［\[【（\(].*?[］\]】）\)]/g, '')     .replace(/[［\]\[\]【】（）\(\)]/g, '')
    .replace(/(直営店限定|Web限定|公式限定|限定|店舗限定)/gi, '')
    .replace(/[\s ]+/g, ' ')
    .trim();

  const lower = clean.toLowerCase();

  // 3. 表記揺れ・派生色を代表カラーへ集約
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
      const filteredProducts = filterProductsByParams(window.allProducts, urlParams);
      
      renderPaginatedProducts(filteredProducts, 1);
    }

    // 取得したデータをもとに各種メニュー・ドロワーを描画する
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

// URLパラメータに基づいて商品を正確に絞り込む関数
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

    // 1. ブランド判定
    if (paramBrand) {
      const pBrand = (product.brand_name || '').trim();
      if (pBrand !== paramBrand) return false;
    }

    // 2. シリーズ判定
    if (paramSeries) {
      const pSeries = (product.series_name || '').trim();
      if (pSeries !== paramSeries) return false;
    }

    // 3. サイズ判定
    if (paramSize) {
      const hasSize = variants.some(v => {
        const vSize = (v.size || product.size || '').trim();
        return vSize === paramSize;
      });
      if (!hasSize) return false;
    }

    // 4. カラー判定（正規化を通して一致判定、商品名も補正対象として参照）
    if (paramColor) {
      const targetNormalizedColor = normalizeColorName(paramColor);
      const hasColor = variants.some(v => {
        const targetStr = `${v.color || ''} ${product.product_name || ''}`;
        return normalizeColorName(targetStr) === targetNormalizedColor;
      });
      if (!hasColor) return false;
    }

    // 5. レイアウト判定
    if (paramLayout) {
      const badges = getAllLayoutBadges(product).map(b => b.text.trim());
      if (!badges.includes(paramLayout)) return false;
    }

    // 6. 始まり月判定
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

  // お気に入りIDリストをlocalStorageから取得
  const favorites = JSON.parse(localStorage.getItem('favorites') || '[]');

  container.innerHTML = products.map(product => {
    const colors = [];
    if (product.variants && Array.isArray(product.variants)) {
      product.variants.forEach(v => {
        // v.color だけでなく商品名も渡して判定
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
  const filteredProducts = filterProductsByParams(window.allProducts, urlParams);
  renderPaginatedProducts(filteredProducts, page);
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

// ==========================================
// ユーティリティ関数（detail.jsと完全同一）
// ==========================================
/**
 * 色名からカラーコード（HEX）を取得する（段階的フォールバック付き）
 */
function getColorCode(cName) {
  if (!cName) return '#e5e7eb';

  // 1. スペースや記号の正規化と小文字化
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

  // 1. 完全一致
  if (colorMap[normalizedName]) return colorMap[normalizedName];

  // 2. 記号を取り除いた文字列で判定
  const cleanName = normalizedName.split(/[［\[\(\（\s]/)[0];
  if (colorMap[cleanName]) return colorMap[cleanName];

  // 3. colorMap 内のキーが含まれているか部分一致判定
  const matchedKey = Object.keys(colorMap).find(key => 
    cleanName.toLowerCase().includes(key.toLowerCase()) || key.toLowerCase().includes(cleanName.toLowerCase())
  );
  if (matchedKey) return colorMap[matchedKey];

  // 4. 系統色キーワード検索（末尾の単語から逆順サーチ）
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

  // Canvas API による自動解析
  const autoColor = autoParseColor(cleanName);
  if (autoColor && autoColor !== '#000000') {
    return autoColor;
  }

  // 5. デフォルト
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
// ドロワーメニュー制御 & 描画（detail.jsと同等の集約処理）
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

    // --- カラー抽出・完全正規化＆集約処理（normalizeColorName使用） ---
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

  // COLOR (カラーボタン) の描画（色相順ソート）
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

document.addEventListener('DOMContentLoaded', async () => {
  await initSlideshowFromData();
});

async function initSlideshowFromData() {
  const track = document.getElementById('slideshow-track');
  const dotsContainer = document.getElementById('slideshow-dots');
  const prevBtn = document.getElementById('prev-slide-btn');
  const nextBtn = document.getElementById('next-slide-btn');

  if (!track) return;

  try {
    // 1. json データの取得
    const response = await fetch('./data.json');
    if (!response.ok) throw new Error('data.json の読み込みに失敗しました');
    const allProducts = await response.json();

    // 2. 画像（image_url）が設定されている商品のみをピックアップ
    const productsWithImage = allProducts.filter(product => {
      // product 直下、またはバリアント(variants)内に有効な image_url があるか判定
      let img = product.image_url;
      if (!img && Array.isArray(product.variants) && product.variants.length > 0) {
        img = product.variants.find(v => v.image_url)?.image_url;
      }
      return img && img.trim() !== '';
    });

    if (productsWithImage.length === 0) {
      document.querySelector('.hero-slideshow')?.style.setProperty('display', 'none');
      return;
    }

    // 3. ピックアップした商品のスライドHTMLを作成
    track.innerHTML = productsWithImage.map(product => {
      let rawImg = product.image_url || product.variants?.find(v => v.image_url)?.image_url || '';
      let imgSrc = rawImg;
      if (rawImg.includes('src=')) {
        const match = rawImg.match(/src=["'](.*?)["']/);
        if (match) imgSrc = match[1];
      }

      const productName = product.product_name || '商品画像';

      return `
        <div class="slide">
          <a href="detail.html?id=${product.id}">
            <img src="${imgSrc}" alt="${productName}">
          </a>
        </div>
      `;
    }).join('');

    // 4. スライドショーの動的制御を開始
    setupSlideshowController(track, dotsContainer, prevBtn, nextBtn);

  } catch (error) {
    console.error('スライドショーの初期化エラー:', error);
  }
}

document.addEventListener('DOMContentLoaded', async () => {
  await initMultiSlideshow();
});

function shuffleArray(array) {
  const shuffled = [...array];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}

const validProducts = allProducts.filter(item => item.imageUrl && item.imageUrl.trim() !== '');

// 2. データをランダムに並び替え
const randomProducts = shuffleArray(validProducts);

// 3. 先頭の5件を取得してスライドショーにセット
const slideshowItems = randomProducts.slice(0, 5);

async function initMultiSlideshow() {
  const track = document.getElementById('multi-slideshow-track');
  const prevBtn = document.getElementById('multi-prev-btn');
  const nextBtn = document.getElementById('multi-next-btn');

  if (!track) return;

  try {
    const response = await fetch('./data.json');
    if (!response.ok) throw new Error('data.json の取得に失敗');
    const allProducts = await response.json();

    // 1. 画像がある商品のみを抽出
    const productsWithImage = allProducts.filter(product => {
      let img = product.image_url;
      if (!img && Array.isArray(product.variants) && product.variants.length > 0) {
        img = product.variants.find(v => v.image_url)?.image_url;
      }
      return img && img.trim() !== '';
    });

    if (productsWithImage.length === 0) return;

    // 2. カードのHTMLを作成
    track.innerHTML = productsWithImage.map(product => {
      let rawImg = product.image_url || product.variants?.find(v => v.image_url)?.image_url || '';
      let imgSrc = rawImg;
      if (rawImg.includes('src=')) {
        const match = rawImg.match(/src=["'](.*?)["']/);
        if (match) imgSrc = match[1];
      }

      return `
        <div class="multi-slide-card">
          <a href="detail.html?id=${product.id}">
            <div class="multi-slide-img-wrapper">
              <img src="${imgSrc}" alt="${product.product_name || ''}">
            </div>
            <div class="multi-slide-info">
              <p class="multi-slide-title">${product.product_name || '商品詳細'}</p>
            </div>
          </a>
        </div>
      `;
    }).join('');

    // 3. カルーセル制御の初期化
    setupMultiCarousel(track, prevBtn, nextBtn);

  } catch (error) {
    console.error('複数枚スライドショー初期化エラー:', error);
  }
}

function setupMultiCarousel(track, prevBtn, nextBtn) {
  let timer = null;

  // 1コマ分（カード1枚＋余白）移動する処理
  function slideNext() {
    const card = track.querySelector('.multi-slide-card');
    if (!card) return;

    const gap = 16; // CSSの gap と合わせる
    const cardWidth = card.getBoundingClientRect().width + gap;


    // アニメーション完了後、先頭要素を末尾に移動させて位置をリセット（無限ループ化）
    setTimeout(() => {
      track.style.transition = 'none';
      track.appendChild(track.firstElementChild);
      track.style.transform = 'translateX(0)';
    }, 400);
  }

  function slidePrev() {
    const card = track.querySelector('.multi-slide-card');
    if (!card) return;

    const gap = 16;
    const cardWidth = card.getBoundingClientRect().width + gap;

    // 末尾要素をあらかじめ先頭に持ってきて左へオフセット
    track.style.transition = 'none';
    track.insertBefore(track.lastElementChild, track.firstElementChild);
    track.style.transform = `translateX(-${cardWidth}px)`;

    // 元の位置に引き戻す
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        track.style.transition = 'transform 0.3s ease-in-out';
        track.style.transform = 'translateX(0)';
      });
    });
  }

  function stopAutoPlay() {
    if (timer) clearInterval(timer);
  }

  // イベント登録
  nextBtn?.addEventListener('click', () => {
    stopAutoPlay();
    slideNext();
    startAutoPlay();
  });

  prevBtn?.addEventListener('click', () => {
    stopAutoPlay();
    slidePrev();
    startAutoPlay();
  });

  // マウスホバー時は自動再生を停止
  track.addEventListener('mouseenter', stopAutoPlay);
  track.addEventListener('mouseleave', startAutoPlay);

  startAutoPlay();
}

async function initMultiSlideshow() {
  const track = document.getElementById('multi-slideshow-track');
  const prevBtn = document.getElementById('multi-prev-btn');
  const nextBtn = document.getElementById('multi-next-btn');

  if (!track) return;

  try {
    const response = await fetch('./data.json');
    if (!response.ok) throw new Error('data.json の取得に失敗');
    const allProducts = await response.json();

    // 1. 画像がある商品のみを抽出
    const productsWithImage = allProducts.filter(product => {
      let img = product.image_url;
      if (!img && Array.isArray(product.variants) && product.variants.length > 0) {
        img = product.variants.find(v => v.image_url)?.image_url;
      }
      return img && img.trim() !== '' && img !== 'なし';
    });

    if (productsWithImage.length === 0) return;

    // ★ 修正ポイント1: ここでランダムにシャッフル！
    const randomProducts = shuffleArray(productsWithImage);

    // ★ 修正ポイント2: productsWithImage ではなく randomProducts をマップ処理
    track.innerHTML = randomProducts.map(product => {
      let rawImg = product.image_url || product.variants?.find(v => v.image_url)?.image_url || '';
      let imgSrc = rawImg;
      if (rawImg.includes('src=')) {
        const match = rawImg.match(/src=["'](.*?)["']/);
        if (match) imgSrc = match[1];
      }

      return `
        <div class="multi-slide-card">
          <a href="detail.html?id=${product.id}">
            <div class="multi-slide-img-wrapper">
              <img src="${imgSrc}" alt="${product.product_name || ''}">
            </div>
            <div class="multi-slide-info">
              <p class="multi-slide-title">${product.product_name || '商品詳細'}</p>
            </div>
          </a>
        </div>
      `;
    }).join('');

    // 3. カルーセル制御の初期化
    setupMultiCarousel(track, prevBtn, nextBtn);

  } catch (error) {
    console.error('複数枚スライドショー初期化エラー:', error);
  }
}

function shuffleArray(array) {
  const shuffled = [...array];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}

// 自動再生タイマー用の変数（グローバルまたはスライドショー処理の親スコープに定義）
let autoPlayTimer = null;

// 自動再生を開始する関数
function startAutoPlay() {
  // すでにタイマーが動いている場合は一度クリア
  if (autoPlayTimer) clearInterval(autoPlayTimer);

  // 例: 3秒ごとに次のスライドへ進む処理
  autoPlayTimer = setInterval(() => {
    // 次のスライドに移動する処理を記述
    // 例: showNextSlide();
  }, 2000);
}

// 自動再生を停止する関数（※必要に応じてホバー時などに使用）
function stopAutoPlay() {
  if (autoPlayTimer) {
    clearInterval(autoPlayTimer);
    autoPlayTimer = null;
  }
}



// 1. レイアウト順の優先度定義
const LAYOUT_ORDER = {
  'マンスリー': 1,
  'ウィークリー': 2,
  'デイリー': 3
};

// 2. レイアウトに応じた背景色テーマ
function getThemeClass(layoutType) {
  if (layoutType === 'マンスリー') return 'theme-monthly'; // 赤・ピンク系
  if (layoutType === 'ウィークリー') return 'theme-weekly';  // 水色系
  if (layoutType === 'デイリー') return 'theme-daily';   // 黄色系
  return 'theme-default';
}

// 3. 説明テキストのマップ
const FORMAT_DESCRIPTIONS = {
  'ブロックマンスリー': '広々書ける\nマンスリー＆ノート',
  'マンスリー': '広々書ける\nマンスリー＆ノート',
  'ウィークリー': '予定とタスクをしっかり管理できる\n週間手帳フォーマット',
  '週間ブロック': 'TO DO＆メモに特化した\nブロックフォーマット',
  '週間バーチカル': '時間管理に最適な\nバーチカルタイプ',
  '週間レフト': '予定とメモをバランス良く\n管理できる王道スタイル',
  '週間メモ': '広々としたメモスペースで\n自由度の高い週間フォーマット',
  'デイリー': '1日1ページでたっぷり書ける\nログ＆メモフォーマット',
  'フリーデイリー': '日付を選ばず\n自由な記録・日記に'
};

// 4. 各フォーマット用の SVG コード定義（★ここに用意したSVGコードを貼り付けます）
const FORMAT_SVGS = {
  'ブロックマンスリー': `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1000 700" width="100%" height="100%" style="background-color: #ffffff; font-family: 'Helvetica Neue', Arial, 'Hiragino Kaku Gothic ProN', sans-serif;">
  <style>
    /* 外枠・中央綴じ線（角丸なし） */
    .line-outer { stroke: #999999; stroke-width: 4; fill: none; }
    .line-center { stroke: #aaaaaa; stroke-width: 3; stroke-dasharray: 8 5; }
    
    /* マンスリーグリッド線（全マス完全等倍） */
    .line-grid { stroke: #444444; stroke-width: 3; fill: none; }

    /* 月の数字（一番上のマスと上揃え） */
    .text-month-num { font-size: 55px; font-weight: bold; fill: #222222; dominant-baseline: hanging; }
  </style>

  <!-- 手帳外枠（上下左右余白40px: x=40, y=40, width=920, height=620） -->
  <rect x="40" y="40" width="920" height="620" fill="#ffffff" class="line-outer" />
  <!-- 中央綴じ线 -->
  <line x1="500" y1="40" x2="500" y2="660" class="line-center" />

  <!-- =================================================== -->
  <!--                      ヘッダー                      -->
  <!-- =================================================== -->
  <!-- 「8」の位置をさらに左側（x=90）へ移動し、外枠寄りに配置 -->
  <g transform="translate(90, 80)">
    <text x="0" y="0" class="text-month-num">8</text>
  </g>

  <!-- =================================================== -->
  <!--             左ページ (3マス × 5行)                -->
  <!-- =================================================== -->
  <!-- 
    1マスサイズ: 横95px × 縦108px
    左ページ範囲: x=200 〜 485 (95px × 3列 = 幅285px)
  -->
  <g id="left-page-grid">
    <!-- 横線 (6本) -->
    <line x1="200" y1="80" x2="485" y2="80" class="line-grid" />
    <line x1="200" y1="188" x2="485" y2="188" class="line-grid" />
    <line x1="200" y1="296" x2="485" y2="296" class="line-grid" />
    <line x1="200" y1="404" x2="485" y2="404" class="line-grid" />
    <line x1="200" y1="512" x2="485" y2="512" class="line-grid" />
    <line x1="200" y1="620" x2="485" y2="620" class="line-grid" />

    <!-- 縦線 (4本 → 等幅3マス) -->
    <line x1="200" y1="80" x2="200" y2="620" class="line-grid" />
    <line x1="295" y1="80" x2="295" y2="620" class="line-grid" />
    <line x1="390" y1="80" x2="390" y2="620" class="line-grid" />
    <line x1="485" y1="80" x2="485" y2="620" class="line-grid" />
  </g>

  <!-- =================================================== -->
  <!--             右ページ (4マス × 5行)                -->
  <!-- =================================================== -->
  <!-- 
    1マスサイズ: 横95px × 縦108px (左ページと完全同一)
    右ページ範囲: x=515 〜 895 (95px × 4列 = 幅380px)
  -->
  <g id="right-page-grid">
    <!-- 横線 (6本) -->
    <line x1="515" y1="80" x2="895" y2="80" class="line-grid" />
    <line x1="515" y1="188" x2="895" y2="188" class="line-grid" />
    <line x1="515" y1="296" x2="895" y2="296" class="line-grid" />
    <line x1="515" y1="404" x2="895" y2="404" class="line-grid" />
    <line x1="515" y1="512" x2="895" y2="512" class="line-grid" />
    <line x1="515" y1="620" x2="895" y2="620" class="line-grid" />

    <!-- 縦線 (5本 → 等幅4マス) -->
    <line x1="515" y1="80" x2="515" y2="620" class="line-grid" />
    <line x1="610" y1="80" x2="610" y2="620" class="line-grid" />
    <line x1="705" y1="80" x2="705" y2="620" class="line-grid" />
    <line x1="800" y1="80" x2="800" y2="620" class="line-grid" />
    <line x1="895" y1="80" x2="895" y2="620" class="line-grid" />
  </g>

</svg>
`,
  '週間ブロック': `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1000 700" width="100%" height="100%" style="background-color: #ffffff; font-family: 'Helvetica Neue', Arial, 'Hiragino Kaku Gothic ProN', sans-serif;">
  <style>
    .line-thin { stroke: #e0e0e0; stroke-width: 0.8; }
    .line-medium { stroke: #cccccc; stroke-width: 1.2; }
    .line-bold { stroke: #333333; stroke-width: 1.5; }
    
    .text-month-num { font-size: 36px; font-weight: 300; fill: #555555; }
    .text-month-name { font-size: 9px; font-weight: bold; fill: #666666; letter-spacing: 0.1em; }
    .text-year { font-size: 8px; fill: #888888; }
    .text-week-info { font-size: 8px; fill: #888888; }
    
    .text-day-num { font-size: 22px; font-weight: 300; fill: #333333; }
    .text-day-num-sun { font-size: 22px; font-weight: 300; fill: #c84040; }
    .text-day-name { font-size: 8px; font-weight: bold; fill: #555555; letter-spacing: 0.08em; }
    .text-day-name-sun { font-size: 8px; font-weight: bold; fill: #c84040; letter-spacing: 0.08em; }
    
    .text-day-count { font-size: 7px; fill: #aaaaaa; }
    .text-brand { font-size: 7px; fill: #aaaaaa; letter-spacing: 0.1em; }
  </style>

  <!-- 手帳外枠・中央綴じ線 -->
  <rect x="20" y="20" width="960" height="660" fill="none" stroke="#cccccc" stroke-width="1.5" />
  <line x1="500" y1="20" x2="500" y2="680" class="line-thin" stroke-dasharray="4 2" />

  <!-- =================================================== -->
  <!--                      左ページ                      -->
  <!-- =================================================== -->

  <!-- 左上ヘッダー（8 AUGUST） -->
  <g transform="translate(45, 45)">
    <text x="0" y="32" class="text-month-num">8</text>
    <text x="26" y="16" class="text-month-name">AUGUST</text>
  </g>

  <!-- 中央区切り縦線（左側フリースペース / MONDAY の境界を中央 x=262.5px に配置） -->
  <line x1="262.5" y1="120" x2="262.5" y2="340" class="line-thin" />
  <line x1="40" y1="85" x2="250" y2="85" class="line-medium" />

  <!-- --- 18 MONDAY --- -->
  <g transform="translate(277.5, 45)">
    <text x="0" y="22" class="text-day-num">18</text>
    <text x="32" y="12" class="text-day-name">MON</text>
    <!-- 上下分割線 -->
    <line x1="-15" y1="40" x2="202.5" y2="40" class="line-medium" />
    <!-- 中央横罫線 -->
    <line x1="-15" y1="185" x2="202.5" y2="185" class="line-thin" />
  </g>

  <!-- 横区切り線（月・火・水 と 木・金・土・日 の境目） -->
  <line x1="45" y1="340" x2="480" y2="340" class="line-medium" />

  <!-- --- 21 THURSDAY --- -->
  <g transform="translate(45, 355)">
    <text x="0" y="22" class="text-day-num">21</text>
    <text x="32" y="12" class="text-day-name">THU</text>
    <!-- 上下分割線 -->
    <line x1="0" y1="40" x2="210" y2="40" class="line-medium" />
    <!-- 中央横罫線 -->
    <line x1="0" y1="185" x2="210" y2="185" class="line-thin" />
  </g>

  <!-- 縦区切り線（木〜金） -->
  <line x1="262.5" y1="340" x2="262.5" y2="650" class="line-thin" />

  <!-- --- 22 FRIDAY --- -->
  <g transform="translate(277.5, 355)">
    <text x="0" y="22" class="text-day-num">22</text>
    <text x="32" y="12" class="text-day-name">FRI</text>
    <!-- 上下分割線 -->
    <line x1="-15" y1="40" x2="202.5" y2="40" class="line-medium" />
    <!-- 中央横罫線 -->
    <line x1="-15" y1="185" x2="202.5" y2="185" class="line-thin" />
  </g>


  <!-- =================================================== -->
  <!--                      右ページ                      -->
  <!-- =================================================== -->

  <!-- --- 19 TUESDAY --- -->
  <g transform="translate(520, 45)">
    <text x="0" y="22" class="text-day-num">19</text>
    <text x="32" y="12" class="text-day-name">TUE</text>
    <!-- 上下分割線 -->
    <line x1="0" y1="40" x2="205" y2="40" class="line-medium" />
    <!-- 中央横罫線 -->
    <line x1="0" y1="185" x2="205" y2="185" class="line-thin" />
  </g>

  <!-- 縦区切り線（火〜水） -->
  <line x1="737.5" y1="45" x2="737.5" y2="340" class="line-thin" />

  <!-- --- 20 WEDNESDAY --- -->
  <g transform="translate(752.5, 45)">
    <text x="0" y="22" class="text-day-num">20</text>
    <text x="32" y="12" class="text-day-name">WED</text>
    <!-- 上下分割線 -->
    <line x1="-15" y1="40" x2="202.5" y2="40" class="line-medium" />
    <!-- 中央横罫線 -->
    <line x1="-15" y1="185" x2="202.5" y2="185" class="line-thin" />
  </g>

  <!-- 横区切り線（火・水 と 土・日 の境目） -->
  <line x1="520" y1="340" x2="955" y2="340" class="line-medium" />

  <!-- --- 23 SATURDAY --- -->
  <g transform="translate(520, 355)">
    <text x="0" y="22" class="text-day-num">23</text>
    <text x="32" y="12" class="text-day-name">SAT</text>
    <!-- 上下分割線 -->
    <line x1="0" y1="40" x2="205" y2="40" class="line-medium" />
    <!-- 中央横罫線 -->
    <line x1="-10" y1="185" x2="205" y2="185" class="line-thin" />
  </g>

  <!-- 縦区切り線（土〜日） -->
  <line x1="737.5" y1="340" x2="737.5" y2="650" class="line-thin" />

  <!-- --- 24 SUNDAY --- -->
  <g transform="translate(752.5, 355)">
    <text x="0" y="22" class="text-day-num-sun">24</text>
    <text x="32" y="12" class="text-day-name-sun">SUN</text>
    <!-- 上下分割線 -->
    <line x1="-15" y1="40" x2="202.5" y2="40" class="line-medium" />
    <!-- 中央横罫線（他曜日と同じフォーマットに統一） -->
    <line x1="-15" y1="185" x2="202.5" y2="185" class="line-thin" />
  </g>
</svg>`,
  '週間バーチカル': `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1000 715" width="100%" height="100%" style="background-color: #ffffff; font-family: 'Helvetica Neue', Arial, 'Hiragino Kaku Gothic ProN', sans-serif;">

  <!-- 手帳外枠・中央綴じ線 -->
  <rect x="20" y="20" width="960" height="660" fill="none" stroke="#cccccc" stroke-width="1.5" />
  <line x1="500" y1="20" x2="500" y2="680" class="line-thin" stroke-dasharray="4 2" />

  <!-- ================= 左ページ ================= -->
  <!-- 左上 タイトル & ミニ月間カレンダー -->
  <text x="40" y="55" class="text-title">3</text>
  <text x="40" y="73" class="text-sub">2027</text>

  <!-- 曜日ヘッダー区切り線 -->
  <line x1="160" y1="65" x2="490" y2="65" class="line-thin" />
  <line x1="160" y1="20" x2="160" y2="630" class="line-dotted" />
  <line x1="265" y1="20" x2="265" y2="630" class="line-dotted" />
  <line x1="370" y1="20" x2="370" y2="630" class="line-dotted" />

  <!-- 1 MON -->
  <text x="170" y="45" class="text-day-num">1</text>
  <text x="185" y="45" class="text-day-name">MON</text>

  <!-- 2 TUE -->
  <text x="275" y="45" class="text-day-num">2</text>
  <text x="290" y="45" class="text-day-name">TUE</text>

  <!-- 3 WED -->
  <text x="380" y="45" class="text-day-num">3</text>
  <text x="395" y="45" class="text-day-name">WED</text>

  <!-- ================= 右ページ ================= -->
  <line x1="485" y1="65" x2="930" y2="65" class="line-thin" />
  <line x1="610" y1="20" x2="610" y2="630" class="line-dotted" />
  <line x1="715" y1="20" x2="715" y2="630" class="line-dotted" />
  <line x1="820" y1="20" x2="820" y2="630" class="line-dotted" />

  <!-- 4 THU -->
  <text x="510" y="45" class="text-day-num">4</text>
  <text x="525" y="45" class="text-day-name">THU</text>

  <!-- 5 FRI -->
  <text x="620" y="45" class="text-day-num">5</text>
  <text x="635" y="45" class="text-day-name">FRI</text>

  <!-- 6 SAT -->
  <text x="725" y="45" class="text-day-num">6</text>
  <text x="740" y="45" class="text-day-name">SAT</text>

  <!-- 7 SUN (赤字) -->
  <text x="830" y="45" class="text-day-num-sun">7</text>
  <text x="845" y="45" class="text-day-name-sun">SUN</text>


  <!-- ================= バーチカル時間軸（5時〜22時） ================= -->
  <line x1="40" y1="150" x2="930" y2="150" class="line-dotted" />
  <line x1="40" y1="170" x2="930" y2="170" class="line-dotted" />
  <line x1="40" y1="190" x2="930" y2="190" class="line-dotted" />
  <line x1="40" y1="210" x2="930" y2="210" class="line-dotted" />
  <line x1="40" y1="230" x2="930" y2="230" class="line-dotted" />
  <line x1="40" y1="250" x2="930" y2="250" class="line-dotted" />
  <line x1="40" y1="270" x2="930" y2="270" class="line-dotted" />
  <line x1="40" y1="290" x2="930" y2="290" class="line-dotted" />
  <line x1="40" y1="310" x2="930" y2="310" class="line-dotted" />
  <line x1="40" y1="330" x2="930" y2="330" class="line-dotted" />
  <line x1="40" y1="350" x2="930" y2="350" class="line-dotted" />
  <line x1="40" y1="370" x2="930" y2="370" class="line-dotted" />
  <line x1="40" y1="390" x2="930" y2="390" class="line-dotted" />
  <line x1="40" y1="410" x2="930" y2="410" class="line-dotted" />
  <line x1="40" y1="430" x2="930" y2="430" class="line-dotted" />
  <line x1="40" y1="450" x2="930" y2="450" class="line-dotted" />
  <line x1="40" y1="470" x2="930" y2="470" class="line-dotted" />
  <line x1="40" y1="490" x2="930" y2="490" class="line-dotted" />

  <!-- 垂直ガイド線上の時間数字（5〜22）を配置 (月〜日の全7列分) -->
  <g class="text-hour">
    <!-- 5 -->
    <text x="160" y="152">5</text><text x="265" y="152">5</text><text x="370" y="152">5</text><text x="505" y="152">5</text><text x="610" y="152">5</text><text x="715" y="152">5</text><text x="820" y="152">5</text>
    <!-- 6 -->
    <text x="160" y="172">6</text><text x="265" y="172">6</text><text x="370" y="172">6</text><text x="505" y="172">6</text><text x="610" y="172">6</text><text x="715" y="172">6</text><text x="820" y="172">6</text>
    <!-- 7 -->
    <text x="160" y="192">7</text><text x="265" y="192">7</text><text x="370" y="192">7</text><text x="505" y="192">7</text><text x="610" y="192">7</text><text x="715" y="192">7</text><text x="820" y="192">7</text>
    <!-- 8 -->
    <text x="160" y="212">8</text><text x="265" y="212">8</text><text x="370" y="212">8</text><text x="505" y="212">8</text><text x="610" y="212">8</text><text x="715" y="212">8</text><text x="820" y="212">8</text>
    <!-- 9 -->
    <text x="160" y="232">9</text><text x="265" y="232">9</text><text x="370" y="232">9</text><text x="505" y="232">9</text><text x="610" y="232">9</text><text x="715" y="232">9</text><text x="820" y="232">9</text>
    <!-- 10 -->
    <text x="160" y="252">10</text><text x="265" y="252">10</text><text x="370" y="252">10</text><text x="505" y="252">10</text><text x="610" y="252">10</text><text x="715" y="252">10</text><text x="820" y="252">10</text>
    <!-- 11 -->
    <text x="160" y="272">11</text><text x="265" y="272">11</text><text x="370" y="272">11</text><text x="505" y="272">11</text><text x="610" y="272">11</text><text x="715" y="272">11</text><text x="820" y="272">11</text>
    <!-- 12 -->
    <text x="160" y="292">12</text><text x="265" y="292">12</text><text x="370" y="292">12</text><text x="505" y="292">12</text><text x="610" y="292">12</text><text x="715" y="292">12</text><text x="820" y="292">12</text>
    <!-- 13 -->
    <text x="160" y="312">13</text><text x="265" y="312">13</text><text x="370" y="312">13</text><text x="505" y="312">13</text><text x="610" y="312">13</text><text x="715" y="312">13</text><text x="820" y="312">13</text>
    <!-- 14 -->
    <text x="160" y="332">14</text><text x="265" y="332">14</text><text x="370" y="332">14</text><text x="505" y="332">14</text><text x="610" y="332">14</text><text x="715" y="332">14</text><text x="820" y="332">14</text>
    <!-- 15 -->
    <text x="160" y="352">15</text><text x="265" y="352">15</text><text x="370" y="352">15</text><text x="505" y="352">15</text><text x="610" y="352">15</text><text x="715" y="352">15</text><text x="820" y="352">15</text>
    <!-- 16 -->
    <text x="160" y="372">16</text><text x="265" y="372">16</text><text x="370" y="372">16</text><text x="505" y="372">16</text><text x="610" y="372">16</text><text x="715" y="372">16</text><text x="820" y="372">16</text>
    <!-- 17 -->
    <text x="160" y="392">17</text><text x="265" y="392">17</text><text x="370" y="392">17</text><text x="505" y="392">17</text><text x="610" y="392">17</text><text x="715" y="392">17</text><text x="820" y="392">17</text>
    <!-- 18 -->
    <text x="160" y="412">18</text><text x="265" y="412">18</text><text x="370" y="412">18</text><text x="505" y="412">18</text><text x="610" y="412">18</text><text x="715" y="412">18</text><text x="820" y="412">18</text>
    <!-- 19 -->
    <text x="160" y="432">19</text><text x="265" y="432">19</text><text x="370" y="432">19</text><text x="505" y="432">19</text><text x="610" y="432">19</text><text x="715" y="432">19</text><text x="820" y="432">19</text>
    <!-- 20 -->
    <text x="160" y="452">20</text><text x="265" y="452">20</text><text x="370" y="452">20</text><text x="505" y="452">20</text><text x="610" y="452">20</text><text x="715" y="452">20</text><text x="820" y="452">20</text>
    <!-- 21 -->
    <text x="160" y="472">21</text><text x="265" y="472">21</text><text x="370" y="472">21</text><text x="505" y="472">21</text><text x="610" y="472">21</text><text x="715" y="472">21</text><text x="820" y="472">21</text>
    <!-- 22 -->
    <text x="160" y="492">22</text><text x="265" y="492">22</text><text x="370" y="492">22</text><text x="505" y="492">22</text><text x="610" y="492">22</text><text x="715" y="492">22</text><text x="820" y="492">22</text>
  </g>

  <!-- ================= 下部：メモエリア（横ドット罫線） ================= -->
  <line x1="40" y1="510" x2="930" y2="510" class="line-dotted" />
  <line x1="40" y1="530" x2="930" y2="530" class="line-dotted" />
  <line x1="40" y1="550" x2="930" y2="550" class="line-dotted" />
  <line x1="40" y1="570" x2="930" y2="570" class="line-dotted" />
  <line x1="40" y1="590" x2="930" y2="590" class="line-dotted" />
  <line x1="40" y1="610" x2="930" y2="610" class="line-dotted" />
  <line x1="40" y1="630" x2="930" y2="630" class="line-thin" />
</svg>`,
'フリーバーチカル': `  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1000 715" width="100%" height="100%" style="background-color: #ffffff; font-family: 'Helvetica Neue', Arial, 'Hiragino Kaku Gothic ProN', sans-serif;">

  <!-- 手帳外枠・中央の綴じ線 -->
  <rect x="20" y="20" width="960" height="660" fill="none" stroke="#cccccc" stroke-width="1.5" />
  <line x1="500" y1="20" x2="500" y2="680" class="line-thin" stroke-dasharray="4 2" /> <!-- 中央綴じ -->


  <!-- ================= 左ページ（左半分） ================= -->
  <!-- 左上 タイトルブロック -->
  <text x="40" y="65" class="text-title">3</text>
  <text x="40" y="85" class="text-sub">2027</text>

  <!-- 1 MON -->
  <line x1="140" y1="40" x2="140" y2="120" class="line-thin" />
  <text x="148" y="62" class="text-day-num">1</text>
  <text x="162" y="60" class="text-day-name">MON</text>
  <!-- 2 TUE -->
  <line x1="225" y1="40" x2="225" y2="120" class="line-thin" />
  <text x="233" y="62" class="text-day-num">2</text>
  <text x="247" y="60" class="text-day-name">TUE</text>
  <!-- 3 WED -->
  <line x1="310" y1="40" x2="310" y2="120" class="line-thin" />
  <text x="318" y="62" class="text-day-num">3</text>
  <text x="332" y="60" class="text-day-name">WED</text>

  <!-- 上部ヘッダー区切り線 -->
  <line x1="140" y1="120" x2="490" y2="120" class="line-thin" />

  <!-- 中段：縦の点線ガイド（日付列に合わせた垂直ガイド） -->
  <line x1="140" y1="210" x2="490" y2="210" class="line-dotted" />
  <line x1="140" y1="300" x2="490" y2="300" class="line-dotted" />

  <!-- 下段：Notes＆罫線メモエリア -->
  <line x1="40" y1="380" x2="490" y2="380" class="line-thin" />
  
  <!-- 罫線（横ドット線） -->
  <line x1="40" y1="410" x2="490" y2="410" class="line-dotted" />
  <line x1="40" y1="430" x2="490" y2="430" class="line-dotted" />
  <line x1="40" y1="450" x2="490" y2="450" class="line-dotted" />
  <line x1="40" y1="470" x2="490" y2="470" class="line-dotted" />
  <line x1="40" y1="490" x2="490" y2="490" class="line-dotted" />
  <line x1="40" y1="510" x2="490" y2="510" class="line-dotted" />
  <line x1="40" y1="530" x2="490" y2="530" class="line-dotted" />
  <line x1="40" y1="550" x2="490" y2="550" class="line-dotted" />
  <line x1="40" y1="570" x2="490" y2="570" class="line-dotted" />
  <line x1="40" y1="590" x2="490" y2="590" class="line-dotted" />
  <line x1="40" y1="610" x2="490" y2="610" class="line-dotted" />
  <line x1="40" y1="630" x2="490" y2="630" class="line-thin" />

  <!-- ================= 右ページ（右半分） ================= -->
  <!-- 4 THU -->
  <line x1="510" y1="40" x2="510" y2="120" class="line-thin" />
  <text x="518" y="62" class="text-day-num">4</text>
  <text x="532" y="60" class="text-day-name">THU</text>

  <!-- 5 FRI -->
  <line x1="610" y1="40" x2="610" y2="120" class="line-thin" />
  <text x="618" y="62" class="text-day-num">5</text>
  <text x="632" y="60" class="text-day-name">FRI</text>

  <!-- 6 SAT -->
  <line x1="710" y1="40" x2="710" y2="120" class="line-thin" />
  <text x="718" y="62" class="text-day-num">6</text>
  <text x="732" y="60" class="text-day-name">SAT</text>

  <!-- 7 SUN (赤字) -->
  <line x1="810" y1="40" x2="810" y2="120" class="line-thin" />
  <text x="818" y="62" class="text-day-num-sun">7</text>
  <text x="832" y="60" class="text-day-name-sun">SUN</text>

  <!-- 右ページ上部区切り線 -->
  <line x1="510" y1="120" x2="920" y2="120" class="line-thin" />

  <!-- 右ページ中段：縦の点線ガイド -->
  <line x1="510" y1="210" x2="920" y2="210" class="line-dotted" />
  <line x1="510" y1="300" x2="920" y2="300" class="line-dotted" />

  <!-- 右ページ下段：罫線メモエリア -->
  <line x1="510" y1="380" x2="920" y2="380" class="line-thin" />
  <line x1="510" y1="410" x2="920" y2="410" class="line-dotted" />
  <line x1="510" y1="430" x2="920" y2="430" class="line-dotted" />
  <line x1="510" y1="450" x2="920" y2="450" class="line-dotted" />
  <line x1="510" y1="470" x2="920" y2="470" class="line-dotted" />
  <line x1="510" y1="490" x2="920" y2="490" class="line-dotted" />
  <line x1="510" y1="510" x2="920" y2="510" class="line-dotted" />
  <line x1="510" y1="530" x2="920" y2="530" class="line-dotted" />
  <line x1="510" y1="550" x2="920" y2="550" class="line-dotted" />
  <line x1="510" y1="570" x2="920" y2="570" class="line-dotted" />
  <line x1="510" y1="590" x2="920" y2="590" class="line-dotted" />
  <line x1="510" y1="610" x2="920" y2="610" class="line-dotted" />
  <line x1="510" y1="630" x2="920" y2="630" class="line-thin" />

</svg>`,
  '週間レフト': `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1000 700" width="100%" height="100%" style="background-color: #ffffff; font-family: 'Helvetica Neue', Arial, 'Hiragino Kaku Gothic ProN', sans-serif;">

  <defs>
    <!-- 右ページ用方眼パターン (小サイズ用に40px) -->
    <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
      <path d="M 40 0 L 0 0 0 40" fill="none" class="line-grid" />
    </pattern>
  </defs>

  <!-- 手帳外枠 & 中央綴じ線 -->
  <rect x="20" y="20" width="960" height="660" fill="#ffffff" rx="8" class="line-outer" />
  <line x1="500" y1="20" x2="500" y2="680" class="line-center" />

  <!-- =================================================== -->
  <!--                      左ページ                      -->
  <!-- =================================================== -->

  <!-- 左上ヘッダー (8 AUGUSTを大きく) -->
  <g transform="translate(45, 30)">
    <text x="0" y="30" class="text-month-num">8</text>
    <text x="50" y="30" class="text-week">AUGUST</text>
  </g>

  <!-- ヘッダー下区切り横線 -->
  <line x1="45" y1="90" x2="480" y2="90" class="line-border" />

  <!-- 7日間エリア (各高さ: 80px / 曜日を消して数字を特大化) -->
  <!-- 2 -->
  <g transform="translate(45, 90)">
    <text x="8" y="56" class="text-day-num">2</text>
    <line x1="0" y1="80" x2="435" y2="80" class="line-dotted" />
  </g>

  <!-- 3 -->
  <g transform="translate(45, 170)">
    <text x="8" y="56" class="text-day-num">3</text>
    <line x1="0" y1="80" x2="435" y2="80" class="line-dotted" />
  </g>

  <!-- 4 -->
  <g transform="translate(45, 250)">
    <text x="8" y="56" class="text-day-num">4</text>
    <line x1="0" y1="80" x2="435" y2="80" class="line-dotted" />
  </g>

  <!-- 5 -->
  <g transform="translate(45, 330)">
    <text x="8" y="56" class="text-day-num">5</text>
    <line x1="0" y1="80" x2="435" y2="80" class="line-dotted" />
  </g>

  <!-- 6 -->
  <g transform="translate(45, 410)">
    <text x="8" y="56" class="text-day-num">6</text>
    <line x1="0" y1="80" x2="435" y2="80" class="line-dotted" />
  </g>

  <!-- 7 -->
  <g transform="translate(45, 490)">
    <text x="8" y="56" class="text-day-num">7</text>
    <line x1="0" y1="80" x2="435" y2="80" class="line-dotted" />
  </g>

  <!-- 8 -->
  <g transform="translate(45, 570)">
    <text x="8" y="56" class="text-day-num">8</text>
  </g>


  <!-- =================================================== -->
  <!--                      右ページ                      -->
  <!-- =================================================== -->

  <!-- 方眼メモ領域 -->
  <rect x="520" y="40" width="435" height="610" fill="url(#grid)" stroke="#888888" stroke-width="1.5" />

</svg>

`,
  '1日1ページ': `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1000 700" width="100%" height="100%" style="background-color: #ffffff; font-family: 'Helvetica Neue', Arial, 'Hiragino Kaku Gothic ProN', sans-serif;">


  <!-- 手帳外枠・中央綴じ線 -->
  <rect x="20" y="20" width="960" height="660" fill="none" stroke="#cccccc" stroke-width="1.5" />
  <line x1="500" y1="20" x2="500" y2="680" class="line-thin" stroke-dasharray="4 2" />

  <!-- ================= 左ページ ================= -->
  <text x="65" y="85" class="text-day-num">1</text>
  <text x="65" y="102" class="text-day-name">WED</text>

  <line x1="65" y1="110" x2="465" y2="110" class="line-bold" />

  <!-- メイン記入エリア（時間軸＋横ドット罫線） -->

  <g>
    <!-- 横方向のドット罫線（16px間隔） -->
    <line x1="80" y1="139" x2="465" y2="139" class="line-dotted" />
    <line x1="80" y1="155" x2="465" y2="155" class="line-dotted" />
    <line x1="80" y1="171" x2="465" y2="171" class="line-dotted" />
    <line x1="80" y1="187" x2="465" y2="187" class="line-dotted" />
    <line x1="80" y1="203" x2="465" y2="203" class="line-dotted" />
    <line x1="80" y1="219" x2="465" y2="219" class="line-dotted" />
    <line x1="80" y1="235" x2="465" y2="235" class="line-dotted" />
    <line x1="80" y1="251" x2="465" y2="251" class="line-dotted" />
    <line x1="80" y1="267" x2="465" y2="267" class="line-dotted" />
    <line x1="80" y1="283" x2="465" y2="283" class="line-dotted" />
    <line x1="80" y1="299" x2="465" y2="299" class="line-dotted" />
    <line x1="80" y1="315" x2="465" y2="315" class="line-dotted" />
    <line x1="80" y1="331" x2="465" y2="331" class="line-dotted" />
    <line x1="80" y1="347" x2="465" y2="347" class="line-dotted" />
    <line x1="80" y1="363" x2="465" y2="363" class="line-dotted" />
    <line x1="80" y1="379" x2="465" y2="379" class="line-dotted" />
    <line x1="80" y1="395" x2="465" y2="395" class="line-dotted" />
    <line x1="80" y1="411" x2="465" y2="411" class="line-dotted" />
    <line x1="80" y1="427" x2="465" y2="427" class="line-dotted" />
    <line x1="80" y1="443" x2="465" y2="443" class="line-dotted" />
    <line x1="80" y1="459" x2="465" y2="459" class="line-dotted" />
    <line x1="80" y1="475" x2="465" y2="475" class="line-dotted" />
    <line x1="80" y1="491" x2="465" y2="491" class="line-dotted" />
    <line x1="80" y1="507" x2="465" y2="507" class="line-dotted" />
    <line x1="65" y1="523" x2="465" y2="523" class="line-dotted" />
    <line x1="65" y1="539" x2="465" y2="539" class="line-dotted" />
    <line x1="65" y1="555" x2="465" y2="555" class="line-dotted" />
    <line x1="65" y1="571" x2="465" y2="571" class="line-dotted" />
    <line x1="65" y1="587" x2="465" y2="587" class="line-dotted" />
    <line x1="65" y1="603" x2="465" y2="603" class="line-dotted" />
    <line x1="65" y1="619" x2="465" y2="619" class="line-dotted" />
    <line x1="65" y1="635" x2="465" y2="635" class="line-dotted" />


    <!-- 時間数字 (6〜21) -->
    <text x="68" y="142" class="text-hour">5</text>
    <text x="68" y="158" class="text-hour">6</text>
    <text x="68" y="174" class="text-hour">7</text>
    <text x="68" y="190" class="text-hour">8</text>
    <text x="68" y="206" class="text-hour">9</text>
    <text x="68" y="222" class="text-hour">10</text>
    <text x="68" y="238" class="text-hour">11</text>
    <text x="68" y="254" class="text-hour">12</text>
    <text x="68" y="270" class="text-hour">13</text>
    <text x="68" y="286" class="text-hour">14</text>
    <text x="68" y="302" class="text-hour">15</text>
    <text x="68" y="318" class="text-hour">16</text>
    <text x="68" y="334" class="text-hour">17</text>
    <text x="68" y="350" class="text-hour">18</text>
    <text x="68" y="366" class="text-hour">19</text>
    <text x="68" y="382" class="text-hour">20</text>
    <text x="68" y="398" class="text-hour">21</text>
    <text x="68" y="414" class="text-hour">22</text>
    <text x="68" y="430" class="text-hour">23</text>
    <text x="68" y="446" class="text-hour">24</text>
    <text x="68" y="462" class="text-hour">1</text>
    <text x="68" y="478" class="text-hour">2</text>
    <text x="68" y="494" class="text-hour">3</text>
    <text x="68" y="510" class="text-hour">4</text>
  </g>

  <line x1="65" y1="652" x2="465" y2="652" class="line-bold" />



  <!-- ================= 右ページ ================= -->
  <text x="540" y="85" class="text-day-num">2</text>
  <text x="540" y="102" class="text-day-name">THU</text>

  <line x1="540" y1="110" x2="935" y2="110" class="line-bold" />

  <g>
    <!-- 横方向のドット罫線 -->
    <line x1="560" y1="139" x2="935" y2="139" class="line-dotted" />
    <line x1="560" y1="155" x2="935" y2="155" class="line-dotted" />
    <line x1="560" y1="171" x2="935" y2="171" class="line-dotted" />
    <line x1="560" y1="187" x2="935" y2="187" class="line-dotted" />
    <line x1="560" y1="203" x2="935" y2="203" class="line-dotted" />
    <line x1="560" y1="219" x2="935" y2="219" class="line-dotted" />
    <line x1="560" y1="235" x2="935" y2="235" class="line-dotted" />
    <line x1="560" y1="251" x2="935" y2="251" class="line-dotted" />
    <line x1="560" y1="267" x2="935" y2="267" class="line-dotted" />
    <line x1="560" y1="283" x2="935" y2="283" class="line-dotted" />
    <line x1="560" y1="299" x2="935" y2="299" class="line-dotted" />
    <line x1="560" y1="315" x2="935" y2="315" class="line-dotted" />
    <line x1="560" y1="331" x2="935" y2="331" class="line-dotted" />
    <line x1="560" y1="347" x2="935" y2="347" class="line-dotted" />
    <line x1="560" y1="363" x2="935" y2="363" class="line-dotted" />
    <line x1="560" y1="379" x2="935" y2="379" class="line-dotted" />
    <line x1="560" y1="395" x2="935" y2="395" class="line-dotted" />
    <line x1="560" y1="411" x2="935" y2="411" class="line-dotted" />
    <line x1="560" y1="427" x2="935" y2="427" class="line-dotted" />
    <line x1="560" y1="443" x2="935" y2="443" class="line-dotted" />
    <line x1="560" y1="459" x2="935" y2="459" class="line-dotted" />
    <line x1="560" y1="475" x2="935" y2="475" class="line-dotted" />
    <line x1="560" y1="491" x2="935" y2="491" class="line-dotted" />
    <line x1="560" y1="507" x2="935" y2="507" class="line-dotted" />
    <line x1="540" y1="523" x2="935" y2="523" class="line-dotted" />
    <line x1="540" y1="539" x2="935" y2="539" class="line-dotted" />
    <line x1="540" y1="555" x2="935" y2="555" class="line-dotted" />
    <line x1="540" y1="571" x2="935" y2="571" class="line-dotted" />
    <line x1="540" y1="587" x2="935" y2="587" class="line-dotted" />
    <line x1="540" y1="603" x2="935" y2="603" class="line-dotted" />
    <line x1="540" y1="619" x2="935" y2="619" class="line-dotted" />
    <line x1="540" y1="635" x2="935" y2="635" class="line-dotted" />

    <!-- 時間数字 (6〜21) -->
    <text x="545" y="142" class="text-hour">5</text>
    <text x="545" y="158" class="text-hour">6</text>
    <text x="545" y="174" class="text-hour">7</text>
    <text x="545" y="190" class="text-hour">8</text>
    <text x="545" y="206" class="text-hour">9</text>
    <text x="545" y="222" class="text-hour">10</text>
    <text x="545" y="238" class="text-hour">11</text>
    <text x="545" y="254" class="text-hour">12</text>
    <text x="545" y="270" class="text-hour">13</text>
    <text x="545" y="286" class="text-hour">14</text>
    <text x="545" y="302" class="text-hour">15</text>
    <text x="545" y="318" class="text-hour">16</text>
    <text x="545" y="334" class="text-hour">17</text>
    <text x="545" y="350" class="text-hour">18</text>
    <text x="545" y="366" class="text-hour">19</text>
    <text x="545" y="382" class="text-hour">20</text>
    <text x="545" y="398" class="text-hour">21</text>
    <text x="545" y="414" class="text-hour">22</text>
    <text x="545" y="430" class="text-hour">23</text>
    <text x="545" y="446" class="text-hour">24</text>
    <text x="545" y="462" class="text-hour">1</text>
    <text x="545" y="478" class="text-hour">2</text>
    <text x="545" y="494" class="text-hour">3</text>
    <text x="545" y="510" class="text-hour">4</text>
  </g>

  <line x1="540" y1="652" x2="935" y2="652" class="line-bold" />

</svg>`,
'2日1ページ': `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1000 700" width="100%" height="100%" style="background-color: #ffffff; font-family: 'Helvetica Neue', Arial, 'Hiragino Kaku Gothic ProN', sans-serif;">

  <!-- 手帳外枠・中央綴じ線 -->
  <rect x="20" y="20" width="960" height="660" fill="none" stroke="#cccccc" stroke-width="1.5" />
  <line x1="500" y1="20" x2="500" y2="680" class="line-thin" stroke-dasharray="4 2" />


  <!-- ================= 左ページ（1日・2日） ================= -->
  <!-- 左上 月ヘッダー -->
  <text x="65" y="65" class="text-month"><tspan font-size="18">2027</tspan>　3</text>
  <line x1="65" y1="75" x2="475" y2="75" class="line-header" />

  <!-- --- 1日 (Thu) --- -->
  <g transform="translate(65, 80)">
    <text x="0" y="32" class="text-day-num">1</text>
    <text x="25" y="28" class="text-day-name">Thu</text>
    
    <line x1="0" y1="40" x2="410" y2="40" class="line-thin" stroke-width="1.2" />

    <!-- 横罫線（8本） -->
    <line x1="0" y1="70" x2="410" y2="70" class="line-dotted" />
    <line x1="0" y1="100" x2="410" y2="100" class="line-dotted" />
    <line x1="0" y1="130" x2="410" y2="130" class="line-dotted" />
    <line x1="0" y1="160" x2="410" y2="160" class="line-dotted" />
    <line x1="0" y1="190" x2="410" y2="190" class="line-dotted" />
    <line x1="0" y1="220" x2="410" y2="220" class="line-dotted" />
    <line x1="0" y1="250" x2="410" y2="250" class="line-thin" />
  </g>

  <!-- 左右の中央区切り線 -->
  <line x1="65" y1="365" x2="475" y2="365" class="line-divider" />

  <!-- --- 2日 (Fri) --- -->
  <g transform="translate(65, 370)">
    <text x="0" y="32" class="text-day-num">2</text>
    <text x="25" y="28" class="text-day-name">Fri</text>
    
    <line x1="0" y1="40" x2="410" y2="40" class="line-thin" stroke-width="1.2" />

    <!-- 横罫線（8本） -->
    <line x1="0" y1="70" x2="410" y2="70" class="line-dotted" />
    <line x1="0" y1="100" x2="410" y2="100" class="line-dotted" />
    <line x1="0" y1="130" x2="410" y2="130" class="line-dotted" />
    <line x1="0" y1="160" x2="410" y2="160" class="line-dotted" />
    <line x1="0" y1="190" x2="410" y2="190" class="line-dotted" />
    <line x1="0" y1="220" x2="410" y2="220" class="line-dotted" />
    <line x1="0" y1="250" x2="410" y2="250" class="line-dotted" />
    <line x1="0" y1="280" x2="410" y2="280" class="line-thin" />
  </g>


  <!-- ================= 右ページ（3日・4日） ================= -->
  <!-- 右上区切り線 -->
  <line x1="520" y1="75" x2="930" y2="75" class="line-header" />

  <!-- --- 3日 (Sat) --- -->
  <g transform="translate(520, 80)">
    <text x="0" y="32" class="text-day-num">3</text>
    <text x="25" y="28" class="text-day-name">Sat</text>
    
    <line x1="0" y1="40" x2="410" y2="40" class="line-thin" stroke-width="1.2" />

    <!-- 横罫線（8本） -->
    <line x1="0" y1="70" x2="410" y2="70" class="line-dotted" />
    <line x1="0" y1="100" x2="410" y2="100" class="line-dotted" />
    <line x1="0" y1="130" x2="410" y2="130" class="line-dotted" />
    <line x1="0" y1="160" x2="410" y2="160" class="line-dotted" />
    <line x1="0" y1="190" x2="410" y2="190" class="line-dotted" />
    <line x1="0" y1="220" x2="410" y2="220" class="line-dotted" />
    <line x1="0" y1="250" x2="410" y2="250" class="line-thin" />
  </g>

  <!-- 右ページ中央区切り線 -->
  <line x1="520" y1="365" x2="930" y2="365" class="line-divider" />

  <!-- --- 4日 (Sun - 赤字) --- -->
  <g transform="translate(520, 370)">
    <text x="0" y="32" class="text-day-num-sun">4</text>
    <text x="25" y="28" class="text-day-name-sun">Sun</text>
    
    <line x1="0" y1="40" x2="410" y2="40" class="line-thin" stroke-width="1.2" />

    <!-- 横罫線（8本） -->
    <line x1="0" y1="70" x2="410" y2="70" class="line-dotted" />
    <line x1="0" y1="100" x2="410" y2="100" class="line-dotted" />
    <line x1="0" y1="130" x2="410" y2="130" class="line-dotted" />
    <line x1="0" y1="160" x2="410" y2="160" class="line-dotted" />
    <line x1="0" y1="190" x2="410" y2="190" class="line-dotted" />
    <line x1="0" y1="220" x2="410" y2="220" class="line-dotted" />
    <line x1="0" y1="250" x2="410" y2="250" class="line-dotted" />
    <line x1="0" y1="280" x2="410" y2="280" class="line-thin" />
  </g>
</svg>`,
};

// SVGの未定義時に使うフォールバックSVG
const DEFAULT_SVG = `<svg viewBox="0 0 120 85" width="100%" height="100%" xmlns="http://www.w3.org/2000/svg"><rect width="120" height="85" fill="#ffffff" rx="4"/><rect x="10" y="10" width="45" height="65" fill="#f5f5f5" stroke="#e0e0e0"/><rect x="65" y="10" width="45" height="65" fill="#f5f5f5" stroke="#e0e0e0"/></svg>`;


// 5. メイン処理
fetch('data.json')
  .then(res => res.json())
  .then(data => {
    const formatMap = new Map();

    // データの抽出・マッピング処理
    data.forEach(item => {
      const parentLayout = item.layout_type ? item.layout_type.trim() : '';

      // マンスリーの場合のみ、親の layout_type 自体をカードとして登録
      if (parentLayout === 'マンスリー') {
        formatMap.set('マンスリー', 'マンスリー');
      }

      if (Array.isArray(item.variants)) {
        item.variants.forEach(v => {
          if (parentLayout === 'ウィークリー' && v.weekly_sub_type && v.weekly_sub_type.trim() !== '') {
            formatMap.set(v.weekly_sub_type.trim(), 'ウィークリー');
          }
          if (parentLayout === 'デイリー' && v.daily_sub_type && v.daily_sub_type.trim() !== '') {
            formatMap.set(v.daily_sub_type.trim(), 'デイリー');
          }
          if (parentLayout === 'マンスリー' && v.monthly_sub_type && v.monthly_sub_type.trim() !== '') {
            formatMap.set(v.monthly_sub_type.trim(), 'マンスリー');
          }
        });
      }
    });

    const container = document.getElementById('format-guide-container');
    if (container) {
      // ソート処理（layout_type 順 -> グループ内五十音順）
      const sortedFormats = Array.from(formatMap.keys()).sort((a, b) => {
        const layoutA = formatMap.get(a);
        const layoutB = formatMap.get(b);

        const orderA = LAYOUT_ORDER[layoutA] || 99;
        const orderB = LAYOUT_ORDER[layoutB] || 99;

        if (orderA !== orderB) {
          return orderA - orderB;
        }

        if (a === layoutA) return -1;
        if (b === layoutB) return 1;

        return a.localeCompare(b, 'ja');
      });

      // HTML カード群の生成・描画
      container.innerHTML = sortedFormats.map(format => {
        const parentLayout = formatMap.get(format);
        const themeClass = getThemeClass(parentLayout);

        // タイトル変換（マンスリーのみ「ブロックマンスリー」と表示）
        const displayTitle = (format === 'マンスリー') ? 'ブロックマンスリー' : format;

        // 説明文の取得
        const description = FORMAT_DESCRIPTIONS[displayTitle] || FORMAT_DESCRIPTIONS[format] || '使いやすさと機能性を兼ね備えた\n人気フォーマット';

        // バッジ（layout_type を表示）
        const badgeHTML = parentLayout 
          ? `<span class="format-badge">${escapeHTML(parentLayout)}</span>` 
          : '';

        // SVGコードの取得（定義がない場合はDEFAULT_SVG）
        const svgContent = FORMAT_SVGS[displayTitle] || FORMAT_SVGS[format] || DEFAULT_SVG;

        return `
          <a href="list.html?layout=${encodeURIComponent(format)}" class="format-card ${themeClass}">
            <div class="format-card-content">
              <div class="format-badges">
                ${badgeHTML}
              </div>
              <h3 class="format-title">${escapeHTML(displayTitle)}</h3>
              <p class="format-desc">${escapeHTML(description).replace(/\n/g, '<br>')}</p>
            </div>
            <div class="format-card-image">
              ${svgContent}
            </div>
          </a>
        `;
      }).join('');
    }
  })
  .catch(err => console.error("データ読み込みエラー:", err));

// HTMLエスケープ処理
function escapeHTML(str) {
  if (!str) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/ layout_type>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

