// src/types/changey-react-leaflet-markercluster.d.ts
declare module "@changey/react-leaflet-markercluster" {
  import { ReactNode } from "react";
  import { LayerGroup } from "leaflet";

  export interface MarkerClusterGroupProps {
    children?: ReactNode;
    chunkedLoading?: boolean;
    iconCreateFunction?: (cluster: any) => any;
    showCoverageOnHover?: boolean;
    zoomToBoundsOnClick?: boolean;
    spiderfyOnMaxZoom?: boolean;
    removeOutsideVisibleBounds?: boolean;
    animate?: boolean;
    animateAddingMarkers?: boolean;
    disableClusteringAtZoom?: number;
    maxClusterRadius?: number | ((zoom: number) => number);
    polygonOptions?: any;
    spiderfyDistanceMultiplier?: number;
    spiderLegPolylineOptions?: any;
    [key: string]: any;
  }

  export class MarkerClusterGroup extends LayerGroup {
    constructor(options?: MarkerClusterGroupProps);
  }

  export default MarkerClusterGroup;
}
