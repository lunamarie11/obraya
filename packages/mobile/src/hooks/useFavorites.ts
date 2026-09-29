import React from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useFocusEffect } from 'expo-router';
import { getStoredBuyer, type BuyerUser } from '../lib/buyer-auth';
import { getBuyerFavorites, addBuyerFavorite, removeBuyerFavorite, type BuyerFavoriteType } from '../lib/favorites';

// Espejo de packages/frontend/src/hooks/useFavorites.ts, adaptado a que
// getStoredBuyer() es async en mobile (AsyncStorage). Se refresca en cada
// focus de pantalla, igual que profile.tsx, para reflejar login/logout.
export function useFavorites() {
  const [buyer, setBuyer] = React.useState<BuyerUser | null | undefined>(undefined);
  const queryClient = useQueryClient();

  useFocusEffect(
    React.useCallback(() => {
      getStoredBuyer().then(setBuyer);
    }, []),
  );

  const { data: favorites = [] } = useQuery({
    queryKey: ['buyer-favorites'],
    queryFn: getBuyerFavorites,
    enabled: !!buyer,
  });

  const favoriteKeys = React.useMemo(
    () => new Set(favorites.map((f) => `${f.type}:${f.targetId}`)),
    [favorites],
  );

  function isFavorite(type: BuyerFavoriteType, targetId: string) {
    return favoriteKeys.has(`${type}:${targetId}`);
  }

  const addMutation = useMutation({
    mutationFn: ({ type, targetId }: { type: BuyerFavoriteType; targetId: string }) =>
      addBuyerFavorite(type, targetId),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['buyer-favorites'] }),
  });

  const removeMutation = useMutation({
    mutationFn: ({ type, targetId }: { type: BuyerFavoriteType; targetId: string }) =>
      removeBuyerFavorite(type, targetId),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['buyer-favorites'] }),
  });

  function toggle(type: BuyerFavoriteType, targetId: string) {
    if (!buyer) return;
    if (isFavorite(type, targetId)) {
      removeMutation.mutate({ type, targetId });
    } else {
      addMutation.mutate({ type, targetId });
    }
  }

  return { buyer, favorites, isFavorite, toggle };
}
