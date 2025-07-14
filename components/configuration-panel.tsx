"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Slider } from "@/components/ui/slider"
import { Switch } from "@/components/ui/switch"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Settings, Brain, Clock, Search, Save, RotateCcw, Key, Globe } from "lucide-react"

import { useDebateStore } from "@/store/debate-store"

export function ConfigurationPanel() {
  const { config, updateConfig, resetConfig } = useDebateStore()
  const [tempConfig, setTempConfig] = useState(config)
  const [showApiKeys, setShowApiKeys] = useState(false)

  const handleSave = () => {
    updateConfig(tempConfig)
  }

  const handleReset = () => {
    resetConfig()
    setTempConfig(config)
  }

  const updateTempConfig = (path: string, value: any) => {
    const keys = path.split(".")
    const newConfig = { ...tempConfig }
    let current = newConfig

    for (let i = 0; i < keys.length - 1; i++) {
      current = current[keys[i]]
    }
    current[keys[keys.length - 1]] = value

    setTempConfig(newConfig)
  }

  const providers = [
    { value: "google", label: "Google (Gemini)", models: ["gemini-2.0-flash-exp", "gemini-pro"] },
    { value: "openai", label: "OpenAI", models: ["gpt-4", "gpt-3.5-turbo"] },
    { value: "anthropic", label: "Anthropic", models: ["claude-3-sonnet-20240229", "claude-3-haiku-20240307"] },
    { value: "xai", label: "xAI (Grok)", models: ["grok-beta"] },
    { value: "groq", label: "Groq", models: ["llama2-70b-4096", "mixtral-8x7b-32768"] },
  ]

  const searchProviders = [
    { value: "duckduckgo", label: "DuckDuckGo (Free)" },
    { value: "tavily", label: "Tavily (API Key Required)" },
    { value: "serpapi", label: "SerpAPI (API Key Required)" },
  ]

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Settings className="w-5 h-5" />
              <span>Configuration</span>
            </div>
            <div className="flex space-x-2">
              <Button variant="outline" size="sm" onClick={handleReset}>
                <RotateCcw className="w-4 h-4 mr-2" />
                Reset
              </Button>
              <Button size="sm" onClick={handleSave}>
                <Save className="w-4 h-4 mr-2" />
                Save
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
              {["pro", "con", "judge"].map((agentType) => (
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
                          value={tempConfig.agents[agentType].provider}
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
                          value={tempConfig.agents[agentType].model}
                          onValueChange={(value) => updateTempConfig(`agents.${agentType}.model`, value)}
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {providers
                              .find((p) => p.value === tempConfig.agents[agentType].provider)
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
                            {tempConfig.agents[agentType].temperature}
                          </span>
                        </Label>
                        <Slider
                          value={[tempConfig.agents[agentType].temperature]}
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
                          value={tempConfig.agents[agentType].max_tokens}
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
              ))}
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
    </div>
  )
}
