let currentSelectedFormat = '';
let currentSelectedSize = '';
let currentSelectedColor = '';
let productVariants = [];
let defaultMainImage = '';
window.allProducts = [];

// プレースホルダー画像（SVG Data URI）
const NO_IMAGE_SVG = "data:image/svg+xml;charset=utf-8,%3Csvg xmlns='http://www.w3.org/2000/svg' width='800' height='800' viewBox='0 0 800 800'%3E%3Crect width='100%25' height='100%25' fill='%23f1f5f9'/%3E%3Ctext x='50%25' y='50%25' dominant-baseline='middle' text-anchor='middle' font-family='sans-serif' font-size='32' fill='%2394a3b8'%3ENO IMAGE%3C/text%3E%3C/svg%3E";

// ==========================================
// 代表色名への正規化・集約関数
// ==========================================
function normalizeColorName(colorStr) {
  if (!colorStr) return '';

  let clean = String(colorStr)
    .replace(/[［\[【（\(].*?[］\]】）\)]/g, '')     .replace(/[［\]\[\]【】（）\(\)]/g, '')
    .replace(/(直営店限定|Web限定|公式限定|限定|店舗限定)/gi, '')
    .replace(/[\s ]+/g, ' ')
    .trim();

  const lower = clean.toLowerCase();

  if (['赤', 'レッド', 'red', 'ワイン', 'wine', 'ボルドー', 'bordeaux', 'バーガンディー', 'burgundy', 'ベリー', 'berry', 'ルビー', 'ruby', 'ローズ', 'rose', 'crimson'].some(k => lower.includes(k))) return 'レッド';
  if (['緑', 'グリーン', 'green', 'カーキ', 'khaki', 'オリーブ', 'olive', 'エメラルド', 'ライム', 'ブルーグリーン', 'ネオングリーン', 'teal'].some(k => lower.includes(k))) return 'グリーン';
  if (['ラベンダー', 'lavender'].some(k => lower.includes(k))) return 'ラベンダー';
  if (['グレージュ', 'greige'].some(k => lower.includes(k))) return 'グレージュ';
  if (['ミント', 'mint'].some(k => lower.includes(k))) return 'ミント';
  if (['白', 'ホワイト', 'white', 'アイボリー', 'ivory', 'クリア'].some(k => lower.includes(k))) return 'ホワイト';
  if (['黒', 'ブラック', 'black', 'チャコール', 'charcoal'].some(k => lower.includes(k))) return 'ブラック';
  if (['灰', 'グレー', 'grey', 'gray', 'シルバー', 'silver', 'ホワイトグレー', 'ライトグレー', 'ダークグレー'].some(k => lower.includes(k))) return 'シルバー';
  if (['茶', 'ブラウン', 'brown'].some(k => lower.includes(k))) return 'ブラウン';
  if (['ベージュ', 'beige', 'ナチュラル', 'リネン', 'クリーム', 'キャメル', 'モカ', 'テラコッタ'].some(k => lower.includes(k))) return 'ベージュ';
  if (['ネイビー', 'navy', 'インディゴ', 'indigo', '紺'].some(k => lower.includes(k))) return 'ネイビー';
  if (['青', 'ブルー', 'blue', 'スカイ', 'sky', 'ライトブルー', 'サックス'].some(k => lower.includes(k))) return 'ライトブルー';
  if (['黄', 'イエロー', 'yellow', 'マスタード', 'mustard', 'ネオンイエロー'].some(k => lower.includes(k))) return 'イエロー';
  if (['橙', 'オレンジ', 'orange', 'コーラル', 'coral','タンジェリン','tangerine'].some(k => lower.includes(k))) return 'オレンジ';
  if (['紫', 'パープル', 'purple', 'バイオレット', 'violet'].some(k => lower.includes(k))) return 'パープル';
  if (['ピンク', 'pink', '桃'].some(k => lower.includes(k))) return 'ピンク';
  if (['金', 'ゴールド', 'gold'].some(k => lower.includes(k))) return 'ゴールド';

  return 'その他';
}

// ==========================================
// お気に入り機能（localStorage連携）
// ==========================================
function getFavorites() {
  try {
    const raw = JSON.parse(localStorage.getItem('favorites') || '[]');
    return Array.isArray(raw) ? raw.map(String) : [];
  } catch (e) {
    return [];
  }
}

