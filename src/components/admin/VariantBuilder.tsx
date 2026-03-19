"use client";

import { useState } from "react";
import { Plus, Trash2, ChevronUp, ChevronDown, Image as ImageIcon } from "lucide-react";

const DEFAULT_PRESETS = ["Color", "Size", "Material", "Style", "Weight"];

export interface SubAttribute {
  attributeKey: string;
  value: string;
  stock: number;
  priceOverride: string;
  sku: string;
}

export interface VariantGroup {
  id: string;
  masterKey: string;
  masterValue: string;
  groupPrice: string;
  comparePrice: string;
  imageIndex: number | null;
  subAttributes: SubAttribute[];
}

interface Props {
  groups: VariantGroup[];
  onChange: (groups: VariantGroup[]) => void;
  productSlug: string;
  images: { url: string; isPrimary: boolean }[];
}

function generateId() {
  return Math.random().toString(36).slice(2, 8);
}

function generateSku(productSlug: string, masterKey: string, masterValue: string, subKey: string, subValue: string): string {
  const slug = productSlug.toUpperCase().replace(/-/g, "-").slice(0, 8);
  const mk = masterValue.replace(/\s+/g, "-").toUpperCase().slice(0, 5);
  const sk = subValue.replace(/\s+/g, "-").toUpperCase().slice(0, 5);
  return `HB-${slug}-${mk}-${sk}`;
}

