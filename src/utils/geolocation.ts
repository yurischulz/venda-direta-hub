// Função para calcular distância entre duas coordenadas usando Haversine
export const calculateDistance = (
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number => {
  const R = 6371; // Raio da Terra em km
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c * 1000; // Retorna distância em metros
};

const toRad = (value: number): number => {
  return (value * Math.PI) / 180;
};

// Função para verificar se o usuário está próximo a alguma afiliação
export const findNearbyAffiliations = (
  userLat: number,
  userLon: number,
  affiliations: Array<{ id: string; name: string; latitude: number; longitude: number }>,
  maxDistance: number = 500 // 500 metros por padrão
): Array<{ id: string; name: string; distance: number }> => {
  return affiliations
    .filter(affiliation => affiliation.latitude && affiliation.longitude)
    .map(affiliation => ({
      id: affiliation.id,
      name: affiliation.name,
      distance: calculateDistance(
        userLat,
        userLon,
        affiliation.latitude,
        affiliation.longitude
      )
    }))
    .filter(item => item.distance <= maxDistance)
    .sort((a, b) => a.distance - b.distance);
};