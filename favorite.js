// ==========================================
// グローバル変数 & 初期化
// ==========================================
let isCompareMode = false;
let selectedCompareIds = [];

document.addEventListener('DOMContentLoaded', async () => {
  // 1. ハンバーガーメニューの初期化
  initDrawerMenu();

  // 2. お気に入りデータの読み込みと描画
  await initFavorites();

  // 3. 「比較する」ボタンのイベント登録
  const compareBtn = document.querySelector('.btn-compare') || document.getElementById('compare-btn');
  if (compareBtn) {
    compareBtn.addEventListener('click', toggleCompareMode);
  }

  // 4. カードクリック時のイベントリスナー登録（親要素への委譲）
  const container = document.getElementById('product-list') || document.querySelector('.product-grid');
  if (container) {
    container.addEventListener('click', handleCardClick);
  }
});



// ==========================================
// ドロワーメニュー制御
// ==========================================
function initDrawerMenu() {
  // id または class の両方で取得を試みる
  const openBtn = document.getElementById('open-menu-btn') || document.querySelector('.open-menu-btn');
  const closeBtn = document.getElementById('close-menu-btn') || document.querySelector('.close-menu-btn');
  const drawer = document.getElementById('drawer-menu') || document.querySelector('.drawer-menu');
  const overlay = document.getElementById('drawer-overlay') || document.querySelector('.drawer-overlay');

  // 要素が見つからない場合はコンソールに警告を出して処理を抜ける（エラーで停止するのを防ぐ）
  if (!openBtn || !drawer) {
    console.warn('ハンバーガーメニューの要素が見つかりませんでした。HTMLのid/classを確認してください。', { openBtn, drawer });
    return;
  }

  const openDrawer = (e) => {
    if (e) e.preventDefault();
    drawer.classList.add('is-open');
    overlay?.classList.add('is-open');
    document.body.style.overflow = 'hidden';
  };

  const closeDrawer = (e) => {
    if (e) e.preventDefault();
    drawer.classList.remove('is-open');
    overlay?.classList.remove('is-open');
    document.body.style.overflow = '';
  };

  openBtn.addEventListener('click', openDrawer);
  closeBtn?.addEventListener('click', closeDrawer);
  overlay?.addEventListener('click', closeDrawer);
}

// ==========================================
// お気に入り取得 & 描画処理
// ==========================================
async function initFavorites() {
  try {
    const response = await fetch('./data.json');
    if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
    
    const allProducts = await response.json();
    renderFavorites(allProducts);
  } catch (error) {
    console.error('データの読み込みエラー:', error);
    const container = document.getElementById('product-list') || document.querySelector('.product-grid');
    if (container) {
      container.innerHTML = '<p style="text-align:center; padding:40px;">データの読み込みに失敗しました。</p>';
    }
  }
}

function getFavorites() {
  return JSON.parse(localStorage.getItem('favorites') || '[]');
}

function renderFavorites(allProducts) {
  const favorites = getFavorites().map(String);
  const favoriteProducts = allProducts.filter(product => 
    favorites.includes(String(product.id))
  );

  if (typeof renderProductCards === 'function') {
    renderProductCards(favoriteProducts);
  }
}

// ==========================================
// 比較モード機能
// ==========================================
function toggleCompareMode() {
  isCompareMode = !isCompareMode;
  selectedCompareIds = [];

  const bodyContainer = document.body;
  const compareBtn = document.querySelector('.btn-compare') || document.getElementById('compare-btn');

  let instructionEl = document.getElementById('compare-instruction');
  if (!instructionEl && compareBtn) {
    instructionEl = document.createElement('div');
    instructionEl.id = 'compare-instruction';
    instructionEl.className = 'compare-instruction';
    compareBtn.parentNode.insertBefore(instructionEl, compareBtn.nextSibling);
  }

  if (isCompareMode) {
    bodyContainer.classList.add('is-compare-mode');
    if (compareBtn) compareBtn.textContent = 'キャンセル';
    if (instructionEl) {
      instructionEl.textContent = '比較するアイテムを2つ選択してください';
      instructionEl.style.display = 'inline-block';
    }
  } else {
    resetCompareMode();
  }

  updateCardSelectionUI();
}

function resetCompareMode() {
  isCompareMode = false;
  selectedCompareIds = [];
  document.body.classList.remove('is-compare-mode');

  const compareBtn = document.querySelector('.btn-compare') || document.getElementById('compare-btn');
  if (compareBtn) compareBtn.textContent = '比較する';

  const instructionEl = document.getElementById('compare-instruction');
  if (instructionEl) instructionEl.style.display = 'none';

  updateCardSelectionUI();
}

