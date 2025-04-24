
import React, { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { saveRunLocation, getRunLocations, RunLocation } from '@/services/run-tracking-service';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import { Play, Square, AlertCircle } from 'lucide-react';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';

interface RunTrackingProps {
  runId: string;
  onRunComplete?: (summary: {
    distance: number;
    duration: number;
    pace: number;
  }) => void;
}

// Initialize Mapbox with your token
mapboxgl.accessToken = 'pk.eyJ1Ijoid2l0aG1vYWkiLCJhIjoiY205dXVub3N6MGViejJrcTEyZTR3d21jcSJ9.yn3olASbo2JjtdDHX3mQTQ';

const RunTracking: React.FC<RunTrackingProps> = ({ runId, onRunComplete }) => {
  const { user } = useAuth();
  const mapContainer = useRef<HTMLDivElement | null>(null);
  const map = useRef<mapboxgl.Map | null>(null);
  const watchId = useRef<number | null>(null);
  const trackingInterval = useRef<NodeJS.Timeout | null>(null);
  const [isTracking, setIsTracking] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [locationPoints, setLocationPoints] = useState<RunLocation[]>([]);
  const [startTime, setStartTime] = useState<Date | null>(null);
  const [currentTime, setCurrentTime] = useState<Date | null>(null);
  const [showSummary, setShowSummary] = useState(false);
  const [summary, setSummary] = useState({
    distance: 0,
    duration: 0,
    pace: 0
  });
  
  // Create the map when component mounts
  useEffect(() => {
    if (!mapContainer.current) return;
    
    try {
      map.current = new mapboxgl.Map({
        container: mapContainer.current,
        style: 'mapbox://styles/mapbox/streets-v12',
        zoom: 15,
        pitch: 0,
        attributionControl: false,
      });
      
      map.current.addControl(new mapboxgl.NavigationControl(), 'top-right');
      
      // Try to set initial location from user's position
      navigator.geolocation.getCurrentPosition(
        position => {
          if (map.current) {
            map.current.setCenter([position.coords.longitude, position.coords.latitude]);
          }
        },
        () => {
          // Default center if location access is denied
          if (map.current) {
            map.current.setCenter([-122.4194, 37.7749]); // San Francisco default
          }
        }
      );
      
      // Clean up on unmount
      return () => {
        map.current?.remove();
      };
    } catch (err) {
      console.error('Error initializing map:', err);
      setError('Could not initialize map. Please try again later.');
    }
  }, []);
  
  // Load existing run data when component mounts
  useEffect(() => {
    const loadExistingRunData = async () => {
      try {
        const points = await getRunLocations(runId);
        setLocationPoints(points);
        
        if (points.length > 0 && map.current) {
          // Update map with existing points
          updateRouteOnMap(points);
          
          // Center map on the most recent point
          const lastPoint = points[points.length - 1];
          map.current.setCenter([lastPoint.longitude, lastPoint.latitude]);
        }
      } catch (err) {
        console.error('Error loading run data:', err);
      }
    };
    
    loadExistingRunData();
  }, [runId]);
  
  // Update the route on the map when location points change
  useEffect(() => {
    if (locationPoints.length > 0 && map.current) {
      updateRouteOnMap(locationPoints);
    }
  }, [locationPoints]);
  
  // Timer effect for tracking duration
  useEffect(() => {
    let timer: NodeJS.Timeout | null = null;
    
    if (isTracking && startTime) {
      timer = setInterval(() => {
        setCurrentTime(new Date());
      }, 1000);
    }
    
    return () => {
      if (timer) clearInterval(timer);
    };
  }, [isTracking, startTime]);
  
  const startTracking = () => {
    if (!navigator.geolocation) {
      setError("Geolocation is not supported by your browser");
      toast.error("Geolocation is not supported by your browser");
      return;
    }
    
    if (!user?.id) {
      setError("You must be logged in to track your run");
      toast.error("You must be logged in to track your run");
      return;
    }
    
    try {
      // Start the watch position
      watchId.current = navigator.geolocation.watchPosition(
        handlePositionUpdate,
        handlePositionError,
        { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
      );
      
      // Set tracking interval to save location every 5 seconds
      trackingInterval.current = setInterval(saveCurrentPosition, 5000);
      
      setIsTracking(true);
      setStartTime(new Date());
      setCurrentTime(new Date());
      setShowSummary(false);
      toast.success("Location tracking started");
    } catch (err) {
      console.error('Error starting tracking:', err);
      setError("Could not start location tracking");
      toast.error("Could not start location tracking");
    }
  };
  
  const stopTracking = () => {
    if (watchId.current !== null) {
      navigator.geolocation.clearWatch(watchId.current);
      watchId.current = null;
    }
    
    if (trackingInterval.current !== null) {
      clearInterval(trackingInterval.current);
      trackingInterval.current = null;
    }
    
    setIsTracking(false);
    
    // Calculate summary data
    if (locationPoints.length > 0 && startTime && currentTime) {
      const totalDistance = calculateTotalDistance(locationPoints);
      const durationMs = currentTime.getTime() - startTime.getTime();
      const durationMinutes = durationMs / 60000;
      let pace = 0;
      
      if (totalDistance > 0) {
        // Pace in minutes per mile
        pace = durationMinutes / totalDistance;
      }
      
      const runSummary = {
        distance: totalDistance,
        duration: durationMinutes,
        pace: pace
      };
      
      setSummary(runSummary);
      setShowSummary(true);
      
      if (onRunComplete) {
        onRunComplete(runSummary);
      }
    }
    
    toast.success("Location tracking stopped");
  };
  
  const handlePositionUpdate = (position: GeolocationPosition) => {
    const newPoint: RunLocation = {
      run_id: runId,
      latitude: position.coords.latitude,
      longitude: position.coords.longitude,
      timestamp: new Date().toISOString()
    };
    
    // Add to local state
    setLocationPoints(prev => [...prev, newPoint]);
    
    // Center map on new position
    if (map.current) {
      map.current.setCenter([newPoint.longitude, newPoint.latitude]);
    }
    
    setError(null);
  };
  
  const saveCurrentPosition = async () => {
    if (!isTracking || !user?.id) return;
    
    navigator.geolocation.getCurrentPosition(
      async (position) => {
        try {
          const locationData = {
            run_id: runId,
            user_id: user.id,
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
            timestamp: new Date().toISOString()
          };
          
          await saveRunLocation(locationData);
        } catch (err) {
          console.error('Error saving location:', err);
        }
      },
      (err) => {
        console.error('Error getting position for saving:', err);
      },
      { enableHighAccuracy: true, timeout: 5000, maximumAge: 0 }
    );
  };
  
  const handlePositionError = (err: GeolocationPositionError) => {
    console.error('Error getting location:', err);
    let errorMessage = "Error getting your location";
    
    switch (err.code) {
      case 1:
        errorMessage = "Location access denied. Please enable location permissions.";
        break;
      case 2:
        errorMessage = "Location unavailable. Please try again.";
        break;
      case 3:
        errorMessage = "Location request timed out. Please try again.";
        break;
    }
    
    setError(errorMessage);
    toast.error(errorMessage);
  };
  
  const updateRouteOnMap = (points: RunLocation[]) => {
    if (!map.current || points.length < 2) return;
    
    // Check if map is loaded
    if (!map.current.loaded()) {
      map.current.once('load', () => updateRouteOnMap(points));
      return;
    }
    
    // Convert points to GeoJSON LineString
    const geojson = {
      type: 'Feature',
      properties: {},
      geometry: {
        type: 'LineString',
        coordinates: points.map(point => [point.longitude, point.latitude])
      }
    } as GeoJSON.Feature<GeoJSON.LineString>;
    
    // Remove existing layer and source if they exist
    if (map.current.getLayer('route')) {
      map.current.removeLayer('route');
    }
    if (map.current.getSource('route')) {
      map.current.removeSource('route');
    }
    
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
        'line-color': '#3887be',
        'line-width': 5,
        'line-opacity': 0.75
      }
    });
    
    // Add start and end markers
    addStartEndMarkers(points);
  };
  
  const addStartEndMarkers = (points: RunLocation[]) => {
    if (!map.current || points.length < 2) return;
    
    const startPoint = points[0];
    const endPoint = points[points.length - 1];
    
    // Remove existing markers
    const markers = document.querySelectorAll('.mapboxgl-marker');
    markers.forEach(marker => marker.remove());
    
    // Add start marker (green)
    const startMarkerEl = document.createElement('div');
    startMarkerEl.className = 'mapboxgl-marker start-marker';
    startMarkerEl.style.backgroundColor = '#4caf50';
    startMarkerEl.style.width = '15px';
    startMarkerEl.style.height = '15px';
    startMarkerEl.style.borderRadius = '50%';
    startMarkerEl.style.border = '2px solid white';
    
    new mapboxgl.Marker(startMarkerEl)
      .setLngLat([startPoint.longitude, startPoint.latitude])
      .addTo(map.current);
    
    // Add end marker (red)
    if (!isTracking) {
      const endMarkerEl = document.createElement('div');
      endMarkerEl.className = 'mapboxgl-marker end-marker';
      endMarkerEl.style.backgroundColor = '#f44336';
      endMarkerEl.style.width = '15px';
      endMarkerEl.style.height = '15px';
      endMarkerEl.style.borderRadius = '50%';
      endMarkerEl.style.border = '2px solid white';
      
      new mapboxgl.Marker(endMarkerEl)
        .setLngLat([endPoint.longitude, endPoint.latitude])
        .addTo(map.current);
    }
  };
  
  const calculateTotalDistance = (points: RunLocation[]): number => {
    if (points.length < 2) return 0;
    
    let totalMiles = 0;
    
    for (let i = 1; i < points.length; i++) {
      const prevPoint = points[i - 1];
      const currentPoint = points[i];
      
      totalMiles += getDistanceInMiles(
        prevPoint.latitude,
        prevPoint.longitude,
        currentPoint.latitude,
        currentPoint.longitude
      );
    }
    
    return parseFloat(totalMiles.toFixed(2));
  };
  
  const getDistanceInMiles = (lat1: number, lon1: number, lat2: number, lon2: number): number => {
    // Haversine formula to calculate distance between two points
    const R = 3959; // Radius of the earth in miles
    const dLat = deg2rad(lat2 - lat1);
    const dLon = deg2rad(lon2 - lon1);
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(deg2rad(lat1)) * Math.cos(deg2rad(lat2)) *
      Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  };
  
  const deg2rad = (deg: number): number => {
    return deg * (Math.PI / 180);
  };
  
  const formatDuration = (minutes: number): string => {
    const hours = Math.floor(minutes / 60);
    const mins = Math.floor(minutes % 60);
    const secs = Math.floor((minutes * 60) % 60);
    
    return `${hours.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };
  
  const formatPace = (paceMinutesPerMile: number): string => {
    if (!isFinite(paceMinutesPerMile) || paceMinutesPerMile === 0) {
      return '00:00';
    }
    
    const minutes = Math.floor(paceMinutesPerMile);
    const seconds = Math.floor((paceMinutesPerMile - minutes) * 60);
    
    return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  };
  
  return (
    <div className="space-y-4 w-full">
      {/* Map container */}
      <div 
        ref={mapContainer} 
        className="w-full h-[300px] rounded-lg shadow-md relative"
      >
        {error && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/10 backdrop-blur-sm z-10">
            <div className="bg-white p-4 rounded-lg shadow-lg max-w-[80%] text-center">
              <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-2" />
              <p className="text-sm font-medium">{error}</p>
              <Button 
                variant="outline" 
                className="mt-3" 
                size="sm"
                onClick={() => setError(null)}
              >
                Dismiss
              </Button>
            </div>
          </div>
        )}
      </div>
      
      {/* Tracking controls */}
      <div className="flex justify-center">
        {!isTracking ? (
          <Button 
            onClick={startTracking} 
            className="px-8 bg-green-600 hover:bg-green-700 text-white font-semibold"
            disabled={!!error}
          >
            <Play className="h-4 w-4 mr-2" />
            Start Run
          </Button>
        ) : (
          <Button 
            onClick={stopTracking} 
            className="px-8 bg-red-600 hover:bg-red-700 text-white font-semibold"
          >
            <Square className="h-4 w-4 mr-2" />
            End Run
          </Button>
        )}
      </div>
      
      {/* Live stats */}
      {isTracking && startTime && currentTime && (
        <div className="grid grid-cols-3 gap-2 mt-4 text-center">
          <div className="p-2 bg-slate-100 rounded-lg">
            <p className="text-xs font-medium text-slate-500">Distance</p>
            <p className="text-lg font-bold">{calculateTotalDistance(locationPoints)} mi</p>
          </div>
          <div className="p-2 bg-slate-100 rounded-lg">
            <p className="text-xs font-medium text-slate-500">Duration</p>
            <p className="text-lg font-bold">
              {formatDuration((currentTime.getTime() - startTime.getTime()) / 60000)}
            </p>
          </div>
          <div className="p-2 bg-slate-100 rounded-lg">
            <p className="text-xs font-medium text-slate-500">Pace</p>
            <p className="text-lg font-bold">
              {calculateTotalDistance(locationPoints) > 0 
                ? formatPace((currentTime.getTime() - startTime.getTime()) / 60000 / calculateTotalDistance(locationPoints))
                : '00:00'} /mi
            </p>
          </div>
        </div>
      )}
      
      {/* Run summary */}
      {showSummary && (
        <div className="mt-4 p-4 bg-slate-100 rounded-lg">
          <h3 className="text-lg font-semibold mb-2">Run Summary</h3>
          <div className="grid grid-cols-3 gap-2 text-center">
            <div>
              <p className="text-sm font-medium text-slate-500">Distance</p>
              <p className="text-lg font-bold">{summary.distance} mi</p>
            </div>
            <div>
              <p className="text-sm font-medium text-slate-500">Duration</p>
              <p className="text-lg font-bold">{formatDuration(summary.duration)}</p>
            </div>
            <div>
              <p className="text-sm font-medium text-slate-500">Avg. Pace</p>
              <p className="text-lg font-bold">{formatPace(summary.pace)} /mi</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default RunTracking;
