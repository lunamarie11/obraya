'use client';

import React from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { getStoredBuyer } from '@/lib/buyer-auth';
import {
  getBuyerFavorites,
  addBuyerFavorite,
  removeBuyerFavorite,
  type BuyerFavoriteType,
} from '@/lib/favorites';

// Hook compartido para el corazón de favoritos en ProductCard/StoreCard y la
// página /favorites (backlog #4 marketplace-comprador.md). Sin sesión de
// Buyer, `isFavorite` siempre da false y `toggle` no hace nada silencioso —
// quien lo use debe resolver el redirect a /account si corresponde.
export function useFavorites() {
  const buyer = React.useMemo(() => getStoredBuyer(), []);
  const queryClient = useQueryClient();

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
