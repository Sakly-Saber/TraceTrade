import AfricaMap from "@/components/africa-map-v2";

export default function AfricaMapDemo() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl md:text-6xl font-bold text-white mb-4">
            Interactive Africa Map
          </h1>
          <p className="text-xl text-gray-300 max-w-2xl mx-auto">
            Explore the continent with our glassmorphic interactive map. 
            Hover over countries to see smooth animations and information.
          </p>
        </div>

        {/* Map Container */}
        <div className="flex justify-center items-center">
          {/* Make the map much larger: increase container height and allow wider max width */}
          <div className="w-full max-w-7xl h-[1200px]">
            <AfricaMap />
          </div>
        </div>

        {/* Features */}
        <div className="mt-16 grid grid-cols-1 md:grid-cols-3 gap-8 text-center">
          <div className="glass-card p-6">
            <div className="text-blue-400 text-3xl mb-4">✨</div>
            <h3 className="text-xl font-semibold text-white mb-2">Glassmorphic Design</h3>
            <p className="text-gray-300">Beautiful translucent effects with backdrop blur and subtle borders</p>
          </div>
          
          <div className="glass-card p-6">
            <div className="text-green-400 text-3xl mb-4">🎯</div>
            <h3 className="text-xl font-semibold text-white mb-2">Interactive Animations</h3>
            <p className="text-gray-300">Smooth scale and color transitions powered by anime.js</p>
          </div>
          
          <div className="glass-card p-6">
            <div className="text-purple-400 text-3xl mb-4">💫</div>
            <h3 className="text-xl font-semibold text-white mb-2">Dynamic Tooltips</h3>
            <p className="text-gray-300">Real-time country information following your cursor</p>
          </div>
        </div>
      </div>
    </div>
  );
}