export const formatGcContent = (gcContent) => (gcContent ? Number((gcContent * 100).toFixed(0)) : '');
export const formatMeltingTemperature = (meltingTemperature) => (meltingTemperature ? Number(meltingTemperature.toFixed(1)) : '');
export const formatDeltaG = (deltaG) => (deltaG ? Number(deltaG.toFixed(0)) : '');
