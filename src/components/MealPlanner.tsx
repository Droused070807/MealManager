import { useState, useMemo, useEffect, useRef } from "react";
import type { MenuResponse, MenuItem } from "../types/Menu";
import { Target, CheckCircle2, XCircle, Plus, Minus, Beef, TrendingUp, ArrowLeft, Flame, Droplet, Wheat, Candy, Sparkles, Lightbulb, Eye } from "lucide-react";
import confetti from 'canvas-confetti';
import toast from 'react-hot-toast';
import AnimatedCounter from './AnimatedCounter';

const PROTEIN_GOAL = 145;

function parseNutrientValue(value: string | number): number {
  const str = String(value).toLowerCase();
  if (str.includes("less than")) {
    const match = str.match(/less than\s*(\d+\.?\d*)/);
    if (match) return Number(match[1]);
  }
  const num = Number(str.replace(/[^\d.]/g, ""));
  return isNaN(num) ? 0 : num;
}

function getProtein(item: MenuItem): number {
  const protein = item.nutrients.find((n) => n.name.toLowerCase().includes("protein"));
  return protein ? parseNutrientValue(protein.value) : 0;
}

function getCarbs(item: MenuItem): number {
  const carbs = item.nutrients.find((n) => n.name.toLowerCase().includes("carb"));
  return carbs ? parseNutrientValue(carbs.value) : 0;
}

function getFat(item: MenuItem): number {
  const fat = item.nutrients.find((n) => n.name.toLowerCase().includes("fat") && !n.name.toLowerCase().includes("saturated"));
  return fat ? parseNutrientValue(fat.value) : 0;
}

function getSugar(item: MenuItem): number {
  const sugar = item.nutrients.find((n) => n.name.toLowerCase().includes("sugar"));
  return sugar ? parseNutrientValue(sugar.value) : 0;
}

interface SelectedItem {
  item: MenuItem;
  meal: "breakfast" | "lunch" | "dinner";
  quantity: number;
}

