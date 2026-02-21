import { collection, onSnapshot } from 'firebase/firestore';
import { db } from '../firebase';
import type { StockCompany, StockHolding } from '../types/domain';

const fallbackStocks: StockCompany[] = [
  { id: 'VALK', name: 'VALK-YRIE', ticker: '$VALK', price: 980, trend: 'volatile', availableShares: 100 },
  { id: 'GLYPH', name: 'MIND-GLYPH', ticker: '$GLYPH', price: 75, trend: 'up', availableShares: 100 },
  { id: 'ZERO', name: 'ZERO-GEN', ticker: '$ZERO', price: 220, trend: 'flat', availableShares: 100 },
  { id: 'PULSE', name: 'NEON-PULSE', ticker: '$PULSE', price: 340, trend: 'up', availableShares: 100 },
  { id: 'TITAN', name: 'TITAN-Core', ticker: '$TITAN', price: 1600, trend: 'down', availableShares: 100 },
];

export function watchStockMarket(onData: (stocks: StockCompany[]) => void) {
  return onSnapshot(
    collection(db, 'stocks'),
    (snapshot) => {
      if (snapshot.empty) {
        onData(fallbackStocks);
        return;
      }

      onData(snapshot.docs.map((doc) => ({ id: doc.id, ...(doc.data() as Omit<StockCompany, 'id'>) })));
    },
    () => onData(fallbackStocks),
  );
}

export function watchPortfolio(uid: string, onData: (holdings: StockHolding[]) => void) {
  return onSnapshot(
    collection(db, 'players', uid, 'portfolio'),
    (snapshot) => onData(snapshot.docs.map((doc) => doc.data() as StockHolding)),
    () => onData([]),
  );
}
