import "./App.css";
import { useState } from "react";
import { fetchData } from "./fetchData";
import MenuDisplay from "./components/MenuDisplay";
import MealPlanner from "./components/MealPlanner";
import LandingPage from "./components/LandingPage";
import type { MenuResponse } from "./types/Menu";
import { Toaster } from 'react-hot-toast';

type ViewMode = "landing" | "menu" | "planner";

function App() {
  const [viewMode, setViewMode] = useState<ViewMode>("landing");
  const [data, setData] = useState<MenuResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showMealMenu, setShowMealMenu] = useState(false);
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());

  const handleFetch = async (menuItem: string, date: Date = selectedDate) => {
    setLoading(true);
    setError(null);
    setData(null);
    setShowMealMenu(false);

    try {
      // Use the provided date
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const day = String(date.getDate()).padStart(2, '0');
      const localDate = `${year}-${month}-${day}`;
      
      const result = (await fetchData(localDate, menuItem)) as MenuResponse;
      setData(result);
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Unknown error";
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  const handleDateChange = (newDate: Date) => {
    setSelectedDate(newDate);
    // If we have data loaded, refetch with the new date
    if (data?.period?.name) {
      handleFetch(data.period.name.toLowerCase(), newDate);
    }
  };

  if (viewMode === "landing") {
    return <LandingPage onGetStarted={() => setViewMode("menu")} />;
  }

  if (viewMode === "planner") {
    return <MealPlanner onBack={() => setViewMode("menu")} />;
  }

  return (
    <div className="min-h-screen w-full bg-gradient-to-br from-gray-900 via-gray-800 to-black flex flex-col">
      <Toaster
        position="top-center"
        toastOptions={{
          duration: 3000,
          style: {
            background: 'rgba(31, 41, 55, 0.95)',
            color: '#fff',
            border: '1px solid rgba(255, 255, 255, 0.2)',
            borderRadius: '12px',
            backdropFilter: 'blur(12px)',
          },
          success: {
            iconTheme: {
              primary: '#10b981',
              secondary: '#fff',
            },
          },
          error: {
            iconTheme: {
              primary: '#ef4444',
              secondary: '#fff',
            },
          },
        }}
      />
      {/* Integrated Navigation */}
      <div className="w-full">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-6 lg:py-8">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-6 mb-4 sm:mb-6">
            <button
              onClick={() => setViewMode("landing")}
              className="text-xl sm:text-2xl lg:text-3xl font-bold text-white hover:text-gray-300 transition-colors text-center sm:text-left"
            >
              LSU Dining Menu
            </button>

            <div className="flex flex-col sm:flex-row items-center gap-2 sm:gap-3">
              {/* View mode toggle */}
              <div className="flex w-full sm:w-auto bg-white/5 backdrop-blur-sm rounded-lg overflow-hidden border border-white/10">
                <button
                  onClick={() => setViewMode("menu")}
                  className={`flex-1 sm:flex-none px-4 sm:px-6 py-2 sm:py-2.5 transition-all font-semibold text-sm ${
                    viewMode === "menu"
                      ? "bg-white/10 text-white"
                      : "text-gray-400 hover:text-gray-300"
                  }`}
                >
                  Menu
                </button>
                <button
                  onClick={() => setViewMode("planner")}
                  className={`flex-1 sm:flex-none px-4 sm:px-6 py-2 sm:py-2.5 transition-all font-semibold text-sm ${
                    viewMode === "planner"
                      ? "bg-white/10 text-white"
                      : "text-gray-400 hover:text-gray-300"
                  }`}
                >
                  Planner
                </button>
              </div>

              {/* Meal buttons - only show when in menu mode */}
              {viewMode === "menu" && (
                <div className="flex w-full sm:w-auto justify-center gap-2">
                  {["breakfast", "lunch", "dinner"].map((meal) => (
                    <button
                      key={meal}
                      onClick={() => handleFetch(meal)}
                      disabled={loading}
                      className={`
                        flex-1 sm:flex-none px-3 sm:px-5 py-2 sm:py-2.5 rounded-lg transition-all font-semibold capitalize text-xs sm:text-sm
                        ${loading ? "opacity-50 cursor-not-allowed" : ""}
                        ${
                          data?.period?.name?.toLowerCase() === meal
                            ? "bg-white/10 text-white border border-white/20"
                            : "bg-white/5 text-gray-400 border border-white/10 hover:bg-white/10 hover:text-gray-300 active:scale-95"
                        }
                      `}
                    >
                      {meal}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Content area */}
      <div className="flex-1 flex flex-col">
        {/* Error/Unavailable message */}
        {error && (
          <div className="flex-1 flex items-center justify-center px-4">
            <div className="text-center max-w-2xl">
              <div className="bg-white/5 backdrop-blur-sm rounded-2xl w-20 h-20 sm:w-24 sm:h-24 mx-auto mb-6 flex items-center justify-center border border-white/10">
                <svg className="w-10 h-10 sm:w-12 sm:h-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
              </div>
              <h3 className="text-3xl sm:text-4xl font-bold text-white mb-4">Menu Not Available</h3>
              <p className="text-lg text-gray-300 mb-6">
                {error.includes("not found") 
                  ? "The menu for this date and meal period isn't available yet. Try selecting a different date or meal."
                  : "We couldn't load the menu at this time. Please try again later."}
              </p>
              <div className="flex flex-col sm:flex-row gap-3 justify-center">
                <button
                  onClick={() => {
                    setError(null);
                    setSelectedDate(new Date());
                  }}
                  className="px-6 py-3 bg-white/10 hover:bg-white/15 text-white font-semibold rounded-xl border border-white/20 transition-all duration-300 hover:scale-105"
                >
                  Back to Today
                </button>
                <button
                  onClick={() => setShowMealMenu(true)}
                  className="px-6 py-3 bg-white text-gray-900 font-semibold rounded-xl hover:bg-gray-100 transition-all duration-300 hover:scale-105"
                >
                  Try Another Meal
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Loading state */}
        {loading && (
          <div className="flex-1 w-full">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-12">
              {/* Header Skeleton */}
              <div className="w-full relative overflow-hidden mb-12">
                <div className="relative pt-6 sm:pt-8 pb-12 sm:pb-16">
                  <div className="flex items-center justify-between mb-8 sm:mb-10">
                    <div className="h-10 w-32 bg-white/10 rounded-full animate-pulse"></div>
                    <div className="h-10 w-48 bg-white/10 rounded-lg animate-pulse"></div>
                  </div>
                  <div className="space-y-4">
                    <div className="h-20 w-3/4 bg-white/10 rounded-2xl animate-pulse"></div>
                    <div className="h-6 w-64 bg-white/10 rounded-lg animate-pulse"></div>
                  </div>
                </div>
              </div>

              {/* Filter Skeleton */}
              <div className="mb-6">
                <div className="bg-gradient-to-r from-gray-800/70 to-gray-900/70 backdrop-blur-lg border border-white/10 rounded-2xl p-4">
                  <div className="h-6 w-24 bg-white/10 rounded animate-pulse mb-3"></div>
                  <div className="flex gap-2">
                    {[1, 2, 3, 4].map((i) => (
                      <div key={i} className="h-10 w-32 bg-white/10 rounded-lg animate-pulse"></div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Navigation Skeleton */}
              <div className="mb-8">
                <div className="bg-gradient-to-r from-gray-800/70 to-gray-900/70 backdrop-blur-lg border border-white/10 rounded-2xl p-4">
                  <div className="h-6 w-32 bg-white/10 rounded animate-pulse mb-3"></div>
                  <div className="flex flex-wrap gap-2">
                    {[1, 2, 3, 4, 5].map((i) => (
                      <div key={i} className="h-10 w-24 bg-white/10 rounded-lg animate-pulse"></div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Category Sections Skeleton */}
              {[1, 2].map((section) => (
                <div key={section} className="mb-16">
                  {/* Category Header Skeleton */}
                  <div className="bg-gradient-to-br from-white/10 to-white/5 backdrop-blur-sm border border-white/20 rounded-2xl p-6 sm:p-8 mb-8">
                    <div className="h-12 w-64 bg-white/10 rounded-xl animate-pulse mb-4"></div>
                    <div className="h-6 w-96 bg-white/10 rounded-lg animate-pulse"></div>
                  </div>

                  {/* Menu Items Grid Skeleton */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5 sm:gap-6">
                    {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
                      <div
                        key={i}
                        className="bg-gradient-to-br from-white/10 to-white/5 backdrop-blur-md rounded-2xl border border-white/20 p-6 space-y-4 animate-pulse"
                        style={{ animationDelay: `${i * 50}ms` }}
                      >
                        {/* Title and calories */}
                        <div className="flex justify-between items-start gap-4">
                          <div className="flex-1 space-y-2">
                            <div className="h-5 bg-white/10 rounded w-3/4"></div>
                            <div className="h-5 bg-white/10 rounded w-1/2"></div>
                          </div>
                          <div className="space-y-1">
                            <div className="h-8 w-16 bg-white/10 rounded"></div>
                            <div className="h-3 w-16 bg-white/10 rounded"></div>
                          </div>
                        </div>

                        {/* Badges */}
                        <div className="flex gap-2">
                          <div className="h-7 w-20 bg-white/10 rounded-lg"></div>
                        </div>

                        {/* Macros */}
                        <div className="space-y-3 pt-4 border-t border-white/20">
                          {[1, 2, 3].map((macro) => (
                            <div key={macro} className="space-y-1">
                              <div className="flex justify-between">
                                <div className="h-3 w-16 bg-white/10 rounded"></div>
                                <div className="h-3 w-12 bg-white/10 rounded"></div>
                              </div>
                              <div className="h-1.5 bg-white/10 rounded-full"></div>
                            </div>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Menu Data */}
        {data && !loading && (
          <div className="flex-1 w-full">
            <MenuDisplay data={data} selectedDate={selectedDate} onDateChange={handleDateChange} />
          </div>
        )}

        {/* Empty state when no data and not loading */}
        {!data && !loading && !error && (
          <div className="flex-1 flex items-center justify-center px-4">
            <div className="text-center max-w-md">
              <button
                onClick={() => setShowMealMenu(true)}
                className="w-20 h-20 bg-white/5 rounded-2xl flex items-center justify-center mx-auto mb-6 border border-white/10 hover:bg-white/10 hover:border-white/20 transition-all duration-300 hover:scale-110 active:scale-95 cursor-pointer"
              >
                <svg className="w-10 h-10 text-gray-400 group-hover:text-white transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                </svg>
              </button>
              <h3 className="text-2xl font-bold text-white mb-2">Select a Meal</h3>
              <p className="text-gray-400 text-lg">Choose breakfast, lunch, or dinner to view today's menu</p>
            </div>
          </div>
        )}

        {/* Modal for meal selection */}
        {showMealMenu && (
          <div 
            className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 animate-in fade-in duration-300"
            onClick={() => setShowMealMenu(false)}
          >
            <div 
              className="bg-gradient-to-br from-gray-800 to-gray-900 border border-white/20 rounded-2xl p-8 max-w-md w-full mx-4 shadow-2xl animate-in zoom-in duration-300"
              onClick={(e) => e.stopPropagation()}
            >
              <h2 className="text-3xl font-bold text-white mb-2 text-center">Select a Meal</h2>
              <p className="text-gray-400 text-center mb-6">Choose which meal you'd like to view</p>
              
              <div className="space-y-3">
                {["breakfast", "lunch", "dinner"].map((meal, index) => (
                  <button
                    key={meal}
                    onClick={() => handleFetch(meal)}
                    className="w-full px-6 py-4 bg-white/5 hover:bg-white/10 text-white font-semibold capitalize text-lg rounded-xl border border-white/10 hover:border-white/30 transition-all duration-300 hover:scale-105 active:scale-95 flex items-center justify-between group animate-in slide-in-from-bottom duration-300"
                    style={{ animationDelay: `${index * 100}ms` }}
                  >
                    <span>{meal}</span>
                    <svg className="w-5 h-5 opacity-0 group-hover:opacity-100 transition-all duration-200 group-hover:translate-x-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </button>
                ))}
              </div>
              
              <button
                onClick={() => setShowMealMenu(false)}
                className="mt-6 w-full px-6 py-3 text-gray-400 hover:text-white font-semibold rounded-xl hover:bg-white/5 transition-all duration-200"
              >
                Cancel
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default App;
