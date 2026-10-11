// ==========================================
// 色ソート用マップ（グラデーション順）
// ==========================================
const COLOR_ORDER = [
  'ホワイト', 'アイボリー', 'クリーム', 'ベージュ', 'ライトイエロー', 'イエロー', 'ネオンイエロー',
  'オレンジ', 'ピンク', 'ビビッドピンク', 'レッド', 'ワイン', 'レッドブラウン', 'ブラウン', 'ダークブラウン',
  'ミント', 'ライトグリーン', 'グリーン', 'ネオングリーン', 'ブルーグリーン', 'ターコイズブルー', 'スカイブルー',
  'ライトブルー', 'フレンチブルー', 'ブルー', 'ネイビー', 'ラベンダー', 'パープル', 'チャコールグレー',
  'ライトグレー', 'グレー', 'ダークグレー', 'ブラック'
];

// 日本語色名配列のグラデーションソート関数
function sortColorsBySpectrum(colors) {
  if (!Array.isArray(colors)) return [];
  return colors.sort((a, b) => {
    let idxA = COLOR_ORDER.indexOf(a);
    let idxB = COLOR_ORDER.indexOf(b);
    return (idxA === -1 ? 999 : idxA) - (idxB === -1 ? 999 : idxB);
  });
}

// ==========================================
// ヘルパー関数: 色コード (HEX) から HSL の Hue (色相) を取得
// ==========================================
function getHueFromHex(hex) {
  if (!hex || typeof hex !== 'string') return 999;
  
  let cleanHex = hex.replace('#', '').trim();
  if (cleanHex.length === 3) {
    cleanHex = cleanHex.split('').map(c => c + c).join('');
  }
  if (cleanHex.length !== 6) return 999;

  const r = parseInt(cleanHex.substring(0, 2), 16) / 255;
  const g = parseInt(cleanHex.substring(2, 4), 16) / 255;
  const b = parseInt(cleanHex.substring(4, 6), 16) / 255;

  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  let h = 0;

  if (max === min) {
    h = 0; // 無彩色（白・黒・グレー等）
  } else {
    const d = max - min;
    switch (max) {
      case r: h = (g - b) / d + (g < b ? 6 : 0); break;
      case g: h = (b - r) / d + 2; break;
      case b: h = (r - g) / d + 4; break;
    }
    h /= 6;
  }
  return Math.round(h * 360);
}

// ==========================================
// ドロワーメニュー制御 & タブ切り替え
// ==========================================