function toggleFavorite(productId) {
  let favs = getFavorites();
  const idStr = String(productId);
  const index = favs.indexOf(idStr);
  
  if (index > -1) {
    favs.splice(index, 1);
  } else {
    favs.push(idStr);
  }
  
  localStorage.setItem('favorites', JSON.stringify(favs));
}

function handleDetailFavClick(btn, productId) {
  toggleFavorite(productId);
  btn.classList.toggle('active');
}

// ==========================================
// 安全に画像URLのみを抽出するヘルパー関数
// ==========================================
function extractImageUrl(rawImg) {
  if (!rawImg || rawImg === 'なし' || rawImg.trim() === '') {
    return NO_IMAGE_SVG;
  }
  if (typeof rawImg === 'string' && rawImg.includes('src=')) {
    const match = rawImg.match(/src=["'](.*?)["']/);
    return match ? match[1] : rawImg;
  }
  return rawImg;
}

// ==========================================
// フォーマット判定ヘルパー関数
// ==========================================
function getItemFormat(item) {
  if (item.daily_sub_type && item.daily_sub_type.trim() !== '' && item.daily_sub_type !== '-') {
    return item.daily_sub_type.trim();
  }
  if (item.weekly_sub_type && item.weekly_sub_type.trim() !== '' && item.weekly_sub_type !== '-') {
    return item.weekly_sub_type.trim();
  }
  return 'マンスリー';
}

// ==========================================
// 初期化・データ取得
// ==========================================
document.addEventListener('DOMContentLoaded', () => {
  initDrawerMenu();
  initDrawerTabs();
  initSearchModal();

  const urlParams = new URLSearchParams(window.location.search);
  const productId = urlParams.get('id');
  const detailWrapper = document.getElementById('product-detail');

  fetch('./data.json')
    .then(res => {
      if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);
      return res.json();
    })
    .then(dataList => {
      window.allProducts = dataList;

      renderDrawerFromData(dataList);

      if (!productId) {
        if (detailWrapper) {
          detailWrapper.innerHTML = '<p style="padding:40px; text-align:center;">商品IDが指定されていません。</p>';
        }
        return;
      }

      const product = dataList.find(item => String(item.id) === String(productId));
      if (!product) {
        if (detailWrapper) {
          detailWrapper.innerHTML = '<p style="padding:40px; text-align:center;">指定された手帳が見つかりませんでした。</p>';
        }
        return;
      }

      renderProductDetail(product);
    })
    .catch(error => {
      console.error('Error:', error);
      if (detailWrapper) {
        detailWrapper.innerHTML = '<p style="padding:40px; text-align:center;">データの読み込みに失敗しました。</p>';
      }
    });
});

// ==========================================
// 商品詳細の描画処理
// ==========================================
function renderProductDetail(p) {
  const bcTitle = document.getElementById('bc-title');
  if (bcTitle) bcTitle.textContent = p.product_name || p.name;

  const rawMainImage = p.image_url || (p.variants && p.variants[0]?.image_url) || '';
  defaultMainImage = extractImageUrl(rawMainImage);
  productVariants = p.variants || [];

  const favs = getFavorites();
  const isFav = favs.includes(String(p.id));

  // --- 始まり曜日のリンク生成 ---
  let dayOfWeekText = '-';
  let dayOfWeekLinkHtml = '-';

  if (p.start_dayofweek) {
    const dw = String(p.start_dayofweek);
    if (dw.includes('月') || dw === 'mon') {
      dayOfWeekText = '月曜始まり';
    } else if (dw.includes('日') || dw === 'sun') {
      dayOfWeekText = '日曜始まり';
    } else {
      dayOfWeekText = `${p.start_dayofweek}始まり`;
    }
    dayOfWeekLinkHtml = `<a href="list.html?start=${encodeURIComponent(dayOfWeekText)}" class="spec-link">🗓️️ ${escapeHTML(dayOfWeekText)}</a>`;
  } else {
    dayOfWeekLinkHtml = `<span class="spec-badge">🗓️ -</span>`;
  }

  // --- 始まり月のリンク生成 ---
  let startMonthLinkHtml = '<span class="spec-badge">📅 -</span>';
  if (p.start_month) {
    const monthText = `${p.start_month}月始まり`;
    startMonthLinkHtml = `<a href="list.html?start=${encodeURIComponent(monthText)}" class="spec-link">📅 ${escapeHTML(monthText)}</a>`;
  }

  // --- ブランド名・シリーズ名のリンク生成 ---
  let brandSeriesText = '';
  const brandLink = p.brand_name 
    ? `<a href="list.html?brand=${encodeURIComponent(p.brand_name)}" class="brand-name spec-link">${escapeHTML(p.brand_name)}</a>` 
    : '';
  const seriesLink = p.series_name 
    ? `<a href="list.html?series=${encodeURIComponent(p.series_name)}" class="series-name spec-link">${escapeHTML(p.series_name)}</a>` 
    : '';

  if (brandLink && seriesLink) {
    brandSeriesText = `${brandLink} / ${seriesLink}`;
  } else if (brandLink) {
    brandSeriesText = brandLink;
  } else if (seriesLink) {
    brandSeriesText = seriesLink;
  }

  // --- 1. FORMAT一覧の抽出 ---
  const availableFormats = [];
  const addedFormats = new Set();

  const allTargets = (productVariants && productVariants.length > 0) ? productVariants : [p];

  allTargets.forEach(item => {
    const fmt = getItemFormat(item);
    if (!addedFormats.has(fmt)) {
      availableFormats.push(fmt);
      addedFormats.add(fmt);
    }
  });

  if (availableFormats.length === 0) {
    availableFormats.push('マンスリー');
  }

  currentSelectedFormat = availableFormats[0];

  const formatChipsHtml = availableFormats.map((fmt, idx) => {
    const isActive = idx === 0 ? 'active' : '';
    return `<button type="button" class="chip ${isActive}" data-format="${escapeHTML(fmt)}" onclick="onFormatSelect(this, '${escapeHTML(fmt)}')">${escapeHTML(fmt)}</button>`;
  }).join('');

  // --- 2. 全SIZEの抽出 ---
  let rawSizes = [];
  if (productVariants.length > 0) {
    rawSizes = productVariants.map(v => v.size).filter(Boolean);
  } else if (p.size) {
    rawSizes = Array.isArray(p.size) ? p.size : String(p.size).split(',').map(s => s.trim());
  }

  const allSizes = [...new Set(rawSizes.map(s => String(s).trim()))].filter(Boolean);

  // 初期フォーマットに対応するサイズを取得
  const validSizesForFormat = productVariants
    .filter(v => getItemFormat(v) === currentSelectedFormat)
    .map(v => String(v.size || '').trim());

  // 最初のアクティブサイズを自動決定
  currentSelectedSize = allSizes.find(s => validSizesForFormat.includes(s)) || allSizes[0] || '';

  const sizeChipsHtml = allSizes.map((size) => {
    const isActive = (size === currentSelectedSize) ? 'active' : '';
    const isAvailable = validSizesForFormat.includes(size);
    const disabledClass = isAvailable ? '' : 'disabled';
    const disabledAttr = isAvailable ? '' : 'disabled';

    return `<button type="button" class="chip ${isActive} ${disabledClass}" ${disabledAttr} data-size="${escapeHTML(size)}" onclick="onSizeSelect(this, '${escapeHTML(size)}')">${escapeHTML(size)}</button>`;
  }).join('');

  // --- 3. 全COLORの抽出 ---
  const allColors = [...new Set(productVariants.map(v => v.color))].filter(Boolean);
  const swatchesHtml = allColors.map(cName => {
    const hex = getColorCode(cName);
    return `
      <button type="button" 
              class="swatch" 
              data-color="${escapeHTML(cName)}"
              style="background-color: ${hex};" 
              title="${escapeHTML(cName)}"
              onclick="onColorSelect(this, '${escapeHTML(cName)}')">
      </button>
    `;
  }).join('');

  let contentsListHtml = '';
  if (p.contents_page) {
    const items = p.contents_page.split(/[,、]/).map(item => item.trim()).filter(Boolean);
    contentsListHtml = items.map(item => `<div>${escapeHTML(item)}</div>`).join('');
  }
  if (!contentsListHtml) contentsListHtml = '-';

  const totalPagesVal = p.total_pages || (productVariants.find(v => v.total_pages)?.total_pages) || '-';

  const html = `
    <!-- 左カラム：画像 -->
    <div class="detail-left">
      <div class="main-image-container">
        <img id="main-img" 
             src="${defaultMainImage}" 
             alt="NO IMAGE"
             onerror="this.onerror=null; this.src='${NO_IMAGE_SVG}';">
      </div>
    </div>

    <!-- 右カラム：商品情報 -->
    <div class="detail-right">
      <div class="brand-series-header">
        ${brandSeriesText}
      </div>

      <h1 class="product-title">${escapeHTML(p.product_name || p.name || '')}</h1>

      <div class="specs-brief">
        ${startMonthLinkHtml}
        ${dayOfWeekLinkHtml}
      </div>

      <!-- 価格表示とお気に入りボタン -->
      <div class="price-container">
        <div class="price-left">
          <span class="price-label">価格</span>
          <span class="price-amount">¥${p.price_jpy ? p.price_jpy.toLocaleString() : '-'}</span>
          <span class="price-tax">(税込)</span>
        </div>
        
        <button type="button" 
                class="icon-btn fav-detail-btn ${isFav ? 'active' : ''}" 
                id="detail-fav-btn" 
                aria-label="お気に入り"
                onclick="handleDetailFavClick(this, '${p.id}')">
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"></path>
          </svg>
        </button>
      </div>

      <hr class="divider">

      <!-- FORMAT選択エリア -->
      <div class="option-group">
        <div class="option-label">
          <span>FORMAT</span>
          <span class="selected-value" id="selected-format-name">：${escapeHTML(currentSelectedFormat)}</span>
        </div>
        <div class="option-format-chips">${formatChipsHtml}</div>
      </div>

      <!-- SIZE選択エリア -->
      ${allSizes.length > 0 ? `
        <div class="option-group">
          <div class="option-label">
            <span>SIZE</span>
            <span class="selected-value" id="selected-size-name">：${escapeHTML(currentSelectedSize)}</span>
          </div>
          <div class="option-size-chips">${sizeChipsHtml}</div>
        </div>
      ` : ''}

      <!-- COLOR選択エリア -->
      <div class="option-group">
        <div class="option-label">
          <span>COLOR</span>
          <span class="selected-value" id="selected-color-name">：-</span>
        </div>
        <div class="option-swatches" id="color-swatches-container">${swatchesHtml}</div>
      </div>

      <!-- アフィリエイトボタン -->
      <div class="affiliate-actions">
        <a id="btn-amazon" href="#" target="_blank" rel="noopener" class="btn-affiliate btn-amazon is-disabled">
          <span>Amazonで購入する</span>
          <small>※在庫・配送状況を確認</small>
        </a>
        <a id="btn-rakuten" href="#" target="_blank" rel="noopener" class="btn-affiliate btn-rakuten is-disabled">
          <span>楽天で購入する</span>
          <small>※ポイント還元対象</small>
        </a>
      </div>

      <!-- アコーディオン -->
      <div class="accordion-container">
        <div class="accordion-item">
          <button type="button" class="accordion-header" onclick="toggleAccordion(this)">
            <span>収録ページ</span>
            <span class="icon">＋</span>
          </button>
          <div class="accordion-content">
            <table class="spec-table">
              <tr>
                <th>総ページ数</th>
                <td>${totalPagesVal !== '-' ? `${totalPagesVal}` : '-'}</td>
              </tr>
              <tr>
                <th>収録内容</th>
                <td>${contentsListHtml}</td>
              </tr>
            </table>
          </div>
        </div>

        <div class="accordion-item">
          <button type="button" class="accordion-header" onclick="toggleAccordion(this)">
            <span>仕様・サイズ</span>
            <span class="icon">＋</span>
          </button>
          <div class="accordion-content">
            <table class="spec-table">
              <tr>
                <th>外寸</th>
                <td id="spec-dimensions-list"></td>
              </tr>
              <tr>
                <th>重さ</th>
                <td id="spec-weight-list"></td>
              </tr>
              <tr>
                <th>用紙タイプ</th>
                <td>${escapeHTML(p.paper_type || '-')}</td>
              </tr>
              <tr>
                <th>特徴</th>
                <td>${escapeHTML(p.features || '-')}</td>
              </tr>
            </table>
          </div>
        </div>

        <div class="accordion-item">
          <button type="button" class="accordion-header" onclick="toggleAccordion(this)">
            <span>公式サイト情報</span>
            <span class="icon">＋</span>
          </button>
          <div class="accordion-content" id="official-url-container"></div>
        </div>
      </div>
    </div>
  `;

  document.getElementById('product-detail').innerHTML = html;

  updateAvailableSizes();
  updateAvailableColors();
  renderSizeBasedSpecs();
}

// ==========================================
// イベント・表示更新処理
// ==========================================

function onFormatSelect(button, formatName) {
  if (button.classList.contains('disabled')) return;

  const allChips = button.parentElement.querySelectorAll('.chip');
  allChips.forEach(chip => chip.classList.remove('active'));
  button.classList.add('active');

  currentSelectedFormat = formatName;
  const labelElem = document.getElementById('selected-format-name');
  if (labelElem) labelElem.textContent = `：${formatName}`;

  updateAvailableSizes();
  updateAvailableColors();
}

function updateAvailableSizes() {
  const validVariants = productVariants.filter(v => getItemFormat(v) === currentSelectedFormat);
  const validSizes = [...new Set(validVariants.map(v => String(v.size || '').trim()))];

  const sizeChips = document.querySelectorAll('.option-size-chips .chip');
  let firstValidButton = null;
  let currentSizeStillValid = false;

  sizeChips.forEach(chip => {
    const sizeName = chip.getAttribute('data-size');
    chip.classList.remove('active', 'disabled');

    if (validSizes.includes(sizeName)) {
      chip.disabled = false;
      if (!firstValidButton) firstValidButton = chip;
      if (sizeName === currentSelectedSize) currentSizeStillValid = true;
    } else {
      chip.disabled = true;
      chip.classList.add('disabled');
    }
  });

  if (!currentSizeStillValid && firstValidButton) {
    const newSize = firstValidButton.getAttribute('data-size');
    onSizeSelect(firstValidButton, newSize);
  } else {
    sizeChips.forEach(chip => {
      if (chip.getAttribute('data-size') === currentSelectedSize) {
        chip.classList.add('active');
      }
    });
    updateAvailableColors();
    updateSpecHighlight();
  }
}

function onSizeSelect(button, sizeName) {
  if (button.classList.contains('disabled')) return;

  const allChips = button.parentElement.querySelectorAll('.chip');
  allChips.forEach(chip => chip.classList.remove('active'));
  button.classList.add('active');

  currentSelectedSize = sizeName;
  const labelElem = document.getElementById('selected-size-name');
  if (labelElem) labelElem.textContent = `：${sizeName}`;

  updateAvailableColors();
  updateSpecHighlight();
}

function updateAvailableColors() {
  const validVariants = productVariants.filter(v => {
    const isFormatMatch = getItemFormat(v) === currentSelectedFormat;
    const isSizeMatch = v.size && String(v.size).trim().toUpperCase() === currentSelectedSize.toUpperCase();
    return isFormatMatch && isSizeMatch;
  });
  const validColorNames = validVariants.map(v => v.color);

  const swatchButtons = document.querySelectorAll('#color-swatches-container .swatch');
  let firstValidButton = null;

  swatchButtons.forEach(btn => {
    const colorName = btn.getAttribute('data-color');
    btn.classList.remove('active', 'disabled');

    if (validColorNames.includes(colorName)) {
      btn.disabled = false;
      if (!firstValidButton) firstValidButton = btn;
    } else {
      btn.disabled = true;
      btn.classList.add('disabled');
    }
  });

  if (firstValidButton) {
    const colorName = firstValidButton.getAttribute('data-color');
    onColorSelect(firstValidButton, colorName);
  } else {
    const colorLabel = document.getElementById('selected-color-name');
    if (colorLabel) colorLabel.textContent = '：なし';
    updateAffiliateLinks('', '');
  }
}

function onColorSelect(button, colorName) {
  if (button.classList.contains('disabled')) return;

  const allSwatches = button.parentElement.querySelectorAll('.swatch');
  allSwatches.forEach(sw => sw.classList.remove('active'));
  button.classList.add('active');

  currentSelectedColor = colorName;
  const colorLabel = document.getElementById('selected-color-name');
  if (colorLabel) colorLabel.textContent = `：${colorName}`;

  const matchedVariant = productVariants.find(v => {
    const isFormatMatch = getItemFormat(v) === currentSelectedFormat;
    const isSizeMatch = v.size && String(v.size).trim().toUpperCase() === currentSelectedSize.toUpperCase();
    return isFormatMatch && isSizeMatch && v.color === colorName;
  });

  if (matchedVariant) {
    const imgElem = document.getElementById('main-img');
    if (imgElem) {
      imgElem.src = extractImageUrl(matchedVariant.image_url || defaultMainImage);
    }

    const priceAmountElem = document.querySelector('.price-amount');
    if (priceAmountElem) {
      priceAmountElem.textContent = matchedVariant.price_jpy
        ? `¥${matchedVariant.price_jpy.toLocaleString()}`
        : '¥-';
    }

    const officialContainer = document.getElementById('official-url-container');
    if (officialContainer) {
      if (matchedVariant.official_url) {
        officialContainer.innerHTML = `
          <p>詳細な仕様や開発ストーリーは、ブランド公式サイトでもご確認いただけます。</p>
          <a href="${matchedVariant.official_url}" target="_blank" rel="noopener" class="official-link">ブランド公式サイトを開く ↗</a>
        `;
      } else {
        officialContainer.innerHTML = '<p>公式URLの登録はありません。</p>';
      }
    }

    updateAffiliateLinks(matchedVariant.amazon_url, matchedVariant.rakuten_url);
  } else {
    updateAffiliateLinks('', '');
  }
}

function renderSizeBasedSpecs() {
  const dimContainer = document.getElementById('spec-dimensions-list');
  const weightContainer = document.getElementById('spec-weight-list');

  if (!dimContainer || !weightContainer) return;

  const sizeMap = {};
  productVariants.forEach(v => {
    if (!v.size) return;
    const s = String(v.size).trim();
    if (!sizeMap[s]) {
      sizeMap[s] = {
        dimensions: v.external_dimensions || '-',
        weight: v.weight_g ? `${v.weight_g}g` : '-'
      };
    }
  });

  const sizes = Object.keys(sizeMap);

  const dimHtml = sizes.map(size => {
    const isActive = (size.toUpperCase() === currentSelectedSize.toUpperCase()) ? 'active-spec' : '';
    return `<div class="spec-item ${isActive}" data-spec-size="${escapeHTML(size)}">[${escapeHTML(size)}] ${escapeHTML(sizeMap[size].dimensions)}</div>`;
  }).join('');

  const weightHtml = sizes.map(size => {
    const isActive = (size.toUpperCase() === currentSelectedSize.toUpperCase()) ? 'active-spec' : '';
    return `<div class="spec-item ${isActive}" data-spec-size="${escapeHTML(size)}">[${escapeHTML(size)}] ${escapeHTML(sizeMap[size].weight)}</div>`;
  }).join('');

  dimContainer.innerHTML = dimHtml || '-';
  weightContainer.innerHTML = weightHtml || '-';
}

function updateSpecHighlight() {
  const specItems = document.querySelectorAll('.spec-item[data-spec-size]');
  specItems.forEach(item => {
    const itemSize = item.getAttribute('data-spec-size');
    if (itemSize.toUpperCase() === currentSelectedSize.toUpperCase()) {
      item.classList.add('active-spec');
    } else {
      item.classList.remove('active-spec');
    }
  });
}

function updateAffiliateLinks(amazonUrl, rakutenUrl) {
  const btnAmazon = document.getElementById('btn-amazon');
  const btnRakuten = document.getElementById('btn-rakuten');

  if (btnAmazon) {
    if (amazonUrl) {
      btnAmazon.href = amazonUrl;
      btnAmazon.classList.remove('is-disabled');
    } else {
      btnAmazon.href = '#';
      btnAmazon.classList.add('is-disabled');
    }
  }

  if (btnRakuten) {
    if (rakutenUrl) {
      btnRakuten.href = rakutenUrl;
      btnRakuten.classList.remove('is-disabled');
    } else {
      btnRakuten.href = '#';
      btnRakuten.classList.add('is-disabled');
    }
  }
}

function toggleAccordion(button) {
  const item = button.closest('.accordion-item');
  const icon = button.querySelector('.icon');
  item.classList.toggle('open');
  if (icon) {
    icon.textContent = item.classList.contains('open') ? '－' : '＋';
  }
}

// ==========================================
// ドロワーメニュー描画（強力集約版）
// ==========================================
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
      if (v.color) {
        const normalized = normalizeColorName(v.color);
        if (normalized) {
          colorSet.add(normalized);
        }
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

  const sizeContainer = document.getElementById('drawer-size-list');
  if (sizeContainer) {
    sizeContainer.innerHTML = Array.from(sizeSet).map(size => `
      <button type="button" class="filter-chip" onclick="location.href='list.html?size=${encodeURIComponent(size)}'">${escapeHTML(size)}</button>
    `).join('');
  }

  const layoutContainer = document.getElementById('drawer-layout-list');
  if (layoutContainer) {
    const sortedLayouts = Array.from(layoutSet).sort((a, b) => a.localeCompare(b, 'ja'));

    layoutContainer.innerHTML = sortedLayouts.map(layout => `
      <button type="button" class="layout-box" onclick="location.href='list.html?layout=${encodeURIComponent(layout)}'">${escapeHTML(layout)}</button>
    `).join('');
  }

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

  const dayContainer = document.getElementById('drawer-day-list');
  if (dayContainer) {
    const sortedDays = Array.from(daySet);
    dayContainer.innerHTML = sortedDays.map(start => `
      <button type="button" class="filter-chip" onclick="location.href='list.html?start=${encodeURIComponent(start)}'">${escapeHTML(start)}</button>
    `).join('');
  }

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

function getHueFromHex(hex) {
  if (!hex || !hex.startsWith('#')) return 0;
  let c = hex.substring(1);
  if (c.length === 3) c = c.split('').map(x => x + x).join('');
  const num = parseInt(c, 16);
  const r = ((num >> 16) & 255) / 255;
  const g = ((num >> 8) & 255) / 255;
  const b = (num & 255) / 255;

  const max = Math.max(r, g, b), min = Math.min(r, g, b);
  let h = 0;
  if (max !== min) {
    const d = max - min;
    switch (max) {
      case r: h = (g - b) / d + (g < b ? 6 : 0); break;
      case g: h = (b - r) / d + 2; break;
      case b: h = (r - g) / d + 4; break;
    }
    h /= 6;
  }
  return h * 360;
}

function getColorCode(cName) {
  if (!cName) return '#e5e7eb';

  let normalizedName = String(cName)
    .replace(/ /g, ' ')
    .trim();
  
  const lowerName = normalizedName.toLowerCase();

  const colorMap = {
    'シルバー': '#C0C0C0', '銀': '#C0C0C0','グレージュ': '#B9B1A8',
    'ゴールド': '#E4C068', '金': '#E4C068',
    'グリーン': '#008000', 'カーキ': '#556B2F',
    'レッド': '#E63946', 'ピンク': '#FFB6C1', 'オレンジ': '#F4A261',
    'ブラウン': '#8B4513', 'ベージュ': '#E8DABE', 'イエロー': '#FFFF00',
    'ブルー': '#457B9D', 'スカイブルー': '#A8DADC', 'ライトブルー': '#A8DADC', 'ネイビー': '#1D3557',
    'パープル': '#6A0572', 'ホワイト': '#FFFFFF', 'グレー': '#94A3B8', 'ブラック': '#000000',
    'ミント': '#A8E6CF','ラベンダー': '#c5b3d3','その他': '#9E9E9E','クラフト紙':'#cba97b'
  };

  const baseColorCategoryMap = [
    { keywords: ['ピンク', 'pink', 'ローズ', 'rose','ジル＆ジャック','桜花弁'], hex: '#FFC0CB' },
    { keywords: ['赤', 'レッド', 'red'], hex: '#E63946' },
    { keywords: ['ワイン', 'バーガンディー', 'burgundy'], hex: '#80273F' },
    { keywords: ['青', 'ブルー', 'blue', 'ネイビー','楓'], hex: '#0000FF' },
    { keywords: ['緑', 'グリーン', 'green', 'カーキ', 'teal','ジル'], hex: '#008000' },
    { keywords: ['黄', 'イエロー', 'yellow'], hex: '#FFFF00' },
    { keywords: ['茶', 'ブラウン', 'brown','ラテ'], hex: '#8B4513' },
    { keywords: ['紫', 'パープル', 'purple'], hex: '#800080' },
    { keywords: ['ラベンダー','lavender'], hex: '#c5b3d3' },
    { keywords: ['黒', 'ブラック', 'black', 'チャコール'], hex: '#000000' },
    { keywords: ['白', 'ホワイト', 'white', 'クリア'], hex: '#FFFFFF' },
    { keywords: ['灰', 'グレー', 'grey', 'gray', 'シルバー'], hex: '#808080' },
    { keywords: ['橙', 'オレンジ', 'orange','タンジェリン','tangerine','永寿'], hex: '#FFA500' },
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

function initSearchModal() {
  const openTrigger = document.getElementById('open-search-trigger') || document.getElementById('open-keyword-search');
  // 検索モーダルの初期化コードがある場合はここに配置
}