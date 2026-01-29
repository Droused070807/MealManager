import { Utensils, Clock, Leaf, TrendingUp, ArrowRight } from "lucide-react";

interface LandingPageProps {
  onGetStarted: () => void;
}

export default function LandingPage({ onGetStarted }: LandingPageProps) {
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-black text-white">
      {/* Hero Section */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-20 pb-16 sm:pt-24 sm:pb-20">
        <div className="text-center">
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-white/10 backdrop-blur-sm border border-white/20 text-white rounded-full text-sm font-medium mb-8 animate-in fade-in slide-in-from-top duration-500">
            <Utensils className="w-4 h-4" />
            <span>LSU Dining Made Simple</span>
          </div>
          
          <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-bold text-white mb-6 leading-tight animate-in fade-in slide-in-from-bottom duration-700 delay-100">
            Know What's For Dinner
            <br />
            <span className="text-gray-400">Before You Go</span>
          </h1>
          
          <p className="text-lg sm:text-xl text-gray-300 mb-10 max-w-2xl mx-auto animate-in fade-in slide-in-from-bottom duration-700 delay-200">
            View daily menus from LSU's 459 Commons dining hall with detailed nutritional information. 
            Plan your meals smarter.
          </p>
          
          <button
            onClick={onGetStarted}
            className="inline-flex items-center gap-2 px-8 py-4 bg-white text-gray-900 rounded-lg text-lg font-semibold hover:bg-gray-100 transition-all duration-300 shadow-2xl hover:shadow-white/20 hover:scale-105 active:scale-95 animate-in fade-in zoom-in duration-700 delay-300"
          >
            View Today's Menu
            <ArrowRight className="w-5 h-5 transition-transform duration-300 group-hover:translate-x-1" />
          </button>
        </div>
      </div>

      {/* Features Section */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 sm:py-20">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          <FeatureCard
            icon={<Clock className="w-8 h-8" />}
            title="Real-Time Menus"
            description="Get up-to-date breakfast, lunch, and dinner menus instantly"
            delay={0}
          />
          <FeatureCard
            icon={<TrendingUp className="w-8 h-8" />}
            title="Nutrition Info"
            description="See calories, protein, carbs, fat, and sugar for every item"
            delay={100}
          />
          <FeatureCard
            icon={<Leaf className="w-8 h-8" />}
            title="Dietary Filters"
            description="Easily identify vegan and vegetarian options"
            delay={200}
          />
          <FeatureCard
            icon={<Utensils className="w-8 h-8" />}
            title="Protein Tracking"
            description="Find the highest protein options for your fitness goals"
            delay={300}
          />
        </div>
      </div>

      {/* CTA Section */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-16 sm:py-20">
        <div className="bg-gradient-to-br from-gray-800 to-gray-900 border border-white/10 rounded-2xl p-8 sm:p-12 text-center backdrop-blur-xl transition-all duration-300 hover:border-white/20 hover:shadow-2xl">
          <h2 className="text-3xl sm:text-4xl font-bold text-white mb-4 transition-colors duration-300">
            Ready to Plan Your Meals?
          </h2>
          <p className="text-gray-300 text-lg mb-8 transition-colors duration-300">
            Start viewing today's menu and make informed dining decisions
          </p>
          <button
            onClick={onGetStarted}
            className="inline-flex items-center gap-2 px-8 py-4 bg-white text-gray-900 rounded-lg text-lg font-semibold hover:bg-gray-100 transition-all duration-300 hover:scale-105 active:scale-95 group"
          >
            Get Started
            <ArrowRight className="w-5 h-5 transition-transform duration-300 group-hover:translate-x-1" />
          </button>
        </div>
      </div>

      {/* Footer */}
      <footer className="border-t border-white/10 py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center text-gray-400 transition-colors duration-300">
          <p>Made for LSU students • 459 Commons Dining Hall</p>
        </div>
      </footer>
    </div>
  );
}

function FeatureCard({ icon, title, description, delay }: { icon: React.ReactNode; title: string; description: string; delay: number }) {
  return (
    <div 
      className="bg-white/5 backdrop-blur-sm rounded-xl p-6 border border-white/10 hover:border-white/20 hover:bg-white/10 transition-all duration-300 hover:scale-105 hover:shadow-xl animate-in fade-in slide-in-from-bottom duration-700"
      style={{ animationDelay: `${delay}ms` }}
    >
      <div className="w-12 h-12 bg-white/10 rounded-lg flex items-center justify-center text-white mb-4 transition-all duration-300 group-hover:scale-110">
        {icon}
      </div>
      <h3 className="text-xl font-bold text-white mb-2 transition-colors duration-300">{title}</h3>
      <p className="text-gray-400 transition-colors duration-300">{description}</p>
    </div>
  );
}
