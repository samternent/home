export type RuntimeSurfaceDefinition = {
  id: string;
  label: string;
  routeSegment: string;
};

export type RuntimeInternalAppDefinition = {
  id: string;
  label: string;
  defaultSurfaceId: string;
  surfaces: RuntimeSurfaceDefinition[];
};
