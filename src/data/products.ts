import type { Category, Product } from "@/lib/types";

export const CATEGORY_LABELS: Record<Category, string> = {
  audio: "音訊",
  wearable: "穿戴裝置",
  accessory: "配件",
  peripheral: "電腦周邊",
};

export const PRODUCTS: readonly Product[] = [
  { id: 1, name: "無線藍牙耳機", price: 2999, category: "audio", emoji: "🎧", description: "主動降噪，續航 30 小時" },
  { id: 2, name: "智慧手錶", price: 8999, category: "wearable", emoji: "⌚", description: "心率、血氧與睡眠追蹤" },
  { id: 3, name: "便攜式充電器", price: 1299, category: "accessory", emoji: "🔋", description: "10000mAh，支援快充" },
  { id: 4, name: "無線滑鼠", price: 899, category: "peripheral", emoji: "🖱️", description: "靜音按鍵，藍牙雙模" },
  { id: 5, name: "機械鍵盤", price: 3999, category: "peripheral", emoji: "⌨️", description: "熱插拔軸體，RGB 背光" },
  { id: 6, name: "網路攝影機", price: 2199, category: "peripheral", emoji: "📷", description: "1080p 60fps，自動對焦" },
  { id: 7, name: "USB隨身碟", price: 599, category: "accessory", emoji: "💾", description: "128GB，USB 3.2" },
  { id: 8, name: "桌面擴音器", price: 1599, category: "audio", emoji: "🔊", description: "2.0 聲道，藍牙 5.3" },
];