// 1. ドロワーの開閉制御
function initDrawerMenu() {
  const openBtn = document.getElementById('open-menu-btn') || document.querySelector('.open-menu-btn');
  const closeBtn = document.getElementById('close-menu-btn') || document.querySelector('.close-menu-btn');
  const drawer = document.getElementById('drawer-menu') || document.querySelector('.drawer-menu');
  const overlay = document.getElementById('drawer-overlay') || document.querySelector('.drawer-overlay');

  if (!openBtn || !drawer) {
    console.warn('ハンバーガーメニューの要素が見つかりませんでした。HTMLのid/classを確認してください。');
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

// 2. ドロワー内タブ切り替え機能
function initDrawerTabs() {
  const tabButtons = document.querySelectorAll('.drawer-tab-btn');
  const tabPanels = document.querySelectorAll('.drawer-tab-panel');

  if (tabButtons.length === 0) return;

  tabButtons.forEach(btn => {
    btn.addEventListener('click', () => {
      const targetTab = btn.dataset.tab;

      tabButtons.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');

      tabPanels.forEach(panel => {
        if (panel.id === `tab-${targetTab}` || panel.dataset.panel === targetTab) {
          panel.classList.add('active');
          panel.style.display = 'block';
        } else {
          panel.classList.remove('active');
          panel.style.display = 'none';
        }
      });
    });
  });
}

// 3. データからのドロワー内コンテンツ動的生成（カラーグラデーションソート対応）
function renderDrawerFromData(products) {
  if (!Array.isArray(products) || products.length === 0) return;

  // --- A. メーカー一覧の抽出（重複除去 & アルファベット順ソート） ---
  const brandContainer = document.getElementById('drawer-brand-list');
  if (brandContainer) {
    const brands = [...new Set(products.map(p => p.brand || p.maker).filter(Boolean))].sort();
    brandContainer.innerHTML = brands.map(brand => `
      <label class="filter-checkbox-label">
        <input type="checkbox" name="brand" value="${escapeHTML(brand)}">
        <span>${escapeHTML(brand)}</span>
      </label>
    `).join('');
  }

  // --- B. カラー一覧の抽出 & グラデーション順ソート ---
  const colorContainer = document.getElementById('drawer-color-list');
  if (colorContainer) {
    const rawColors = [];
    products.forEach(p => {
      if (Array.isArray(p.colors)) {
        rawColors.push(...p.colors);
      } else if (p.color) {
        rawColors.push(p.color);
      }
    });

    // 重複除去
    const uniqueColors = Array.from(new Set(rawColors.map(c => typeof c === 'object' ? JSON.stringify(c) : c)))
      .map(c => typeof c === 'string' && c.startsWith('{') ? JSON.parse(c) : c);

    // ★ グラデーション順にソートする処理 ★
    uniqueColors.sort((a, b) => {
      const nameA = typeof a === 'object' ? a.name : a;
      const nameB = typeof b === 'object' ? b.name : b;
      
      const idxA = COLOR_ORDER.indexOf(nameA);
      const idxB = COLOR_ORDER.indexOf(nameB);

      // 1. 両方とも COLOR_ORDER に定義されている色名の場合は配列順（グラデーション順）
      if (idxA !== -1 && idxB !== -1) {
        return idxA - idxB;
      }
      if (idxA !== -1) return -1;
      if (idxB !== -1) return 1;

      // 2. HEXコード（16進数）が含まれている場合は getHueFromHex で色相順にソート
      const hexA = typeof a === 'object' ? a.hex : '';
      const hexB = typeof b === 'object' ? b.hex : '';
      if (hexA && hexB) {
        return getHueFromHex(hexA) - getHueFromHex(hexB);
      }

      return 0;
    });

    // DOM描画
    colorContainer.innerHTML = uniqueColors.map(colorObj => {
      const name = typeof colorObj === 'object' ? colorObj.name : colorObj;
      const hex = typeof colorObj === 'object' ? colorObj.hex : '#ccc';
      return `
        <label class="color-picker-label" title="${escapeHTML(name)}">
          <input type="checkbox" name="color" value="${escapeHTML(name)}">
          <span class="color-swatch" style="background-color: ${escapeHTML(hex)};"></span>
        </label>
      `;
    }).join('');
  }
}

// ==========================================
// お気に入りのローカルストレージ操作
// ==========================================
function getFavorites() {
  return JSON.parse(localStorage.getItem('planner_favorites') || '[]');
}

function toggleFavorite(productId) {
  let favs = getFavorites();
  const index = favs.indexOf(String(productId));
  if (index > -1) {
    favs.splice(index, 1);
  } else {
    favs.push(String(productId));
  }
  localStorage.setItem('planner_favorites', JSON.stringify(favs));
  updateFavButtons();
}

function updateFavButtons() {
  const favs = getFavorites();
  document.querySelectorAll('.card-fav-btn[data-id]').forEach(btn => {
    const id = btn.getAttribute('data-id');
    if (favs.includes(id)) {
      btn.classList.add('active');
    } else {
      btn.classList.remove('active');
    }
  });
}

// ==========================================
// 画像URLの判定および「画像準備中」対応
// ==========================================
function renderProductImageHTML(rawImg, altText) {
  if (!rawImg || rawImg === 'なし' || rawImg === '') {
    return `<div class="no-image-placeholder">画像準備中</div>`;
  }
  let src = rawImg;
  if (typeof rawImg === 'string' && rawImg.includes('src=')) {
    const match = rawImg.match(/src=["'](.*?)["']/);
    src = match ? match[1] : rawImg;
  }
  return `<img src="${src}" alt="${escapeHTML(altText)}" onerror="this.outerHTML='<div class=\\'no-image-placeholder\\'>画像準備中</div>'">`;
}

function escapeHTML(str) {
  return String(str || '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

// ==========================================
// ページ読み込み完了時の初期化
// ==========================================
document.addEventListener('DOMContentLoaded', () => {
  initDrawerMenu();
  initDrawerTabs();
  updateFavButtons();
});