function handleCardClick(e) {
  if (!isCompareMode) return;

  const card = e.target.closest('.product-card');
  if (!card) return;

  e.preventDefault();
  e.stopPropagation();

  const productId = String(card.dataset.id || card.getAttribute('data-id'));
  if (!productId) return;

  const index = selectedCompareIds.indexOf(productId);

  if (index > -1) {
    selectedCompareIds.splice(index, 1);
  } else {
    if (selectedCompareIds.length < 2) {
      selectedCompareIds.push(productId);
    }
  }

  updateCardSelectionUI();

  if (selectedCompareIds.length === 2) {
    setTimeout(() => {
      window.location.href = `compare.html?ids=${selectedCompareIds.join(',')}`;
    }, 400);
  }
}

function updateCardSelectionUI() {
  const cards = document.querySelectorAll('.product-card');

  cards.forEach(card => {
    const productId = String(card.dataset.id || card.getAttribute('data-id'));
    const selectIndex = selectedCompareIds.indexOf(productId);

    let badge = card.querySelector('.compare-badge');
    if (!badge) {
      badge = document.createElement('div');
      badge.className = 'compare-badge';
      card.appendChild(badge);
    }

    if (selectIndex > -1) {
      card.classList.add('is-selected');
      badge.textContent = String(selectIndex + 1);
    } else {
      card.classList.remove('is-selected');
      badge.textContent = '';
    }
  });
}

function getColorCode(cName) {
  if (!cName) return '#cccccc';
  
  let cleanName = String(cName)
    .replace(/[［\[【（\(].*?[］\]】）\)]/g, '')     .replace(/[［\]\[\]【】（）\(\)]/g, '')
    .replace(/(直営店限定|Web限定|公式限定|限定|店舗限定)/gi, '')
    .replace(/[\s ]+/g, '')
    .trim();

  if (!cleanName) cleanName = String(cName).trim();

  const aliasMap = {
    'ミント': 'グリーン',
    'ライトグリーン': 'グリーン',
    'エメラルド': 'グリーン',
    'ライム': 'グリーン',
    '赤': 'レッド',
    '白': 'ホワイト',
    '黒': 'ブラック',
    'ホワイトグレー': 'グレー',
    'ライトグレー': 'グレー',
    'ダークグレー': 'グレー'
  };

  if (aliasMap[cleanName]) {
    cleanName = aliasMap[cleanName];
  }

  const colorMap = {
    'シルバー': '#C0C0C0', 'silver': '#C0C0C0', '銀': '#C0C0C0',
    'ゴールド': '#D4AF37', 'gold': '#D4AF37', '金': '#D4AF37',
    'グリーン': '#2A9D8F', 'カーキ': '#556B2F',
    'レッド': '#E63946', 'ピンク': '#FFB6C1', 'オレンジ': '#F4A261',
    'ブラウン': '#8B4513', 'ベージュ': '#F5F5DC', 'イエロー': '#E9C46A',
    'ブルー': '#457B9D', 'スカイブルー': '#A8DADC', 'ネイビー': '#1D3557',
    'パープル': '#6A0572', 'ホワイト': '#FFFFFF', 'グレー': '#94A3B8', 'ブラック': '#000000'
  };

  if (colorMap[cleanName]) {
    return colorMap[cleanName];
  }

  const autoColor = autoParseColor(cleanName);
  
  if (!autoColor || autoColor === '#000000') {
    if (cleanName !== '黒' && cleanName !== 'ブラック' && cleanName.toLowerCase() !== 'black') {
      return '#cccccc';
    }
  }

  return autoColor || '#cccccc';
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

// ==========================================
// 比較表モーダルの初期化＆処理
// ==========================================
function initCompareModal() {
  const openBtn = document.getElementById('open-compare-modal-btn');
  const closeBtn = document.getElementById('close-compare-modal-btn');
  const overlay = document.getElementById('close-compare-overlay');
  const modal = document.getElementById('compare-modal');

  openBtn?.addEventListener('click', () => {
    renderCompareTable();
    modal?.classList.add('is-open');
  });

  const closeModal = () => {
    modal?.classList.remove('is-open');
  };

  closeBtn?.addEventListener('click', closeModal);
  overlay?.addEventListener('click', closeModal);
}

