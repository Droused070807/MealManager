import { useMemo, useState } from "react";
import type { MenuResponse, Category, MenuItem as Item } from "../types/Menu";
import { Leaf, Flame, Beef, Sparkles, Calendar, ChevronLeft, ChevronRight, ChevronDown, Filter, X, CheckCircle2 } from "lucide-react";

function parseNutrientValue(value: string | number): number {
  const str = String(value).toLowerCase();
  if (str.includes("less than")) {
    const match = str.match(/less than\s*(\d+\.?\d*)/);
    if (match) return Number(match[1]);
  }
  const num = Number(str.replace(/[^\d.]/g, ""));
  return isNaN(num) ? 0 : num;
}

function formatNutrientValue(value: string | number, uom: string = "g"): string {
  const str = String(value);
  if (str.toLowerCase().includes("less than")) {
    const match = str.match(/less than\s*(\d+\.?\d*)/);
    return match ? `${match[1]}${uom}` : str;
  }
  const num = str.replace(/[^\d.]/g, "");
  return num ? `${num}${uom}` : str;
}

export default function MenuDisplay({ 
  data, 
  selectedDate, 
  onDateChange 
}: { 
  data: MenuResponse;
  selectedDate: Date;
  onDateChange: (date: Date) => void;
}) {
  const { period } = data;
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [activeSection, setActiveSection] = useState<string | null>(null);
  const [filters, setFilters] = useState({
    vegan: false,
    vegetarian: false,
    highProtein: false,
    lowCalorie: false,
  });
  const [showFilters, setShowFilters] = useState(false);
  const [showMobileFilters, setShowMobileFilters] = useState(false);

  const formattedDate = useMemo(() => {
    return selectedDate.toLocaleDateString("en-US", {
      weekday: "long",
      month: "long",
      day: "numeric",
      year: "numeric",
    });
  }, [selectedDate]);

  const filteredCategories = useMemo(() => {
    if (!Object.values(filters).some(v => v)) {
      return period.categories;
    }

    return period.categories.map(category => ({
      ...category,
      items: category.items.filter(item => {
        // Vegan filter
        if (filters.vegan && !item.filters.some(f => f.name === "Vegan" && f.icon)) {
          return false;
        }

        // Vegetarian filter (includes vegan)
        if (filters.vegetarian && !item.filters.some(f => 
          (f.name === "Vegetarian" || f.name === "Vegan") && f.icon
        )) {
          return false;
        }

        // High protein filter (>20g)
        if (filters.highProtein) {
          const protein = item.nutrients.find(n => n.name.toLowerCase().includes("protein"));
          const proteinValue = protein ? parseNutrientValue(protein.value) : 0;
          if (proteinValue < 20) return false;
        }

        // Low calorie filter (<400 cal)
        if (filters.lowCalorie) {
          const calories = typeof item.calories === 'number' ? item.calories : parseInt(String(item.calories)) || 0;
          if (calories >= 400) return false;
        }

        return true;
      })
    })).filter(category => category.items.length > 0);
  }, [period.categories, filters]);

  const activeFilterCount = Object.values(filters).filter(v => v).length;

  const toggleFilter = (filterName: keyof typeof filters) => {
    setFilters(prev => ({ ...prev, [filterName]: !prev[filterName] }));
  };

  const clearFilters = () => {
    setFilters({
      vegan: false,
      vegetarian: false,
      highProtein: false,
      lowCalorie: false,
    });
  };

  const scrollToSection = (categoryId: string) => {
    const element = document.getElementById(`category-${categoryId}`);
    if (element) {
      const offset = 120;
      const elementPosition = element.getBoundingClientRect().top;
      const offsetPosition = elementPosition + window.pageYOffset - offset;
      
      // Use a custom smooth scroll with easing
      const startPosition = window.pageYOffset;
      const distance = offsetPosition - startPosition;
      const duration = 1000; // 1 second for smooth animation
      let start: number | null = null;

      const easeInOutCubic = (t: number): number => {
        return t < 0.5 ? 4 * t * t * t : (t - 1) * (2 * t - 2) * (2 * t - 2) + 1;
      };

      const animation = (currentTime: number) => {
        if (start === null) start = currentTime;
        const timeElapsed = currentTime - start;
        const progress = Math.min(timeElapsed / duration, 1);
        const ease = easeInOutCubic(progress);
        
        window.scrollTo(0, startPosition + distance * ease);
        
        if (timeElapsed < duration) {
          requestAnimationFrame(animation);
        }
      };

      requestAnimationFrame(animation);
      setActiveSection(categoryId);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-black">
      {/* Enhanced header section */}
      <div className="w-full relative overflow-hidden">
        {/* Subtle background */}
        <div className="absolute inset-0 bg-gradient-to-b from-white/5 to-transparent"></div>
        
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-6 sm:pt-8 pb-12 sm:pb-16">
          {/* Top row with badge and date */}
          <div className="flex items-center justify-between mb-8 sm:mb-10 animate-in fade-in slide-in-from-top duration-500">
            <div className="inline-flex items-center gap-3 px-5 py-2.5 bg-white/10 backdrop-blur-md rounded-full border border-white/20 shadow-lg transition-all duration-300 hover:bg-white/15 hover:scale-105">
              <Sparkles className="w-5 h-5 text-white" />
              <span className="text-sm font-bold text-white tracking-wide">
                DAILY MENU
              </span>
            </div>
            <button
              onClick={() => setShowDatePicker(true)}
              className="flex items-center gap-2.5 px-4 py-2 bg-white/10 backdrop-blur-sm rounded-lg border border-white/20 transition-all duration-300 hover:bg-white/15 hover:scale-105 cursor-pointer group"
            >
              <Calendar className="w-5 h-5 text-gray-300 group-hover:text-white transition-colors" />
              <time className="text-sm sm:text-base font-semibold text-white">{formattedDate}</time>
            </button>
          </div>
          
          {/* Main title with decorative elements */}
          <div className="relative animate-in fade-in slide-in-from-bottom duration-700 delay-100">
            <div className="absolute -left-4 top-1/2 -translate-y-1/2 w-1 h-20 bg-gradient-to-b from-white/40 via-white/20 to-transparent rounded-full transition-all duration-500"></div>
            <h1 className="text-5xl sm:text-6xl md:text-7xl lg:text-8xl font-black text-white leading-tight tracking-tight transition-all duration-300 hover:text-gray-100">
              {period.name}
            </h1>
            <div className="mt-4 flex items-center gap-3 animate-in fade-in slide-in-from-left duration-700 delay-200">
              <div className="h-1 w-20 bg-gradient-to-r from-white/60 via-white/30 to-transparent rounded-full"></div>
              <span className="text-sm font-semibold text-gray-400 uppercase tracking-wider transition-colors duration-300">
                459 Commons Dining Hall
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Content section */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-12">
        {period.categories.length === 0 ? (
          <div className="text-center py-20 sm:py-32">
            <div className="bg-white/5 backdrop-blur-sm rounded-2xl w-20 h-20 sm:w-24 sm:h-24 mx-auto mb-6 flex items-center justify-center border border-white/10">
              <Sparkles className="w-10 h-10 sm:w-12 sm:h-12 text-gray-400" />
            </div>
            <p className="text-xl text-gray-400">No menu available today</p>
          </div>
        ) : (
          <>
            {/* Filter Section */}
            <div className="mb-6 animate-in fade-in slide-in-from-top duration-500">
              {/* Desktop Filter */}
              <div className="hidden md:block bg-gradient-to-r from-gray-800/70 to-gray-900/70 backdrop-blur-lg border border-white/10 rounded-2xl p-4 shadow-2xl">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <Filter className="w-5 h-5 text-gray-300" />
                    <span className="text-sm font-bold text-gray-300 uppercase tracking-wider">Filters</span>
                    {activeFilterCount > 0 && (
                      <span className="px-2 py-0.5 bg-white text-gray-900 text-xs font-bold rounded-full">
                        {activeFilterCount}
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    {activeFilterCount > 0 && (
                      <button
                        onClick={clearFilters}
                        className="text-xs text-gray-400 hover:text-white transition-colors duration-200 flex items-center gap-1"
                      >
                        <X className="w-3 h-3" />
                        Clear
                      </button>
                    )}
                    <button
                      onClick={() => setShowFilters(!showFilters)}
                      className="text-xs text-gray-400 hover:text-white transition-colors duration-200"
                    >
                      {showFilters ? 'Hide' : 'Show'}
                    </button>
                  </div>
                </div>
                
                {showFilters && (
                  <div className="flex flex-wrap gap-2 animate-in fade-in slide-in-from-top duration-300">
                    <button
                      onClick={() => toggleFilter('vegan')}
                      className={`
                        px-4 py-2 rounded-lg font-semibold text-sm transition-all duration-300 flex items-center gap-2
                        ${filters.vegan 
                          ? 'bg-emerald-500/20 text-emerald-300 border-2 border-emerald-400/50 scale-105' 
                          : 'bg-white/10 text-white border-2 border-transparent hover:bg-white/20 hover:scale-105'
                        }
                      `}
                    >
                      <Leaf className="w-4 h-4" />
                      Vegan
                    </button>
                    
                    <button
                      onClick={() => toggleFilter('vegetarian')}
                      className={`
                        px-4 py-2 rounded-lg font-semibold text-sm transition-all duration-300 flex items-center gap-2
                        ${filters.vegetarian 
                          ? 'bg-amber-500/20 text-amber-300 border-2 border-amber-400/50 scale-105' 
                          : 'bg-white/10 text-white border-2 border-transparent hover:bg-white/20 hover:scale-105'
                        }
                      `}
                    >
                      <Leaf className="w-4 h-4" />
                      Vegetarian
                    </button>
                    
                    <button
                      onClick={() => toggleFilter('highProtein')}
                      className={`
                        px-4 py-2 rounded-lg font-semibold text-sm transition-all duration-300 flex items-center gap-2
                        ${filters.highProtein 
                          ? 'bg-blue-500/20 text-blue-300 border-2 border-blue-400/50 scale-105' 
                          : 'bg-white/10 text-white border-2 border-transparent hover:bg-white/20 hover:scale-105'
                        }
                      `}
                    >
                      <Beef className="w-4 h-4" />
                      High Protein (20g+)
                    </button>
                    
                    <button
                      onClick={() => toggleFilter('lowCalorie')}
                      className={`
                        px-4 py-2 rounded-lg font-semibold text-sm transition-all duration-300 flex items-center gap-2
                        ${filters.lowCalorie 
                          ? 'bg-green-500/20 text-green-300 border-2 border-green-400/50 scale-105' 
                          : 'bg-white/10 text-white border-2 border-transparent hover:bg-white/20 hover:scale-105'
                        }
                      `}
                    >
                      <Flame className="w-4 h-4" />
                      Low Calorie (&lt;400)
                    </button>
                  </div>
                )}
              </div>

              {/* Mobile Filter Button */}
              <button
                onClick={() => setShowMobileFilters(true)}
                className="md:hidden w-full bg-gradient-to-r from-gray-800/70 to-gray-900/70 backdrop-blur-lg border border-white/10 rounded-2xl p-4 shadow-2xl flex items-center justify-between"
              >
                <div className="flex items-center gap-2">
                  <Filter className="w-5 h-5 text-gray-300" />
                  <span className="text-sm font-bold text-gray-300 uppercase tracking-wider">Filters</span>
                  {activeFilterCount > 0 && (
                    <span className="px-2 py-0.5 bg-white text-gray-900 text-xs font-bold rounded-full">
                      {activeFilterCount}
                    </span>
                  )}
                </div>
                <ChevronDown className="w-5 h-5 text-gray-400" />
              </button>
            </div>

            {/* Mobile Filter Bottom Sheet */}
            {showMobileFilters && (
              <div 
                className="md:hidden fixed inset-0 bg-black/60 backdrop-blur-sm z-50 animate-in fade-in duration-300"
                onClick={() => setShowMobileFilters(false)}
              >
                <div 
                  className="absolute bottom-0 left-0 right-0 bg-gradient-to-br from-gray-800 to-gray-900 border-t border-white/20 rounded-t-3xl p-6 shadow-2xl animate-in slide-in-from-bottom duration-300 max-h-[80vh] overflow-y-auto"
                  onClick={(e) => e.stopPropagation()}
                >
                  {/* Handle bar */}
                  <div className="w-12 h-1 bg-white/20 rounded-full mx-auto mb-6"></div>
                  
                  <div className="flex items-center justify-between mb-6">
                    <h3 className="text-xl font-bold text-white">Filters</h3>
                    {activeFilterCount > 0 && (
                      <button
                        onClick={clearFilters}
                        className="text-sm text-red-400 hover:text-red-300 font-semibold transition-colors"
                      >
                        Clear All
                      </button>
                    )}
                  </div>

                  <div className="space-y-3 mb-6">
                    <button
                      onClick={() => toggleFilter('vegan')}
                      className={`
                        w-full px-6 py-4 rounded-xl font-semibold text-base transition-all duration-300 flex items-center justify-between
                        ${filters.vegan 
                          ? 'bg-emerald-500/20 text-emerald-300 border-2 border-emerald-400/50' 
                          : 'bg-white/10 text-white border-2 border-white/10'
                        }
                      `}
                    >
                      <div className="flex items-center gap-3">
                        <Leaf className="w-5 h-5" />
                        <span>Vegan</span>
                      </div>
                      {filters.vegan && <CheckCircle2 className="w-5 h-5" />}
                    </button>
                    
                    <button
                      onClick={() => toggleFilter('vegetarian')}
                      className={`
                        w-full px-6 py-4 rounded-xl font-semibold text-base transition-all duration-300 flex items-center justify-between
                        ${filters.vegetarian 
                          ? 'bg-amber-500/20 text-amber-300 border-2 border-amber-400/50' 
                          : 'bg-white/10 text-white border-2 border-white/10'
                        }
                      `}
                    >
                      <div className="flex items-center gap-3">
                        <Leaf className="w-5 h-5" />
                        <span>Vegetarian</span>
                      </div>
                      {filters.vegetarian && <CheckCircle2 className="w-5 h-5" />}
                    </button>
                    
                    <button
                      onClick={() => toggleFilter('highProtein')}
                      className={`
                        w-full px-6 py-4 rounded-xl font-semibold text-base transition-all duration-300 flex items-center justify-between
                        ${filters.highProtein 
                          ? 'bg-blue-500/20 text-blue-300 border-2 border-blue-400/50' 
                          : 'bg-white/10 text-white border-2 border-white/10'
                        }
                      `}
                    >
                      <div className="flex items-center gap-3">
                        <Beef className="w-5 h-5" />
                        <span>High Protein (20g+)</span>
                      </div>
                      {filters.highProtein && <CheckCircle2 className="w-5 h-5" />}
                    </button>
                    
                    <button
                      onClick={() => toggleFilter('lowCalorie')}
                      className={`
                        w-full px-6 py-4 rounded-xl font-semibold text-base transition-all duration-300 flex items-center justify-between
                        ${filters.lowCalorie 
                          ? 'bg-green-500/20 text-green-300 border-2 border-green-400/50' 
                          : 'bg-white/10 text-white border-2 border-white/10'
                        }
                      `}
                    >
                      <div className="flex items-center gap-3">
                        <Flame className="w-5 h-5" />
                        <span>Low Calorie (&lt;400)</span>
                      </div>
                      {filters.lowCalorie && <CheckCircle2 className="w-5 h-5" />}
                    </button>
                  </div>

                  <button
                    onClick={() => setShowMobileFilters(false)}
                    className="w-full px-6 py-4 bg-white/10 hover:bg-white/15 text-white rounded-xl font-semibold transition-all duration-300 border border-white/20"
                  >
                    Apply Filters
                  </button>
                </div>
              </div>
            )}

            {/* Show message if filters result in no items */}
            {filteredCategories.length === 0 && (
              <div className="text-center py-20 sm:py-32">
                <div className="bg-white/5 backdrop-blur-sm rounded-2xl w-20 h-20 sm:w-24 sm:h-24 mx-auto mb-6 flex items-center justify-center border border-white/10">
                  <Filter className="w-10 h-10 sm:w-12 sm:h-12 text-gray-400" />
                </div>
                <h3 className="text-2xl font-bold text-white mb-2">No items match your filters</h3>
                <p className="text-lg text-gray-400 mb-6">Try adjusting your filter settings</p>
                <button
                  onClick={clearFilters}
                  className="px-6 py-3 bg-white/10 hover:bg-white/15 text-white font-semibold rounded-xl border border-white/20 transition-all duration-300 hover:scale-105"
                >
                  Clear All Filters
                </button>
              </div>
            )}

            {/* Floating Quick Navigation */}
            {filteredCategories.length > 0 && (
              <div className="sticky top-24 z-40 mb-8 animate-in fade-in slide-in-from-top duration-500">
                <div className="bg-gradient-to-r from-gray-800/70 to-gray-900/70 backdrop-blur-lg border border-white/10 rounded-2xl p-4 shadow-2xl">
                  <div className="flex items-center gap-2 mb-3">
                    <ChevronDown className="w-5 h-5 text-gray-300" />
                    <span className="text-sm font-bold text-gray-300 uppercase tracking-wider">Jump to Section</span>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {filteredCategories.map((category) => (
                      <button
                        key={category.id}
                        onClick={() => scrollToSection(category.id)}
                        className={`
                          px-4 py-2 rounded-lg font-semibold text-sm transition-all duration-300
                          ${activeSection === category.id 
                            ? 'bg-white text-gray-900 scale-105 shadow-lg' 
                            : 'bg-white/10 text-white hover:bg-white/20 hover:scale-105'
                          }
                        `}
                      >
                        {category.name}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}

            <div className="space-y-16 sm:space-y-20">
              {filteredCategories.map((category, i) => (
                <div key={category.id} id={`category-${category.id}`}>
                  <CategorySection category={category} index={i} />
                </div>
              ))}
            </div>
          </>
        )}
      </div>

      {/* Date Picker Modal */}
      {showDatePicker && (
        <DatePickerModal
          selectedDate={selectedDate}
          onDateChange={(date) => {
            onDateChange(date);
            setShowDatePicker(false);
          }}
          onClose={() => setShowDatePicker(false)}
        />
      )}
    </div>
  );
}

// Category Section with Staggered Animation
function CategorySection({ category, index }: { category: Category; index: number }) {
  const highestProtein = useMemo(() => {
    if (category.items.length === 0) return null;
    return category.items
      .map((item) => {
        const protein = item.nutrients.find((n) =>
          n.name.toLowerCase().includes("protein")
        );
        return {
          item,
          value: protein ? parseNutrientValue(protein.value) : 0,
        };
      })
      .reduce((max, curr) => (curr.value > max.value ? curr : max), {
        item: category.items[0],
        value: 0,
      });
  }, [category.items]);

  if (category.items.length === 0) return null;

  return (
    <section className="mb-16 sm:mb-20 animate-in fade-in slide-in-from-bottom duration-700" style={{ animationDelay: `${index * 150}ms` }}>
      {/* Enhanced Category Header */}
      <div className="relative mb-8 sm:mb-10 group">
        <div className="absolute inset-0 bg-gradient-to-r from-white/10 via-white/5 to-transparent rounded-2xl blur-xl opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
        <div className="relative bg-gradient-to-br from-white/10 to-white/5 backdrop-blur-sm border border-white/20 rounded-2xl overflow-hidden transition-all duration-300 hover:border-white/30 hover:shadow-2xl">
          {/* Decorative corner accent */}
          <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-white/10 to-transparent rounded-bl-full transition-opacity duration-500 opacity-0 group-hover:opacity-100"></div>
          
          {/* Category Title */}
          <div className="relative p-6 sm:p-8">
            <div className="flex items-center gap-4">
              <div className="flex-shrink-0 w-1 h-12 bg-gradient-to-b from-white via-white/60 to-transparent rounded-full transition-all duration-300 group-hover:h-16"></div>
              <h2 className="text-3xl sm:text-4xl md:text-5xl font-black text-white tracking-tight transition-all duration-300 group-hover:text-gray-100">
                {category.name}
              </h2>
            </div>

            {/* Highest Protein Text - Simple text under title */}
            {highestProtein && highestProtein.value > 0 && (
              <div className="mt-4 ml-5 flex items-center gap-3 text-gray-300">
                <Beef className="w-5 h-5" />
                <span className="text-sm font-semibold">
                  Highest Protein: <span className="text-white">{highestProtein.item.name}</span> ({highestProtein.value}g)
                </span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Menu Items Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-5 lg:gap-6">
        {category.items.map((item, i) => (
          <div
            key={item.id}
            className="animate-in fade-in zoom-in duration-500"
            style={{ animationDelay: `${i * 50}ms` }}
          >
            <MenuItem
              item={item}
              isHighestProtein={highestProtein?.item.id === item.id}
            />
          </div>
        ))}
      </div>
    </section>
  );
}

// Individual Menu Item Card
function MenuItem({
  item,
  isHighestProtein,
}: {
  item: Item;
  isHighestProtein?: boolean;
}) {
  const { vegan, vegetarian } = useMemo(() => ({
    vegan: item.filters.some((f) => f.name === "Vegan" && f.icon),
    vegetarian: item.filters.some((f) => f.name === "Vegetarian" && f.icon),
  }), [item.filters]);

  const nutrients = useMemo(() => {
    const find = (keyword: string) =>
      item.nutrients.find((n) => n.name.toLowerCase().includes(keyword));
    return {
      protein: find("protein"),
      carbs: find("carb"),
      fat: find("fat"),
      sugar: find("sugar"),
    };
  }, [item.nutrients]);

  return (
    <div className="relative h-full pt-10">
      {/* Top Badge - Absolutely positioned */}
      {isHighestProtein && (
        <div className="absolute top-0 left-0 right-0 bg-gradient-to-r from-amber-400 to-orange-500 text-gray-900 text-center py-2 rounded-t-2xl font-bold text-xs shadow-lg z-10">
          <span className="flex items-center justify-center gap-1.5">
            <Flame className="w-4 h-4" />
            <span>HIGHEST PROTEIN</span>
          </span>
        </div>
      )}

      <article
        className={`
          relative bg-gradient-to-br from-white/10 to-white/5 backdrop-blur-md rounded-2xl 
          border border-white/20 overflow-hidden
          hover:from-white/15 hover:to-white/10 hover:border-white/30 hover:shadow-2xl
          active:scale-[0.98]
          transition-all duration-300 ease-out
          ${isHighestProtein ? "ring-2 ring-amber-400/50 shadow-2xl shadow-amber-500/20" : "shadow-xl"}
          h-full flex flex-col group
          touch-manipulation
        `}
      >
        {/* Gradient overlay on hover */}
        <div className="absolute inset-0 bg-gradient-to-br from-white/0 via-white/0 to-white/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none"></div>
        
        <div className="relative p-3 sm:p-4 space-y-2 sm:space-y-2.5 flex-1 flex flex-col">
          {/* Name & Calories */}
          <div className="flex justify-between items-start gap-2 sm:gap-3">
            <h3 className="text-sm sm:text-base font-bold text-white leading-tight flex-1 group-hover:text-gray-100 transition-colors">
              {item.name}
            </h3>
            <div className="text-right flex-shrink-0">
              <div className="text-xl sm:text-2xl font-bold bg-gradient-to-br from-white to-gray-200 bg-clip-text text-transparent">
                {item.calories || "-"}
              </div>
              <div className="text-[10px] text-gray-400 font-semibold uppercase tracking-wide">cal</div>
            </div>
          </div>

          {/* Diet Badges */}
          {(vegan || vegetarian) && (
            <div className="flex flex-wrap gap-1.5">
              {vegan && (
                <span className="inline-flex items-center gap-1 px-2 py-1 bg-emerald-500/20 text-emerald-300 border border-emerald-400/30 rounded-lg text-[10px] font-bold backdrop-blur-sm">
                  <Leaf className="w-3 h-3" /> Vegan
                </span>
              )}
              {vegetarian && !vegan && (
                <span className="inline-flex items-center gap-1 px-2 py-1 bg-amber-500/20 text-amber-300 border border-amber-400/30 rounded-lg text-[10px] font-bold backdrop-blur-sm">
                  Vegetarian
                </span>
              )}
            </div>
          )}

          {/* Spacer to push macros to bottom */}
          <div className="flex-1 min-h-[8px]"></div>

          {/* Macros - Always visible */}
          {(nutrients.protein || nutrients.carbs || nutrients.fat || nutrients.sugar) && (
            <div className="space-y-2 pt-2 border-t border-white/20 group-hover:border-white/30 transition-colors">
              {nutrients.protein && (
                <MacroBar 
                  label="Protein" 
                  value={formatNutrientValue(nutrients.protein.value, nutrients.protein.uom)} 
                  rawValue={parseNutrientValue(nutrients.protein.value)}
                  max={50}
                  color="from-blue-400 to-cyan-400"
                />
              )}
              {nutrients.carbs && (
                <MacroBar 
                  label="Carbs" 
                  value={formatNutrientValue(nutrients.carbs.value, nutrients.carbs.uom)} 
                  rawValue={parseNutrientValue(nutrients.carbs.value)}
                  max={100}
                  color="from-purple-400 to-pink-400"
                />
              )}
              {nutrients.fat && (
                <MacroBar 
                  label="Fat" 
                  value={formatNutrientValue(nutrients.fat.value, nutrients.fat.uom)} 
                  rawValue={parseNutrientValue(nutrients.fat.value)}
                  max={30}
                  color="from-amber-400 to-orange-400"
                />
              )}
              {nutrients.sugar && (
                <MacroBar 
                  label="Sugar" 
                  value={formatNutrientValue(nutrients.sugar.value, nutrients.sugar.uom)} 
                  rawValue={parseNutrientValue(nutrients.sugar.value)}
                  max={25}
                  color={parseNutrientValue(nutrients.sugar.value) > 12 ? "from-red-400 to-rose-400" : "from-green-400 to-emerald-400"}
                />
              )}
            </div>
          )}
        </div>
      </article>
    </div>
  );
}

function MacroBar({
  label,
  value,
  rawValue,
  max,
  color,
}: {
  label: string;
  value: string;
  rawValue: number;
  max: number;
  color: string;
}) {
  const percentage = Math.min((rawValue / max) * 100, 100);
  
  // Determine daily value percentage
  // Color based on health status
  const getBarColor = () => {
    if (label === 'Sugar' && rawValue > 15) return 'from-orange-400 to-red-400';
    if (label === 'Fat' && rawValue > 25) return 'from-orange-400 to-red-400';
    if (label === 'Protein' && rawValue > 20) return 'from-green-400 to-emerald-400';
    if (label === 'Protein' && rawValue > 10) return 'from-blue-400 to-cyan-400';
    return color;
  };
  
  const barColor = getBarColor();
  
  return (
    <div className="space-y-0.5 group/macro relative">
      <div className="flex justify-between items-center">
        <span className="text-xs font-semibold text-gray-400 uppercase tracking-wide">
          {label}
        </span>
        <span className="text-sm font-bold text-white text-right min-w-[45px] tabular-nums">{value}</span>
      </div>
      
      {/* Progress bar */}
      <div className="h-1 bg-white/10 rounded-full overflow-hidden">
        <div 
          className={`h-full bg-gradient-to-r ${barColor} rounded-full transition-all duration-500 ease-out`}
          style={{ width: `${percentage}%` }}
        ></div>
      </div>
    </div>
  );
}

// Date Picker Modal Component
function DatePickerModal({
  selectedDate,
  onDateChange,
  onClose,
}: {
  selectedDate: Date;
  onDateChange: (date: Date) => void;
  onClose: () => void;
}) {
  const [currentMonth, setCurrentMonth] = useState(new Date(selectedDate));

  const daysInMonth = new Date(
    currentMonth.getFullYear(),
    currentMonth.getMonth() + 1,
    0
  ).getDate();

  const firstDayOfMonth = new Date(
    currentMonth.getFullYear(),
    currentMonth.getMonth(),
    1
  ).getDay();

  const monthName = currentMonth.toLocaleDateString("en-US", {
    month: "long",
    year: "numeric",
  });

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const handlePrevMonth = () => {
    setCurrentMonth(
      new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1, 1)
    );
  };

  const handleNextMonth = () => {
    setCurrentMonth(
      new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 1)
    );
  };

  const handleDateClick = (day: number) => {
    const newDate = new Date(
      currentMonth.getFullYear(),
      currentMonth.getMonth(),
      day
    );
    onDateChange(newDate);
  };

  const isSelectedDate = (day: number) => {
    const date = new Date(
      currentMonth.getFullYear(),
      currentMonth.getMonth(),
      day
    );
    return (
      date.getFullYear() === selectedDate.getFullYear() &&
      date.getMonth() === selectedDate.getMonth() &&
      date.getDate() === selectedDate.getDate()
    );
  };

  const isToday = (day: number) => {
    const date = new Date(
      currentMonth.getFullYear(),
      currentMonth.getMonth(),
      day
    );
    return (
      date.getFullYear() === today.getFullYear() &&
      date.getMonth() === today.getMonth() &&
      date.getDate() === today.getDate()
    );
  };

  return (
    <div
      className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 animate-in fade-in duration-300"
      onClick={onClose}
    >
      <div
        className="bg-gradient-to-br from-gray-800 to-gray-900 border border-white/20 rounded-2xl p-6 max-w-md w-full mx-4 shadow-2xl animate-in zoom-in duration-300"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <button
            onClick={handlePrevMonth}
            className="p-2 hover:bg-white/10 rounded-lg transition-all duration-200 hover:scale-110"
          >
            <ChevronLeft className="w-6 h-6 text-white" />
          </button>
          <h2 className="text-2xl font-bold text-white">{monthName}</h2>
          <button
            onClick={handleNextMonth}
            className="p-2 hover:bg-white/10 rounded-lg transition-all duration-200 hover:scale-110"
          >
            <ChevronRight className="w-6 h-6 text-white" />
          </button>
        </div>

        {/* Day labels */}
        <div className="grid grid-cols-7 gap-2 mb-2">
          {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((day) => (
            <div
              key={day}
              className="text-center text-sm font-semibold text-gray-400 py-2"
            >
              {day}
            </div>
          ))}
        </div>

        {/* Calendar grid */}
        <div className="grid grid-cols-7 gap-2">
          {/* Empty cells for days before month starts */}
          {Array.from({ length: firstDayOfMonth }).map((_, i) => (
            <div key={`empty-${i}`} />
          ))}

          {/* Days of the month */}
          {Array.from({ length: daysInMonth }).map((_, i) => {
            const day = i + 1;
            const selected = isSelectedDate(day);
            const todayDate = isToday(day);

            return (
              <button
                key={day}
                onClick={() => handleDateClick(day)}
                className={`
                  aspect-square rounded-lg font-semibold text-sm transition-all duration-200
                  ${
                    selected
                      ? "bg-white text-gray-900 scale-110 shadow-lg"
                      : todayDate
                      ? "bg-white/20 text-white border-2 border-white/40 hover:bg-white/30"
                      : "bg-white/5 text-white hover:bg-white/10 hover:scale-105"
                  }
                `}
              >
                {day}
              </button>
            );
          })}
        </div>

        {/* Footer */}
        <div className="mt-6 flex gap-3">
          <button
            onClick={() => {
              onDateChange(new Date());
            }}
            className="flex-1 px-4 py-2.5 bg-white/10 hover:bg-white/15 text-white font-semibold rounded-lg border border-white/20 transition-all duration-200 hover:scale-105"
          >
            Today
          </button>
          <button
            onClick={onClose}
            className="flex-1 px-4 py-2.5 text-gray-400 hover:text-white font-semibold rounded-lg hover:bg-white/5 transition-all duration-200"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}