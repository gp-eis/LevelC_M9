/* Completion-stage art directions. Bounds/anchors refer to the original full
   coloring image, normalized to 0..1, including its dark outlines. Small items
   precede larger neighbors so overlapping boxes do not claim their regions.
   Origins/effect positions are normalized within the extracted item. Explicit
   layers keep tabletop and foreground objects in front of their neighbors. */
(() => {
  'use strict';
  const object = (name, bounds, motion, anchor) => ({name, bounds, motion, anchor});
  const scenes = {
    a1Landscape: {
      id: 'a1-landscape', background: 'assets/color-motion-clean-landscape.png',
      shadows: [[.170,.790,.475,.853],[.560,.790,.795,.853],[.095,.885,.180,.927],[.815,.802,.980,.855]],
      inkSpread: 27,
      eraseFringe: 4,
      backdropBlend: 32,
      objects: [
        {...object('Water bottle', [.100, .665, .173, .910], 'flip', [.137, .800]), layer: 2, origin: [.5, .75]},
        {...object('Bike helmet', [.805, .665, .985, .850], 'helmet-hop', [.900, .765]), layer: 2, origin: [.5, .9]},
        {...object('Bicycle', [.178, .305, .820, .835], 'ride', [.500, .590]),
          layer: 1, origin: [.5, .75],
          wheels: [
            {center: [.303, .651], radius: [.116, .174]},
            {center: [.696, .650], radius: [.116, .174]}
          ]}
      ]
    },
    a1Portrait: {
      id: 'a1-portrait', background: 'assets/color-motion-clean-portrait.png',
      eraseFringe: 4,
      shadows: [[.010,.680,.575,.735],[.555,.680,.995,.735],[.030,.900,.195,.935],[.645,.825,.990,.885]],
      inkSpread: 27,
      backdropBlend: 32,
      objects: [
        {...object('Water bottle', [.037, .660, .185, .920], 'flip', [.110, .805]), layer: 2, origin: [.5, .75]},
        {...object('Bike helmet', [.630, .680, .995, .885], 'helmet-hop', [.820, .795]), layer: 2, origin: [.5, .9]},
        {...object('Bicycle', [.012, .255, .995, .710], 'ride', [.500, .480]),
          layer: 1, origin: [.5, .75],
          wheels: [
            {center: [.201, .553], radius: [.193, .155]},
            {center: [.789, .553], radius: [.193, .155]}
          ]}
      ]
    },
    a2: {
      id: 'a2', background: 'assets/color-motion-clean.png',
      inkSpread: 27,
      eraseFringe: 4,
      backdropBlend: 32,
      objects: [
        {...object('Beach ball', [.795, .615, .994, .915], 'beach-bounce', [.895, .765]), layer: 3, origin: [.5, .75]},
        {...object('Bucket', [.018, .570, .237, .900], 'bucket-dance', [.125, .755]), layer: 3, origin: [.5, .95]},
        {...object('Sailboat', [.245, .065, .795, .910], 'sail', [.520, .650]), layer: 1, origin: [.5, .9]}
      ]
    },
    a3: {
      id: 'a3', background: 'assets/color-motion-clean.png',
      inkSpread: 27,
      eraseFringe: 4,
      backdropBlend: 32,
      objects: [
        {...object('Sneakers', [.580, .560, .997, .965], 'tiptoe', [.800, .790]), layer: 3, origin: [.5, .95]},
        {...object('Basketball', [.295, .460, .605, .920], 'dribble', [.450, .695]), layer: 2, origin: [.5, .9]},
        {...object('Basketball hoop', [.005, .005, .380, .920], 'hoop-cheer', [.175, .460]), layer: 1, origin: [.45, .98]}
      ]
    },
    a4: {
      id: 'a4', background: 'assets/color-motion-clean.png',
      inkSpread: 27,
      eraseFringe: 4, backdropBlend: 32,
      shadows: [[.215,.815,.645,.918],[.555,.800,.998,.910]],
      objects: [
        {...object('Swimming goggles', [.215, .590, .640, .880], 'goggle-dive', [.430, .760]), layer: 3, origin: [.5, .5],
          moveWith: 'swimming-kit', groupMotion: 'bag-jump', groupOrigin: [.65, .9]},
        {...object('Swimsuit', [.010, .090, .300, .795], 'shimmy', [.150, .445]), layer: 1, origin: [.5, .02],
          regionSeeds: [[.257917,.603125],[.222917,.623125],[.228750,.663125],[.087917,.703125]]},
        {...object('Sports bag', [.565, .345, .997, .870], 'bag-jump', [.795, .645]), layer: 2, origin: [.5, .95],
          moveWith: 'swimming-kit', groupMotion: 'bag-jump', groupOrigin: [.65, .9],
          regionSeeds: [[.600417,.580625],[.629583,.600625],[.583750,.619375],[.580417,.671875],[.620417,.755625],[.942917,.606875]]}
      ]
    },
    b1: {
      id: 'b1', background: 'assets/color-motion-clean.png',
      inkSpread: 27,
      eraseFringe: 4,
      backdropBlend: 32,
      objects: [
        {...object('Flower', [.605, .505, .840, .950], 'bloom', [.725, .725]), layer: 3, origin: [.5, .98], effect: {type: 'pollen', at: [.52, .34]}},
        {...object('Bee', [.560, .005, .945, .490], 'bee-loop', [.765, .250]), solid: true, layer: 2, origin: [.5, .5]},
        {...object('Bird', [.020, .270, .465, .945], 'bird-hop', [.245, .610]), solid: true, layer: 2, origin: [.5, .95]}
      ]
    },
    b2: {
      id: 'b2', background: 'assets/color-motion-clean.png',
      inkSpread: 27,
      eraseFringe: 4,
      backdropBlend: 32,
      objects: [
        {...object('Sun', [.350, .010, .655, .425], 'sunshine', [.500, .225]), layer: 1, origin: [.5, .5], effect: {type: 'rays', at: [.5, .5]}},
        {...object('Potted seedling', [.640, .220, .955, .950], 'sprout', [.805, .620]), layer: 3, origin: [.5, .98]},
        {...object('Watering can', [.035, .335, .580, .930], 'watering', [.285, .665]), layer: 2, origin: [.4, .85], effect: {type: 'water', at: [.94, .23]}}
      ]
    },
    b3: {
      id: 'b3', background: 'assets/color-motion-clean.png',
      inkSpread: 27,
      eraseFringe: 4,
      backdropBlend: 32,
      objects: [
        {...object('Mushroom', [.335, .505, .670, .980], 'mushroom-pop', [.505, .750]), solid: true, layer: 3, origin: [.5, .98]},
        {...object('Bee', [.015, .060, .505, .760], 'bee-loop', [.260, .405]), solid: true, layer: 2, origin: [.5, .5]},
        {...object('Flower', [.605, .105, .990, .960], 'petal-dance', [.800, .550]), layer: 2, origin: [.5, .98], effect: {type: 'pollen', at: [.5, .36]}}
      ]
    },
    b4: {
      id: 'b4', background: 'assets/color-motion-clean.png',
      inkTone: 'warm',
      eraseFringe: 4,
      backdropBlend: 32,
      objects: [
        {...object('Cupcake', [.740, .335, .995, .885], 'cupcake-hop', [.870, .655]), layer: 3, origin: [.5, .95]},
        {...object('Honey jar', [.470, .375, .745, .870], 'honey-jiggle', [.610, .650]), layer: 2, origin: [.5, .95]},
        {...object('Teapot', [.005, .275, .500, .875], 'tea-pour', [.250, .610]), layer: 1, origin: [.43, .9], effect: {type: 'steam', at: [.93, .27]}}
      ]
    },
    c3: {
      id: 'c3', background: 'assets/hobby-coloring-clean.png',
      inkSpread: 27,
      eraseFringe: 4,
      backdropBlend: 32,
      objects: [
        {...object('Hat', [.570,.092,.929,.354], 'hat-tip', [.750,.320]), inkSpread: 5, layer: 3, origin: [.5,.8]},
        {...object('Paint pot', [.615,.511,.906,.882], 'paint-pot-hop', [.750,.850]), layer: 2, origin: [.5,.95]},
        {...object('Guitar', [.105,.021,.370,.946], 'guitar-strum', [.235,.900]), layer: 1, origin: [.5,.9], effect: {type: 'music', at: [.55,.6]}}
      ]
    },
    c4: {
      id: 'c4', background: 'assets/garden-coloring-clean.png',
      inkSpread: 27,
      eraseFringe: 4,
      backdropBlend: 32,
      objects: [
        {...object('Butterfly ornament', [.022,.140,.410,.790], 'butterfly-flutter', [.218,.780]), layer: 1, origin: [.5,.5],
          paintSeeds: [[.06125,.279375],[.10375,.249375],[.374583,.300625],[.177083,.201875],[.26375,.199375],[.33375,.266875],[.124583,.341875],[.31125,.351875],[.219583,.325625],[.21875,.409375],[.10125,.543125],[.329583,.545625],[.13375,.463125],[.29875,.465625],[.154583,.511875],[.27875,.513125],[.217917,.506875]]},
        {...object('Watering can', [.364,.438,.750,.840], 'watering', [.520,.825]), layer: 2, origin: [.4,.85], effect: {type: 'water', at: [.94,.23]},
          paintSeeds: [[.38625,.566875],[.71375,.496875],[.59125,.470625],[.69625,.524375],[.517917,.656875],[.639583,.650625],[.517083,.824375]]},
        {...object('Flowerpot', [.756,.190,.975,.862], 'pot-waltz', [.870,.850]), layer: 3, origin: [.5,.95],
          paintSeeds: [[.860417,.248125],[.89875,.261875],[.82375,.271875],[.92375,.309375],[.800417,.323125],[.86125,.340625],[.92125,.374375],[.80625,.383125],[.887083,.418125],[.839583,.419375],[.86375,.519375],[.824583,.520625],[.910417,.526875],[.867917,.629375],[.864583,.755625]]}
      ]
    },
    c2: {
      id: 'c2', background: 'assets/color-motion-clean.png',
      inkTone: 'warm',
      eraseFringe: 4,
      backdropBlend: 32,
      objects: [
        {...object('Cushion', [.410, .635, .715, .950], 'cushion-fluff', [.555, .790]), origin: [.5,.75], layer: 3},
        {...object('Blanket', [.670, .605, .985, .920], 'blanket-wave', [.825, .770]), origin: [.5,.75], layer: 2,
          regionSeeds: [[.689167,.7425]]},
        {...object('Armchair', [.012, .320, .420, .890], 'chair-rock', [.220, .630]), origin: [.5,.95], layer: 1}
      ]
    },
    c1: {
      id: 'c1', background: 'assets/color-motion-clean.png',
      inkTone: 'warm',
      eraseFringe: 4,
      backdropBlend: 32,
      objects: [
        {...object('Mushrooms', [.775, .480, .998, .915], 'mushroom-pop', [.895, .700]), inkRadius: 5, solid: true, layer: 2, origin: [.5, .98]},
        {...object('Leaf', [.440, .605, .790, .950], 'leaf-tumble', [.640, .810]), layer: 3, origin: [.5, .5]},
        {...object('Sleeping fox', [.050, .310, .560, .810], 'sleepy-stretch', [.300, .580]), solid: true, layer: 1, origin: [.5, .96], effect: {type: 'zzz', at: [.24, .14]},
          outline: [[.066,.411],[.163,.438],[.208,.384],[.247,.393],[.293,.337],[.326,.312],[.347,.393],[.399,.403],[.443,.436],[.478,.478],[.505,.531],[.532,.552],[.546,.614],[.549,.654],[.536,.716],[.512,.759],[.456,.782],[.384,.791],[.312,.775],[.270,.768],[.216,.737],[.173,.741],[.111,.731],[.080,.693],[.067,.648],[.059,.620],[.067,.564],[.065,.529],[.060,.474]]}
      ]
    }
  };

  function resolve(pathname, landscape = true) {
    const path = String(pathname || '').split(/[?#]/)[0].replace(/\\/g, '/').toLowerCase();
    if (/\/level-a\/games\/adventures(?:\/|$)/.test(path)) {
      return landscape ? scenes.a1Landscape : scenes.a1Portrait;
    }
    const match = path.match(/\/level-([abc])\/games\/adventures-week-([1-4])(?:\/|$)/);
    return match ? scenes[`${match[1]}${match[2]}`] || null : null;
  }
  window.Month9ColorScenes = {resolve};
})();
