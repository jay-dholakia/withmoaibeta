
import { useLocation, Link } from "react-router-dom";
import { useEffect } from "react";
import { ArrowLeft, Home, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";

const NotFound = () => {
  const location = useLocation();

  useEffect(() => {
    console.error(
      "404 Error: User attempted to access non-existent route:",
      location.pathname
    );
  }, [location.pathname]);

  // Helper function to suggest possible routes
  const suggestRoute = (path: string) => {
    if (path.includes("profile-editor")) {
      return "/client-dashboard/settings/edit-profile";
    }
    if (path.includes("profile")) {
      return "/client-profile-builder";
    }
    if (path.includes("workout") || path.includes("/active/")) {
      return "/client-dashboard/workouts";
    }
    return null;
  };
  
  const suggestedRoute = suggestRoute(location.pathname);

  // Determine if this might be a workout not found issue
  const isWorkoutNotFound = location.pathname.includes("/workouts/active/") || 
                           location.pathname.includes("/workout/");

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
      <div className="bg-white p-8 rounded-lg shadow-md max-w-md w-full text-center">
        {isWorkoutNotFound ? (
          <>
            <div className="mx-auto h-16 w-16 flex items-center justify-center rounded-full bg-red-100 mb-4">
              <AlertCircle className="h-8 w-8 text-red-500" />
            </div>
            <h1 className="text-2xl font-bold text-gray-800 mb-4">Workout Not Found</h1>
            <p className="text-gray-600 mb-6">
              We couldn't find the workout you're looking for. It may have been deleted or you may not have access to it.
            </p>
          </>
        ) : (
          <>
            <h1 className="text-6xl font-bold text-red-500 mb-4">404</h1>
            <p className="text-xl font-medium text-gray-800 mb-2">Page Not Found</p>
            <p className="text-gray-600 mb-6">
              The page you're looking for doesn't exist: 
              <span className="font-mono bg-gray-100 px-1.5 py-0.5 rounded text-sm ml-1">
                {location.pathname}
              </span>
            </p>
          </>
        )}
        
        {suggestedRoute && (
          <div className="mb-6 p-4 bg-blue-50 rounded-md border border-blue-200">
            <p className="text-blue-800 mb-2">Did you mean to go here?</p>
            <Link 
              to={suggestedRoute} 
              className="inline-block text-blue-600 hover:text-blue-800 underline"
            >
              {suggestedRoute}
            </Link>
          </div>
        )}
        
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Button
            variant="outline"
            onClick={() => window.history.back()}
            className="flex items-center gap-2"
          >
            <ArrowLeft className="h-4 w-4" />
            Go Back
          </Button>
          
          <Link to={isWorkoutNotFound ? "/client-dashboard/workouts" : "/"}>
            <Button className="flex items-center gap-2 w-full">
              {isWorkoutNotFound ? (
                <>
                  <ArrowLeft className="h-4 w-4" />
                  Back to Workouts
                </>
              ) : (
                <>
                  <Home className="h-4 w-4" />
                  Return Home
                </>
              )}
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
};

export default NotFound;
