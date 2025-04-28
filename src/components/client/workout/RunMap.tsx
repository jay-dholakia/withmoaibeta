
import React, { useEffect, useRef } from 'react';
import { RunLocation } from '@/services/run-tracking-service';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';

// Use the Mapbox token from supabase client
mapboxgl.accessToken = 'pk.eyJ1Ijoid2l0aG1vYWkiLCJhIjoiY205dXVub3N6MGViejJrcTEyZTR3d21jcSJ9.yn3olASbo2JjtdDHX3mQTQ';

interface RunMapProps {
  locations: RunLocation[];
  height?: string;
  width?: string;
  interactive?: boolean;
}

const RunMap: React.FC<RunMapProps> = ({
  locations,
  height = '300px',
  width = '100%',
  interactive = true
}) => {
  const mapContainer = useRef<HTMLDivElement | null>(null);
  const map = useRef<mapboxgl.Map | null>(null);

  useEffect(() => {
    if (!mapContainer.current || locations.length < 2) return;

    const initializeMap = () => {
      // Get start and end points
      const firstPoint = locations[0];
      const lastPoint = locations[locations.length - 1];
      
      // Get center point to initialize the map
      const centerLat = (firstPoint.latitude + lastPoint.latitude) / 2;
      const centerLng = (firstPoint.longitude + lastPoint.longitude) / 2;
      
      // Create map instance
      map.current = new mapboxgl.Map({
        container: mapContainer.current!,
        style: 'mapbox://styles/mapbox/streets-v11',
        center: [centerLng, centerLat],
        zoom: 13,
        attributionControl: false,
        interactive: interactive,
      });
      
      // If interactive, add navigation controls
      if (interactive) {
        map.current.addControl(
          new mapboxgl.NavigationControl({ showCompass: false }),
          'top-right'
        );
      }
      
      // Add route when map is loaded
      map.current.on('load', () => {
        addRunRoute();
      });
    };
    
    const addRunRoute = () => {
      if (!map.current) return;
      
      // Create GeoJSON for the route
      const geojson = {
        type: 'Feature',
        properties: {},
        geometry: {
          type: 'LineString',
          coordinates: locations.map(point => [point.longitude, point.latitude])
        }
      } as GeoJSON.Feature<GeoJSON.LineString>;
      
      // Calculate bounds to fit all points
      const bounds = new mapboxgl.LngLatBounds();
      locations.forEach(point => {
        bounds.extend([point.longitude, point.latitude]);
      });
      
      // Add some padding to the bounds
      map.current.fitBounds(bounds, {
        padding: { top: 40, bottom: 40, left: 40, right: 40 },
        maxZoom: 15
      });
      
      // Add the route line
      map.current.addSource('route', {
        type: 'geojson',
        data: geojson
      });
      
      map.current.addLayer({
        id: 'route',
        type: 'line',
        source: 'route',
        layout: {
          'line-join': 'round',
          'line-cap': 'round'
        },
        paint: {
          'line-color': '#7E69AB', // Primary purple from the app's color palette
          'line-width': 4,
          'line-opacity': 0.8
        }
      });
      
      // Add start point marker
      const startEl = document.createElement('div');
      startEl.className = 'start-marker';
      startEl.style.backgroundColor = '#4caf50';
      startEl.style.width = '12px';
      startEl.style.height = '12px';
      startEl.style.borderRadius = '50%';
      startEl.style.border = '2px solid white';
      
      new mapboxgl.Marker(startEl)
        .setLngLat([firstPoint.longitude, firstPoint.latitude])
        .addTo(map.current);
      
      // Add end point marker
      const endEl = document.createElement('div');
      endEl.className = 'end-marker';
      endEl.style.backgroundColor = '#f44336';
      endEl.style.width = '12px';
      endEl.style.height = '12px';
      endEl.style.borderRadius = '50%';
      endEl.style.border = '2px solid white';
      
      new mapboxgl.Marker(endEl)
        .setLngLat([lastPoint.longitude, lastPoint.latitude])
        .addTo(map.current);
    };
    
    initializeMap();
    
    return () => {
      if (map.current) {
        map.current.remove();
        map.current = null;
      }
    };
  }, [locations, interactive]);

  return (
    <div 
      ref={mapContainer} 
      style={{ 
        height: height,
        width: width,
        borderRadius: '8px',
        overflow: 'hidden'
      }}
      className="shadow-sm"
    />
  );
};

export default RunMap;
