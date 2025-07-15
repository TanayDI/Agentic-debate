"use client"

import { useState, useEffect, useCallback, useMemo } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Slider } from "@/components/ui/slider"
import { Switch } from "@/components/ui/switch"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Settings, Brain, Clock, Search, Save, RotateCcw, Key, Globe, Check } from "lucide-react"

import { useDebateStore } from "@/store/debate-store"
import { useToast } from "@/hooks/use-toast"

export function ConfigurationPanel() {
  const { config, updateConfig, resetConfig, isHydrated, hydrateConfig } = useDebateStore()
  const { toast } = useToast()
  const [tempConfig, setTempConfig] = useState(config)
  const [showApiKeys, setShowApiKeys] = useState(false)
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved'>('idle')

  // Hydrate the config on mount
  useEffect(() => {
    if (!isHydrated) {
      hydrateConfig()
    }
  }, [isHydrated, hydrateConfig])

  // Sync tempConfig with store config
  useEffect(() => {
    setTempConfig(config)
  }, [config])

  // Reset save status when config changes
  useEffect(() => {
    setSaveStatus('idle')
  }, [tempConfig])

  // Check if configuration has changes
  const hasChanges = useMemo(() => {
    if (!isHydrated) return false
    const tempStr = JSON.stringify(tempConfig)
    const configStr = JSON.stringify(config)
    const hasChange = tempStr !== configStr
    console.log('hasChanges check:', { 
      hasChange, 
      isHydrated, 
      tempConfigKeys: Object.keys(tempConfig), 
      configKeys: Object.keys(config),
      tempStr: tempStr.slice(0, 200), 
      configStr: configStr.slice(0, 200) 
    })
    return hasChange
  }, [tempConfig, config, isHydrated])

  const handleSave = useCallback(() => {
    setSaveStatus('saving')
    
    try {
      updateConfig(tempConfig)
      setSaveStatus('saved')
      
      // Show success toast
      toast({
        title: "Configuration saved!",
        description: "Your debate settings have been successfully saved.",
        duration: 3000,
      })
      
      // Reset to idle after 2 seconds
      setTimeout(() => {
        setSaveStatus('idle')
      }, 2000)
    } catch (error) {
      console.error('Error saving configuration:', error)
      setSaveStatus('idle')
      
      // Show error toast
      toast({
        title: "Error saving configuration",
        description: "There was an issue saving your settings. Please try again.",
        variant: "destructive",
        duration: 4000,
      })
    }
  }, [tempConfig, updateConfig, toast])

  const handleReset = useCallback(() => {
    resetConfig()
    setTempConfig(config)
    setSaveStatus('idle')
    
    // Show reset toast
    toast({
      title: "Configuration reset",
      description: "All settings have been restored to their defaults.",
      duration: 3000,
    })
  }, [resetConfig, config, toast])

  // Handle keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.ctrlKey && e.key === 's') {
        e.preventDefault()
        if (hasChanges && saveStatus === 'idle') {
          handleSave()
        }
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [hasChanges, saveStatus, handleSave])

  const updateTempConfig = (path: string, value: any) => {
    const keys = path.split(".");
    
    setTempConfig(prevConfig => {
      const newConfig = JSON.parse(JSON.stringify(prevConfig)); // Deep copy
      let current: any = newConfig;

      for (let i = 0; i < keys.length - 1; i++) {
        current = current[keys[i] as keyof typeof current];
      }
      current[keys[keys.length - 1] as keyof typeof current] = value;
      
      return newConfig;
    });
  }

  const providers = [
    { value: "google", label: "Google (Gemini)", models: ["gemini-1.5-flash", "gemini-1.5-pro", "gemini-2.0-flash-exp"] },
    { value: "openai", label: "OpenAI", models: ["gpt-4", "gpt-4-turbo", "gpt-3.5-turbo"] },
    { value: "anthropic", label: "Anthropic", models: ["claude-3-5-sonnet-20241022", "claude-3-sonnet-20240229", "claude-3-haiku-20240307"] },
    { value: "xai", label: "xAI (Grok)", models: ["grok-beta", "grok-2-1212"] },
    { value: "groq", label: "Groq", models: ["llama-3.1-70b-versatile", "llama2-70b-4096", "mixtral-8x7b-32768"] },
  ]

  const searchProviders = [
    { value: "duckduckgo", label: "DuckDuckGo (Free)" },
    { value: "tavily", label: "Tavily (API Key Required)" },
    { value: "serpapi", label: "SerpAPI (API Key Required)" },
  ]

  return (
    <div className="space-y-6">
      {!isHydrated && (
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-center space-x-2 text-muted-foreground">
              <div className="w-4 h-4 animate-spin border-2 border-current border-t-transparent rounded-full"></div>
              <span>Loading configuration...</span>
            </div>
          </CardContent>
        </Card>
      )}
      
      {isHydrated && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Settings className="w-5 h-5" />
                <span>Configuration</span>
                {hasChanges && (
                  <div className="flex items-center space-x-1 text-sm text-orange-600">
                    <div className="w-2 h-2 bg-orange-500 rounded-full"></div>
                    <span className="text-xs">Unsaved changes</span>
                  </div>
                )}
                {!hasChanges && isHydrated && (
                  <div className="flex items-center space-x-1 text-sm text-green-600">
                    <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                    <span className="text-xs">No changes</span>
                  </div>
                )}
              </div>
              <div className="flex space-x-2">
                <Button variant="outline" size="sm" onClick={handleReset}>
                  <RotateCcw className="w-4 h-4 mr-2" />
                  Reset
                </Button>
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={() => {
                    console.log('Test change - setting max_turns to 5')
                    updateTempConfig('debate.max_turns', 5)
                  }}
                >
                  Test Change
                </Button>
                <Button 
                  size="sm" 
                  onClick={handleSave}
                  disabled={saveStatus === 'saving' || (!hasChanges && isHydrated)}
                  className={`transition-all duration-200 ${
                    saveStatus === 'saved' 
                      ? 'bg-green-600 hover:bg-green-700 text-white' 
                      : ''
                  }`}
                >
                  {saveStatus === 'saving' ? (
                    <>
                      <div className="w-4 h-4 mr-2 animate-spin border-2 border-white border-t-transparent rounded-full"></div>
                      Saving...
                    </>
                  ) : saveStatus === 'saved' ? (
                    <>
                      <Check className="w-4 h-4 mr-2" />
                      Saved!
                    </>
                  ) : (
                    <>
                      <Save className="w-4 h-4 mr-2" />
                      Save
                    </>
                  )}
                </Button>
              </div>
            </CardTitle>
          </CardHeader>
        <CardContent>
          <Tabs defaultValue="debate" className="space-y-4">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="debate">Debate</TabsTrigger>
              <TabsTrigger value="agents">Agents</TabsTrigger>
              <TabsTrigger value="tools">Tools</TabsTrigger>
              <TabsTrigger value="api">API Keys</TabsTrigger>
            </TabsList>

            {/* Debate Settings */}
            <TabsContent value="debate" className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label className="flex items-center space-x-2">
                      <Clock className="w-4 h-4" />
                      <span>Maximum Turns</span>
                    </Label>
                    <div className="px-3">
                      <Slider
                        value={[tempConfig.debate.max_turns]}
                        onValueChange={([value]) => updateTempConfig("debate.max_turns", value)}
                        max={20}
                        min={2}
                        step={1}
                        className="w-full"
                      />
                      <div className="flex justify-between text-xs text-muted-foreground mt-1">
                        <span>2</span>
                        <span>{tempConfig.debate.max_turns} turns</span>
                        <span>20</span>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label>Maximum Time (seconds)</Label>
                    <Input
                      type="number"
                      value={tempConfig.debate.max_time}
                      onChange={(e) => updateTempConfig("debate.max_time", Number.parseInt(e.target.value))}
                      min={300}
                      max={7200}
                    />
                    <p className="text-xs text-muted-foreground">Total debate duration limit (300-7200 seconds)</p>
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label>Turn Timeout (seconds)</Label>
                    <Input
                      type="number"
                      value={tempConfig.debate.turn_timeout}
                      onChange={(e) => updateTempConfig("debate.turn_timeout", Number.parseInt(e.target.value))}
                      min={30}
                      max={300}
                    />
                    <p className="text-xs text-muted-foreground">Maximum time per agent turn (30-300 seconds)</p>
                  </div>
                </div>
              </div>
            </TabsContent>

            {/* Agent Settings */}
            <TabsContent value="agents" className="space-y-6">
              {(["pro", "con", "judge"] as const).map((agentType) => {
                const agent = tempConfig.agents[agentType];
                return (
                  <Card key={agentType}>
                    <CardHeader className="pb-3">
                      <CardTitle className="text-lg capitalize flex items-center space-x-2">
                        <Brain className="w-5 h-5" />
                        <span>{agentType} Agent</span>
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label>Provider</Label>
                          <Select
                            value={agent.provider}
                            onValueChange={(value) => updateTempConfig(`agents.${agentType}.provider`, value)}
                          >
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              {providers.map((provider) => (
                                <SelectItem key={provider.value} value={provider.value}>
                                  {provider.label}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>

                        <div className="space-y-2">
                          <Label>Model</Label>
                          <Select
                            value={agent.model}
                            onValueChange={(value) => updateTempConfig(`agents.${agentType}.model`, value)}
                          >
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              {providers
                                .find((p) => p.value === agent.provider)
                                ?.models.map((model) => (
                                  <SelectItem key={model} value={model}>
                                    {model}
                                  </SelectItem>
                                ))}
                            </SelectContent>
                          </Select>
                        </div>

                        <div className="space-y-2">
                          <Label className="flex items-center justify-between">
                            <span>Temperature</span>
                            <span className="text-sm text-muted-foreground">
                              {agent.temperature}
                            </span>
                          </Label>
                          <Slider
                            value={[agent.temperature]}
                            onValueChange={([value]) => updateTempConfig(`agents.${agentType}.temperature`, value)}
                            max={1}
                            min={0}
                            step={0.1}
                            className="w-full"
                          />
                        </div>

                        <div className="space-y-2">
                          <Label>Max Tokens</Label>
                          <Input
                            type="number"
                            value={agent.max_tokens}
                            onChange={(e) =>
                              updateTempConfig(`agents.${agentType}.max_tokens`, Number.parseInt(e.target.value))
                            }
                            min={100}
                            max={4000}
                          />
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </TabsContent>

            {/* Tools Settings */}
            <TabsContent value="tools" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <Search className="w-5 h-5" />
                    <span>Web Search</span>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Search Provider</Label>
                      <Select
                        value={tempConfig.tools.web_search.provider}
                        onValueChange={(value) => updateTempConfig("tools.web_search.provider", value)}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {searchProviders.map((provider) => (
                            <SelectItem key={provider.value} value={provider.value}>
                              {provider.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label>Max Results</Label>
                      <Input
                        type="number"
                        value={tempConfig.tools.web_search.max_results}
                        onChange={(e) =>
                          updateTempConfig("tools.web_search.max_results", Number.parseInt(e.target.value))
                        }
                        min={1}
                        max={10}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label>Timeout (seconds)</Label>
                      <Input
                        type="number"
                        value={tempConfig.tools.web_search.timeout}
                        onChange={(e) => updateTempConfig("tools.web_search.timeout", Number.parseInt(e.target.value))}
                        min={10}
                        max={120}
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* API Keys */}
            <TabsContent value="api" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <Key className="w-5 h-5" />
                      <span>API Keys</span>
                    </div>
                    <Switch checked={showApiKeys} onCheckedChange={setShowApiKeys} />
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 gap-4">
                    {[
                      { key: "google_api_key", label: "Google API Key", required: true },
                      { key: "openai_api_key", label: "OpenAI API Key" },
                      { key: "anthropic_api_key", label: "Anthropic API Key" },
                      { key: "xai_api_key", label: "xAI API Key" },
                      { key: "groq_api_key", label: "Groq API Key" },
                      { key: "tavily_api_key", label: "Tavily API Key" },
                      { key: "serpapi_key", label: "SerpAPI Key" },
                    ].map((apiKey) => (
                      <div key={apiKey.key} className="space-y-2">
                        <Label className="flex items-center justify-between">
                          <span>{apiKey.label}</span>
                          {apiKey.required && <span className="text-xs text-red-500">Required</span>}
                        </Label>
                        <Input
                          type={showApiKeys ? "text" : "password"}
                          value={tempConfig.api_keys[apiKey.key] || ""}
                          onChange={(e) => updateTempConfig(`api_keys.${apiKey.key}`, e.target.value)}
                          placeholder={`Enter ${apiKey.label.toLowerCase()}`}
                        />
                      </div>
                    ))}
                  </div>

                  <div className="mt-4 p-4 bg-muted rounded-lg">
                    <p className="text-sm text-muted-foreground">
                      <Globe className="w-4 h-4 inline mr-2" />
                      API keys are stored locally and can also be set via environment variables.
                    </p>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
      )}
    </div>
  )
}