export default function VariantBuilder({ groups, onChange, productSlug, images }: Props) {
  const [presets, setPresets] = useState<string[]>(DEFAULT_PRESETS);
  const [newPreset, setNewPreset] = useState("");
  const [showAddPreset, setShowAddPreset] = useState<string | null>(null); // groupId-"master" or groupId-subIndex

  function addGroup() {
    onChange([...groups, {
      id: generateId(),
      masterKey: presets[0],
      masterValue: "",
      groupPrice: "",
      comparePrice: "",
      imageIndex: null,
      subAttributes: [{ attributeKey: presets.find(p => p !== presets[0]) ?? presets[0], value: "", stock: 0, priceOverride: "", sku: "" }],
    }]);
  }

  function removeGroup(id: string) {
    onChange(groups.filter(g => g.id !== id));
  }

  function updateGroup(id: string, field: keyof VariantGroup, value: any) {
    onChange(groups.map(g => g.id === id ? { ...g, [field]: value } : g));
  }

  function addSubAttribute(groupId: string, masterKey: string) {
    onChange(groups.map(g => {
      if (g.id !== groupId) return g;
      const availableKey = presets.find(p => p !== masterKey) ?? presets[0];
      return {
        ...g,
        subAttributes: [...g.subAttributes, { attributeKey: availableKey, value: "", stock: 0, priceOverride: "", sku: "" }]
      };
    }));
  }

  function removeSubAttribute(groupId: string, index: number) {
    onChange(groups.map(g => {
      if (g.id !== groupId) return g;
      return { ...g, subAttributes: g.subAttributes.filter((_, i) => i !== index) };
    }));
  }

  function updateSubAttribute(groupId: string, index: number, field: keyof SubAttribute, value: any, group: VariantGroup) {
    onChange(groups.map(g => {
      if (g.id !== groupId) return g;
      const updated = g.subAttributes.map((sub, i) => {
        if (i !== index) return sub;
        const newSub = { ...sub, [field]: value };
        if ((field === "value" || field === "attributeKey") && productSlug && g.masterKey && g.masterValue) {
          const sv = field === "value" ? value : sub.value;
          const sk = field === "attributeKey" ? value : sub.attributeKey;
          if (sv && sk) {
            newSub.sku = generateSku(productSlug, g.masterKey, g.masterValue, sk, sv);
          }
        }
        return newSub;
      });
      return { ...g, subAttributes: updated };
    }));
  }

  function updateStock(groupId: string, index: number, delta: number) {
    onChange(groups.map(g => {
      if (g.id !== groupId) return g;
      return {
        ...g,
        subAttributes: g.subAttributes.map((sub, i) =>
          i === index ? { ...sub, stock: Math.max(0, sub.stock + delta) } : sub
        )
      };
    }));
  }

  function handleAddPreset(target: string, groupId: string, field: "master" | number) {
    if (!newPreset.trim()) return;
    const formatted = newPreset.trim().charAt(0).toUpperCase() + newPreset.trim().slice(1);
    if (!presets.includes(formatted)) setPresets(prev => [...prev, formatted]);

    if (field === "master") {
      updateGroup(groupId, "masterKey", formatted);
    } else {
      onChange(groups.map(g => {
        if (g.id !== groupId) return g;
        return {
          ...g,
          subAttributes: g.subAttributes.map((sub, i) =>
            i === field ? { ...sub, attributeKey: formatted } : sub
          )
        };
      }));
    }
    setNewPreset("");
    setShowAddPreset(null);
  }

  return (
    <div className="space-y-4">
      {groups.map((group, gi) => (
        <div key={group.id} className="border border-gray-200 rounded-xl p-5 space-y-4 bg-gray-50/50">
          {/* Group header */}
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold text-gray-700">Variant Group {gi + 1}</h3>
            <button type="button" onClick={() => removeGroup(group.id)}
              className="text-red-400 hover:text-red-600 transition-colors">
              <Trash2 size={15} />
            </button>
          </div>

          {/* Master attribute */}
          <div className="bg-white border border-gray-200 rounded-lg p-4 space-y-3">
            <p className="text-xs font-bold text-gray-500 uppercase tracking-widest">Master Attribute</p>
            <div className="grid grid-cols-2 gap-3">
              {/* Master key dropdown */}
              <div>
                <label className="block text-xs text-gray-400 mb-1">Attribute Name</label>
                {showAddPreset === `${group.id}-master` ? (
                  <div className="flex gap-2">
                    <input value={newPreset} onChange={e => setNewPreset(e.target.value)}
                      onKeyDown={e => { if (e.key === "Enter") { e.preventDefault(); handleAddPreset("", group.id, "master"); } }}
                      placeholder="e.g. Fabric" autoFocus
                      className="flex-1 border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-gray-400" />
                    <button type="button" onClick={() => handleAddPreset("", group.id, "master")}
                      className="bg-[#2D2D2D] text-white text-xs px-3 rounded-lg">Add</button>
                    <button type="button" onClick={() => { setShowAddPreset(null); setNewPreset(""); }}
                      className="text-gray-400 text-xs px-1">✕</button>
                  </div>
                ) : (
                  <div className="flex gap-2">
                    <select value={group.masterKey}
                      onChange={e => updateGroup(group.id, "masterKey", e.target.value)}
                      className="flex-1 border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-gray-400 bg-white">
                      {presets.map(p => <option key={p} value={p}>{p}</option>)}
                    </select>
                    <button type="button" onClick={() => setShowAddPreset(`${group.id}-master`)}
                      className="text-xs text-gray-400 hover:text-gray-600 border border-gray-200 rounded-lg px-2 hover:bg-gray-50 whitespace-nowrap">
                      + New
                    </button>
                  </div>
                )}
              </div>

              {/* Master value input */}
              <div>
                <label className="block text-xs text-gray-400 mb-1">Value</label>
                <input value={group.masterValue}
                  onChange={e => updateGroup(group.id, "masterValue", e.target.value)}
                  placeholder={`e.g. ${group.masterKey === "Color" ? "Red" : group.masterKey === "Size" ? "Large" : "Value"}`}
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-gray-400" />
              </div>
            </div>

            {/* Group price */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs text-gray-400 mb-1">Group Price (K)</label>
                <input type="number" min="0" step="0.01" value={group.groupPrice}
                  onChange={e => updateGroup(group.id, "groupPrice", e.target.value)}
                  placeholder="0.00"
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-gray-400" />
              </div>
              <div>
                <label className="block text-xs text-gray-400 mb-1">Compare Price (K)</label>
                <input type="number" min="0" step="0.01" value={group.comparePrice}
                  onChange={e => updateGroup(group.id, "comparePrice", e.target.value)}
                  placeholder="0.00"
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-gray-400" />
              </div>
            </div>

            {/* Image link */}
            {images.length > 0 && (
              <div>
                <label className="block text-xs text-gray-400 mb-1.5 flex items-center gap-1">
                  <ImageIcon size={10} /> Link to Image
                </label>
                <div className="flex gap-2 flex-wrap">
                  <button type="button" onClick={() => updateGroup(group.id, "imageIndex", null)}
                    className={`w-10 h-10 rounded-lg border-2 flex items-center justify-center text-[10px] transition-colors
                      ${group.imageIndex === null ? "border-[#2D2D2D] bg-gray-100 font-bold" : "border-gray-200 hover:border-gray-300"}`}>
                    None
                  </button>
                  {images.map((img, i) => (
                    <button key={i} type="button" onClick={() => updateGroup(group.id, "imageIndex", i)}
                      className={`w-10 h-10 rounded-lg border-2 overflow-hidden transition-colors
                        ${group.imageIndex === i ? "border-[#2D2D2D]" : "border-gray-200 hover:border-gray-300"}`}>
                      <img src={img.url} alt="" className="w-full h-full object-cover" />
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Sub-attributes */}
          <div className="space-y-2">
            <p className="text-xs font-bold text-gray-500 uppercase tracking-widest">Sub-Attributes</p>

            {/* Header row */}
            <div className="grid grid-cols-12 gap-2 px-1">
              <div className="col-span-3 text-xs text-gray-400">Attribute</div>
              <div className="col-span-2 text-xs text-gray-400">Value</div>
              <div className="col-span-2 text-xs text-gray-400">Stock</div>
              <div className="col-span-2 text-xs text-gray-400">Price Override</div>
              <div className="col-span-2 text-xs text-gray-400">SKU</div>
              <div className="col-span-1"></div>
            </div>

            {group.subAttributes.map((sub, si) => (
              <div key={si} className="grid grid-cols-12 gap-2 items-center bg-white border border-gray-100 rounded-lg p-2">
                {/* Sub attribute key */}
                <div className="col-span-3">
                  {showAddPreset === `${group.id}-${si}` ? (
                    <div className="flex gap-1">
                      <input value={newPreset} onChange={e => setNewPreset(e.target.value)}
                        onKeyDown={e => { if (e.key === "Enter") { e.preventDefault(); handleAddPreset("", group.id, si); } }}
                        placeholder="New..." autoFocus
                        className="flex-1 border border-gray-200 rounded px-2 py-1.5 text-xs focus:outline-none w-0 min-w-0" />
                      <button type="button" onClick={() => handleAddPreset("", group.id, si)}
                        className="bg-[#2D2D2D] text-white text-[10px] px-2 rounded">OK</button>
                      <button type="button" onClick={() => { setShowAddPreset(null); setNewPreset(""); }}
                        className="text-gray-400 text-[10px]">✕</button>
                    </div>
                  ) : (
                    <div className="flex gap-1">
                      <select value={sub.attributeKey}
                        onChange={e => updateSubAttribute(group.id, si, "attributeKey", e.target.value, group)}
                        className="flex-1 border border-gray-200 rounded px-2 py-1.5 text-xs focus:outline-none focus:border-gray-400 bg-white w-0 min-w-0">
                        {presets.filter(p => p !== group.masterKey).map(p => (
                          <option key={p} value={p}>{p}</option>
                        ))}
                      </select>
                      <button type="button" onClick={() => setShowAddPreset(`${group.id}-${si}`)}
                        className="text-[10px] text-gray-400 hover:text-gray-600 border border-gray-200 rounded px-1.5 hover:bg-gray-50">
                        +
                      </button>
                    </div>
                  )}
                </div>

                {/* Sub attribute value */}
                <div className="col-span-2">
                  <input value={sub.value}
                    onChange={e => updateSubAttribute(group.id, si, "value", e.target.value, group)}
                    placeholder={sub.attributeKey === "Size" ? "e.g. M" : "Value"}
                    className="w-full border border-gray-200 rounded px-2 py-1.5 text-xs focus:outline-none focus:border-gray-400" />
                </div>

                {/* Stock counter */}
                <div className="col-span-2">
                  <div className="flex items-center border border-gray-200 rounded overflow-hidden">
                    <input type="number" min="0" value={sub.stock}
                      onChange={e => updateSubAttribute(group.id, si, "stock", parseInt(e.target.value) || 0, group)}
                      className="flex-1 px-2 py-1.5 text-xs focus:outline-none w-0 min-w-0" />
                    <div className="flex flex-col border-l border-gray-200">
                      <button type="button" onClick={() => updateStock(group.id, si, 1)}
                        className="px-1.5 py-0.5 hover:bg-gray-50 border-b border-gray-200">
                        <ChevronUp size={9} />
                      </button>
                      <button type="button" onClick={() => updateStock(group.id, si, -1)}
                        className="px-1.5 py-0.5 hover:bg-gray-50">
                        <ChevronDown size={9} />
                      </button>
                    </div>
                  </div>
                </div>

                {/* Price override */}
                <div className="col-span-2">
                  <input type="number" min="0" step="0.01" value={sub.priceOverride}
                    onChange={e => updateSubAttribute(group.id, si, "priceOverride", e.target.value, group)}
                    placeholder={group.groupPrice || "Inherit"}
                    className="w-full border border-gray-200 rounded px-2 py-1.5 text-xs focus:outline-none focus:border-gray-400" />
                </div>

                {/* SKU */}
                <div className="col-span-2">
                  <input value={sub.sku}
                    onChange={e => updateSubAttribute(group.id, si, "sku", e.target.value.toUpperCase(), group)}
                    placeholder="Auto"
                    className="w-full border border-gray-200 rounded px-2 py-1.5 text-xs focus:outline-none focus:border-gray-400 font-mono" />
                </div>

                {/* Remove */}
                <div className="col-span-1 flex justify-center">
                  {group.subAttributes.length > 1 && (
                    <button type="button" onClick={() => removeSubAttribute(group.id, si)}
                      className="text-red-400 hover:text-red-600 transition-colors">
                      <Trash2 size={12} />
                    </button>
                  )}
                </div>
              </div>
            ))}

            <button type="button" onClick={() => addSubAttribute(group.id, group.masterKey)}
              className="flex items-center gap-1.5 text-xs font-medium text-gray-500 hover:text-gray-700 border border-dashed border-gray-300 rounded-lg px-3 py-2 hover:border-gray-400 transition-colors w-full justify-center">
              <Plus size={11} /> Add Sub-Attribute
            </button>
          </div>
        </div>
      ))}

      <button type="button" onClick={addGroup}
        className="flex items-center gap-2 text-sm font-medium text-gray-600 border border-gray-200 px-4 py-2.5 rounded-lg hover:bg-gray-50 transition-colors">
        <Plus size={14} /> Add Variant Group
      </button>
    </div>
  );
}