// Metres. Visual placement reserves inherited from the prototype, not toleranced CAD.
export const vehicleLayout = Object.freeze({
  motor:{x:.49,y:.269,zMin:-.188,zMax:.085,radius:.099},
  differential:{x:.87,y:.269,radiusX:.116,radiusY:.106,halfWidth:.15},
  pulley:{z:.236,halfWidth:.025,boreSmall:.0225,boreLarge:.038},
  battery:{position:[1.02,.409,.016],variants:[[.52,.09,.152],[.316,.09,.22],[.18,.235,.152]]},
  cv:{innerLeft:[.19,.28],innerRight:[.31,.40],outer:[.51,.60],endCollar:.02}
});

// Checks only a few declared envelopes. Connections/mount contacts are excluded.
// A pass is not an exhaustive collision, motion-clearance or structural analysis.
export function checkVisualEnvelopes(layout=vehicleLayout){
  const motor=layout.motor,diff=layout.differential,pulley=layout.pulley;
  const tests=[
    {id:'motor-differential',gap:diff.x-diff.radiusX-(motor.x+motor.radius)},
    {id:'differential-battery',gap:layout.battery.position[1]-(diff.y+diff.radiusY)},
    {id:'motor-belt-plane',gap:pulley.z-pulley.halfWidth-motor.zMax},
    {id:'right-cv-pulley',gap:layout.cv.innerRight[0]-layout.cv.endCollar-(pulley.z+pulley.halfWidth)},
    {id:'small-pulley-shaft-bore',gap:pulley.boreSmall-.022},
    {id:'large-pulley-input-bore',gap:pulley.boreLarge-.036}
  ];
  return {scope:'Selected static visual envelopes only; unverified CAD',tests:tests.map(t=>({...t,pass:t.gap>0}))};
}