// 比較表の生成処理
// ==========================================
// 比較表の生成処理（ヘッダーに画像・ブランド・シリーズ・商品名・カラーチップを集約）
// ==========================================
// ==========================================
// 比較表の生成処理（項目追加・Amazon/楽天リンク・ゴミ箱削除ボタン）
// ==========================================
function renderCompareTable() {
  const wrapper = document.getElementById('compare-table-wrapper');
  if (!wrapper) return;

  // localStorage からお気に入り商品IDを取得
  const favorites = JSON.parse(localStorage.getItem('favorites') || '[]');
  
  if (favorites.length === 0) {
    wrapper.innerHTML = '<p style="text-align:center; padding: 40px; color: #666;">お気に入りに登録された商品がありません。<br>商品カードのブックマークアイコンを押してお気に入りに追加してください。</p>';
    return;
  }

  // お気に入りに該当する商品データを抽出
  const favProducts = (window.allProducts || []).filter(p => favorites.includes(String(p.id)));

  if (favProducts.length === 0) {
    wrapper.innerHTML = '<p style="text-align:center; padding: 40px; color: #666;">お気に入り商品のデータが見つかりませんでした。</p>';
    return;
  }

  // 比較項目リスト（追加項目を含む）
  const rows = [
    { key: 'price', label: '価格 (税込)' },
    { key: 'size', label: 'サイズ' },
    { key: 'dimensions', label: '外寸' },
    { key: 'weight', label: '重さ' },
    { key: 'pages', label: 'ページ数' },
    { key: 'paper_type', label: '用紙タイプ' },
    { key: 'layout', label: 'レイアウト' },
    { key: 'start_month', label: '始まり月' },
    { key: 'start_day', label: '始まり曜日' },
    { key: 'official_url', label: '公式サイト' },
    { key: 'affiliate_action', label: '購入・詳細' }
  ];

  let html = '<table class="compare-table">';

  // 列幅の固定・統一 (<colgroup>)
  html += '<colgroup>';
  html += '<col style="width: 150px;">'; // 左端固定列
  favProducts.forEach(() => {
    html += '<col style="width: 220px;">'; // 各商品列
  });
  html += '</colgroup><tbody>';

  // ----------------------------------------------------
  // 1. 最上部ヘッダー（画像 + 右上ゴミ箱削除ボタン + ブランド/シリーズ/商品名 + カラーチップ）
  // ----------------------------------------------------
  html += `<tr><th class="sticky-col compare-header-label">商品情報</th>`;

  favProducts.forEach(product => {
    const variants = (product.variants && Array.isArray(product.variants) && product.variants.length > 0)
      ? product.variants
      : [product];

    // 画像URL
    let imgUrl = product.image_url || variants[0]?.image_url || FALLBACK_IMAGE;
    if (imgUrl.includes('src=')) {
      const m = imgUrl.match(/src=["'](.*?)["']/);
      imgUrl = m ? m[1] : FALLBACK_IMAGE;
    }

    // カラーチップの準備
    const colors = [];
    variants.forEach(v => {
      const norm = normalizeColorName(`${v.color || ''} ${product.product_name || ''}`);
      if (norm && !colors.includes(norm)) colors.push(norm);
    });

    const maxSwatches = 5;
    const visibleColors = colors.slice(0, maxSwatches);
    const extraCount = colors.length - maxSwatches;
    const swatchesHtml = visibleColors.map(color => {
      return `<span class="color-dot" title="${escapeHTML(color)}" style="background-color: ${getColorCode(color)};"></span>`;
    }).join('') + (extraCount > 0 ? `<span class="more-count">+${extraCount}</span>` : '');

    html += `
      <td class="product-col compare-product-header">
        <!-- 画像＆右上ゴミ箱ボタンのラッパー -->
        <div class="compare-img-wrapper">
          <button type="button" class="compare-delete-btn" title="比較表から削除" onclick="removeFromCompare('${product.id}')">
            <svg viewBox="0 0 24 24" width="16" height="16" stroke="currentColor" stroke-width="2" fill="none" stroke-linecap="round" stroke-linejoin="round">
              <polyline points="3 6 5 6 21 6"></polyline>
              <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
            </svg>
          </button>
          <a href="detail.html?id=${product.id}">
            <img src="${escapeHTML(imgUrl)}" class="compare-product-img" alt="" onerror="this.src='${FALLBACK_IMAGE}';">
          </a>
        </div>
        <div class="compare-brand-series">
          ${product.brand_name ? `<span class="compare-brand-name">${escapeHTML(product.brand_name)}</span>` : ''}
          ${product.series_name ? `<span class="compare-series-name">${escapeHTML(product.series_name)}</span>` : ''}
        </div>
        <div class="compare-product-title">
          <a href="detail.html?id=${product.id}">${escapeHTML(product.product_name || '名称未設定')}</a>
        </div>
        <div class="color-swatches compare-color-swatches">
          ${swatchesHtml || ''}
        </div>
      </td>
    `;
  });
  html += `</tr>`;

  // ----------------------------------------------------
  // 2. 仕様・詳細項目行
  // ----------------------------------------------------
  rows.forEach(row => {
    html += `<tr><th class="sticky-col">${escapeHTML(row.label)}</th>`;

    favProducts.forEach(product => {
      const variants = (product.variants && Array.isArray(product.variants) && product.variants.length > 0)
        ? product.variants
        : [product];

      html += `<td class="product-col">`;

      switch (row.key) {
  case 'price':
    const prices = variants.map(v => v.price_jpy).filter(p => typeof p === 'number' && !isNaN(p));
    if (prices.length > 0) {
      const min = Math.min(...prices);
      const max = Math.max(...prices);
      html += min === max ? `¥${min.toLocaleString()}` : `¥${min.toLocaleString()}〜`;
    } else {
      html += '-';
    }
    break;

  case 'size':
    const sizes = [...new Set(variants.map(v => v.size || product.size).filter(Boolean))];
    html += sizes.length > 0 ? escapeHTML(sizes.join(', ')) : '-';
    break;

  case 'dimensions':
    const dims = [...new Set(variants.map(v => v.external_dimensions || v.dimensions || product.external_dimensions || product.dimensions).filter(Boolean))];
    html += dims.length > 0 ? escapeHTML(dims.join(', ')) : '-';
    break;

  case 'weight':
    const weights = [...new Set(variants.map(v => {
      const w = v.weight_g ?? v.weight ?? product.weight_g ?? product.weight;
      if (w === '' || w === null || w === undefined) return null;
      return typeof w === 'number' || !isNaN(w) ? `${w}g` : w;
    }).filter(Boolean))];
    html += weights.length > 0 ? escapeHTML(weights.join(', ')) : '-';
    break;

  case 'pages':
    const pageList = [...new Set(variants.map(v => v.total_pages || product.total_pages).filter(Boolean))];
    html += pageList.length > 0 ? pageList.map(p => `${escapeHTML(p)}P`).join(', ') : '-';
    break;

  case 'paper_type':
    const papers = [...new Set(variants.map(v => v.paper_type || product.paper_type).filter(Boolean))];
    html += papers.length > 0 ? escapeHTML(papers.join(', ')) : '-';
    break;

  case 'layout':
    const badges = getAllLayoutBadges(product).map(b => b.text);
    html += badges.length > 0 ? escapeHTML(badges.join(', ')) : '-';
    break;

  case 'start_month':
    html += product.start_month ? `${product.start_month}月` : '-';
    break;

  case 'start_day':
    html += escapeHTML(product.start_dayofweek || '-');
    break;

  case 'official_url':
    // variants か product の official_url を取得
    const officialUrl = variants.find(v => v.official_url)?.official_url || product.official_url;
    if (officialUrl) {
      html += `<a href="${escapeHTML(officialUrl)}" target="_blank" rel="noopener noreferrer" class="compare-official-link">公式サイト ↗</a>`;
    } else {
      html += '-';
    }
    break;

  case 'affiliate_action':
    // variants か product の URL を優先取得
    const amazonUrl = variants.find(v => v.amazon_url)?.amazon_url || product.amazon_url || `https://www.amazon.co.jp/s?k=${encodeURIComponent(product.product_name || '')}`;
    const rakutenUrl = variants.find(v => v.rakuten_url)?.rakuten_url || product.rakuten_url || `https://search.rakuten.co.jp/search/mall/${encodeURIComponent(product.product_name || '')}/`;

    html += `
      <div class="affiliate-btn-group">
        <a href="${escapeHTML(amazonUrl)}" target="_blank" rel="noopener noreferrer" class="btn-affiliate btn-amazon">
          Amazon
        </a>
        <a href="${escapeHTML(rakutenUrl)}" target="_blank" rel="noopener noreferrer" class="btn-affiliate btn-rakuten">
          楽天市場
        </a>
      </div>
    `;
    break;

  default:
    html += '-';
}

      html += `</td>`;
    });

    html += '</tr>';
  });

  html += '</tbody></table>';
  wrapper.innerHTML = html;
}

// 比較表からお気に入りを削除する処理
function removeFromCompare(productId) {
  let favorites = JSON.parse(localStorage.getItem('favorites') || '[]');
  favorites = favorites.filter(id => id !== String(productId));
  localStorage.setItem('favorites', JSON.stringify(favorites));

  // 一覧側のボタンの見た目も更新（カードが存在すれば）
  const cardFavBtn = document.querySelector(`.product-card[data-id="${productId}"] .card-fav-btn`);
  if (cardFavBtn) {
    cardFavBtn.classList.remove('is-active');
  }

  // 比較表を再描画
  renderCompareTable();
}

// DOMContentLoaded にて initCompareModal を呼び出すように追加
document.addEventListener('DOMContentLoaded', () => {
  initCompareModal();
});