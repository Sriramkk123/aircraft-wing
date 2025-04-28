"use client"

import { useState, useEffect } from "react"
import { Canvas } from "@react-three/fiber"
import { OrbitControls, Environment, PerspectiveCamera } from "@react-three/drei"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Card, CardContent } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Slider } from "@/components/ui/slider"
import { Button } from "@/components/ui/button"
import { Eye, EyeOff, Play, Pause } from "lucide-react"
import { FixedLeadingEdge } from "./components/fixed-leading-edge"
import { DeployableSlats } from "./components/deployable-slats"
import { FowlerFlaps } from "./components/fowler-flaps"
import { Ailerons } from "./components/ailerons"
import { Spoilers } from "./components/spoilers"
import { Winglets } from "./components/winglets"
import { FuselageFairing } from "./components/fuselage-fairing"
import { WingSurfaceDetails } from "./components/wing-surface-details"
import { InternalWingSystems } from "./components/internal-wing-systems"

export default function AircraftWingViewer() {
  // Selected component/module
  const [selectedModule, setSelectedModule] = useState("full-assembly")

  // View mode for visualization
  const [viewMode, setViewMode] = useState("complete")

  // Component visibility
  const [showSkin, setShowSkin] = useState(true)
  const [showSpars, setShowSpars] = useState(true)
  const [showRibs, setShowRibs] = useState(true)
  const [showLeadingEdge, setShowLeadingEdge] = useState(true)
  const [showSlats, setShowSlats] = useState(true)
  const [showFlaps, setShowFlaps] = useState(true)
  const [showWinglets, setShowWinglets] = useState(true)
  const [showFuselageFairing, setShowFuselageFairing] = useState(true)
  const [showWingSurfaceDetails, setShowWingSurfaceDetails] = useState(true)
  const [showInternalWingSystems, setShowInternalWingSystems] = useState(true)

  // Exploded view amount
  const [explodeAmount, setExplodeAmount] = useState(0)

  // High-lift device deployment
  const [slatDeployment, setSlatDeployment] = useState(0)
  const [flapDeployment, setFlapDeployment] = useState(0)
  const [autoDeploying, setAutoDeploying] = useState(false)
  const [deploymentDirection, setDeploymentDirection] = useState(1) // 1 = deploying, -1 = retracting
  const [animationTarget, setAnimationTarget] = useState("both") // "slats", "flaps", or "both"

  // Control surfaces
  const [aileronDeflection, setAileronDeflection] = useState(0) // -1 to 1, where -1 is down, 0 is neutral, 1 is up
  const [spoilerDeployment, setSpoilerDeployment] = useState(0) // 0 to 1, where 0 is stowed, 1 is fully deployed
  const [showAilerons, setShowAilerons] = useState(true)
  const [showSpoilers, setShowSpoilers] = useState(true)

  // Active tab
  const [activeTab, setActiveTab] = useState("view")

  // Determine which components to show based on selected module
  const shouldShowWingBox = selectedModule === "full-assembly" || selectedModule === "wing-box"
  const shouldShowLeadingEdge =
    selectedModule === "full-assembly" || selectedModule === "leading-edge" || selectedModule === "slats"
  const shouldShowSlats = selectedModule === "full-assembly" || selectedModule === "slats"
  const shouldShowFlaps = selectedModule === "full-assembly" || selectedModule === "flaps"
  const shouldShowAilerons = selectedModule === "full-assembly" || selectedModule === "ailerons"
  const shouldShowSpoilers = selectedModule === "full-assembly" || selectedModule === "spoilers"
  const shouldShowWinglets = selectedModule === "full-assembly" || selectedModule === "winglets"
  const shouldShowFuselageFairing = selectedModule === "full-assembly" || selectedModule === "fuselage-fairing"
  const shouldShowWingSurfaceDetails = selectedModule === "full-assembly" || selectedModule === "wing-surface-details"
  const shouldShowInternalWingSystems = selectedModule === "full-assembly" || selectedModule === "internal-wing-systems"

  // Auto-deployment animation
  useEffect(() => {
    if (!autoDeploying) return

    const interval = setInterval(() => {
      if (animationTarget === "slats" || animationTarget === "both") {
        setSlatDeployment((prev) => {
          const newValue = prev + 0.01 * deploymentDirection
          return Math.max(0, Math.min(1, newValue))
        })
      }

      if (animationTarget === "flaps" || animationTarget === "both") {
        setFlapDeployment((prev) => {
          const newValue = prev + 0.01 * deploymentDirection
          return Math.max(0, Math.min(1, newValue))
        })
      }

      // Change direction when reaching limits
      if (
        (animationTarget === "slats" && slatDeployment >= 0.99 && deploymentDirection > 0) ||
        (animationTarget === "flaps" && flapDeployment >= 0.99 && deploymentDirection > 0) ||
        (animationTarget === "both" && slatDeployment >= 0.99 && flapDeployment >= 0.99 && deploymentDirection > 0)
      ) {
        setDeploymentDirection(-1)
      } else if (
        (animationTarget === "slats" && slatDeployment <= 0.01 && deploymentDirection < 0) ||
        (animationTarget === "flaps" && flapDeployment <= 0.01 && deploymentDirection < 0) ||
        (animationTarget === "both" && slatDeployment <= 0.01 && flapDeployment <= 0.01 && deploymentDirection < 0)
      ) {
        setDeploymentDirection(1)
      }
    }, 30)

    return () => clearInterval(interval)
  }, [autoDeploying, deploymentDirection, animationTarget, slatDeployment, flapDeployment])

  return (
    <div className="relative flex flex-col w-full h-screen bg-slate-100">
      <div className="flex-1 relative">
        <Canvas shadows>
          <PerspectiveCamera makeDefault position={[0, 1, 5]} fov={45} />
          <ambientLight intensity={0.5} />
          <directionalLight
            position={[10, 10, 5]}
            intensity={1}
            castShadow
            shadow-mapSize-width={2048}
            shadow-mapSize-height={2048}
          />

          {/* Wing Box Structure */}
          {shouldShowWingBox && (
            <WingBoxStructure
              viewMode={viewMode}
              showSkin={showSkin}
              showSpars={showSpars}
              showRibs={showRibs}
              explodeAmount={explodeAmount}
            />
          )}

          {/* Fixed Leading Edge */}
          {shouldShowLeadingEdge && <FixedLeadingEdge viewMode={viewMode} explodeAmount={explodeAmount} />}

          {/* Deployable Slats */}
          {shouldShowSlats && (
            <DeployableSlats viewMode={viewMode} explodeAmount={explodeAmount} deploymentPercentage={slatDeployment} />
          )}

          {/* Fowler Flaps */}
          {shouldShowFlaps && (
            <FowlerFlaps viewMode={viewMode} explodeAmount={explodeAmount} deploymentPercentage={flapDeployment} />
          )}

          {/* Ailerons */}
          {shouldShowAilerons && (
            <Ailerons viewMode={viewMode} explodeAmount={explodeAmount} deflectionAngle={aileronDeflection} />
          )}

          {/* Spoilers */}
          {shouldShowSpoilers && (
            <Spoilers viewMode={viewMode} explodeAmount={explodeAmount} deploymentPercentage={spoilerDeployment} />
          )}

          {/* Winglets */}
          {shouldShowWinglets && <Winglets viewMode={viewMode} explodeAmount={explodeAmount} />}

          {/* Fuselage Fairing */}
          {shouldShowFuselageFairing && <FuselageFairing viewMode={viewMode} explodeAmount={explodeAmount} />}

          {/* Wing Surface Details */}
          {shouldShowWingSurfaceDetails && <WingSurfaceDetails viewMode={viewMode} explodeAmount={explodeAmount} />}

          {/* Internal Wing Systems */}
          {shouldShowInternalWingSystems && <InternalWingSystems viewMode={viewMode} explodeAmount={explodeAmount} />}

          <Environment preset="sunset" />
          <OrbitControls enablePan={true} enableZoom={true} enableRotate={true} minDistance={2} maxDistance={10} />
        </Canvas>
      </div>

      <Card className="absolute top-4 left-4 w-80 bg-white bg-opacity-80 backdrop-blur-sm rounded-md shadow-lg z-10">
        <CardContent className="p-4">
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="grid grid-cols-3 mb-4">
              <TabsTrigger value="view">View Options</TabsTrigger>
              <TabsTrigger value="controls">Controls</TabsTrigger>
              <TabsTrigger value="info">Information</TabsTrigger>
            </TabsList>

            <TabsContent value="view" className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <h3 className="text-sm font-medium mb-2">Module Selection</h3>
                  <Select value={selectedModule} onValueChange={setSelectedModule}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select module" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="full-assembly">Full Assembly</SelectItem>
                      <SelectItem value="wing-box">Wing Box Structure</SelectItem>
                      <SelectItem value="leading-edge">Fixed Leading Edge</SelectItem>
                      <SelectItem value="slats">Deployable Slats</SelectItem>
                      <SelectItem value="flaps">Fowler Flaps</SelectItem>
                      <SelectItem value="ailerons">Ailerons</SelectItem>
                      <SelectItem value="spoilers">Spoilers</SelectItem>
                      <SelectItem value="winglets">Winglets</SelectItem>
                      <SelectItem value="fuselage-fairing">Fuselage Fairing</SelectItem>
                      <SelectItem value="wing-surface-details">Wing Surface Details</SelectItem>
                      <SelectItem value="internal-wing-systems">Internal Wing Systems</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <h3 className="text-sm font-medium mb-2">View Mode</h3>
                  <Select value={viewMode} onValueChange={setViewMode}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select view mode" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="complete">Complete Model</SelectItem>
                      <SelectItem value="wireframe">Wireframe</SelectItem>
                      <SelectItem value="xray">X-Ray View</SelectItem>
                      <SelectItem value="exploded">Exploded View</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {selectedModule !== "leading-edge" &&
                selectedModule !== "slats" &&
                selectedModule !== "flaps" &&
                selectedModule !== "ailerons" &&
                selectedModule !== "spoilers" && (
                  <div className="space-y-2">
                    <h3 className="text-sm font-medium">Wing Box Component Visibility</h3>
                    <div className="flex flex-wrap gap-2">
                      <Button
                        variant={showSkin ? "default" : "outline"}
                        size="sm"
                        onClick={() => setShowSkin(!showSkin)}
                        className="flex items-center gap-1"
                      >
                        {showSkin ? <Eye size={14} /> : <EyeOff size={14} />} Skin
                      </Button>
                      <Button
                        variant={showSpars ? "default" : "outline"}
                        size="sm"
                        onClick={() => setShowSpars(!showSpars)}
                        className="flex items-center gap-1"
                      >
                        {showSpars ? <Eye size={14} /> : <EyeOff size={14} />} Spars
                      </Button>
                      <Button
                        variant={showRibs ? "default" : "outline"}
                        size="sm"
                        onClick={() => setShowRibs(!showRibs)}
                        className="flex items-center gap-1"
                      >
                        {showRibs ? <Eye size={14} /> : <EyeOff size={14} />} Ribs
                      </Button>
                    </div>
                  </div>
                )}

              {viewMode === "exploded" && (
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <h3 className="text-sm font-medium">Explode Amount</h3>
                    <span className="text-xs text-muted-foreground">{explodeAmount.toFixed(1)}</span>
                  </div>
                  <Slider
                    value={[explodeAmount]}
                    min={0}
                    max={2}
                    step={0.1}
                    onValueChange={(value) => setExplodeAmount(value[0])}
                  />
                </div>
              )}
            </TabsContent>

            <TabsContent value="controls" className="space-y-4">
              {/* High-lift device controls */}
              <div className="space-y-6">
                {/* Slat controls */}
                {(selectedModule === "full-assembly" || selectedModule === "slats") && (
                  <div className="space-y-2">
                    <h3 className="text-sm font-medium">Leading Edge Slats</h3>
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs text-muted-foreground">Stowed</span>
                      <span className="text-xs text-muted-foreground">{Math.round(slatDeployment * 100)}%</span>
                      <span className="text-xs text-muted-foreground">Deployed</span>
                    </div>
                    <Slider
                      value={[slatDeployment]}
                      min={0}
                      max={1}
                      step={0.01}
                      onValueChange={(value) => {
                        setSlatDeployment(value[0])
                        if (autoDeploying && animationTarget === "both") {
                          setAnimationTarget("flaps")
                        } else if (autoDeploying) {
                          setAutoDeploying(false)
                        }
                      }}
                    />
                  </div>
                )}

                {/* Flap controls */}
                {(selectedModule === "full-assembly" || selectedModule === "flaps") && (
                  <div className="space-y-2">
                    <h3 className="text-sm font-medium">Trailing Edge Flaps</h3>
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs text-muted-foreground">Stowed</span>
                      <span className="text-xs text-muted-foreground">{Math.round(flapDeployment * 100)}%</span>
                      <span className="text-xs text-muted-foreground">Deployed</span>
                    </div>
                    <Slider
                      value={[flapDeployment]}
                      min={0}
                      max={1}
                      step={0.01}
                      onValueChange={(value) => {
                        setFlapDeployment(value[0])
                        if (autoDeploying && animationTarget === "both") {
                          setAnimationTarget("slats")
                        } else if (autoDeploying) {
                          setAutoDeploying(false)
                        }
                      }}
                    />
                  </div>
                )}

                {/* Aileron controls */}
                {(selectedModule === "full-assembly" || selectedModule === "ailerons") && (
                  <div className="space-y-2">
                    <h3 className="text-sm font-medium">Aileron Deflection</h3>
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs text-muted-foreground">Down</span>
                      <span className="text-xs text-muted-foreground">
                        {aileronDeflection === 0
                          ? "Neutral"
                          : `${Math.abs(Math.round(aileronDeflection * 100))}% ${aileronDeflection > 0 ? "Up" : "Down"}`}
                      </span>
                      <span className="text-xs text-muted-foreground">Up</span>
                    </div>
                    <Slider
                      value={[aileronDeflection]}
                      min={-1}
                      max={1}
                      step={0.01}
                      onValueChange={(value) => {
                        setAileronDeflection(value[0])
                      }}
                    />
                    <div className="grid grid-cols-3 gap-2 mt-2">
                      <Button variant="outline" size="sm" onClick={() => setAileronDeflection(-1)}>
                        Full Down
                      </Button>
                      <Button variant="outline" size="sm" onClick={() => setAileronDeflection(0)}>
                        Neutral
                      </Button>
                      <Button variant="outline" size="sm" onClick={() => setAileronDeflection(1)}>
                        Full Up
                      </Button>
                    </div>
                  </div>
                )}

                {/* Spoiler controls */}
                {(selectedModule === "full-assembly" || selectedModule === "spoilers") && (
                  <div className="space-y-2">
                    <h3 className="text-sm font-medium">Spoiler Deployment</h3>
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs text-muted-foreground">Stowed</span>
                      <span className="text-xs text-muted-foreground">{Math.round(spoilerDeployment * 100)}%</span>
                      <span className="text-xs text-muted-foreground">Deployed</span>
                    </div>
                    <Slider
                      value={[spoilerDeployment]}
                      min={0}
                      max={1}
                      step={0.01}
                      onValueChange={(value) => {
                        setSpoilerDeployment(value[0])
                      }}
                    />
                    <div className="grid grid-cols-2 gap-2 mt-2">
                      <Button variant="outline" size="sm" onClick={() => setSpoilerDeployment(0)}>
                        Stowed
                      </Button>
                      <Button variant="outline" size="sm" onClick={() => setSpoilerDeployment(1)}>
                        Fully Deployed
                      </Button>
                    </div>
                  </div>
                )}

                {/* Animation controls */}
                {(selectedModule === "full-assembly" || selectedModule === "slats" || selectedModule === "flaps") && (
                  <div className="space-y-4">
                    <div className="flex justify-center">
                      <Button
                        variant={autoDeploying ? "destructive" : "default"}
                        onClick={() => setAutoDeploying(!autoDeploying)}
                        className="flex items-center gap-2"
                      >
                        {autoDeploying ? <Pause size={16} /> : <Play size={16} />}
                        {autoDeploying ? "Stop Animation" : "Animate Deployment"}
                      </Button>
                    </div>

                    {/* Animation target selection */}
                    {selectedModule === "full-assembly" && (
                      <div className="grid grid-cols-3 gap-2">
                        <Button
                          variant={animationTarget === "slats" ? "default" : "outline"}
                          onClick={() => {
                            setAnimationTarget("slats")
                            if (!autoDeploying) setAutoDeploying(true)
                          }}
                          size="sm"
                        >
                          Slats Only
                        </Button>
                        <Button
                          variant={animationTarget === "both" ? "default" : "outline"}
                          onClick={() => {
                            setAnimationTarget("both")
                            if (!autoDeploying) setAutoDeploying(true)
                          }}
                          size="sm"
                        >
                          Both
                        </Button>
                        <Button
                          variant={animationTarget === "flaps" ? "default" : "outline"}
                          onClick={() => {
                            setAnimationTarget("flaps")
                            if (!autoDeploying) setAutoDeploying(true)
                          }}
                          size="sm"
                        >
                          Flaps Only
                        </Button>
                      </div>
                    )}

                    {/* Preset configurations */}
                    <div className="grid grid-cols-4 gap-2">
                      <Button
                        variant="outline"
                        onClick={() => {
                          setSlatDeployment(0)
                          setFlapDeployment(0)
                          setSpoilerDeployment(0)
                          setAileronDeflection(0)
                          setAutoDeploying(false)
                        }}
                        size="sm"
                      >
                        Cruise
                      </Button>
                      <Button
                        variant="outline"
                        onClick={() => {
                          setSlatDeployment(0.5)
                          setFlapDeployment(0.5)
                          setSpoilerDeployment(0)
                          setAileronDeflection(0)
                          setAutoDeploying(false)
                        }}
                        size="sm"
                      >
                        Takeoff
                      </Button>
                      <Button
                        variant="outline"
                        onClick={() => {
                          setSlatDeployment(1)
                          setFlapDeployment(1)
                          setSpoilerDeployment(0)
                          setAileronDeflection(0)
                          setAutoDeploying(false)
                        }}
                        size="sm"
                      >
                        Landing
                      </Button>
                      <Button
                        variant="outline"
                        onClick={() => {
                          setSlatDeployment(0)
                          setFlapDeployment(0)
                          setSpoilerDeployment(1)
                          setAileronDeflection(0)
                          setAutoDeploying(false)
                        }}
                        size="sm"
                      >
                        Braking
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            </TabsContent>

            <TabsContent value="info">
              <div className="space-y-2 text-sm">
                <h3 className="font-medium">Aircraft Wing Components:</h3>

                {selectedModule === "full-assembly" && (
                  <ul className="list-disc pl-5 space-y-1">
                    <li>
                      Complete wing assembly with wing box, fixed leading edge, deployable slats, Fowler flaps,
                      ailerons, and spoilers
                    </li>
                    <li>Semi-tapered airfoil cross-section</li>
                    <li>High-lift devices for takeoff and landing</li>
                    <li>Flight control surfaces for roll, pitch, and drag control</li>
                    <li>Integrated anti-ice system mounting points</li>
                  </ul>
                )}

                {selectedModule === "wing-box" && (
                  <>
                    <h4 className="font-medium mt-2">Wing Box Structure:</h4>
                    <ul className="list-disc pl-5 space-y-1">
                      <li>Front spar positioned at 25% chord</li>
                      <li>Rear spar positioned at 70% chord</li>
                      <li>Perpendicular ribs at 0.5-meter intervals</li>
                      <li>Smooth outer skin mesh wrapping the structure</li>
                      <li>Internal cavity suitable for housing fuel</li>
                      <li>Structural detailing including lightening holes on ribs</li>
                    </ul>
                  </>
                )}

                {(selectedModule === "full-assembly" || selectedModule === "leading-edge") && (
                  <>
                    <h4 className="font-medium mt-2">Fixed Leading Edge:</h4>
                    <ul className="list-disc pl-5 space-y-1">
                      <li>Rounded, aerodynamic airfoil nose profile</li>
                      <li>Spans full wing length with cutouts for slat sections</li>
                      <li>Internal mounting points for anti-ice ducts</li>
                      <li>Smooth blending into the main wing box structure</li>
                      <li>Optimized for laminar airflow</li>
                    </ul>
                  </>
                )}

                {(selectedModule === "full-assembly" || selectedModule === "slats") && (
                  <>
                    <h4 className="font-medium mt-2">Deployable Slats:</h4>
                    <ul className="list-disc pl-5 space-y-1">
                      <li>Three slat sections: inboard, mid, and outboard</li>
                      <li>Curved deployment path - forward and downward motion</li>
                      <li>Curved tracks with rollers for smooth deployment</li>
                      <li>Hydraulic actuators for deployment and retraction</li>
                      <li>Seamless integration with fixed leading edge when stowed</li>
                      <li>Increases wing camber and area during takeoff and landing</li>
                    </ul>
                  </>
                )}

                {(selectedModule === "full-assembly" || selectedModule === "flaps") && (
                  <>
                    <h4 className="font-medium mt-2">Double-Slotted Fowler Flaps:</h4>
                    <ul className="list-disc pl-5 space-y-1">
                      <li>Three flap sections along the trailing edge</li>
                      <li>Double-slotted design with main flap and auxiliary vane</li>
                      <li>Two-phase deployment: extension followed by rotation</li>
                      <li>Visible track mechanisms and support brackets</li>
                      <li>Hydraulic actuators for precise control</li>
                      <li>Increases wing area and camber for enhanced lift</li>
                      <li>Creates two aerodynamic slots for improved airflow</li>
                    </ul>
                  </>
                )}

                {(selectedModule === "full-assembly" || selectedModule === "ailerons") && (
                  <>
                    <h4 className="font-medium mt-2">Ailerons:</h4>
                    <ul className="list-disc pl-5 space-y-1">
                      <li>Located at the outboard section of the wing</li>
                      <li>Hinged control surfaces for roll control</li>
                      <li>Rotate around the front hinge line</li>
                      <li>Equipped with counterweights for aerodynamic balance</li>
                      <li>Multiple attachment hinges for structural integrity</li>
                      <li>Flush with the wing surface when in neutral position</li>
                      <li>Connected to the control system via linkage rods</li>
                    </ul>
                  </>
                )}

                {(selectedModule === "full-assembly" || selectedModule === "spoilers") && (
                  <>
                    <h4 className="font-medium mt-2">Spoilers:</h4>
                    <ul className="list-disc pl-5 space-y-1">
                      <li>Rectangular panels positioned between flaps and ailerons</li>
                      <li>Rotate upward to a maximum of 45 degrees</li>
                      <li>Flush with the wing upper surface when stowed</li>
                      <li>Hydraulic piston mechanisms for deployment</li>
                      <li>Multiple panels for redundancy and control</li>
                      <li>Used for lift dumping, drag increase, and roll control</li>
                      <li>Critical for landing deceleration and descent control</li>
                    </ul>
                  </>
                )}

                {(selectedModule === "full-assembly" || selectedModule === "winglets") && (
                  <>
                    <h4 className="font-medium mt-2">Winglets:</h4>
                    <ul className="list-disc pl-5 space-y-1">
                      <li>Swept and upward-curved aerodynamic design</li>
                      <li>Height approximately 10% of wing span</li>
                      <li>Aerodynamic twist (washout) for optimized performance</li>
                      <li>Smooth fillets at the wing-winglet junction</li>
                      <li>Navigation lights at the tips (red port, green starboard)</li>
                      <li>Reduces induced drag and improves fuel efficiency</li>
                      <li>Enhances lateral stability and control effectiveness</li>
                    </ul>
                  </>
                )}

                {(selectedModule === "full-assembly" || selectedModule === "fuselage-fairing") && (
                  <>
                    <h4 className="font-medium mt-2">Fuselage Fairing:</h4>
                    <ul className="list-disc pl-5 space-y-1">
                      <li>Smooth teardrop shape blending wing root and fuselage</li>
                      <li>Teardrop cross-section covering lower wing-fuselage junction</li>
                      <li>Panel lines at spanwise offsets for maintenance access</li>
                      <li>Access hatch for internal inspections and equipment</li>
                      <li>Enhances aerodynamic flow and reduces drag at root</li>
                    </ul>
                  </>
                )}

                {(selectedModule === "full-assembly" || selectedModule === "wing-surface-details") && (
                  <>
                    <h4 className="font-medium mt-2">Wing Surface Details:</h4>
                    <ul className="list-disc pl-5 space-y-1">
                      <li>Access panels for maintenance and inspection</li>
                      <li>Rivet lines along ribs and panel junctions</li>
                      <li>Static discharge rods on trailing edges</li>
                      <li>Embedded pitot/static sensors flush-mounted</li>
                      <li>Flush-mounted navigation lights at wingtips</li>
                      <li>Visible joints and hinges between movable surfaces</li>
                    </ul>
                  </>
                )}

                {(selectedModule === "full-assembly" || selectedModule === "internal-wing-systems") && (
                  <>
                    <h4 className="font-medium mt-2">Internal Wing Systems:</h4>
                    <ul className="list-disc pl-5 space-y-1">
                      <li>Placeholder fuel bays between ribs</li>
                      <li>Fuel lines routed along spar roots</li>
                      <li>Hydraulic lines to flaps and spoilers</li>
                      <li>Electrical cable conduits within wing box</li>
                      <li>Pressure relief valves at rib locations</li>
                    </ul>
                  </>
                )}
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  )
}

function WingBoxStructure({ viewMode, showSkin, showSpars, showRibs, explodeAmount }: { viewMode: string; showSkin: boolean; showSpars: boolean; showRibs: boolean; explodeAmount: number }) {
  // In a real implementation, we would generate this geometry programmatically
  // For this example, we'll use a simplified model

  return (
    <group position={[0, 0, 0]} rotation={[0, Math.PI / 4, 0]}>
      {/* Wing Skin */}
      {showSkin && (
        <mesh position={[0, 0, explodeAmount * (viewMode === "exploded" ? 0.5 : 0)]}>
          <boxGeometry args={[3, 0.5, 5]} />
          <meshStandardMaterial
            color="#a0a0a0"
            metalness={0.8}
            roughness={0.2}
            transparent={viewMode === "xray"}
            opacity={viewMode === "xray" ? 0.3 : 1}
            wireframe={viewMode === "wireframe"}
          />
        </mesh>
      )}

      {/* Front Spar (25% chord) */}
      {showSpars && (
        <group position={[-1.25, 0, explodeAmount * (viewMode === "exploded" ? -0.5 : 0)]}>
          <mesh>
            <boxGeometry args={[0.05, 0.4, 5]} />
            <meshStandardMaterial
              color="#4a6fa5"
              metalness={0.6}
              roughness={0.3}
              wireframe={viewMode === "wireframe"}
            />
          </mesh>
        </group>
      )}

      {/* Rear Spar (70% chord) */}
      {showSpars && (
        <group position={[1, 0, explodeAmount * (viewMode === "exploded" ? -1 : 0)]}>
          <mesh>
            <boxGeometry args={[0.05, 0.3, 5]} />
            <meshStandardMaterial
              color="#4a6fa5"
              metalness={0.6}
              roughness={0.3}
              wireframe={viewMode === "wireframe"}
            />
          </mesh>
        </group>
      )}

      {/* Ribs (at 0.5m intervals) */}
      {showRibs && (
        <group position={[0, 0, explodeAmount * (viewMode === "exploded" ? -1.5 : 0)]}>
          {[-2.25, -1.75, -1.25, -0.75, -0.25, 0.25, 0.75, 1.25, 1.75, 2.25].map((pos, index) => {
            const taperFactor = 1 - (Math.abs(pos) / 2.5) * 0.3
            return (
              <mesh key={index} position={[0, 0, pos]}>
                <boxGeometry args={[3 * taperFactor, 0.4 * taperFactor, 0.05]} />
                <meshStandardMaterial
                  color="#6d7a8c"
                  metalness={0.5}
                  roughness={0.5}
                  wireframe={viewMode === "wireframe"}
                />
              </mesh>
            )
          })}
        </group>
      )}
    </group>
  )
}
