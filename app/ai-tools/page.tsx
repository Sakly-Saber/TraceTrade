"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Navigation } from "@/components/navigation"
import { AIInsights } from "@/components/ai-insights"
import { 
  Brain, 
  Gavel, 
  FileCheck, 
  Bot, 
  Zap, 
  Shield, 
  TrendingUp, 
  MessageSquare,
  CheckCircle2,
  Sparkles,
  Target,
  Users,
  Clock,
  ArrowRight,
  Star
} from "lucide-react"

export default function AIToolsPage() {
  const [activeDemo, setActiveDemo] = useState<string | null>(null)

  const aiTools = [
    {
      id: "ai-actioner",
      title: "AI ACTIONER",
      subtitle: "Intelligent Trading Assistant",
      description: "Advanced AI agent that automatically executes optimal trading strategies based on market analysis and user preferences.",
      icon: <Bot className="w-8 h-8" />,
      features: [
        "Real-time market monitoring and analysis",
        "Automated bid placement with risk management",
        "Smart contract optimization",
        "Portfolio diversification recommendations",
        "24/7 autonomous trading operations"
      ],
      benefits: [
        "Maximize trading profits through AI-driven decisions",
        "Reduce emotional trading mistakes",
        "Execute trades faster than humanly possible",
        "Never miss profitable opportunities"
      ],
      status: "Active",
      color: "from-blue-500 to-indigo-600"
    },
    {
      id: "ai-legal-verifier",
      title: "AI LEGAL DOCS VERIFIER",
      subtitle: "Intelligent Document Validation",
      description: "Sophisticated AI system that verifies legal documents, contracts, and compliance requirements for B2B transactions.",
      icon: <FileCheck className="w-8 h-8" />,
      features: [
        "Automated legal document analysis",
        "Contract compliance verification",
        "Risk assessment and flagging",
        "Regulatory compliance checking",
        "Multi-jurisdiction legal validation"
      ],
      benefits: [
        "Eliminate legal risks in transactions",
        "Reduce document review time by 90%",
        "Ensure regulatory compliance",
        "Prevent costly legal disputes"
      ],
      status: "Active",
      color: "from-green-500 to-emerald-600"
    },
    {
      id: "personal-ai-assistant",
      title: "PERSONAL AI ASSISTANT",
      subtitle: "Your Intelligent Bidding Companion",
      description: "Personalized AI assistant that learns your trading patterns and preferences to bid and buy on your behalf with maximum efficiency.",
      icon: <MessageSquare className="w-8 h-8" />,
      features: [
        "Learning algorithm adapts to your style",
        "Automated bidding with custom parameters",
        "Real-time market alerts and notifications",
        "Personalized investment recommendations",
        "Voice and chat interaction capabilities"
      ],
      benefits: [
        "Never miss important bidding opportunities",
        "Optimize your investment strategy",
        "Save time with automated processes",
        "Get personalized market insights"
      ],
      status: "Active",
      color: "from-purple-500 to-pink-600"
    },
    {
      id: "ai-market-analyzer",
      title: "AI MARKET INSIGHTS",
      subtitle: "Advanced Market Intelligence & Analytics",
      description: "Real-time market intelligence platform delivering actionable insights into commodity trends, pricing patterns, and emerging market opportunities across global trading networks.",
      icon: <TrendingUp className="w-8 h-8" />,
      features: [
        "Real-time market sentiment analysis",
        "Predictive pricing models and forecasting",
        "AI-powered trade opportunity detection",
        "Competitive intelligence dashboard"
      ],
      benefits: [
        "Gain competitive advantage with market foresight",
        "Optimize trading strategies with data-driven insights",
        "Identify emerging market opportunities early",
        "Minimize risks and make informed decisions with comprehensive intelligence"
      ],
      status: "Active",
      color: "from-orange-500 to-red-600"
    }
  ]

  return (
    <div className="min-h-screen relative">
      {/* Crystal Glass Background */}
      <div 
        className="absolute inset-0 bg-cover bg-center bg-no-repeat"
        style={{
          backgroundImage: 'url(/crystal-glass-whisk-bg.jpg)',
          backgroundAttachment: 'fixed'
        }}
      >
        <div className="absolute inset-0 bg-white/20 backdrop-blur-[0.5px]"></div>
      </div>
      
      <div className="relative z-10">
        <Navigation />

        <div className="max-w-7xl mx-auto px-6 py-12">
          {/* Header */}
          <div className="text-center mb-16">
            <div className="inline-flex items-center px-4 py-2 bg-white/60 backdrop-blur-sm border border-white/30 text-blue-700 rounded-full text-sm font-medium mb-6 shadow-lg">
              <Brain className="w-4 h-4 mr-2" />
              AI-Powered Trading Platform
            </div>
            <h1 className="text-5xl font-bold mb-6">
              <span className="bg-gradient-to-r from-gray-900 via-gray-700 to-gray-900 bg-clip-text text-transparent drop-shadow-lg">
                Magnificent AI Tools
              </span>
            </h1>
            <p className="text-xl text-gray-800 max-w-4xl mx-auto leading-relaxed mb-8 bg-white/30 backdrop-blur-sm rounded-2xl p-6 border border-white/20">
              Experience the future of B2B trading with our revolutionary AI-powered tools. 
              From intelligent document verification to autonomous trading assistants, 
              our AI ecosystem transforms how businesses trade commodities.
            </p>
            
            <div className="flex flex-wrap justify-center gap-4 mb-12">
              <Badge className="bg-blue-500/20 text-blue-700 border-blue-300/50 backdrop-blur-sm px-4 py-2">
                <Sparkles className="w-4 h-4 mr-2" />
                4 AI Tools Active
              </Badge>
              <Badge className="bg-green-500/20 text-green-700 border-green-300/50 backdrop-blur-sm px-4 py-2">
                <Shield className="w-4 h-4 mr-2" />
                Enterprise Grade Security
              </Badge>
              <Badge className="bg-purple-500/20 text-purple-700 border-purple-300/50 backdrop-blur-sm px-4 py-2">
                <Zap className="w-4 h-4 mr-2" />
                Real-time Processing
              </Badge>
            </div>
          </div>

          {/* AI Tools Grid */}
          <div className="grid lg:grid-cols-2 gap-8 mb-16">
            {aiTools.map((tool) => (
              <Card key={tool.id} className="bg-white/80 backdrop-blur-md border border-white/30 hover:shadow-2xl transition-all duration-500 group shadow-xl overflow-hidden">
                <div className={`h-2 bg-gradient-to-r ${tool.color}`}></div>
                
                <CardHeader className="pb-4">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-4">
                      <div className={`p-3 rounded-xl bg-gradient-to-r ${tool.color} text-white shadow-lg group-hover:scale-110 transition-transform duration-300`}>
                        {tool.icon}
                      </div>
                      <div>
                        <CardTitle className="text-xl font-bold text-gray-900 mb-1">{tool.title}</CardTitle>
                        <CardDescription className="text-gray-600 font-medium">{tool.subtitle}</CardDescription>
                      </div>
                    </div>
                    <Badge className="bg-green-100 text-green-700 border-green-300">
                      <CheckCircle2 className="w-3 h-3 mr-1" />
                      {tool.status}
                    </Badge>
                  </div>
                  <p className="text-gray-700 leading-relaxed mt-4">{tool.description}</p>
                </CardHeader>

                <CardContent className="space-y-6">
                  {/* Features */}
                  <div>
                    <h4 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                      <Star className="w-4 h-4 text-yellow-500" />
                      Key Features
                    </h4>
                    <ul className="space-y-2">
                      {tool.features.map((feature, index) => (
                        <li key={index} className="flex items-start gap-2 text-sm text-gray-600">
                          <CheckCircle2 className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
                          {feature}
                        </li>
                      ))}
                    </ul>
                  </div>

                  {/* Benefits */}
                  <div>
                    <h4 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                      <Target className="w-4 h-4 text-blue-500" />
                      Business Benefits
                    </h4>
                    <ul className="space-y-2">
                      {tool.benefits.map((benefit, index) => (
                        <li key={index} className="flex items-start gap-2 text-sm text-gray-600">
                          <ArrowRight className="w-4 h-4 text-blue-500 mt-0.5 flex-shrink-0" />
                          {benefit}
                        </li>
                      ))}
                    </ul>
                  </div>

                  {/* Action Buttons */}
                  <div className="flex gap-3 pt-4">
                    <Button 
                      className={`flex-1 bg-gradient-to-r ${tool.color} hover:opacity-90 transition-opacity shadow-lg`}
                      onClick={() => setActiveDemo(tool.id)}
                    >
                      <Zap className="w-4 h-4 mr-2" />
                      Try Demo
                    </Button>
                    <Button variant="outline" className="bg-white/80 backdrop-blur-sm border-white/30 hover:bg-white/90">
                      Learn More
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Live Demo Section */}
          <Card className="bg-white/80 backdrop-blur-md border border-white/30 shadow-xl mb-16">
            <CardHeader>
              <CardTitle className="text-3xl font-bold text-gray-900 text-center">
                Experience AI in Action
              </CardTitle>
              <CardDescription className="text-center text-gray-600 text-lg">
                Interactive demo of our AI Market Insights and Treasury Intelligence
              </CardDescription>
            </CardHeader>
            <CardContent>
              <AIInsights 
                commodity="Copper Ore"
                quantity={100}
                grade="Grade A"
                walletAddress="0x1234...5678"
                auctionData={{}}
              />
            </CardContent>
          </Card>

          {/* Statistics Section */}
          <div className="grid md:grid-cols-4 gap-6 mb-16">
            {[
              { label: "AI Decisions/Day", value: "50,000+", icon: <Brain className="w-6 h-6" />, color: "text-blue-600" },
              { label: "Documents Verified", value: "1M+", icon: <FileCheck className="w-6 h-6" />, color: "text-green-600" },
              { label: "Active AI Assistants", value: "5,000+", icon: <Bot className="w-6 h-6" />, color: "text-purple-600" },
              { label: "Success Rate", value: "99.7%", icon: <CheckCircle2 className="w-6 h-6" />, color: "text-orange-600" }
            ].map((stat, index) => (
              <Card key={index} className="bg-white/80 backdrop-blur-md border border-white/30 shadow-xl text-center group hover:scale-105 transition-transform duration-300">
                <CardContent className="p-6">
                  <div className={`${stat.color} mx-auto mb-3 group-hover:scale-110 transition-transform duration-300`}>
                    {stat.icon}
                  </div>
                  <div className="text-3xl font-bold text-gray-900 mb-2">{stat.value}</div>
                  <div className="text-gray-600 font-medium">{stat.label}</div>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Call to Action */}
          <Card className="bg-gradient-to-r from-blue-600 to-purple-600 text-white border-none shadow-2xl">
            <CardContent className="p-8 text-center">
              <h3 className="text-3xl font-bold mb-4">Ready to Transform Your Business?</h3>
              <p className="text-xl mb-6 opacity-90">
                Join thousands of businesses already using our AI tools to revolutionize their trading operations.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Button size="lg" className="bg-white text-blue-600 hover:bg-gray-100 shadow-lg">
                  <Users className="w-5 h-5 mr-2" />
                  Start Free Trial
                </Button>
                <Button size="lg" variant="outline" className="border-white text-white hover:bg-white/10">
                  <MessageSquare className="w-5 h-5 mr-2" />
                  Schedule Demo
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}