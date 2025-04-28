
import React, { useRef, useEffect, useState } from 'react';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';
import '@/styles/mapbox.css';
import { getRunLocations, RunLocation } from '@/services/run-tracking-service';

interface RunMapProps {
  runId: string;
  className?: string;
  height?: string | number;
  width?: string | number;
}

const RunMap: React.FC<RunMapProps> = ({ 
  runId, 
  className = '',
  height = 200,
  width = '100%'
}) => {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<mapboxgl.Map | null>(null);
  const [locations, setLocations] = useState<RunLocation[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Load run data
  useEffect(() => {
    const loadRunData = async () => {
      try {
        setLoading(true);
        const runLocations = await getRunLocations(runId);
        
        setLocations(runLocations);
        setLoading(false);
      } catch (err) {
        console.error('Error fetching run data:', err);
        setError('Failed to load run data');
        setLoading(false);
      }
    };

    loadRunData();
  }, [runId]);

  // Initialize map when locations are loaded
  useEffect(() => {
    if (!mapContainer.current || locations.length === 0) return;
    
    // Free public token - restricted to this domain
    mapboxgl.accessToken = 'pk.eyJ1IjoibG92YWJsZWFpIiwiYSI6ImNsdHczYWs5YTA5cWoycW85d244bHUzN3IifQ.a6E6kcPAVJ-Gj816tHqhEg';
    
    // Create the map
    map.current = new mapboxgl.Map({
      container: mapContainer.current,
      style: 'mapbox://styles/mapbox/streets-v11',
      interactive: true,
      attributionControl: false,
    });

    // Create coordinates array from locations
    const coordinates = locations.map(loc => [loc.longitude, loc.latitude]);
    
    // Wait for the map to load
    map.current.on('load', () => {
      if (!map.current) return;

      // Add the route line
      map.current.addSource('route', {
        type: 'geojson',
        data: {
          type: 'Feature',
          properties: {},
          geometry: {
            type: 'LineString',
            coordinates
          }
        }
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
          'line-color': '#3887be',
          'line-width': 5,
          'line-opacity': 0.75
        }
      });

      // Add start and end points if we have locations
      if (locations.length > 0) {
        const firstPoint = coordinates[0] as [number, number]; // Type assertion to ensure it's a tuple
        const lastPoint = coordinates[coordinates.length - 1] as [number, number]; // Type assertion to ensure it's a tuple
        
        // Add start marker
        const startMarker = document.createElement('div');
        startMarker.className = 'w-3 h-3 rounded-full bg-green-500 start-marker';
        
        new mapboxgl.Marker(startMarker)
          .setLngLat(firstPoint)
          .addTo(map.current);
        
        // Add end marker
        const endMarker = document.createElement('div');
        endMarker.className = 'w-3 h-3 rounded-full bg-red-500 end-marker';
        
        new mapboxgl.Marker(endMarker)
          .setLngLat(lastPoint)
          .addTo(map.current);
      }

      // Fit map to show the entire route with padding
      map.current.fitBounds(
        [coordinates[0] as [number, number], coordinates[coordinates.length - 1] as [number, number]], 
        { 
          padding: { top: 50, bottom: 50, left: 50, right: 50 }, 
          maxZoom: 16
        }
      );
    });

    // Clean up
    return () => {
      if (map.current) {
        map.current.remove();
        map.current = null;
      }
    };
  }, [locations]);

  if (loading) {
    return (
      <div 
        className={`flex items-center justify-center bg-gray-100 rounded ${className}`} 
        style={{ height, width }}
      >
        <p className="text-sm text-gray-500">Loading map...</p>
      </div>
    );
  }

  if (error || locations.length === 0) {
    return (
      <div 
        className={`flex items-center justify-center bg-gray-100 rounded ${className}`} 
        style={{ height, width }}
      >
        <p className="text-sm text-gray-500">
          {error || 'No route data available'}
        </p>
      </div>
    );
  }

  return (
    <div 
      ref={mapContainer} 
      className={`rounded-md overflow-hidden shadow-sm ${className}`}
      style={{ height, width }}
    />
  );
};

export default RunMap;