export default function MealPlanner({ onBack }: { onBack?: () => void }) {
  const [breakfastData, setBreakfastData] = useState<MenuResponse | null>(null);
  const [lunchData, setLunchData] = useState<MenuResponse | null>(null);
  const [dinnerData, setDinnerData] = useState<MenuResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedItems, setSelectedItems] = useState<SelectedItem[]>([]);
  const [activeMeal, setActiveMeal] = useState<"breakfast" | "lunch" | "dinner">("breakfast");
  const [showMealPlanModal, setShowMealPlanModal] = useState(false);
  const prevProteinGoalMet = useRef(false);

  const loadMenus = async () => {
    setLoading(true);
    setError(null);
    try {
      const { fetchData } = await import("../fetchData");
      const today = new Date();
      const year = today.getFullYear();
      const month = String(today.getMonth() + 1).padStart(2, '0');
      const day = String(today.getDate()).padStart(2, '0');
      const localDate = `${year}-${month}-${day}`;
      
      const [breakfast, lunch, dinner] = await Promise.all([
        fetchData(localDate, "breakfast") as Promise<MenuResponse>,
        fetchData(localDate, "lunch") as Promise<MenuResponse>,
        fetchData(localDate, "dinner") as Promise<MenuResponse>,
      ]);
      setBreakfastData(breakfast);
      setLunchData(lunch);
      setDinnerData(dinner);
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Failed to load menus";
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadMenus();
  }, []);

  const totalProtein = useMemo(() => {
    return selectedItems.reduce((sum, selected) => {
      return sum + getProtein(selected.item) * selected.quantity;
    }, 0);
  }, [selectedItems]);

  const totalCalories = useMemo(() => {
    return selectedItems.reduce((sum, selected) => {
      const calories = typeof selected.item.calories === 'number' ? selected.item.calories : parseInt(String(selected.item.calories)) || 0;
      return sum + calories * selected.quantity;
    }, 0);
  }, [selectedItems]);

  const totalCarbs = useMemo(() => {
    return selectedItems.reduce((sum, selected) => {
      return sum + getCarbs(selected.item) * selected.quantity;
    }, 0);
  }, [selectedItems]);

  const totalFat = useMemo(() => {
    return selectedItems.reduce((sum, selected) => {
      return sum + getFat(selected.item) * selected.quantity;
    }, 0);
  }, [selectedItems]);

  const totalSugar = useMemo(() => {
    return selectedItems.reduce((sum, selected) => {
      return sum + getSugar(selected.item) * selected.quantity;
    }, 0);
  }, [selectedItems]);

  // Group selected items by meal
  const itemsByMeal = useMemo(() => {
    const grouped = {
      breakfast: selectedItems.filter(s => s.meal === "breakfast"),
      lunch: selectedItems.filter(s => s.meal === "lunch"),
      dinner: selectedItems.filter(s => s.meal === "dinner"),
    };
    return grouped;
  }, [selectedItems]);
  const recommendations = useMemo(() => {
    const proteinNeeded = Math.max(0, PROTEIN_GOAL - totalProtein);
    const allAvailableItems: Array<{ item: MenuItem; meal: "breakfast" | "lunch" | "dinner" }> = [];
    
    // Collect all items from all meals
    if (breakfastData) {
      breakfastData.period.categories.forEach(cat => {
        cat.items.forEach(item => allAvailableItems.push({ item, meal: "breakfast" }));
      });
    }
    if (lunchData) {
      lunchData.period.categories.forEach(cat => {
        cat.items.forEach(item => allAvailableItems.push({ item, meal: "lunch" }));
      });
    }
    if (dinnerData) {
      dinnerData.period.categories.forEach(cat => {
        cat.items.forEach(item => allAvailableItems.push({ item, meal: "dinner" }));
      });
    }

    // Filter out already selected items
    const selectedIds = new Set(selectedItems.map(s => `${s.item.id}-${s.meal}`));
    const availableItems = allAvailableItems.filter(
      ({ item, meal }) => !selectedIds.has(`${item.id}-${meal}`)
    );

    if (proteinNeeded <= 0 || availableItems.length === 0) {
      return [];
    }

    // Find items that would help reach protein goal
    const scoredItems = availableItems.map(({ item, meal }) => {
      const protein = getProtein(item);
      const calories = typeof item.calories === 'number' ? item.calories : parseInt(String(item.calories)) || 0;
      const sugar = getSugar(item);
      
      // Score based on protein efficiency (protein per calorie) and low sugar
      const proteinEfficiency = calories > 0 ? protein / calories : 0;
      const sugarPenalty = sugar > 15 ? 0.5 : 1; // Penalize high sugar items
      const proteinScore = protein * proteinEfficiency * sugarPenalty;
      
      return {
        item,
        meal,
        protein,
        calories,
        score: proteinScore,
      };
    });

    // Sort by score and return top 3
    return scoredItems
      .sort((a, b) => b.score - a.score)
      .slice(0, 3);
  }, [totalProtein, breakfastData, lunchData, dinnerData, selectedItems]);

  const proteinProgress = Math.min((totalProtein / PROTEIN_GOAL) * 100, 100);
  const remainingProtein = Math.max(0, PROTEIN_GOAL - totalProtein);

  // Confetti when goal is reached
  useEffect(() => {
    const goalMet = totalProtein >= PROTEIN_GOAL;
    
    if (goalMet && !prevProteinGoalMet.current) {
      // Trigger confetti
      const duration = 3000;
      const animationEnd = Date.now() + duration;
      const defaults = { startVelocity: 30, spread: 360, ticks: 60, zIndex: 9999 };

      function randomInRange(min: number, max: number) {
        return Math.random() * (max - min) + min;
      }

      const interval: any = setInterval(function() {
        const timeLeft = animationEnd - Date.now();

        if (timeLeft <= 0) {
          return clearInterval(interval);
        }

        const particleCount = 50 * (timeLeft / duration);
        
        confetti({
          ...defaults,
          particleCount,
          origin: { x: randomInRange(0.1, 0.3), y: Math.random() - 0.2 }
        });
        confetti({
          ...defaults,
          particleCount,
          origin: { x: randomInRange(0.7, 0.9), y: Math.random() - 0.2 }
        });
      }, 250);

      // Show toast
      toast.success('🎉 Protein goal reached! Great job!', {
        duration: 4000,
        style: {
          background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.2), rgba(5, 150, 105, 0.2))',
          border: '2px solid rgba(16, 185, 129, 0.5)',
        },
      });
    }
    
    prevProteinGoalMet.current = goalMet;
  }, [totalProtein]);

  const toggleItem = (item: MenuItem, meal: "breakfast" | "lunch" | "dinner") => {
    setSelectedItems((prev) => {
      const existing = prev.findIndex(
        (s) => s.item.id === item.id && s.meal === meal
      );
      if (existing >= 0) {
        toast.success(`Removed ${item.name}`, {
          icon: '✓',
        });
        return prev.filter((_, i) => i !== existing);
      } else {
        toast.success(`Added ${item.name}`, {
          icon: '✓',
        });
        return [...prev, { item, meal, quantity: 1 }];
      }
    });
  };

  const updateQuantity = (itemId: string, meal: "breakfast" | "lunch" | "dinner", delta: number) => {
    setSelectedItems((prev) =>
      prev.map((s) => {
        if (s.item.id === itemId && s.meal === meal) {
          const newQuantity = Math.max(1, s.quantity + delta);
          return { ...s, quantity: newQuantity };
        }
        return s;
      })
    );
  };

  const isSelected = (itemId: string, meal: "breakfast" | "lunch" | "dinner") => {
    return selectedItems.some((s) => s.item.id === itemId && s.meal === meal);
  };

  const getSelectedQuantity = (itemId: string, meal: "breakfast" | "lunch" | "dinner") => {
    const selected = selectedItems.find((s) => s.item.id === itemId && s.meal === meal);
    return selected?.quantity || 0;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-black flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-white mb-4"></div>
          <p className="text-gray-300 text-lg">Loading menus...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-black flex items-center justify-center px-4">
        <div className="text-center bg-white/10 backdrop-blur-xl rounded-2xl p-8 border border-white/20">
          <XCircle className="w-16 h-16 text-red-400 mx-auto mb-4" />
          <p className="text-red-400 text-lg font-semibold mb-4">Error: {error}</p>
          <button
            onClick={loadMenus}
            className="px-6 py-3 bg-white/10 text-white rounded-lg font-semibold hover:bg-white/20 transition-colors border border-white/20"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-black">
      {/* Enhanced header section - matching MenuDisplay */}
      <div className="w-full relative overflow-hidden">
        {/* Subtle background */}
        <div className="absolute inset-0 bg-gradient-to-b from-white/5 to-transparent"></div>
        
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-6 sm:pt-8 pb-12 sm:pb-16">
          {/* Back button */}
          {onBack && (
            <button
              onClick={onBack}
              className="mb-6 inline-flex items-center gap-2 px-4 py-2 bg-white/10 hover:bg-white/15 text-white rounded-lg font-semibold transition-all duration-300 hover:scale-105 border border-white/20"
            >
              <ArrowLeft className="w-5 h-5" />
              Back to Menu
            </button>
          )}

          {/* Top row with badge and refresh */}
          <div className="flex items-center justify-between mb-8 sm:mb-10 animate-in fade-in slide-in-from-top duration-500">
            <div className="inline-flex items-center gap-3 px-5 py-2.5 bg-white/10 backdrop-blur-md rounded-full border border-white/20 shadow-lg transition-all duration-300 hover:bg-white/15 hover:scale-105">
              <Target className="w-5 h-5 text-white" />
              <span className="text-sm font-bold text-white tracking-wide">
                MEAL PLANNER
              </span>
            </div>
            <button
              onClick={loadMenus}
              className="px-4 py-2 bg-white/10 hover:bg-white/15 text-white rounded-lg font-semibold transition-all duration-300 hover:scale-105 border border-white/20 text-sm"
            >
              Refresh
            </button>
          </div>
          
          {/* Main title with decorative elements */}
          <div className="relative animate-in fade-in slide-in-from-bottom duration-700 delay-100">
            <div className="absolute -left-4 top-1/2 -translate-y-1/2 w-1 h-20 bg-gradient-to-b from-white/40 via-white/20 to-transparent rounded-full transition-all duration-500"></div>
            <h1 className="text-5xl sm:text-6xl md:text-7xl lg:text-8xl font-black text-white leading-tight tracking-tight transition-all duration-300 hover:text-gray-100">
              Plan Your Day
            </h1>
            <div className="mt-4 flex items-center gap-3 animate-in fade-in slide-in-from-left duration-700 delay-200">
              <div className="h-1 w-20 bg-gradient-to-r from-white/60 via-white/30 to-transparent rounded-full"></div>
              <span className="text-sm font-semibold text-gray-400 uppercase tracking-wider transition-colors duration-300">
                Build your perfect meal plan
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Content section */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-12">

        {/* Nutrition Dashboard */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
          {/* Protein Goal Progress */}
          <div className="bg-gradient-to-br from-white/10 to-white/5 backdrop-blur-sm border border-white/20 rounded-2xl p-6 shadow-xl">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 bg-blue-500/20 rounded-lg border border-blue-400/30">
                <Target className="w-6 h-6 text-blue-300" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-white">Protein Goal</h2>
                <p className="text-sm text-gray-400">Target: {PROTEIN_GOAL}g</p>
              </div>
            </div>
            
            <div className="mb-4">
              <div className="flex justify-between items-center mb-2">
                <span className="text-2xl font-bold text-white">
                  <AnimatedCounter value={totalProtein} decimals={1} suffix="g" />
                </span>
                <span className={`text-sm font-semibold ${remainingProtein === 0 ? 'text-green-400' : 'text-gray-400'}`}>
                  {remainingProtein === 0 ? (
                    <span className="flex items-center gap-1.5">
                      <CheckCircle2 className="w-4 h-4" />
                      Complete!
                    </span>
                  ) : (
                    <>
                      <AnimatedCounter value={remainingProtein} decimals={1} suffix="g left" />
                    </>
                  )}
                </span>
              </div>
              <div className="w-full bg-white/10 rounded-full h-3 overflow-hidden border border-white/20">
                <div
                  className={`h-full transition-all duration-500 rounded-full ${
                    proteinProgress >= 100
                      ? "bg-gradient-to-r from-green-400 to-emerald-400"
                      : "bg-gradient-to-r from-blue-400 to-cyan-400"
                  }`}
                  style={{ width: `${proteinProgress}%` }}
                />
              </div>
              <div className="mt-1 text-right text-xs text-gray-400">{proteinProgress.toFixed(0)}%</div>
            </div>
          </div>

          {/* Nutrition Totals */}
          <div className="bg-gradient-to-br from-white/10 to-white/5 backdrop-blur-sm border border-white/20 rounded-2xl p-6 shadow-xl">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 bg-purple-500/20 rounded-lg border border-purple-400/30">
                <TrendingUp className="w-6 h-6 text-purple-300" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-white">Daily Totals</h2>
                <p className="text-sm text-gray-400">{selectedItems.length} items selected</p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="bg-white/5 rounded-xl p-3 border border-white/10">
                <div className="flex items-center gap-2 mb-1">
                  <Flame className="w-4 h-4 text-orange-400" />
                  <span className="text-xs text-gray-400 font-semibold uppercase">Calories</span>
                </div>
                <div className="text-2xl font-bold text-white">
                  <AnimatedCounter value={totalCalories} decimals={0} />
                </div>
              </div>

              <div className="bg-white/5 rounded-xl p-3 border border-white/10">
                <div className="flex items-center gap-2 mb-1">
                  <Wheat className="w-4 h-4 text-amber-400" />
                  <span className="text-xs text-gray-400 font-semibold uppercase">Carbs</span>
                </div>
                <div className="text-2xl font-bold text-white">
                  <AnimatedCounter value={totalCarbs} decimals={1} suffix="g" />
                </div>
              </div>

              <div className="bg-white/5 rounded-xl p-3 border border-white/10">
                <div className="flex items-center gap-2 mb-1">
                  <Droplet className="w-4 h-4 text-yellow-400" />
                  <span className="text-xs text-gray-400 font-semibold uppercase">Fat</span>
                </div>
                <div className="text-2xl font-bold text-white">
                  <AnimatedCounter value={totalFat} decimals={1} suffix="g" />
                </div>
              </div>

              <div className="bg-white/5 rounded-xl p-3 border border-white/10">
                <div className="flex items-center gap-2 mb-1">
                  <Candy className="w-4 h-4 text-pink-400" />
                  <span className="text-xs text-gray-400 font-semibold uppercase">Sugar</span>
                </div>
                <div className="text-2xl font-bold text-white">
                  <AnimatedCounter value={totalSugar} decimals={1} suffix="g" />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Selected Items Summary - Compact with Modal */}
        {selectedItems.length > 0 && (
          <div className="bg-gradient-to-br from-white/10 to-white/5 backdrop-blur-sm border border-white/20 rounded-2xl p-6 mb-6 shadow-xl">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-bold text-white">Your Meal Plan</h3>
                <p className="text-sm text-gray-400 mt-1">
                  {selectedItems.length} item{selectedItems.length !== 1 ? 's' : ''} selected
                  {itemsByMeal.breakfast.length > 0 && ` • ${itemsByMeal.breakfast.length} breakfast`}
                  {itemsByMeal.lunch.length > 0 && ` • ${itemsByMeal.lunch.length} lunch`}
                  {itemsByMeal.dinner.length > 0 && ` • ${itemsByMeal.dinner.length} dinner`}
                </p>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setShowMealPlanModal(true)}
                  className="px-4 py-2 bg-white/10 hover:bg-white/15 text-white rounded-lg font-semibold transition-all duration-300 hover:scale-105 border border-white/20 text-sm"
                >
                  View Details
                </button>
                <button
                  onClick={() => setSelectedItems([])}
                  className="px-4 py-2 text-red-400 hover:text-red-300 font-semibold transition-colors text-sm"
                >
                  Clear All
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Meal Plan Modal */}
        {showMealPlanModal && (
          <div 
            className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 animate-in fade-in duration-300 p-4"
            onClick={() => setShowMealPlanModal(false)}
          >
            <div 
              className="bg-gradient-to-br from-gray-800 to-gray-900 border border-white/20 rounded-2xl max-w-4xl w-full max-h-[80vh] overflow-hidden shadow-2xl animate-in zoom-in duration-300"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Modal Header */}
              <div className="p-6 border-b border-white/20">
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="text-2xl font-bold text-white">Your Meal Plan</h2>
                    <p className="text-sm text-gray-400 mt-1">{selectedItems.length} items selected</p>
                  </div>
                  <button
                    onClick={() => setShowMealPlanModal(false)}
                    className="p-2 hover:bg-white/10 rounded-lg transition-all duration-200"
                  >
                    <XCircle className="w-6 h-6 text-gray-400 hover:text-white transition-colors" />
                  </button>
                </div>
              </div>

              {/* Modal Content */}
              <div className="p-6 overflow-y-auto max-h-[calc(80vh-140px)] custom-scrollbar">
                <div className="space-y-6">
                  {/* Breakfast Section */}
                  {itemsByMeal.breakfast.length > 0 && (
                    <div className="animate-in fade-in slide-in-from-top duration-300">
                      <div className="flex items-center gap-3 mb-4">
                        <div className="w-1 h-8 bg-gradient-to-b from-white via-white/60 to-transparent rounded-full"></div>
                        <h3 className="text-xl font-bold text-white">Breakfast</h3>
                        <span className="text-sm text-gray-400">({itemsByMeal.breakfast.length} items)</span>
                      </div>
                      <div className="space-y-2">
                        {itemsByMeal.breakfast.map((selected) => (
                          <div
                            key={`${selected.item.id}-${selected.meal}`}
                            className="flex items-center justify-between bg-white/5 backdrop-blur-sm rounded-xl p-4 border border-white/10 hover:bg-white/8 transition-all duration-200 group"
                          >
                            <div className="flex-1 min-w-0">
                              <div className="font-semibold text-white truncate">{selected.item.name}</div>
                              <div className="flex items-center gap-3 mt-1">
                                <span className="text-xs text-blue-300 font-semibold">{getProtein(selected.item).toFixed(1)}g protein</span>
                                <span className="text-xs text-gray-400">{typeof selected.item.calories === 'number' ? selected.item.calories : parseInt(String(selected.item.calories)) || 0} cal</span>
                              </div>
                            </div>
                            <div className="flex items-center gap-2 ml-4">
                              <button
                                onClick={() => updateQuantity(selected.item.id, selected.meal, -1)}
                                className="w-8 h-8 rounded-lg bg-white/10 hover:bg-white/20 flex items-center justify-center transition-all duration-200 border border-white/20 hover:scale-110 active:scale-95"
                              >
                                <Minus className="w-4 h-4 text-white" />
                              </button>
                              <span className="w-8 text-center font-bold text-white">{selected.quantity}</span>
                              <button
                                onClick={() => updateQuantity(selected.item.id, selected.meal, 1)}
                                className="w-8 h-8 rounded-lg bg-white/10 hover:bg-white/20 flex items-center justify-center transition-all duration-200 border border-white/20 hover:scale-110 active:scale-95"
                              >
                                <Plus className="w-4 h-4 text-white" />
                              </button>
                              <button
                                onClick={() => toggleItem(selected.item, selected.meal)}
                                className="ml-2 text-red-400 hover:text-red-300 transition-colors"
                              >
                                <XCircle className="w-5 h-5" />
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Lunch Section */}
                  {itemsByMeal.lunch.length > 0 && (
                    <div className="animate-in fade-in slide-in-from-top duration-300 delay-100">
                      <div className="flex items-center gap-3 mb-4">
                        <div className="w-1 h-8 bg-gradient-to-b from-white via-white/60 to-transparent rounded-full"></div>
                        <h3 className="text-xl font-bold text-white">Lunch</h3>
                        <span className="text-sm text-gray-400">({itemsByMeal.lunch.length} items)</span>
                      </div>
                      <div className="space-y-2">
                        {itemsByMeal.lunch.map((selected) => (
                          <div
                            key={`${selected.item.id}-${selected.meal}`}
                            className="flex items-center justify-between bg-white/5 backdrop-blur-sm rounded-xl p-4 border border-white/10 hover:bg-white/8 transition-all duration-200 group"
                          >
                            <div className="flex-1 min-w-0">
                              <div className="font-semibold text-white truncate">{selected.item.name}</div>
                              <div className="flex items-center gap-3 mt-1">
                                <span className="text-xs text-blue-300 font-semibold">{getProtein(selected.item).toFixed(1)}g protein</span>
                                <span className="text-xs text-gray-400">{typeof selected.item.calories === 'number' ? selected.item.calories : parseInt(String(selected.item.calories)) || 0} cal</span>
                              </div>
                            </div>
                            <div className="flex items-center gap-2 ml-4">
                              <button
                                onClick={() => updateQuantity(selected.item.id, selected.meal, -1)}
                                className="w-8 h-8 rounded-lg bg-white/10 hover:bg-white/20 flex items-center justify-center transition-all duration-200 border border-white/20 hover:scale-110 active:scale-95"
                              >
                                <Minus className="w-4 h-4 text-white" />
                              </button>
                              <span className="w-8 text-center font-bold text-white">{selected.quantity}</span>
                              <button
                                onClick={() => updateQuantity(selected.item.id, selected.meal, 1)}
                                className="w-8 h-8 rounded-lg bg-white/10 hover:bg-white/20 flex items-center justify-center transition-all duration-200 border border-white/20 hover:scale-110 active:scale-95"
                              >
                                <Plus className="w-4 h-4 text-white" />
                              </button>
                              <button
                                onClick={() => toggleItem(selected.item, selected.meal)}
                                className="ml-2 text-red-400 hover:text-red-300 transition-colors"
                              >
                                <XCircle className="w-5 h-5" />
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Dinner Section */}
                  {itemsByMeal.dinner.length > 0 && (
                    <div className="animate-in fade-in slide-in-from-top duration-300 delay-200">
                      <div className="flex items-center gap-3 mb-4">
                        <div className="w-1 h-8 bg-gradient-to-b from-white via-white/60 to-transparent rounded-full"></div>
                        <h3 className="text-xl font-bold text-white">Dinner</h3>
                        <span className="text-sm text-gray-400">({itemsByMeal.dinner.length} items)</span>
                      </div>
                      <div className="space-y-2">
                        {itemsByMeal.dinner.map((selected) => (
                          <div
                            key={`${selected.item.id}-${selected.meal}`}
                            className="flex items-center justify-between bg-white/5 backdrop-blur-sm rounded-xl p-4 border border-white/10 hover:bg-white/8 transition-all duration-200 group"
                          >
                            <div className="flex-1 min-w-0">
                              <div className="font-semibold text-white truncate">{selected.item.name}</div>
                              <div className="flex items-center gap-3 mt-1">
                                <span className="text-xs text-blue-300 font-semibold">{getProtein(selected.item).toFixed(1)}g protein</span>
                                <span className="text-xs text-gray-400">{typeof selected.item.calories === 'number' ? selected.item.calories : parseInt(String(selected.item.calories)) || 0} cal</span>
                              </div>
                            </div>
                            <div className="flex items-center gap-2 ml-4">
                              <button
                                onClick={() => updateQuantity(selected.item.id, selected.meal, -1)}
                                className="w-8 h-8 rounded-lg bg-white/10 hover:bg-white/20 flex items-center justify-center transition-all duration-200 border border-white/20 hover:scale-110 active:scale-95"
                              >
                                <Minus className="w-4 h-4 text-white" />
                              </button>
                              <span className="w-8 text-center font-bold text-white">{selected.quantity}</span>
                              <button
                                onClick={() => updateQuantity(selected.item.id, selected.meal, 1)}
                                className="w-8 h-8 rounded-lg bg-white/10 hover:bg-white/20 flex items-center justify-center transition-all duration-200 border border-white/20 hover:scale-110 active:scale-95"
                              >
                                <Plus className="w-4 h-4 text-white" />
                              </button>
                              <button
                                onClick={() => toggleItem(selected.item, selected.meal)}
                                className="ml-2 text-red-400 hover:text-red-300 transition-colors"
                              >
                                <XCircle className="w-5 h-5" />
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Modal Footer */}
              <div className="p-6 border-t border-white/20 flex items-center justify-between">
                <button
                  onClick={() => setSelectedItems([])}
                  className="px-4 py-2 text-red-400 hover:text-red-300 font-semibold transition-colors"
                >
                  Clear All Items
                </button>
                <button
                  onClick={() => setShowMealPlanModal(false)}
                  className="px-6 py-2 bg-white/10 hover:bg-white/15 text-white rounded-lg font-semibold transition-all duration-300 hover:scale-105 border border-white/20"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Smart Recommendations */}
        {recommendations.length > 0 && totalProtein < PROTEIN_GOAL && (
          <div className="bg-gradient-to-br from-white/10 to-white/5 backdrop-blur-sm border border-white/20 rounded-2xl p-6 mb-6 shadow-xl animate-in fade-in slide-in-from-bottom duration-500">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 bg-white/10 rounded-lg border border-white/20">
                <Lightbulb className="w-5 h-5 text-white" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-white">Smart Recommendations</h3>
                <p className="text-sm text-gray-300">Add these to reach your protein goal ({(PROTEIN_GOAL - totalProtein).toFixed(0)}g needed)</p>
              </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              {recommendations.map(({ item, meal, protein, calories }, index) => (
                <div
                  key={`${item.id}-${meal}`}
                  className="bg-white/5 backdrop-blur-sm rounded-xl p-4 border border-white/10 hover:bg-white/15 hover:border-white/30 transition-all duration-300 cursor-pointer group animate-in fade-in zoom-in duration-300 hover:scale-105"
                  style={{ animationDelay: `${index * 100}ms` }}
                  onClick={() => toggleItem(item, meal)}
                >
                  <div className="flex items-start justify-between gap-2 mb-3">
                    <h4 className="font-semibold text-white text-sm leading-tight flex-1 group-hover:text-gray-100 transition-colors">
                      {item.name}
                    </h4>
                    <Sparkles className="w-4 h-4 text-white flex-shrink-0 opacity-60 group-hover:opacity-100 transition-opacity" />
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <div className="flex flex-col gap-1">
                      <div className="flex items-center gap-2">
                        <span className="inline-flex items-center gap-1 px-2 py-1 bg-blue-500/20 text-blue-300 border border-blue-400/30 rounded text-xs font-bold">
                          <Beef className="w-3 h-3" />
                          {protein.toFixed(1)}g
                        </span>
                        <span className="text-xs text-gray-400 font-medium">{calories} cal</span>
                      </div>
                      <span className="text-xs text-gray-300 capitalize font-semibold">{meal}</span>
                    </div>
                    
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        toggleItem(item, meal);
                      }}
                      className="w-8 h-8 rounded-lg bg-white/10 hover:bg-white/20 border border-white/20 flex items-center justify-center transition-all duration-200 hover:scale-110 active:scale-95"
                    >
                      <Plus className="w-4 h-4 text-white" strokeWidth={2.5} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Meal Tabs */}
        <div className="mb-8 animate-in fade-in slide-in-from-top duration-500">
          <div className="bg-gradient-to-r from-gray-800/70 to-gray-900/70 backdrop-blur-lg border border-white/10 rounded-2xl p-4 shadow-2xl">
            <div className="flex items-center gap-2 mb-3">
              <Target className="w-5 h-5 text-gray-300" />
              <span className="text-sm font-bold text-gray-300 uppercase tracking-wider">Select Meal</span>
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => setActiveMeal("breakfast")}
                className={`flex-1 px-6 py-3 rounded-lg font-semibold transition-all duration-300 ${
                  activeMeal === "breakfast"
                    ? "bg-white text-gray-900 scale-105 shadow-lg"
                    : "bg-white/10 text-white hover:bg-white/20 hover:scale-105"
                }`}
              >
                Breakfast
              </button>
              <button
                onClick={() => setActiveMeal("lunch")}
                className={`flex-1 px-6 py-3 rounded-lg font-semibold transition-all duration-300 ${
                  activeMeal === "lunch"
                    ? "bg-white text-gray-900 scale-105 shadow-lg"
                    : "bg-white/10 text-white hover:bg-white/20 hover:scale-105"
                }`}
              >
                Lunch
              </button>
              <button
                onClick={() => setActiveMeal("dinner")}
                className={`flex-1 px-6 py-3 rounded-lg font-semibold transition-all duration-300 ${
                  activeMeal === "dinner"
                    ? "bg-white text-gray-900 scale-105 shadow-lg"
                    : "bg-white/10 text-white hover:bg-white/20 hover:scale-105"
                }`}
              >
                Dinner
              </button>
            </div>
          </div>
        </div>


        {/* Menu Items - Full Display like Menu Page */}
        <div className="space-y-16 sm:space-y-20">
          {activeMeal === "breakfast" && breakfastData && breakfastData.period.categories.map((category, i) => {
            const categoryItems = category.items;
            const selectedCount = categoryItems.filter(item => isSelected(item.id, "breakfast")).length;
            
            return (
              <section key={category.id} className="mb-16 sm:mb-20 animate-in fade-in slide-in-from-bottom duration-700" style={{ animationDelay: `${i * 150}ms` }}>
                {/* Enhanced Category Header */}
                <div className="relative mb-8 sm:mb-10 group">
                  <div className="absolute inset-0 bg-gradient-to-r from-white/10 via-white/5 to-transparent rounded-2xl blur-xl opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                  <div className="relative bg-gradient-to-br from-white/10 to-white/5 backdrop-blur-sm border border-white/20 rounded-2xl overflow-hidden transition-all duration-300 hover:border-white/30 hover:shadow-2xl">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-white/10 to-transparent rounded-bl-full transition-opacity duration-500 opacity-0 group-hover:opacity-100"></div>
                    
                    <div className="relative p-6 sm:p-8">
                      <div className="flex items-center gap-4">
                        <div className="flex-shrink-0 w-1 h-12 bg-gradient-to-b from-white via-white/60 to-transparent rounded-full transition-all duration-300 group-hover:h-16"></div>
                        <div>
                          <h2 className="text-3xl sm:text-4xl md:text-5xl font-black text-white tracking-tight transition-all duration-300 group-hover:text-gray-100">
                            {category.name}
                          </h2>
                          {selectedCount > 0 && (
                            <div className="mt-2 inline-flex items-center gap-2 px-3 py-1.5 bg-blue-500/20 text-blue-300 rounded-lg text-sm font-semibold border border-blue-400/30">
                              {selectedCount} selected
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5 sm:gap-6">
                  {categoryItems.map((item, idx) => {
                    const protein = getProtein(item);
                    const selected = isSelected(item.id, "breakfast");
                    const quantity = getSelectedQuantity(item.id, "breakfast");
                    return (
                      <div key={item.id} className="animate-in fade-in zoom-in duration-500" style={{ animationDelay: `${idx * 50}ms` }}>
                        <ItemCard item={item} protein={protein} selected={selected} quantity={quantity} onToggle={() => toggleItem(item, "breakfast")} onQuantityChange={(delta) => updateQuantity(item.id, "breakfast", delta)} />
                      </div>
                    );
                  })}
                </div>
              </section>
            );
          })}

          {activeMeal === "lunch" && lunchData && lunchData.period.categories.map((category, i) => {
            const categoryItems = category.items;
            const selectedCount = categoryItems.filter(item => isSelected(item.id, "lunch")).length;
            
            return (
              <section key={category.id} className="mb-16 sm:mb-20 animate-in fade-in slide-in-from-bottom duration-700" style={{ animationDelay: `${i * 150}ms` }}>
                <div className="relative mb-8 sm:mb-10 group">
                  <div className="absolute inset-0 bg-gradient-to-r from-white/10 via-white/5 to-transparent rounded-2xl blur-xl opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                  <div className="relative bg-gradient-to-br from-white/10 to-white/5 backdrop-blur-sm border border-white/20 rounded-2xl overflow-hidden transition-all duration-300 hover:border-white/30 hover:shadow-2xl">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-white/10 to-transparent rounded-bl-full transition-opacity duration-500 opacity-0 group-hover:opacity-100"></div>
                    
                    <div className="relative p-6 sm:p-8">
                      <div className="flex items-center gap-4">
                        <div className="flex-shrink-0 w-1 h-12 bg-gradient-to-b from-white via-white/60 to-transparent rounded-full transition-all duration-300 group-hover:h-16"></div>
                        <div>
                          <h2 className="text-3xl sm:text-4xl md:text-5xl font-black text-white tracking-tight transition-all duration-300 group-hover:text-gray-100">
                            {category.name}
                          </h2>
                          {selectedCount > 0 && (
                            <div className="mt-2 inline-flex items-center gap-2 px-3 py-1.5 bg-blue-500/20 text-blue-300 rounded-lg text-sm font-semibold border border-blue-400/30">
                              {selectedCount} selected
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5 sm:gap-6">
                  {categoryItems.map((item, idx) => {
                    const protein = getProtein(item);
                    const selected = isSelected(item.id, "lunch");
                    const quantity = getSelectedQuantity(item.id, "lunch");
                    return (
                      <div key={item.id} className="animate-in fade-in zoom-in duration-500" style={{ animationDelay: `${idx * 50}ms` }}>
                        <ItemCard item={item} protein={protein} selected={selected} quantity={quantity} onToggle={() => toggleItem(item, "lunch")} onQuantityChange={(delta) => updateQuantity(item.id, "lunch", delta)} />
                      </div>
                    );
                  })}
                </div>
              </section>
            );
          })}

          {activeMeal === "dinner" && dinnerData && dinnerData.period.categories.map((category, i) => {
            const categoryItems = category.items;
            const selectedCount = categoryItems.filter(item => isSelected(item.id, "dinner")).length;
            
            return (
              <section key={category.id} className="mb-16 sm:mb-20 animate-in fade-in slide-in-from-bottom duration-700" style={{ animationDelay: `${i * 150}ms` }}>
                <div className="relative mb-8 sm:mb-10 group">
                  <div className="absolute inset-0 bg-gradient-to-r from-white/10 via-white/5 to-transparent rounded-2xl blur-xl opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                  <div className="relative bg-gradient-to-br from-white/10 to-white/5 backdrop-blur-sm border border-white/20 rounded-2xl overflow-hidden transition-all duration-300 hover:border-white/30 hover:shadow-2xl">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-white/10 to-transparent rounded-bl-full transition-opacity duration-500 opacity-0 group-hover:opacity-100"></div>
                    
                    <div className="relative p-6 sm:p-8">
                      <div className="flex items-center gap-4">
                        <div className="flex-shrink-0 w-1 h-12 bg-gradient-to-b from-white via-white/60 to-transparent rounded-full transition-all duration-300 group-hover:h-16"></div>
                        <div>
                          <h2 className="text-3xl sm:text-4xl md:text-5xl font-black text-white tracking-tight transition-all duration-300 group-hover:text-gray-100">
                            {category.name}
                          </h2>
                          {selectedCount > 0 && (
                            <div className="mt-2 inline-flex items-center gap-2 px-3 py-1.5 bg-blue-500/20 text-blue-300 rounded-lg text-sm font-semibold border border-blue-400/30">
                              {selectedCount} selected
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5 sm:gap-6">
                  {categoryItems.map((item, idx) => {
                    const protein = getProtein(item);
                    const selected = isSelected(item.id, "dinner");
                    const quantity = getSelectedQuantity(item.id, "dinner");
                    return (
                      <div key={item.id} className="animate-in fade-in zoom-in duration-500" style={{ animationDelay: `${idx * 50}ms` }}>
                        <ItemCard item={item} protein={protein} selected={selected} quantity={quantity} onToggle={() => toggleItem(item, "dinner")} onQuantityChange={(delta) => updateQuantity(item.id, "dinner", delta)} />
                      </div>
                    );
                  })}
                </div>
              </section>
            );
          })}
        </div>
      </div>

      {/* Floating "View Plan" Button */}
      {selectedItems.length > 0 && (
        <button
          onClick={() => setShowMealPlanModal(true)}
          className="fixed bottom-6 right-6 bg-gradient-to-r from-blue-500 to-cyan-500 hover:from-blue-600 hover:to-cyan-600 text-white px-6 py-4 rounded-full shadow-2xl flex items-center gap-3 font-bold transition-all duration-300 hover:scale-110 active:scale-95 z-50 animate-in slide-in-from-bottom duration-500"
        >
          <Eye className="w-5 h-5" />
          <span>View Plan ({selectedItems.length})</span>
          <div className="absolute -top-1 -right-1 w-6 h-6 bg-red-500 rounded-full flex items-center justify-center text-xs font-bold animate-pulse">
            {selectedItems.length}
          </div>
        </button>
      )}
    </div>
  );
}

function ItemCard({
  item,
  protein,
  selected,
  quantity,
  onToggle,
  onQuantityChange,
}: {
  item: MenuItem;
  protein: number;
  selected: boolean;
  quantity: number;
  onToggle: () => void;
  onQuantityChange: (delta: number) => void;
}) {
  return (
    <div
      className={`
        relative p-4 rounded-xl transition-all duration-300 cursor-pointer border
        ${selected
          ? "bg-gradient-to-br from-blue-500/15 to-cyan-500/10 border-blue-400/40 shadow-lg scale-[1.02]"
          : "bg-white/5 border-white/10 hover:border-white/20 hover:bg-white/8 hover:scale-[1.01]"
        }
      `}
      onClick={onToggle}
    >
      <div className="flex items-start justify-between gap-3 mb-2">
        <h4 className="font-semibold text-white text-sm leading-tight flex-1 transition-colors duration-200">
          {item.name}
        </h4>
        {selected && (
          <div className="flex-shrink-0 w-5 h-5 bg-green-500 rounded-full flex items-center justify-center animate-in zoom-in duration-300">
            <CheckCircle2 className="w-3.5 h-3.5 text-white" strokeWidth={3} />
          </div>
        )}
      </div>

      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 text-xs">
          <span className="inline-flex items-center gap-1 px-2 py-1 bg-blue-500/20 text-blue-300 border border-blue-400/30 rounded font-semibold transition-all duration-200">
            <Beef className="w-3 h-3" />
            {protein.toFixed(1)}g
          </span>
          {item.calories > 0 && (
            <span className="text-gray-400 font-medium transition-colors duration-200">{item.calories} cal</span>
          )}
        </div>

        {selected && (
          <div
            className="flex items-center gap-1.5 animate-in slide-in-from-right duration-300"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={() => onQuantityChange(-1)}
              className="w-6 h-6 rounded bg-white/10 hover:bg-white/20 flex items-center justify-center transition-all duration-200 border border-white/20 hover:scale-110 active:scale-95"
            >
              <Minus className="w-3 h-3 text-white" strokeWidth={2.5} />
            </button>
            <span className="w-6 text-center font-bold text-white text-sm transition-all duration-200">{quantity}</span>
            <button
              onClick={() => onQuantityChange(1)}
              className="w-6 h-6 rounded bg-white/10 hover:bg-white/20 flex items-center justify-center transition-all duration-200 border border-white/20 hover:scale-110 active:scale-95"
            >
              <Plus className="w-3 h-3 text-white" strokeWidth={2.5} />
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

