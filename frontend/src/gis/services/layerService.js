export const setLayerVisibility = (layers, layerId, visible) => ({
  ...layers,
  [layerId]: visible,
});
