import React, { useEffect, useMemo, useState } from 'react';
import {
  Linking,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';

const KEYS = {
  ITEMS: 'freshcart_rn_items_v1',
  INVENTORY: 'freshcart_rn_inv_v1',
  CATEGORIES: 'freshcart_rn_cats_v1',
  SETTINGS: 'freshcart_rn_settings_v1',
  NOTEPAD: 'freshcart_rn_notepad_v1',
};

const DEFAULT_CATEGORIES = [
  { name: 'Food', color: '#34C759', icon: 'nutrition' },
  { name: 'Daily Essentials', color: '#007AFF', icon: 'sparkles' },
  { name: 'Clothes', color: '#AF52DE', icon: 'shirt' },
  { name: 'Electronics', color: '#5856D6', icon: 'hardware-chip' },
  { name: 'Accessories', color: '#FF9500', icon: 'watch' },
  { name: 'Wish List', color: '#FF2D55', icon: 'heart' },
];

const DEFAULT_UNITS = [
  { name: 'numbers', step: 1 },
  { name: 'Kg', step: 0.5 },
  { name: 'gm', step: 100 },
  { name: 'Liters', step: 0.5 },
  { name: 'box', step: 1 },
  { name: 'packets', step: 1 },
  { name: 'ml', step: 100 },
  { name: 'dozen', step: 1 },
  { name: 'bottle', step: 1 },
  { name: 'pair', step: 1 },
];

const THEME_COLORS = ['#007AFF', '#34C759', '#5856D6', '#AF52DE', '#FF9500', '#FF2D55', '#00C7BE', '#475569'];
const APP_ICONS = [
  { id: 'basket', label: 'Basket' },
  { id: 'cart', label: 'Cart' },
  { id: 'bag', label: 'Bag' },
  { id: 'list', label: 'List' },
  { id: 'cube', label: 'Box' },
  { id: 'heart', label: 'Heart' },
];

const SAMPLE_ITEMS = [
  { id: 's1', name: 'Fresh Milk', qty: 2, unit: 'Liters', category: 'Food', note: 'Full cream', checked: false },
  { id: 's2', name: 'Tomatoes', qty: 1, unit: 'Kg', category: 'Food', note: 'Firm & ripe', checked: false },
  { id: 's3', name: 'Green Chillies', qty: 250, unit: 'gm', category: 'Food', note: '', checked: false },
  { id: 's4', name: 'Basmati Rice', qty: 1, unit: 'packets', category: 'Food', note: '5 Kg pack', checked: true },
  { id: 's5', name: 'Dishwashing Liquid', qty: 1, unit: 'bottle', category: 'Daily Essentials', note: 'Lemon', checked: false },
  { id: 's6', name: 'Tissue Box', qty: 2, unit: 'box', category: 'Daily Essentials', note: '', checked: true },
  { id: 's7', name: 'Crew Socks', qty: 3, unit: 'pair', category: 'Clothes', note: 'Black / grey', checked: false },
  { id: 's8', name: 'USB-C Fast Cable', qty: 2, unit: 'numbers', category: 'Electronics', note: '2m braided', checked: false },
  { id: 's9', name: 'MagSafe Phone Case', qty: 1, unit: 'numbers', category: 'Accessories', note: 'Clear matte', checked: false },
  {
    id: 's10',
    name: 'Noise-Canceling Headphones',
    qty: 1,
    unit: 'box',
    category: 'Wish List',
    note: 'Wait for sale',
    checked: false,
    price: 24990,
    wishTag: 'Electronics',
    link: 'https://www.sony.co.in',
  },
];

const SAMPLE_INVENTORY = [
  { id: 'inv1', name: 'Fresh Milk', qty: 0.5, unit: 'Liters', category: 'Food', note: 'Fridge door' },
  { id: 'inv2', name: 'Tomatoes', qty: 0.5, unit: 'Kg', category: 'Food', note: 'Crisper' },
  { id: 'inv3', name: 'Basmati Rice', qty: 3, unit: 'Kg', category: 'Food', note: 'Pantry jar' },
  { id: 'inv4', name: 'Dishwashing Liquid', qty: 0.5, unit: 'bottle', category: 'Daily Essentials', note: 'Under sink' },
  { id: 'inv5', name: 'Crew Socks', qty: 5, unit: 'pair', category: 'Clothes', note: 'Top drawer' },
  { id: 'inv6', name: 'USB-C Fast Cable', qty: 1, unit: 'numbers', category: 'Electronics', note: 'Desk drawer' },
];

const FONT_SCALES = {
  small: { title: 15, body: 13, sub: 11, xs: 10 },
  medium: { title: 17, body: 14.5, sub: 12, xs: 11 },
  large: { title: 19, body: 16, sub: 13.5, xs: 12 },
};

const fmtQty = (v) => {
  const n = Number(v);
  if (!Number.isFinite(n)) return '0';
  return Number.isInteger(n) ? String(n) : String(Number(n.toFixed(2)));
};

const fmtPrice = (v) => {
  const n = Number(v);
  if (!Number.isFinite(n) || n <= 0) return '';
  return `₹${n.toLocaleString('en-IN')}`;
};

const normUrl = (raw) => {
  const s = String(raw || '').trim();
  if (!s) return '';
  return /^https?:\/\//i.test(s) ? s : `https://${s}`;
};

function MainApp() {
  const [loaded, setLoaded] = useState(false);
  const [view, setView] = useState('home'); // 'home' | 'list' | 'inventory'
  const [activeList, setActiveList] = useState('All');
  const [filter, setFilter] = useState('all'); // 'all' | 'active' | 'checked'
  const [search, setSearch] = useState('');
  const [invSearch, setInvSearch] = useState('');

  const [categories, setCategories] = useState(DEFAULT_CATEGORIES);
  const [items, setItems] = useState(SAMPLE_ITEMS);
  const [inventory, setInventory] = useState(SAMPLE_INVENTORY);
  const [notepad, setNotepad] = useState('');
  const [settings, setSettings] = useState({
    fontSize: 'small',
    themeColor: '#007AFF',
    appIcon: 'basket',
    darkMode: false,
    defaultUnit: 'numbers',
    units: DEFAULT_UNITS,
  });

  // Modals
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [editTarget, setEditTarget] = useState(null); // { mode: 'list'|'inventory', item }
  const [unitPickerTarget, setUnitPickerTarget] = useState(null); // { onSelect }

  // Add List Item form state
  const [newName, setNewName] = useState('');
  const [newQty, setNewQty] = useState('1');
  const [newUnit, setNewUnit] = useState('numbers');
  const [newCat, setNewCat] = useState('Food');
  const [newPrice, setNewPrice] = useState('');
  const [newWishTag, setNewWishTag] = useState('');
  const [newLink, setNewLink] = useState('');

  // Add Inventory form state
  const [invName, setInvName] = useState('');
  const [invQty, setInvQty] = useState('1');
  const [invUnit, setInvUnit] = useState('numbers');
  const [invCat, setInvCat] = useState('Food');

  // Settings form state
  const [newCatName, setNewCatName] = useState('');
  const [newCatColor, setNewCatColor] = useState('#34C759');
  const [newUnitName, setNewUnitName] = useState('');
  const [newUnitStep, setNewUnitStep] = useState('1');

  // Load persisted data
  useEffect(() => {
    (async () => {
      try {
        const [rItems, rInv, rCats, rSet, rNote] = await Promise.all([
          AsyncStorage.getItem(KEYS.ITEMS),
          AsyncStorage.getItem(KEYS.INVENTORY),
          AsyncStorage.getItem(KEYS.CATEGORIES),
          AsyncStorage.getItem(KEYS.SETTINGS),
          AsyncStorage.getItem(KEYS.NOTEPAD),
        ]);
        if (rItems) setItems(JSON.parse(rItems));
        if (rInv) setInventory(JSON.parse(rInv));
        if (rCats) {
          const parsed = JSON.parse(rCats);
          if (Array.isArray(parsed) && parsed.length) setCategories(parsed);
        }
        if (rSet) {
          const parsed = JSON.parse(rSet);
          setSettings((prev) => ({ ...prev, ...parsed }));
          if (parsed.defaultUnit) {
            setNewUnit(parsed.defaultUnit);
            setInvUnit(parsed.defaultUnit);
          }
        }
        if (rNote !== null) setNotepad(rNote);
      } catch (e) {}
      setLoaded(true);
    })();
  }, []);

  useEffect(() => { if (loaded) AsyncStorage.setItem(KEYS.ITEMS, JSON.stringify(items)).catch(() => {}); }, [items, loaded]);
  useEffect(() => { if (loaded) AsyncStorage.setItem(KEYS.INVENTORY, JSON.stringify(inventory)).catch(() => {}); }, [inventory, loaded]);
  useEffect(() => { if (loaded) AsyncStorage.setItem(KEYS.CATEGORIES, JSON.stringify(categories)).catch(() => {}); }, [categories, loaded]);
  useEffect(() => { if (loaded) AsyncStorage.setItem(KEYS.SETTINGS, JSON.stringify(settings)).catch(() => {}); }, [settings, loaded]);
  useEffect(() => { if (loaded) AsyncStorage.setItem(KEYS.NOTEPAD, notepad).catch(() => {}); }, [notepad, loaded]);

  const fs = FONT_SCALES[settings.fontSize] || FONT_SCALES.small;
  const dark = settings.darkMode;
  const theme = {
    bg: dark ? '#000000' : '#F2F2F7',
    card: dark ? '#1C1C1E' : '#FFFFFF',
    input: dark ? '#2C2C2E' : '#EFEFF4',
    border: dark ? 'rgba(255,255,255,0.12)' : 'rgba(60,60,67,0.12)',
    text: dark ? '#F2F2F7' : '#1C1C1E',
    sub: dark ? '#AEAEB2' : '#6E6E73',
    muted: '#8E8E93',
    accent: settings.themeColor,
    green: dark ? '#30D158' : '#34C759',
    orange: dark ? '#FF9F0A' : '#FF9500',
    red: dark ? '#FF453A' : '#FF3B30',
  };

  const getStep = (unitName) => {
    const u = settings.units.find((x) => x.name.toLowerCase() === String(unitName).toLowerCase());
    return u && Number(u.step) > 0 ? Number(u.step) : 1;
  };

  const getCatMeta = (name) => categories.find((c) => c.name === name) || { name, color: '#8E8E93', icon: 'folder' };

  const findInvMatch = (name) => {
    const c = name.trim().toLowerCase();
    if (!c) return null;
    return inventory.find((i) => i.name.toLowerCase() === c)
      || inventory.find((i) => i.name.toLowerCase().includes(c) || c.includes(i.name.toLowerCase()));
  };

  const openList = (catName) => {
    setView('list');
    setActiveList(catName);
    setFilter('all');
    setSearch('');
    if (catName !== 'All') setNewCat(catName);
    setDrawerOpen(false);
  };

  const scopedItems = useMemo(() => {
    if (view === 'home' || activeList === 'All') return items;
    return items.filter((i) => i.category === activeList);
  }, [items, view, activeList]);

  const pendingCount = scopedItems.filter((i) => !i.checked).length;
  const closedCount = scopedItems.filter((i) => i.checked).length;

  const filteredListItems = useMemo(() => {
    const q = search.trim().toLowerCase();
    return scopedItems
      .filter((i) => {
        if (filter === 'active' && i.checked) return false;
        if (filter === 'checked' && !i.checked) return false;
        if (q) return i.name.toLowerCase().includes(q) || i.category.toLowerCase().includes(q) || (i.note || '').toLowerCase().includes(q);
        return true;
      })
      .sort((a, b) => Number(a.checked) - Number(b.checked));
  }, [scopedItems, filter, search]);

  const filteredInventory = useMemo(() => {
    const q = invSearch.trim().toLowerCase();
    return inventory.filter((i) => !q || i.name.toLowerCase().includes(q) || i.category.toLowerCase().includes(q));
  }, [inventory, invSearch]);

  const effectiveAddCat = activeList !== 'All' ? activeList : newCat;
  const isWishAdd = effectiveAddCat === 'Wish List';
  const liveInvHint = newName.trim() ? findInvMatch(newName) : null;

  const handleAddListItem = () => {
    const clean = newName.trim();
    if (!clean) return;
    const qtyVal = Math.max(0.25, parseFloat(newQty) || 1);
    const parsedPrice = parseFloat(newPrice);
    const linkClean = normUrl(newLink);
    setItems((prev) => {
      const idx = prev.findIndex((x) => x.name.toLowerCase() === clean.toLowerCase() && x.unit === newUnit && x.category === effectiveAddCat && !x.checked);
      if (idx !== -1) {
        const next = [...prev];
        next[idx] = { ...next[idx], qty: Number((next[idx].qty + qtyVal).toFixed(2)) };
        return next;
      }
      return [
        {
          id: `i_${Date.now()}`,
          name: clean,
          qty: qtyVal,
          unit: newUnit,
          category: effectiveAddCat,
          note: '',
          checked: false,
          price: Number.isFinite(parsedPrice) && parsedPrice > 0 ? parsedPrice : '',
          wishTag: isWishAdd ? newWishTag : '',
          link: isWishAdd ? linkClean : '',
        },
        ...prev,
      ];
    });
    setNewName('');
    setNewQty('1');
    setNewPrice('');
    setNewWishTag('');
    setNewLink('');
  };

  const handleAddInvItem = () => {
    const clean = invName.trim();
    if (!clean) return;
    const qtyVal = Math.max(0, parseFloat(invQty) || 0);
    setInventory((prev) => {
      const idx = prev.findIndex((x) => x.name.toLowerCase() === clean.toLowerCase());
      if (idx !== -1) {
        const next = [...prev];
        next[idx] = { ...next[idx], qty: Number((next[idx].qty + qtyVal).toFixed(2)), unit: invUnit };
        return next;
      }
      return [{ id: `inv_${Date.now()}`, name: clean, qty: qtyVal, unit: invUnit, category: invCat, note: '' }, ...prev];
    });
    setInvName('');
    setInvQty('1');
  };

  const sendInvToList = (invItem) => {
    setItems((prev) => [
      { id: `i_${Date.now()}`, name: invItem.name, qty: 1, unit: invItem.unit, category: invItem.category, note: '', checked: false },
      ...prev,
    ]);
  };

  const headerTitle = view === 'home' ? 'FreshCart' : view === 'inventory' ? 'Inventory' : activeList === 'All' ? 'All Items' : activeList;
  const headerColor = view === 'inventory' ? theme.green : (view === 'home' || activeList === 'All') ? theme.accent : getCatMeta(activeList).color;

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: theme.bg }]} edges={['top', 'bottom']}>
      <StatusBar style={dark ? 'light' : 'dark'} />

      {/* Top Header */}
      <View style={[styles.header, { backgroundColor: theme.card, borderBottomColor: theme.border }]}>
        <View style={styles.rowCenter}>
          <TouchableOpacity onPress={() => setDrawerOpen(true)} style={styles.iconBtn}>
            <Ionicons name="menu" size={22} color={theme.accent} />
          </TouchableOpacity>
          {view !== 'home' && (
            <TouchableOpacity onPress={() => setView('home')} style={[styles.rowCenter, { marginRight: 6 }]}>
              <Ionicons name="chevron-back" size={18} color={theme.accent} />
              <Text style={{ color: theme.accent, fontSize: fs.sub, fontWeight: '600' }}>Home</Text>
            </TouchableOpacity>
          )}
          <View style={[styles.appBadge, { backgroundColor: headerColor }]}>
            <Ionicons name={view === 'inventory' ? 'cube' : settings.appIcon} size={15} color="#fff" />
          </View>
          <View style={{ marginLeft: 8 }}>
            <Text style={{ color: theme.text, fontSize: fs.title, fontWeight: '700' }}>{headerTitle}</Text>
            <Text style={{ color: theme.sub, fontSize: fs.xs }}>
              {view === 'inventory' ? `${inventory.length} tracked items` : `${pendingCount} pending`}
            </Text>
          </View>
        </View>
        <TouchableOpacity
          onPress={() => setSettings((s) => ({ ...s, darkMode: !s.darkMode }))}
          style={styles.iconBtn}
        >
          <Ionicons name={dark ? 'sunny' : 'moon'} size={18} color={theme.sub} />
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.scrollBody} keyboardShouldPersistTaps="handled">
        {/* Top 2 Summary Cards (Pending / Closed or Low / In Stock) */}
        <View style={styles.summaryRow}>
          <TouchableOpacity
            style={[styles.summaryCard, { backgroundColor: theme.card, borderColor: theme.border }]}
            onPress={() => {
              if (view === 'inventory') return;
              if (view === 'home') openList('All');
              setFilter('active');
            }}
          >
            <View>
              <Text style={{ color: theme.sub, fontSize: fs.xs, fontWeight: '700', textTransform: 'uppercase' }}>
                {view === 'inventory' ? 'Low / Out' : 'Pending'}
              </Text>
              <Text style={{ color: theme.text, fontSize: 22, fontWeight: '700', marginTop: 2 }}>
                {view === 'inventory' ? inventory.filter((i) => i.qty <= 0).length : pendingCount}
              </Text>
            </View>
            <View style={[styles.summaryIcon, { backgroundColor: 'rgba(255,149,0,0.15)' }]}>
              <Ionicons name="time" size={16} color={theme.orange} />
            </View>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.summaryCard, { backgroundColor: theme.card, borderColor: theme.border }]}
            onPress={() => {
              if (view === 'inventory') return;
              if (view === 'home') openList('All');
              setFilter('checked');
            }}
          >
            <View>
              <Text style={{ color: theme.sub, fontSize: fs.xs, fontWeight: '700', textTransform: 'uppercase' }}>
                {view === 'inventory' ? 'In Stock' : 'Closed'}
              </Text>
              <Text style={{ color: theme.green, fontSize: 22, fontWeight: '700', marginTop: 2 }}>
                {view === 'inventory' ? inventory.filter((i) => i.qty > 0).length : closedCount}
              </Text>
            </View>
            <View style={[styles.summaryIcon, { backgroundColor: 'rgba(52,199,89,0.15)' }]}>
              <Ionicons name="checkmark-circle" size={16} color={theme.green} />
            </View>
          </TouchableOpacity>
        </View>

        {/* ==================== VIEW 1: HOME DASHBOARD ==================== */}
        {view === 'home' && (
          <View style={{ gap: 10 }}>
            <View style={styles.sectionHeaderRow}>
              <View>
                <Text style={{ color: theme.text, fontSize: fs.title, fontWeight: '700' }}>Categories</Text>
                <Text style={{ color: theme.sub, fontSize: fs.xs }}>Tap a block to open list &amp; add items</Text>
              </View>
              <View style={{ flexDirection: 'row', gap: 6 }}>
                <TouchableOpacity onPress={() => setView('inventory')} style={[styles.smallPillBtn, { backgroundColor: theme.card, borderColor: theme.border }]}>
                  <Text style={{ color: theme.green, fontSize: fs.xs, fontWeight: '700' }}>Inventory</Text>
                </TouchableOpacity>
                <TouchableOpacity onPress={() => openList('All')} style={[styles.smallPillBtn, { backgroundColor: theme.card, borderColor: theme.border }]}>
                  <Text style={{ color: theme.accent, fontSize: fs.xs, fontWeight: '700' }}>All Items</Text>
                </TouchableOpacity>
              </View>
            </View>

            {/* Single-Column Rectangular Category Blocks */}
            {categories.map((cat) => {
              const catItems = items.filter((i) => i.category === cat.name);
              const pending = catItems.filter((i) => !i.checked);
              const preview = pending.slice(0, 2).map((i) => `${i.name} (${fmtQty(i.qty)} ${i.unit})`).join(', ');
              return (
                <TouchableOpacity
                  key={cat.name}
                  onPress={() => openList(cat.name)}
                  style={[styles.dashTile, { backgroundColor: theme.card, borderColor: theme.border }]}
                >
                  <View style={[styles.dashBar, { backgroundColor: cat.color }]} />
                  <View style={[styles.catIconBox, { backgroundColor: cat.color }]}>
                    <Ionicons name={cat.icon || 'folder'} size={16} color="#fff" />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={{ color: theme.text, fontSize: fs.body, fontWeight: '700' }} numberOfLines={1}>{cat.name}</Text>
                    <Text style={{ color: theme.sub, fontSize: fs.xs, marginTop: 2 }} numberOfLines={1}>
                      {preview || (catItems.length ? 'All items closed' : 'Tap to add items')}
                    </Text>
                  </View>
                  <View style={{ alignItems: 'flex-end', marginRight: 4 }}>
                    <Text style={{ color: pending.length ? theme.text : theme.green, fontSize: 18, fontWeight: '700' }}>{pending.length}</Text>
                    <Text style={{ color: theme.muted, fontSize: 9, fontWeight: '700', textTransform: 'uppercase' }}>Pending</Text>
                  </View>
                  <Ionicons name="chevron-forward" size={16} color={theme.muted} />
                </TouchableOpacity>
              );
            })}
          </View>
        )}

        {/* ==================== VIEW 2: CATEGORY / LIST PAGE ==================== */}
        {view === 'list' && (
          <View style={{ gap: 12 }}>
            {/* Add New Item Card (always on List page with units) */}
            <View style={[styles.card, { backgroundColor: theme.card, borderColor: theme.border }]}>
              <View style={{ flexDirection: 'row', gap: 6 }}>
                <TextInput
                  value={newName}
                  onChangeText={setNewName}
                  placeholder={`Add item to ${activeList === 'All' ? newCat : activeList}...`}
                  placeholderTextColor={theme.muted}
                  onSubmitEditing={handleAddListItem}
                  style={[styles.input, { flex: 1, backgroundColor: theme.input, color: theme.text, fontSize: fs.body }]}
                />
                <TouchableOpacity onPress={handleAddListItem} style={[styles.addBtn, { backgroundColor: theme.accent }]}>
                  <Text style={{ color: '#fff', fontSize: fs.body, fontWeight: '700' }}>+ Add</Text>
                </TouchableOpacity>
              </View>

              {/* Live Inventory Match Hint */}
              {newName.trim().length > 0 && !isWishAdd && (
                <View style={[styles.hintBar, { backgroundColor: liveInvHint && liveInvHint.qty > 0 ? 'rgba(52,199,89,0.14)' : theme.input }]}>
                  <Text style={{ color: liveInvHint && liveInvHint.qty > 0 ? theme.green : theme.sub, fontSize: fs.xs, fontWeight: '600' }}>
                    {liveInvHint ? `In Inventory (${liveInvHint.name}): ${fmtQty(liveInvHint.qty)} ${liveInvHint.unit}` : 'Inventory stock: 0'}
                  </Text>
                </View>
              )}

              {/* Quantity Stepper + Unit Selector */}
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                <View style={[styles.stepper, { backgroundColor: theme.input, borderColor: theme.border }]}>
                  <TouchableOpacity onPress={() => setNewQty(fmtQty(Math.max(0.25, (parseFloat(newQty) || 1) - getStep(newUnit))))} style={styles.stepBtn}>
                    <Text style={{ color: theme.accent, fontWeight: '700', fontSize: 15 }}>−</Text>
                  </TouchableOpacity>
                  <TextInput value={newQty} onChangeText={setNewQty} keyboardType="decimal-pad" style={{ color: theme.text, width: 34, textAlign: 'center', fontSize: fs.sub, fontWeight: '700' }} />
                  <TouchableOpacity onPress={() => setNewQty(fmtQty((parseFloat(newQty) || 0) + getStep(newUnit)))} style={styles.stepBtn}>
                    <Text style={{ color: theme.accent, fontWeight: '700', fontSize: 15 }}>+</Text>
                  </TouchableOpacity>
                </View>

                <TouchableOpacity
                  onPress={() => setUnitPickerTarget({ current: newUnit, onSelect: (u) => setNewUnit(u) })}
                  style={[styles.selectPill, { backgroundColor: theme.input }]}
                >
                  <Text style={{ color: theme.text, fontSize: fs.sub, fontWeight: '600' }}>{newUnit} ▾</Text>
                </TouchableOpacity>

                {activeList === 'All' && (
                  <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 6 }}>
                    {categories.map((c) => (
                      <TouchableOpacity
                        key={c.name}
                        onPress={() => setNewCat(c.name)}
                        style={[styles.selectPill, { backgroundColor: newCat === c.name ? c.color : theme.input }]}
                      >
                        <Text style={{ color: newCat === c.name ? '#fff' : theme.text, fontSize: fs.xs, fontWeight: '600' }}>{c.name}</Text>
                      </TouchableOpacity>
                    ))}
                  </ScrollView>
                )}
              </View>

              {/* Wish List Extra Fields: Price, Item Category, Product Link */}
              {isWishAdd && (
                <View style={{ gap: 6, paddingTop: 6, borderTopWidth: 0.5, borderTopColor: theme.border }}>
                  <View style={{ flexDirection: 'row', gap: 6 }}>
                    <TextInput
                      value={newPrice}
                      onChangeText={setNewPrice}
                      keyboardType="decimal-pad"
                      placeholder="₹ Price"
                      placeholderTextColor={theme.muted}
                      style={[styles.input, { flex: 1, backgroundColor: theme.input, color: theme.text, fontSize: fs.sub }]}
                    />
                    <TextInput
                      value={newWishTag}
                      onChangeText={setNewWishTag}
                      placeholder="Category (e.g. Electronics)"
                      placeholderTextColor={theme.muted}
                      style={[styles.input, { flex: 1.3, backgroundColor: theme.input, color: theme.text, fontSize: fs.sub }]}
                    />
                  </View>
                  <TextInput
                    value={newLink}
                    onChangeText={setNewLink}
                    autoCapitalize="none"
                    keyboardType="url"
                    placeholder="Product link (https://...)"
                    placeholderTextColor={theme.muted}
                    style={[styles.input, { backgroundColor: theme.input, color: theme.text, fontSize: fs.sub }]}
                  />
                </View>
              )}
            </View>

            {/* Search + Filter */}
            <TextInput
              value={search}
              onChangeText={setSearch}
              placeholder="Search items..."
              placeholderTextColor={theme.muted}
              style={[styles.input, { backgroundColor: theme.card, color: theme.text, fontSize: fs.sub, borderWidth: 0.5, borderColor: theme.border }]}
            />
            <View style={[styles.segmented, { backgroundColor: dark ? '#2C2C2E' : '#E5E5EA' }]}>
              {[
                { k: 'all', label: `All (${scopedItems.length})` },
                { k: 'active', label: `Pending (${pendingCount})` },
                { k: 'checked', label: `Closed (${closedCount})` },
              ].map((f) => (
                <TouchableOpacity
                  key={f.k}
                  onPress={() => setFilter(f.k)}
                  style={[styles.segBtn, filter === f.k && { backgroundColor: theme.card }]}
                >
                  <Text style={{ color: filter === f.k ? theme.text : theme.sub, fontSize: fs.xs, fontWeight: '700' }}>{f.label}</Text>
                </TouchableOpacity>
              ))}
            </View>

            {/* Items List */}
            {filteredListItems.length === 0 ? (
              <View style={[styles.card, { backgroundColor: theme.card, borderColor: theme.border, alignItems: 'center', paddingVertical: 28 }]}>
                <Text style={{ color: theme.sub, fontSize: fs.body }}>No items here yet.</Text>
              </View>
            ) : (
              <View style={[styles.card, { backgroundColor: theme.card, borderColor: theme.border, padding: 0, overflow: 'hidden' }]}>
                {filteredListItems.map((item, idx) => {
                  const invMatch = findInvMatch(item.name);
                  const isWish = item.category === 'Wish List';
                  return (
                    <View
                      key={item.id}
                      style={[styles.itemRow, idx < filteredListItems.length - 1 && { borderBottomWidth: 0.5, borderBottomColor: theme.border }]}
                    >
                      <TouchableOpacity
                        onPress={() => setItems((prev) => prev.map((x) => (x.id === item.id ? { ...x, checked: !x.checked } : x)))}
                        style={[styles.checkCircle, { borderColor: item.checked ? theme.green : theme.muted, backgroundColor: item.checked ? theme.green : 'transparent' }]}
                      >
                        {item.checked && <Ionicons name="checkmark" size={13} color="#fff" />}
                      </TouchableOpacity>

                      <TouchableOpacity onPress={() => setEditTarget({ mode: 'list', item: { ...item } })} style={{ flex: 1 }}>
                        <Text
                          style={{
                            color: theme.text,
                            fontSize: fs.body,
                            fontWeight: '600',
                            textDecorationLine: item.checked ? 'line-through' : 'none',
                            opacity: item.checked ? 0.5 : 1,
                          }}
                          numberOfLines={1}
                        >
                          {item.name}
                        </Text>
                        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginTop: 2, alignItems: 'center' }}>
                          {isWish ? (
                            <>
                              {!!fmtPrice(item.price) && <Text style={{ color: theme.accent, fontSize: fs.xs, fontWeight: '700' }}>{fmtPrice(item.price)}</Text>}
                              {!!item.wishTag && <Text style={{ color: theme.sub, fontSize: fs.xs }}>{item.wishTag}</Text>}
                              {!!item.link && (
                                <TouchableOpacity onPress={() => Linking.openURL(normUrl(item.link)).catch(() => {})}>
                                  <Text style={{ color: theme.accent, fontSize: fs.xs, fontWeight: '700', textDecorationLine: 'underline' }}>Link ↗</Text>
                                </TouchableOpacity>
                              )}
                            </>
                          ) : (
                            <Text style={{ color: invMatch && invMatch.qty > 0 ? theme.green : theme.muted, fontSize: fs.xs, fontWeight: '600' }}>
                              {invMatch ? `In stock: ${fmtQty(invMatch.qty)} ${invMatch.unit}` : 'In stock: 0'}
                            </Text>
                          )}
                          {!!item.note && <Text style={{ color: theme.sub, fontSize: fs.xs }}>· {item.note}</Text>}
                        </View>
                      </TouchableOpacity>

                      {/* Inline Stepper + Unit Switcher */}
                      <View style={[styles.stepper, { backgroundColor: theme.input, borderColor: theme.border }]}>
                        <TouchableOpacity
                          onPress={() =>
                            setItems((prev) =>
                              prev
                                .map((x) => (x.id === item.id ? { ...x, qty: Number((x.qty - getStep(x.unit)).toFixed(2)) } : x))
                                .filter((x) => x.qty > 0)
                            )
                          }
                          style={styles.stepBtn}
                        >
                          <Text style={{ color: theme.accent, fontWeight: '700' }}>−</Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                          onPress={() =>
                            setUnitPickerTarget({
                              current: item.unit,
                              onSelect: (u) => setItems((prev) => prev.map((x) => (x.id === item.id ? { ...x, unit: u } : x))),
                            })
                          }
                          style={{ paddingHorizontal: 4 }}
                        >
                          <Text style={{ color: theme.text, fontSize: fs.xs, fontWeight: '700' }}>
                            {fmtQty(item.qty)} <Text style={{ color: theme.sub, fontWeight: '500' }}>{item.unit}</Text>
                          </Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                          onPress={() => setItems((prev) => prev.map((x) => (x.id === item.id ? { ...x, qty: Number((x.qty + getStep(x.unit)).toFixed(2)) } : x)))}
                          style={styles.stepBtn}
                        >
                          <Text style={{ color: theme.accent, fontWeight: '700' }}>+</Text>
                        </TouchableOpacity>
                      </View>
                    </View>
                  );
                })}
              </View>
            )}

            {closedCount > 0 && (
              <TouchableOpacity
                onPress={() => setItems((prev) => prev.filter((x) => !(x.checked && (activeList === 'All' || x.category === activeList))))}
                style={{ alignSelf: 'flex-start', paddingVertical: 4 }}
              >
                <Text style={{ color: theme.red, fontSize: fs.sub, fontWeight: '600' }}>Clear Closed ({closedCount})</Text>
              </TouchableOpacity>
            )}
          </View>
        )}

        {/* ==================== VIEW 3: INVENTORY PAGE ==================== */}
        {view === 'inventory' && (
          <View style={{ gap: 12 }}>
            <View style={[styles.card, { backgroundColor: theme.card, borderColor: theme.border }]}>
              <View style={{ flexDirection: 'row', gap: 6 }}>
                <TextInput
                  value={invName}
                  onChangeText={setInvName}
                  placeholder="Add item to home inventory..."
                  placeholderTextColor={theme.muted}
                  onSubmitEditing={handleAddInvItem}
                  style={[styles.input, { flex: 1, backgroundColor: theme.input, color: theme.text, fontSize: fs.body }]}
                />
                <TouchableOpacity onPress={handleAddInvItem} style={[styles.addBtn, { backgroundColor: theme.green }]}>
                  <Text style={{ color: '#fff', fontSize: fs.body, fontWeight: '700' }}>+ Add</Text>
                </TouchableOpacity>
              </View>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                <View style={[styles.stepper, { backgroundColor: theme.input, borderColor: theme.border }]}>
                  <TouchableOpacity onPress={() => setInvQty(fmtQty(Math.max(0, (parseFloat(invQty) || 0) - getStep(invUnit))))} style={styles.stepBtn}>
                    <Text style={{ color: theme.accent, fontWeight: '700' }}>−</Text>
                  </TouchableOpacity>
                  <TextInput value={invQty} onChangeText={setInvQty} keyboardType="decimal-pad" style={{ color: theme.text, width: 34, textAlign: 'center', fontSize: fs.sub, fontWeight: '700' }} />
                  <TouchableOpacity onPress={() => setInvQty(fmtQty((parseFloat(invQty) || 0) + getStep(invUnit)))} style={styles.stepBtn}>
                    <Text style={{ color: theme.accent, fontWeight: '700' }}>+</Text>
                  </TouchableOpacity>
                </View>
                <TouchableOpacity
                  onPress={() => setUnitPickerTarget({ current: invUnit, onSelect: (u) => setInvUnit(u) })}
                  style={[styles.selectPill, { backgroundColor: theme.input }]}
                >
                  <Text style={{ color: theme.text, fontSize: fs.sub, fontWeight: '600' }}>{invUnit} ▾</Text>
                </TouchableOpacity>
              </View>
            </View>

            <TextInput
              value={invSearch}
              onChangeText={setInvSearch}
              placeholder="Search inventory..."
              placeholderTextColor={theme.muted}
              style={[styles.input, { backgroundColor: theme.card, color: theme.text, fontSize: fs.sub, borderWidth: 0.5, borderColor: theme.border }]}
            />

            <View style={[styles.card, { backgroundColor: theme.card, borderColor: theme.border, padding: 0, overflow: 'hidden' }]}>
              {filteredInventory.map((item, idx) => (
                <View
                  key={item.id}
                  style={[styles.itemRow, idx < filteredInventory.length - 1 && { borderBottomWidth: 0.5, borderBottomColor: theme.border }]}
                >
                  <TouchableOpacity onPress={() => sendInvToList(item)} style={[styles.toListBtn, { backgroundColor: theme.input }]}>
                    <Ionicons name="cart-outline" size={14} color={theme.accent} />
                  </TouchableOpacity>
                  <TouchableOpacity onPress={() => setEditTarget({ mode: 'inventory', item: { ...item } })} style={{ flex: 1 }}>
                    <Text style={{ color: theme.text, fontSize: fs.body, fontWeight: '600' }} numberOfLines={1}>{item.name}</Text>
                    <Text style={{ color: item.qty <= 0 ? theme.red : theme.sub, fontSize: fs.xs }}>
                      {item.qty <= 0 ? 'Out of stock' : item.note || item.category}
                    </Text>
                  </TouchableOpacity>
                  <View style={[styles.stepper, { backgroundColor: theme.input, borderColor: theme.border }]}>
                    <TouchableOpacity
                      onPress={() => setInventory((prev) => prev.map((x) => (x.id === item.id ? { ...x, qty: Math.max(0, Number((x.qty - getStep(x.unit)).toFixed(2))) } : x)))}
                      style={styles.stepBtn}
                    >
                      <Text style={{ color: theme.accent, fontWeight: '700' }}>−</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      onPress={() =>
                        setUnitPickerTarget({
                          current: item.unit,
                          onSelect: (u) => setInventory((prev) => prev.map((x) => (x.id === item.id ? { ...x, unit: u } : x))),
                        })
                      }
                      style={{ paddingHorizontal: 4 }}
                    >
                      <Text style={{ color: theme.text, fontSize: fs.xs, fontWeight: '700' }}>
                        {fmtQty(item.qty)} <Text style={{ color: theme.sub, fontWeight: '500' }}>{item.unit}</Text>
                      </Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      onPress={() => setInventory((prev) => prev.map((x) => (x.id === item.id ? { ...x, qty: Number((x.qty + getStep(x.unit)).toFixed(2)) } : x)))}
                      style={styles.stepBtn}
                    >
                      <Text style={{ color: theme.accent, fontWeight: '700' }}>+</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              ))}
            </View>
          </View>
        )}
      </ScrollView>

      {/* ==================== LEFT DRAWER MODAL (Nav + Notepad + Settings) ==================== */}
      <Modal visible={drawerOpen} transparent animationType="fade" onRequestClose={() => setDrawerOpen(false)}>
        <View style={styles.drawerOverlay}>
          <View style={[styles.drawerPanel, { backgroundColor: theme.card, borderRightColor: theme.border }]}>
            <SafeAreaView style={{ flex: 1 }} edges={['top', 'bottom']}>
              <View style={[styles.drawerHead, { borderBottomColor: theme.border }]}>
                <View style={styles.rowCenter}>
                  <View style={[styles.appBadge, { backgroundColor: theme.accent }]}>
                    <Ionicons name={settings.appIcon} size={15} color="#fff" />
                  </View>
                  <Text style={{ color: theme.text, fontSize: fs.title, fontWeight: '700', marginLeft: 8 }}>FreshCart</Text>
                </View>
                <TouchableOpacity onPress={() => setDrawerOpen(false)}>
                  <Ionicons name="close" size={20} color={theme.sub} />
                </TouchableOpacity>
              </View>

              <View style={{ padding: 12, gap: 6 }}>
                <TouchableOpacity onPress={() => { setView('home'); setDrawerOpen(false); }} style={[styles.drawerNavBtn, view === 'home' && { backgroundColor: theme.input }]}>
                  <Text style={{ color: view === 'home' ? theme.accent : theme.text, fontSize: fs.body, fontWeight: '600' }}>Home Dashboard</Text>
                  <Text style={{ color: theme.sub, fontSize: fs.xs }}>{items.filter((i) => !i.checked).length}</Text>
                </TouchableOpacity>
                <TouchableOpacity onPress={() => openList('All')} style={[styles.drawerNavBtn, view === 'list' && activeList === 'All' && { backgroundColor: theme.input }]}>
                  <Text style={{ color: view === 'list' && activeList === 'All' ? theme.accent : theme.text, fontSize: fs.body, fontWeight: '600' }}>All Lists</Text>
                  <Text style={{ color: theme.sub, fontSize: fs.xs }}>{items.length}</Text>
                </TouchableOpacity>
                <TouchableOpacity onPress={() => { setView('inventory'); setDrawerOpen(false); }} style={[styles.drawerNavBtn, view === 'inventory' && { backgroundColor: theme.input }]}>
                  <Text style={{ color: view === 'inventory' ? theme.accent : theme.text, fontSize: fs.body, fontWeight: '600' }}>Inventory</Text>
                  <Text style={{ color: theme.sub, fontSize: fs.xs }}>{inventory.length}</Text>
                </TouchableOpacity>
              </View>

              {/* Notepad in Side Panel */}
              <View style={{ flex: 1, paddingHorizontal: 12, paddingTop: 8, borderTopWidth: 0.5, borderTopColor: theme.border }}>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 6 }}>
                  <Text style={{ color: theme.sub, fontSize: fs.xs, fontWeight: '700', textTransform: 'uppercase' }}>Notepad</Text>
                  <TouchableOpacity onPress={() => setNotepad('')}>
                    <Text style={{ color: theme.red, fontSize: fs.xs, fontWeight: '600' }}>Clear</Text>
                  </TouchableOpacity>
                </View>
                <TextInput
                  multiline
                  textAlignVertical="top"
                  value={notepad}
                  onChangeText={setNotepad}
                  placeholder="Quick notes, recipes, store reminders..."
                  placeholderTextColor={theme.muted}
                  style={[styles.notepad, { backgroundColor: theme.input, color: theme.text, fontSize: fs.sub }]}
                />
              </View>

              {/* Settings Button Pinned at Bottom */}
              <View style={{ padding: 12, borderTopWidth: 0.5, borderTopColor: theme.border }}>
                <TouchableOpacity
                  onPress={() => { setDrawerOpen(false); setSettingsOpen(true); }}
                  style={[styles.drawerSettingsBtn, { backgroundColor: theme.input }]}
                >
                  <View style={styles.rowCenter}>
                    <Ionicons name="settings" size={16} color={theme.accent} />
                    <Text style={{ color: theme.text, fontSize: fs.body, fontWeight: '700', marginLeft: 8 }}>App Settings</Text>
                  </View>
                  <Ionicons name="chevron-forward" size={16} color={theme.muted} />
                </TouchableOpacity>
              </View>
            </SafeAreaView>
          </View>
          <Pressable style={{ flex: 1 }} onPress={() => setDrawerOpen(false)} />
        </View>
      </Modal>

      {/* ==================== SETTINGS MODAL ==================== */}
      <Modal visible={settingsOpen} transparent animationType="slide" onRequestClose={() => setSettingsOpen(false)}>
        <View style={styles.modalBg}>
          <View style={[styles.modalSheet, { backgroundColor: theme.card }]}>
            <View style={styles.modalHead}>
              <Text style={{ color: theme.text, fontSize: fs.title, fontWeight: '700' }}>App Settings</Text>
              <TouchableOpacity onPress={() => setSettingsOpen(false)}><Ionicons name="close" size={20} color={theme.sub} /></TouchableOpacity>
            </View>
            <ScrollView contentContainerStyle={{ gap: 16, paddingBottom: 20 }}>
              {/* Font Size */}
              <View>
                <Text style={[styles.label, { color: theme.sub }]}>Font Size</Text>
                <View style={[styles.segmented, { backgroundColor: theme.input }]}>
                  {['small', 'medium', 'large'].map((sz) => (
                    <TouchableOpacity key={sz} onPress={() => setSettings((s) => ({ ...s, fontSize: sz }))} style={[styles.segBtn, settings.fontSize === sz && { backgroundColor: theme.card }]}>
                      <Text style={{ color: settings.fontSize === sz ? theme.text : theme.sub, fontSize: fs.xs, fontWeight: '700', textTransform: 'capitalize' }}>{sz}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>

              {/* Theme Color */}
              <View>
                <Text style={[styles.label, { color: theme.sub }]}>Theme Color</Text>
                <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 10 }}>
                  {THEME_COLORS.map((hex) => (
                    <TouchableOpacity
                      key={hex}
                      onPress={() => setSettings((s) => ({ ...s, themeColor: hex }))}
                      style={[styles.colorDot, { backgroundColor: hex, borderWidth: settings.themeColor === hex ? 3 : 0, borderColor: theme.text }]}
                    />
                  ))}
                </View>
              </View>

              {/* App Icon */}
              <View>
                <Text style={[styles.label, { color: theme.sub }]}>App Icon</Text>
                <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
                  {APP_ICONS.map((ic) => (
                    <TouchableOpacity
                      key={ic.id}
                      onPress={() => setSettings((s) => ({ ...s, appIcon: ic.id }))}
                      style={[styles.iconChoice, { backgroundColor: settings.appIcon === ic.id ? theme.accent : theme.input }]}
                    >
                      <Ionicons name={ic.id} size={16} color={settings.appIcon === ic.id ? '#fff' : theme.text} />
                      <Text style={{ color: settings.appIcon === ic.id ? '#fff' : theme.text, fontSize: 10, fontWeight: '600' }}>{ic.label}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>

              {/* Categories Add / Remove */}
              <View>
                <Text style={[styles.label, { color: theme.sub }]}>Categories (Add / Remove)</Text>
                <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginBottom: 8 }}>
                  {categories.map((c) => (
                    <View key={c.name} style={[styles.chip, { backgroundColor: theme.input }]}>
                      <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: c.color }} />
                      <Text style={{ color: theme.text, fontSize: fs.xs }}>{c.name}</Text>
                      {categories.length > 1 && (
                        <TouchableOpacity onPress={() => setCategories((prev) => prev.filter((x) => x.name !== c.name))}>
                          <Text style={{ color: theme.red, fontWeight: '700', marginLeft: 4 }}>×</Text>
                        </TouchableOpacity>
                      )}
                    </View>
                  ))}
                </View>
                <View style={{ flexDirection: 'row', gap: 6 }}>
                  <TextInput value={newCatName} onChangeText={setNewCatName} placeholder="New category..." placeholderTextColor={theme.muted} style={[styles.input, { flex: 1, backgroundColor: theme.input, color: theme.text, fontSize: fs.sub }]} />
                  <TouchableOpacity
                    onPress={() => {
                      const n = newCatName.trim();
                      if (!n || categories.some((c) => c.name.toLowerCase() === n.toLowerCase())) return;
                      setCategories((prev) => [...prev, { name: n, color: newCatColor, icon: 'folder' }]);
                      setNewCatName('');
                    }}
                    style={[styles.addBtn, { backgroundColor: theme.accent }]}
                  >
                    <Text style={{ color: '#fff', fontSize: fs.sub, fontWeight: '700' }}>Add</Text>
                  </TouchableOpacity>
                </View>
              </View>

              {/* Quantity Units */}
              <View>
                <Text style={[styles.label, { color: theme.sub }]}>Quantity Units</Text>
                <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginBottom: 8 }}>
                  {settings.units.map((u) => (
                    <View key={u.name} style={[styles.chip, { backgroundColor: theme.input }]}>
                      <Text style={{ color: theme.text, fontSize: fs.xs }}>{u.name} (±{fmtQty(u.step)})</Text>
                      {settings.units.length > 1 && (
                        <TouchableOpacity onPress={() => setSettings((s) => ({ ...s, units: s.units.filter((x) => x.name !== u.name) }))}>
                          <Text style={{ color: theme.red, fontWeight: '700', marginLeft: 4 }}>×</Text>
                        </TouchableOpacity>
                      )}
                    </View>
                  ))}
                </View>
                <View style={{ flexDirection: 'row', gap: 6 }}>
                  <TextInput value={newUnitName} onChangeText={setNewUnitName} placeholder="Add unit (e.g. bunch)" placeholderTextColor={theme.muted} style={[styles.input, { flex: 1, backgroundColor: theme.input, color: theme.text, fontSize: fs.sub }]} />
                  <TextInput value={newUnitStep} onChangeText={setNewUnitStep} keyboardType="decimal-pad" style={[styles.input, { width: 52, textAlign: 'center', backgroundColor: theme.input, color: theme.text, fontSize: fs.sub }]} />
                  <TouchableOpacity
                    onPress={() => {
                      const n = newUnitName.trim();
                      if (!n || settings.units.some((u) => u.name.toLowerCase() === n.toLowerCase())) return;
                      setSettings((s) => ({ ...s, units: [...s.units, { name: n, step: Math.max(0.1, parseFloat(newUnitStep) || 1) }] }));
                      setNewUnitName('');
                      setNewUnitStep('1');
                    }}
                    style={[styles.addBtn, { backgroundColor: theme.accent }]}
                  >
                    <Text style={{ color: '#fff', fontSize: fs.sub, fontWeight: '700' }}>Add</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* ==================== UNIT PICKER MODAL ==================== */}
      <Modal visible={!!unitPickerTarget} transparent animationType="fade" onRequestClose={() => setUnitPickerTarget(null)}>
        <Pressable style={styles.modalBg} onPress={() => setUnitPickerTarget(null)}>
          <View style={[styles.modalSheet, { backgroundColor: theme.card, maxHeight: '55%' }]}>
            <Text style={{ color: theme.text, fontSize: fs.title, fontWeight: '700', marginBottom: 10 }}>Select Quantity Unit</Text>
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
              {settings.units.map((u) => (
                <TouchableOpacity
                  key={u.name}
                  onPress={() => {
                    unitPickerTarget?.onSelect(u.name);
                    setUnitPickerTarget(null);
                  }}
                  style={[styles.selectPill, { backgroundColor: unitPickerTarget?.current === u.name ? theme.accent : theme.input, paddingHorizontal: 14, paddingVertical: 8 }]}
                >
                  <Text style={{ color: unitPickerTarget?.current === u.name ? '#fff' : theme.text, fontSize: fs.body, fontWeight: '600' }}>{u.name}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        </Pressable>
      </Modal>

      {/* ==================== EDIT ITEM MODAL ==================== */}
      <Modal visible={!!editTarget} transparent animationType="slide" onRequestClose={() => setEditTarget(null)}>
        <View style={styles.modalBg}>
          {editTarget && (
            <View style={[styles.modalSheet, { backgroundColor: theme.card }]}>
              <View style={styles.modalHead}>
                <Text style={{ color: theme.text, fontSize: fs.title, fontWeight: '700' }}>Edit Item</Text>
                <TouchableOpacity onPress={() => setEditTarget(null)}><Ionicons name="close" size={20} color={theme.sub} /></TouchableOpacity>
              </View>
              <View style={{ gap: 10 }}>
                <TextInput
                  value={editTarget.item.name}
                  onChangeText={(v) => setEditTarget((t) => ({ ...t, item: { ...t.item, name: v } }))}
                  placeholder="Item Name"
                  placeholderTextColor={theme.muted}
                  style={[styles.input, { backgroundColor: theme.input, color: theme.text, fontSize: fs.body }]}
                />
                <View style={{ flexDirection: 'row', gap: 8 }}>
                  <TextInput
                    value={String(editTarget.item.qty)}
                    onChangeText={(v) => setEditTarget((t) => ({ ...t, item: { ...t.item, qty: v } }))}
                    keyboardType="decimal-pad"
                    placeholder="Qty"
                    placeholderTextColor={theme.muted}
                    style={[styles.input, { flex: 1, backgroundColor: theme.input, color: theme.text, fontSize: fs.body }]}
                  />
                  <TouchableOpacity
                    onPress={() => setUnitPickerTarget({ current: editTarget.item.unit, onSelect: (u) => setEditTarget((t) => ({ ...t, item: { ...t.item, unit: u } })) })}
                    style={[styles.selectPill, { backgroundColor: theme.input, justifyContent: 'center', paddingHorizontal: 14 }]}
                  >
                    <Text style={{ color: theme.text, fontSize: fs.body, fontWeight: '600' }}>{editTarget.item.unit} ▾</Text>
                  </TouchableOpacity>
                </View>
                {editTarget.mode === 'list' && editTarget.item.category === 'Wish List' && (
                  <>
                    <View style={{ flexDirection: 'row', gap: 8 }}>
                      <TextInput
                        value={String(editTarget.item.price || '')}
                        onChangeText={(v) => setEditTarget((t) => ({ ...t, item: { ...t.item, price: v } }))}
                        keyboardType="decimal-pad"
                        placeholder="₹ Price"
                        placeholderTextColor={theme.muted}
                        style={[styles.input, { flex: 1, backgroundColor: theme.input, color: theme.text, fontSize: fs.sub }]}
                      />
                      <TextInput
                        value={editTarget.item.wishTag || ''}
                        onChangeText={(v) => setEditTarget((t) => ({ ...t, item: { ...t.item, wishTag: v } }))}
                        placeholder="Category tag"
                        placeholderTextColor={theme.muted}
                        style={[styles.input, { flex: 1, backgroundColor: theme.input, color: theme.text, fontSize: fs.sub }]}
                      />
                    </View>
                    <TextInput
                      value={editTarget.item.link || ''}
                      onChangeText={(v) => setEditTarget((t) => ({ ...t, item: { ...t.item, link: v } }))}
                      autoCapitalize="none"
                      keyboardType="url"
                      placeholder="Product URL"
                      placeholderTextColor={theme.muted}
                      style={[styles.input, { backgroundColor: theme.input, color: theme.text, fontSize: fs.sub }]}
                    />
                  </>
                )}
                <TextInput
                  value={editTarget.item.note || ''}
                  onChangeText={(v) => setEditTarget((t) => ({ ...t, item: { ...t.item, note: v } }))}
                  placeholder="Note (optional)"
                  placeholderTextColor={theme.muted}
                  style={[styles.input, { backgroundColor: theme.input, color: theme.text, fontSize: fs.sub }]}
                />
                <View style={{ flexDirection: 'row', gap: 8, marginTop: 4 }}>
                  <TouchableOpacity
                    onPress={() => {
                      if (editTarget.mode === 'inventory') setInventory((prev) => prev.filter((x) => x.id !== editTarget.item.id));
                      else setItems((prev) => prev.filter((x) => x.id !== editTarget.item.id));
                      setEditTarget(null);
                    }}
                    style={[styles.addBtn, { backgroundColor: 'rgba(255,59,48,0.14)' }]}
                  >
                    <Text style={{ color: theme.red, fontWeight: '700' }}>Delete</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    onPress={() => {
                      const updated = {
                        ...editTarget.item,
                        qty: Math.max(editTarget.mode === 'inventory' ? 0 : 0.25, parseFloat(editTarget.item.qty) || 0),
                        link: editTarget.item.link ? normUrl(editTarget.item.link) : '',
                      };
                      if (editTarget.mode === 'inventory') setInventory((prev) => prev.map((x) => (x.id === updated.id ? updated : x)));
                      else setItems((prev) => prev.map((x) => (x.id === updated.id ? updated : x)));
                      setEditTarget(null);
                    }}
                    style={[styles.addBtn, { flex: 1, backgroundColor: theme.accent, alignItems: 'center' }]}
                  >
                    <Text style={{ color: '#fff', fontWeight: '700' }}>Save Changes</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </View>
          )}
        </View>
      </Modal>
    </SafeAreaView>
  );
}

export default function App() {
  return (
    <SafeAreaProvider>
      <MainApp />
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 14, paddingVertical: 10, borderBottomWidth: 0.5 },
  rowCenter: { flexDirection: 'row', alignItems: 'center' },
  iconBtn: { padding: 6 },
  appBadge: { width: 28, height: 28, borderRadius: 8, alignItems: 'center', justifyContent: 'center' },
  scrollBody: { padding: 14, gap: 12, paddingBottom: 40 },
  summaryRow: { flexDirection: 'row', gap: 10 },
  summaryCard: { flex: 1, borderRadius: 14, borderWidth: 0.5, padding: 12, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  summaryIcon: { width: 32, height: 32, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  sectionHeaderRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  smallPillBtn: { paddingHorizontal: 10, paddingVertical: 6, borderRadius: 9, borderWidth: 0.5 },
  dashTile: { borderRadius: 14, borderWidth: 0.5, paddingVertical: 12, paddingHorizontal: 14, flexDirection: 'row', alignItems: 'center', gap: 10, overflow: 'hidden' },
  dashBar: { position: 'absolute', left: 0, top: 0, bottom: 0, width: 4 },
  catIconBox: { width: 34, height: 34, borderRadius: 10, alignItems: 'center', justifyContent: 'center', marginLeft: 4 },
  card: { borderRadius: 14, borderWidth: 0.5, padding: 10, gap: 8 },
  input: { borderRadius: 9, paddingHorizontal: 10, paddingVertical: Platform.OS === 'ios' ? 9 : 7 },
  addBtn: { borderRadius: 9, paddingHorizontal: 14, paddingVertical: 9, justifyContent: 'center' },
  hintBar: { borderRadius: 8, paddingHorizontal: 10, paddingVertical: 6 },
  stepper: { flexDirection: 'row', alignItems: 'center', borderRadius: 999, borderWidth: 0.5, paddingHorizontal: 4, paddingVertical: 2 },
  stepBtn: { width: 26, height: 26, borderRadius: 13, alignItems: 'center', justifyContent: 'center' },
  selectPill: { borderRadius: 9, paddingHorizontal: 10, paddingVertical: 6 },
  segmented: { flexDirection: 'row', borderRadius: 9, padding: 2 },
  segBtn: { flex: 1, alignItems: 'center', paddingVertical: 6, borderRadius: 7 },
  itemRow: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingHorizontal: 12, paddingVertical: 10 },
  checkCircle: { width: 22, height: 22, borderRadius: 11, borderWidth: 1.75, alignItems: 'center', justifyContent: 'center' },
  toListBtn: { width: 28, height: 28, borderRadius: 8, alignItems: 'center', justifyContent: 'center' },
  drawerOverlay: { flex: 1, flexDirection: 'row', backgroundColor: 'rgba(0,0,0,0.45)' },
  drawerPanel: { width: 285, maxWidth: '84%', height: '100%', borderRightWidth: 0.5 },
  drawerHead: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 14, borderBottomWidth: 0.5 },
  drawerNavBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 12, paddingVertical: 10, borderRadius: 10 },
  notepad: { flex: 1, borderRadius: 12, padding: 10, marginBottom: 10 },
  drawerSettingsBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 12, paddingVertical: 11, borderRadius: 11 },
  modalBg: { flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(0,0,0,0.45)' },
  modalSheet: { borderTopLeftRadius: 18, borderTopRightRadius: 18, padding: 16, maxHeight: '85%' },
  modalHead: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 },
  label: { fontSize: 10, fontWeight: '700', textTransform: 'uppercase', marginBottom: 6 },
  colorDot: { width: 28, height: 28, borderRadius: 14 },
  iconChoice: { width: 54, paddingVertical: 8, borderRadius: 10, alignItems: 'center', gap: 3 },
  chip: { flexDirection: 'row', alignItems: 'center', gap: 5, paddingHorizontal: 10, paddingVertical: 5, borderRadius: 999 },
});
