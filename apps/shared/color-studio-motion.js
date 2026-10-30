/* Bring the child's own colored pixels to life, without replacing their artwork. */
(() => {
  'use strict';
  const contains = (bounds, x, y) => x >= bounds[0] && x <= bounds[2] && y >= bounds[1] && y <= bounds[3];
  function inside(object, x, y) {
    if (!contains(object.bounds, x, y)) return false;
    if (!object.outline) return true;
    let included = false;
    for (let i = 0, j = object.outline.length - 1; i < object.outline.length; j = i++) {
      const [xi, yi] = object.outline[i], [xj, yj] = object.outline[j];
      if ((yi > y) !== (yj > y) && x < (xj - xi) * (y - yi) / (yj - yi) + xi) included = !included;
    }
    return included;
  }
  const ink = (data, p, spread = 75, tone) => {
    const k = p * 4, high = Math.max(data[k], data[k + 1], data[k + 2]);
    // Warm brown authored strokes must not absorb green foliage or cabinetry
    // through a handle, or carry that scenery along the moving contour.
    if (tone === 'warm') return (high < 205 && high - Math.min(data[k], data[k + 1], data[k + 2]) < 27) ||
      (high < 60 && high - Math.min(data[k], data[k + 1], data[k + 2]) < 45) ||
      (high < 190 && data[k] - data[k + 1] >= 8 && data[k + 1] - data[k + 2] >= 4 &&
       high - Math.min(data[k], data[k + 1], data[k + 2]) < 110);
    return high < 205 && high - Math.min(data[k], data[k + 1], data[k + 2]) < spread;
  };
  function cutouts(canvas, base, labels, regions, config) {
    const w = canvas.width, h = canvas.height, count = w * h;
    const owners = new Int16Array(count).fill(-1), distance = new Uint8Array(count);
    const queue = new Int32Array(count), bounds = config.objects.map(() => [w, h, 0, 0]);
    // Some authored white objects have soft shading rather than pure-white
    // fills. Their measured interior seeds identify exact paint compartments
    // and owners, including handles inside a neighboring object's coarse box.
    // regionSeeds resolve only ambiguous overlaps; paintSeeds are an exclusive
    // list for scenes whose shaded white artwork needs authored acceptance.
    const seededOwners = new Map();
    config.objects.forEach((object, owner) => (object.paintSeeds || object.regionSeeds || []).forEach(([x, y]) => {
      const px = Math.min(w - 1, Math.max(0, Math.floor(x * w)));
      const py = Math.min(h - 1, Math.max(0, Math.floor(y * h)));
      const id = labels[py * w + px];
      if (id >= 0) seededOwners.set(id, owner);
    }));
    let tail = 0;
    // White compartments must have an ink border. This excludes bright clouds
    // and scenery highlights that also happen to pass the painting threshold.
    regions.forEach((region, id) => {
      if (region.length < 100) return;
      let sx = 0, sy = 0, boundary = 0, outlined = 0, white = 0, edge = false;
      const extent = [w, h, 0, 0];
      for (const p of region) {
        const x = p % w, y = Math.floor(p / w);
        sx += x; sy += y;
        extent[0] = Math.min(extent[0], x); extent[1] = Math.min(extent[1], y);
        extent[2] = Math.max(extent[2], x + 1); extent[3] = Math.max(extent[3], y + 1);
        const k = p * 4;
        if (Math.min(base.data[k], base.data[k + 1], base.data[k + 2]) > 245) white++;
        if (!x || !y || x === w - 1 || y === h - 1) edge = true;
        if ((x && labels[p - 1] !== id) || (x < w - 1 && labels[p + 1] !== id) ||
            (y && labels[p - w] !== id) || (y < h - 1 && labels[p + w] !== id)) {
          boundary++;
          let dark = false;
          for (const [dx, dy] of [[-1, 0], [1, 0], [0, -1], [0, 1]]) {
            for (let step = 1; step <= 3; step++) {
              const xx = x + dx * step, yy = y + dy * step;
              if (xx >= 0 && xx < w && yy >= 0 && yy < h && ink(base.data, yy * w + xx, config.inkSpread, config.inkTone)) { dark = true; break; }
            }
            if (dark) break;
          }
          if (dark) outlined++;
        }
      }
      const x = sx / region.length / w, y = sy / region.length / h;
      const seeded = seededOwners.has(id);
      if (edge || !boundary || (!seeded && (outlined / boundary < .45 || white / region.length < .45))) return;
      let owner = seeded ? seededOwners.get(id) : -1;
      if (!seeded) {
        // A centroid can fall inside the goggles' box even though most of the
        // region is the bag behind them. Prefer the object that contains the
        // complete compartment, rather than the first overlapping rectangle.
        let bestFit = -1;
        config.objects.forEach((object, index) => {
          if (object.paintSeeds || !inside(object, x, y)) return;
          const box = object.bounds;
          const fit = Math.max(0, Math.min(extent[2], box[2] * w) - Math.max(extent[0], box[0] * w)) *
            Math.max(0, Math.min(extent[3], box[3] * h) - Math.max(extent[1], box[1] * h));
          if (fit > bestFit) { bestFit = fit; owner = index; }
        });
      }
      if (owner < 0) return;
      for (const p of region) { owners[p] = owner; queue[tail++] = p; }
    });
    // Grow only through nearby neutral ink. Colored scenery seen through a
    // wheel, handle or frame stays transparent, rather than becoming a rectangle.
    // Include the complete heavy outer strokes, not just the first few pixels
    // next to a white compartment. A short radius visibly shaved thick corners.
    const stroke = Math.max(5, Math.round(w / 120));
    for (let head = 0; head < tail; head++) {
      const p = queue[head], x = p % w, y = Math.floor(p / w), owner = owners[p];
      const authoredStroke = config.objects[owner].inkRadius;
      if (distance[p] >= (authoredStroke ? Math.max(1, Math.round(authoredStroke * w / 1200)) : stroke)) continue;
      for (const v of [x ? p - 1 : -1, x < w - 1 ? p + 1 : -1, y ? p - w : -1, y < h - 1 ? p + w : -1]) {
        if (v < 0 || owners[v] >= 0 || !ink(base.data, v, config.objects[owner].inkSpread ?? config.inkSpread, config.inkTone)) continue;
        if (!contains(config.objects[owner].bounds, (v % w) / w, Math.floor(v / w) / h)) continue;
        owners[v] = owner; distance[v] = distance[p] + 1; queue[tail++] = v;
      }
    }
    // Keep solid pupils, noses and other dark details enclosed by the cutout.
    // Scenery holes stay transparent: a whole hole must be almost entirely ink.
    const seen = new Uint8Array(count);
    for (let seed = 0; seed < count; seed++) {
      if (owners[seed] >= 0 || seen[seed]) continue;
      let head = 0, length = 1, dark = 0, pale = 0, borderOwner = -1, mixed = false, edge = false;
      queue[0] = seed; seen[seed] = 1;
      while (head < length) {
        const p = queue[head++], x = p % w, y = Math.floor(p / w);
        if (ink(base.data, p, config.inkSpread, config.inkTone)) dark++;
        const k = p * 4, low = Math.min(base.data[k], base.data[k + 1], base.data[k + 2]);
        if (low > 195 && Math.max(base.data[k], base.data[k + 1], base.data[k + 2]) - low < 27) pale++;
        if (!x || !y || x === w - 1 || y === h - 1) edge = true;
        for (const v of [x ? p - 1 : -1, x < w - 1 ? p + 1 : -1, y ? p - w : -1, y < h - 1 ? p + w : -1]) {
          if (v < 0) continue;
          if (owners[v] >= 0) {
            if (borderOwner < 0) borderOwner = owners[v];
            else if (borderOwner !== owners[v]) mixed = true;
          } else if (!seen[v]) { seen[v] = 1; queue[length++] = v; }
        }
      }
      if (!edge && !mixed && borderOwner >= 0 && (dark / length > .85 ||
          (config.objects[borderOwner].solid && (dark + pale) / length > .85))) {
        for (let i = 0; i < length; i++) owners[queue[i]] = borderOwner;
      }
    }
    for (let p = 0; p < count; p++) {
      const owner = owners[p];
      if (owner < 0) continue;
      const box = bounds[owner], x = p % w, y = Math.floor(p / w);
      box[0] = Math.min(box[0], x); box[1] = Math.min(box[1], y);
      box[2] = Math.max(box[2], x + 1); box[3] = Math.max(box[3], y + 1);
    }
    const colored = canvas.getContext('2d').getImageData(0, 0, w, h).data;
    const matteMask = new Int16Array(count).fill(-1);
    const sprites = config.objects.flatMap((object, index) => {
      let [left, top, right, bottom] = bounds[index];
      if (right <= left || bottom <= top) return [];
      // A one-pixel matte follows the real ink contour, including holes. Keeping
      // this margin inside the sprite avoids cutting its antialiasing at its box.
      left = Math.max(0, left - 1); top = Math.max(0, top - 1);
      right = Math.min(w, right + 1); bottom = Math.min(h, bottom + 1);
      const sprite = document.createElement('canvas');
      sprite.width = right - left; sprite.height = bottom - top;
      const context = sprite.getContext('2d'), pixels = context.createImageData(sprite.width, sprite.height);
      for (let y = top; y < bottom; y++) for (let x = left; x < right; x++) {
        const p = y * w + x;
        let coverage = 0, edgePixel = p, darkest = 766;
        for (let dy = -1; dy <= 1; dy++) for (let dx = -1; dx <= 1; dx++) {
          const xx = x + dx, yy = y + dy;
          if (xx < 0 || xx >= w || yy < 0 || yy >= h) continue;
          const neighbor = yy * w + xx;
          if (owners[neighbor] !== index) continue;
          coverage += (dx ? 1 : 2) * (dy ? 1 : 2);
          const k = neighbor * 4, shade = base.data[k] + base.data[k + 1] + base.data[k + 2];
          if (shade < darkest) { darkest = shade; edgePixel = neighbor; }
        }
        if (!coverage) continue;
        matteMask[p] = index;
        const k = p * 4, to = ((y - top) * sprite.width + x - left) * 4;
        // Boundary pixels in the source already mix black ink with the scenery.
        // Carrying that RGB into a moving cutout makes teal/brown trimming halos.
        // Use its neighboring actual ink color with fractional edge coverage;
        // all interior painted pixels remain byte-for-byte the child's colors.
        const paintedInterior = owners[p] === index && distance[p] === 0 && labels[p] >= 0;
        const from = coverage < 16 && !paintedInterior ? edgePixel * 4 : k;
        pixels.data[to] = colored[from]; pixels.data[to + 1] = colored[from + 1];
        pixels.data[to + 2] = colored[from + 2]; pixels.data[to + 3] = Math.round(colored[from + 3] * coverage / 16);

      }
      context.putImageData(pixels, 0, 0);
      return [{object, sprite, box: [left / w, top / h, right / w, bottom / h]}];
    });
    return {sprites, mask: matteMask};
  }

  function originalBackdrop(canvas, base, mask, cleanPlate, config) {
    const w = canvas.width, h = canvas.height;
    const patch = document.createElement('canvas'); patch.width = w; patch.height = h;
    const patchContext = patch.getContext('2d');
    patchContext.drawImage(cleanPlate, 0, 0, w, h);
    const cleared = patchContext.getImageData(0, 0, w, h).data;
    const backdrop = document.createElement('canvas'); backdrop.width = w; backdrop.height = h;
    backdrop.className = 'paint-motion-backdrop';
    Object.assign(backdrop.style, {position: 'absolute', inset: '0', width: '100%', height: '100%'});
    const context = backdrop.getContext('2d'), picture = context.createImageData(w, h);
    picture.data.set(base.data);
    // Clear the authorized outline fringe. A scene may also feather the clean
    // plate into its surrounding shadows when their source lighting differs.
    const fringe = config.eraseFringe || 1;
    const blend = Math.max(0, Math.min(96, Math.round(config.backdropBlend || 0)));
    const reach = fringe + blend;
    let extended;
    if (reach > 1) {
      extended = new Uint8Array(mask.length).fill(255);
      const queue = new Int32Array(mask.length); let tail = 0;
      for (let p = 0; p < mask.length; p++) if (mask[p] >= 0) { extended[p] = 0; queue[tail++] = p; }
      for (let head = 0; head < tail; head++) {
        const p = queue[head], x = p % w, y = Math.floor(p / w);
        if (extended[p] >= reach) continue;
        for (const v of [x ? p - 1 : -1, x < w - 1 ? p + 1 : -1, y ? p - w : -1, y < h - 1 ? p + w : -1]) {
          if (v < 0 || extended[v] !== 255) continue;
          extended[v] = extended[p] + 1; queue[tail++] = v;
        }
      }
    }
    // Preserve every visible background pixel from the original coloring scene.
    // The clean plate supplies only the spots uncovered by moving objects and
    // their scene-authorized fringe/blend. More distant scenery remains exact.
    for (let p = 0; p < mask.length; p++) {
      const x = p % w, y = Math.floor(p / w);
      const covered = extended ? extended[p] <= fringe : mask[p] >= 0 ||
        (x && mask[p - 1] >= 0) || (x < w - 1 && mask[p + 1] >= 0) ||
        (y && mask[p - w] >= 0) || (y < h - 1 && mask[p + w] >= 0);
      let alpha = covered ? 1 : 0;
      if (blend && extended[p] > fringe && extended[p] < reach) {
        const t = (reach - extended[p]) / blend;
        alpha = t * t * (3 - 2 * t);
      }
      for (const box of config.shadows || []) {
        if (!contains(box, x / w, y / h)) continue;
        const rx = (box[2] - box[0]) / 2, ry = (box[3] - box[1]) / 2;
        const radius = Math.hypot((x / w - box[0] - rx) / rx, (y / h - box[1] - ry) / ry);
        alpha = Math.max(alpha, Math.max(0, Math.min(1, (1 - radius) * Math.min(rx * w, ry * h) / 8)));
      }
      if (alpha) for (let c = 0; c < 4; c++) {
        const k = p * 4 + c;
        picture.data[k] = Math.round(base.data[k] * (1 - alpha) + cleared[k] * alpha);
      }
    }
    context.putImageData(picture, 0, 0);
    return backdrop;
  }

  function keyframes(motion, width, height, index, box = [0, 0, 1, 1], origin = [.5, .75]) {
    // Respect each real cutout's rotated footprint. A small item can hop high;
    // an almost full-height flower needs a gentler dance to keep its petals in view.
    const frame = (offset, x = 0, y = 0, angle = 0, sx = 1, sy = sx, opacity = 1) => {
      if (motion !== 'ride' && offset > 0 && offset < 1) {
        const ow = (box[2] - box[0]) * width, oh = (box[3] - box[1]) * height;
        const ox = ow * origin[0], oy = oh * origin[1], radians = angle * Math.PI / 180, inset = 2;
        const footprint = () => [[0, 0], [ow, 0], [0, oh], [ow, oh]].map(([cx, cy]) => {
          const xx = (cx - ox) * sx, yy = (cy - oy) * sy;
          return [ox + xx * Math.cos(radians) - yy * Math.sin(radians), oy + xx * Math.sin(radians) + yy * Math.cos(radians)];
        });
        let corners = footprint(), xs = corners.map(point => point[0]), ys = corners.map(point => point[1]);
        const fit = Math.min(1, (width - inset * 2) / (Math.max(...xs) - Math.min(...xs)), (height - inset * 2) / (Math.max(...ys) - Math.min(...ys)));
        if (fit < 1) { sx *= fit; sy *= fit; corners = footprint(); xs = corners.map(point => point[0]); ys = corners.map(point => point[1]); }
        x = Math.max(inset - box[0] * width - Math.min(...xs), Math.min(x, width - inset - box[0] * width - Math.max(...xs)));
        y = Math.max(inset - box[1] * height - Math.min(...ys), Math.min(y, height - inset - box[1] * height - Math.max(...ys)));
      }
      return {offset, transform: `translate(${x}px,${y}px) rotate(${angle}deg) scale(${sx},${sy})`, opacity};
    };
    const jump = height * .20, shift = width * .14;
    const start = [frame(0), frame(.10)];
    function choreography() { switch (motion) {
      case 'ride': return [frame(0), frame(.06), frame(.10, -width * .015, 0, -3), frame(.18, width * .05, -height * .018, -1), frame(.32, width * .58, -height * .02), frame(.46, width * 1.25, 0, 1), frame(.49, width * 1.25, 0, 1, 1, 1, 0), frame(.50, -width * 1.25, 0, -1, 1, 1, 0), frame(.52, -width * 1.25, 0, -1), frame(.68, -width * .60, -height * .018, -2), frame(.84, -width * .10, -height * .01, 1), frame(.94), frame(1)];
      case 'sail': return [...start, frame(.22, -shift * .35, -height * .015, -5), frame(.38, shift * .6, -height * .025, 4), frame(.56, shift * .9, 0, -4), frame(.72, shift * .3, -height * .02, 3), frame(.90), frame(1)];
      case 'flip': return [...start, frame(.22, 0, 4, -12, 1.08, .9), frame(.40, shift * .15, -jump, -130), frame(.55, shift * .25, -jump * 1.15, -255), frame(.72, shift * .1, 0, -360, 1.15, .82), frame(.80, 0, -jump * .16, -360), frame(.88, 0, 0, -360), frame(1, 0, 0, -360)];
      case 'helmet-hop': return [...start, frame(.20, 0, 0, -8, 1.08, .90), frame(.34, -shift * .08, -jump * .55, 12), frame(.47, 0, 0, -10, 1.10, .88), frame(.61, shift * .07, -jump * .28, 8), frame(.74, 0, 0, -4, 1.04, .96), frame(.92), frame(1)];
      case 'beach-bounce': return [...start, frame(.19, 0, 0, -10, 1.10, .85), frame(.33, -shift * .25, -jump * .8, -40), frame(.47, -shift * .4, 0, -65, 1.12, .84), frame(.61, -shift * .15, -jump * .4, -20), frame(.74, shift * .05, 0, 12, 1.05, .94), frame(.90), frame(1)];
      case 'bucket-dance': return [...start, frame(.24, 0, -jump * .12, -14), frame(.39, shift * .1, 0, 12), frame(.54, -shift * .06, -jump * .08, -10), frame(.69, shift * .04, 0, 7), frame(.83, 0, 0, -3), frame(.94), frame(1)];
      case 'goggle-dive': return [...start, frame(.22, 0, -jump * .3, -8), frame(.38, shift * .1, -jump * .4, 22, .96), frame(.53, shift * .18, jump * .10, -12, .94), frame(.67, 0, -jump * .1, 7), frame(.82, 0, 0, -3), frame(.94), frame(1)];
      case 'bag-jump': return [...start, frame(.22, 0, 0, -5, 1.05, .93), frame(.32, 0, 0, 6, .98, 1.03), frame(.44, 0, 0, -7, 1.06, .92), frame(.58, -shift * .06, -jump * .5, 9), frame(.70, 0, 0, -4, 1.08, .90), frame(.83, 0, -jump * .10, 2), frame(.94), frame(1)];
      case 'fly':
      case 'bee-loop': return [...start, frame(.22, -shift * .45, jump * .30, -12, .98, .94), frame(.35, -shift * .7, -jump * .12, 10), frame(.48, shift * .20, -jump * .4, 12, 1, .94), frame(.62, shift * .5, jump * .18, -8), frame(.76, -shift * .15, jump * .1, 6, 1, .95), frame(.92), frame(1)];
      case 'bird-hop': return [...start, frame(.18, 0, 0, -5, 1.04, .93), frame(.28, shift * .15, -jump * .45, -8), frame(.36, shift * .2, 0, 3, 1.05, .92), frame(.48, shift * .3, -jump * .6, 8, 1, .93), frame(.60, shift * .25, 0, -3), frame(.70, shift * .1, -jump * .35, -6), frame(.84, 0, 0, 3), frame(.94), frame(1)];
      case 'dribble': return [...start, frame(.17, 0, 0, -8, 1.08, .85), frame(.28, -shift * .25, -jump * .7, -35), frame(.38, -shift * .4, 0, -65, 1.12, .82), frame(.50, shift * .1, -jump * 1.15, 45), frame(.62, shift * .3, 0, 100, 1.1, .86), frame(.73, shift * .1, -jump * .4, 40), frame(.83, 0, 0, -12, 1.05, .95), frame(.94), frame(1)];
      case 'tiptoe': return [...start, frame(.20, -shift * .10, -jump * .15, -10), frame(.31, shift * .15, 0, 8, 1.04, .95), frame(.43, shift * .28, -jump * .27, -8), frame(.54, shift * .10, 0, 9, 1.04, .96), frame(.65, -shift * .17, -jump * .3, -12), frame(.77, -shift * .12, 0, 7), frame(.92), frame(1)];
      case 'hoop-cheer': return [...start, frame(.25, 0, 0, -4, .99, .96), frame(.36, 0, -jump * .07, 5, 1, 1.03), frame(.47, 0, 0, -4), frame(.58, 0, -jump * .07, 4, 1, 1.02), frame(.71, 0, 0, -2), frame(.90), frame(1)];
      case 'peek': return [...start, frame(.22, 0, -jump * .28, -10), frame(.36, -shift * .2, -jump * .4, 12), frame(.49, shift * .15, -jump * .25, -8), frame(.62, 0, 0, 5), frame(.74, 0, -jump * .15, -4), frame(.92), frame(1)];
      case 'shimmy': return [...start, frame(.22, -shift * .15, 0, -7, .96, 1.03), frame(.34, shift * .16, -jump * .05, 7, 1.03, .97), frame(.46, -shift * .13, 0, -6), frame(.58, shift * .13, -jump * .1, 6), frame(.70, -shift * .08, 0, -3), frame(.83, shift * .05, 0, 2), frame(.94), frame(1)];
      case 'zip': return [...start, frame(.22, 0, 0, -6, 1.04, .95), frame(.36, -shift * .16, -jump * .22, 5), frame(.49, shift * .2, 0, -5, 1.04, .94), frame(.63, 0, -jump * .45, 7), frame(.76, 0, 0, -3, 1.08, .92), frame(.92), frame(1)];
      case 'sunshine': return [...start, frame(.26, 0, 0, -12, .94), frame(.43, 0, 0, 14, 1.06), frame(.61, 0, 0, -10, .97), frame(.78, 0, 0, 6, 1.03), frame(.94), frame(1)];
      case 'sprout': return [...start, frame(.22, 0, 0, -3, .94, .88), frame(.39, 0, -jump * .06, 3, .98, 1.02), frame(.54, 0, -jump * .08, -4, 1.03, 1.08), frame(.68, 0, 0, 4, 1.02), frame(.81, 0, 0, -2), frame(.94), frame(1)];
      case 'watering': return [...start, frame(.24, 0, -jump * .12, -3), frame(.38, shift * .04, -jump * .15, 18), frame(.63, shift * .04, -jump * .15, 18), frame(.76, 0, -jump * .06, -4), frame(.92), frame(1)];
      case 'mushroom-pop': return [...start, frame(.23, 0, 0, -3, 1.08, .86), frame(.39, 0, -jump * .65, 7, .97, 1.03), frame(.52, 0, 0, -5, 1.12, .84), frame(.65, shift * .06, -jump * .25, 4), frame(.77, 0, 0, -2, 1.04, .97), frame(.92), frame(1)];
      case 'bloom':
      case 'petal-dance': return [...start, frame(.22, 0, 0, -5, .95, .94), frame(.38, -shift * .04, -jump * .04, 6, 1.02, 1.04), frame(.53, shift * .03, 0, -7), frame(.67, -shift * .02, -jump * .03, 5, 1.03), frame(.81, 0, 0, -2), frame(.94), frame(1)];
      case 'cupcake-hop': return [...start, frame(.20, 0, 0, -5, 1.10, .87), frame(.34, -shift * .10, -jump * .6, -14), frame(.48, 0, 0, 8, 1.12, .85), frame(.62, shift * .10, -jump * .3, 11), frame(.75, 0, 0, -5, 1.06, .94), frame(.91), frame(1)];
      case 'honey-jiggle': return [...start, frame(.22, 0, 0, -8, 1.04, .96), frame(.36, 0, -jump * .08, 9, .98, 1.03), frame(.49, 0, 0, -7, 1.05, .95), frame(.61, 0, -jump * .04, 5), frame(.73, 0, 0, -3), frame(.91), frame(1)];
      case 'tea-pour': return [...start, frame(.24, 0, -jump * .10, -6), frame(.38, shift * .08, -jump * .15, 16), frame(.61, shift * .08, -jump * .15, 16), frame(.75, 0, -jump * .05, -4), frame(.91), frame(1)];
      case 'sleepy-stretch': return [...start, frame(.25, 0, 0, -2, 1.02, .97), frame(.42, 0, -jump * .04, 2, 1.05, 1.06), frame(.57, shift * .04, 0, -2, 1.06, .96), frame(.71, 0, 0, 1, .98, 1.02), frame(.88), frame(1)];
      case 'chair-rock': return [...start, frame(.24, 0, 0, -4), frame(.39, 0, 0, 4), frame(.54, 0, 0, -3), frame(.69, 0, 0, 2), frame(.83, 0, 0, -1), frame(.94), frame(1)];
      case 'cushion-fluff': return [...start, frame(.22, 0, 0, -6, 1.12, .82), frame(.38, 0, -jump * .65, 12, .94, 1.12), frame(.53, shift * .05, 0, -8, 1.16, .83), frame(.68, 0, -jump * .25, 5), frame(.82, 0, 0, -2, 1.04, .97), frame(.94), frame(1)];
      case 'blanket-wave': return [...start, frame(.23, -shift * .04, -jump * .08, -4, 1.06, .94), frame(.39, shift * .04, -jump * .12, 4, .96, 1.08), frame(.55, -shift * .03, -jump * .06, -3, 1.08, .95), frame(.70, shift * .02, 0, 2, .98, 1.03), frame(.85, 0, 0, -1), frame(.94), frame(1)];
      case 'guitar-strum': return [...start, frame(.20, 0, 0, -7), frame(.28, shift * .025, -jump * .025, 8), frame(.36, -shift * .025, 0, -6), frame(.44, shift * .025, -jump * .04, 7), frame(.52, -shift * .02, 0, -5), frame(.63, 0, -jump * .12, 10), frame(.76, 0, 0, -3), frame(.92), frame(1)];
      case 'hat-tip': return [...start, frame(.24, 0, -jump * .12, -18), frame(.36, shift * .08, -jump * .42, -30), frame(.53, shift * .12, -jump * .5, 150), frame(.69, 0, -jump * .18, 355), frame(.80, 0, 0, 360, 1.06, .94), frame(.91, 0, 0, 360), frame(1, 0, 0, 360)];
      case 'paint-pot-hop': return [...start, frame(.21, 0, 0, -5, 1.08, .90), frame(.36, -shift * .10, -jump * .48, -14), frame(.49, 0, 0, 8, 1.09, .91), frame(.63, shift * .08, -jump * .24, 12), frame(.76, 0, 0, -5), frame(.92), frame(1)];
      case 'butterfly-flutter': return [...start, frame(.22, -shift * .12, -jump * .20, -12, .86, 1), frame(.35, -shift * .28, -jump * .44, 10), frame(.47, shift * .10, -jump * .56, 14, .82, 1), frame(.60, shift * .24, -jump * .25, -10), frame(.73, -shift * .08, -jump * .14, 7, .88, 1), frame(.92), frame(1)];
      case 'pot-waltz': return [...start, frame(.21, -shift * .06, 0, -10), frame(.33, -shift * .10, -jump * .12, -15), frame(.45, 0, 0, 8), frame(.59, shift * .10, -jump * .15, 14), frame(.72, shift * .05, 0, -6), frame(.84, 0, -jump * .06, 3), frame(.94), frame(1)];
      case 'leaf-tumble': return [...start, frame(.23, -shift * .2, -jump * .3, -25, .93), frame(.39, -shift * .3, -jump * .6, -70, .9), frame(.55, shift * .1, -jump * .45, 35, .95), frame(.70, shift * .2, -jump * .2, 16), frame(.85, -shift * .05, 0, -7), frame(.95), frame(1)];
      case 'spin': return [...start, frame(.26, 0, -jump * .2, -15), frame(.48, 0, -jump * .4, 170), frame(.70, 0, -jump * .15, 370), frame(.86, 0, 0, 360), frame(1, 0, 0, 360)];
      case 'pour': return [...start, frame(.30, 0, -jump * .1, 8), frame(.46, shift * .1, -jump * .15, 24), frame(.65, shift * .1, -jump * .15, 24), frame(.86), frame(1)];
      case 'grow': return [...start, frame(.27, 0, 0, -3, .94, .90), frame(.48, 0, -jump * .1, 3, 1.08, 1.14), frame(.70, 0, 0, -3, .99), frame(.87), frame(1)];
      case 'sway': return [...start, frame(.25, -shift * .06, 0, -9), frame(.43, shift * .07, -jump * .05, 10), frame(.62, -shift * .05, 0, -7), frame(.80, shift * .03, 0, 4), frame(.92), frame(1)];
      case 'sleep': return [...start, frame(.28, 0, -jump * .025, -1, 1.025), frame(.44), frame(.64, 0, -jump * .025, 1, 1.025), frame(.82), frame(1)];
      case 'wobble': return [...start, frame(.24, 0, 0, -11, 1.02, .98), frame(.40, 0, -jump * .12, 10), frame(.56, 0, 0, -8, 1.06, .94), frame(.73, 0, -jump * .05, 5), frame(.88), frame(1)];
      default: {
        const direction = index % 2 ? -1 : 1;
        return [...start, frame(.20, 0, 0, 0, 1.1, .88), frame(.35, shift * .12 * direction, -jump, direction * 10), frame(.50, shift * .18 * direction, 0, 0, 1.14, .84), frame(.63, shift * .10 * direction, -jump * .50, direction * -7), frame(.76, 0, 0, 0, 1.06, .94), frame(.88), frame(1)];
      }
    } }
    const frames = choreography();
    if (motion === 'ride') return frames;
    // A turning bottle can cross an edge between otherwise-safe poses. Bound
    // the intervening poses too, rather than letting overflow crop the artwork.
    const values = item => item.transform.match(/-?[\d.]+/g).map(Number);
    const bounded = [frames[0]];
    for (let i = 1; i < frames.length; i++) {
      const previous = frames[i - 1], next = frames[i], from = values(previous), to = values(next);
      for (let step = 1; step <= 16; step++) {
        const t = step / 16, pose = from.map((value, n) => value + (to[n] - value) * t);
        bounded.push(frame(previous.offset + (next.offset - previous.offset) * t, ...pose, previous.opacity + (next.opacity - previous.opacity) * t));
      }
    }
    return bounded;
  }

  function addEffect(actor, object, animations, width, height) {
    const effect = object.effect;
    if (!effect) return;
    const count = effect.type === 'zzz' ? 3 : effect.type === 'rays' ? 5 : 6;
    for (let i = 0; i < count; i++) {
      const particle = document.createElement('span');
      particle.className = `paint-motion-effect paint-motion-effect--${effect.type}`;
      particle.dataset.effect = effect.type;
      if (effect.type === 'zzz') particle.textContent = i % 2 ? 'z' : 'Z';
      if (effect.type === 'music') particle.textContent = i % 2 ? '♪' : '♫';
      Object.assign(particle.style, {left: `${effect.at[0] * 100}%`, top: `${effect.at[1] * 100}%`});
      actor.append(particle);
      let x, y;
      if (effect.type === 'water') { x = width * (.08 + (i % 3) * .035); y = height * (.32 + (i % 2) * .10); }
      else if (effect.type === 'rays') { const angle = i * Math.PI * 2 / count; x = Math.cos(angle) * width * .38; y = Math.sin(angle) * height * .38; }
      else { x = (i % 2 ? -1 : 1) * width * (.08 + i * .035); y = -height * (.20 + i * .035); }
      const frames = [
        {offset: 0, opacity: 0, transform: 'translate(0,0) scale(.3)'},
        {offset: .18, opacity: .85, transform: `translate(${x * .15}px,${y * .15}px) scale(.8)`},
        {offset: .70, opacity: .65, transform: `translate(${x * .7}px,${y * .7}px) scale(1)`},
        {offset: 1, opacity: 0, transform: `translate(${x}px,${y}px) scale(.6)`}
      ];
      if (particle.animate) animations.push(particle.animate(frames, {duration: effect.type === 'water' ? 850 : 1400, delay: 1300 + i * 130, easing: 'ease-out', fill: 'both'}));
    }
  }

  function create({canvas, base, labels, regions, scene, config}) {
    let disposed = false, active = null, loaded = false, failed = false;
    const preview = new Image();
    preview.onload = () => { loaded = true; if (active) start(); };
    preview.onerror = () => { failed = true; settle(false); };
    if (config) preview.src = config.background;
    function play() {
      if (disposed || !config) return Promise.resolve(false);
      if (active) return active.promise;
      const {sprites, mask} = cutouts(canvas, base, labels, regions, config);
      if (!sprites.length) return Promise.resolve(true);
      let resolve;
      const promise = new Promise(done => { resolve = done; });
      active = {promise, sprites, mask, world: null, animations: [], resolve, opacity: canvas.style.opacity, timer: null};
      if (loaded) start();
      else if (failed) settle(false);
      else active.timer = setTimeout(() => settle(false), 8000);
      return promise;
    }
    function start() {
      if (!active || active.world || disposed) return;
      if (document.visibilityState === 'hidden') { settle(false); return; }
      clearTimeout(active.timer);
      const {sprites, mask} = active;
      const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
      const world = document.createElement('div'); world.className = 'paint-motion-world';
      world.setAttribute('aria-hidden', 'true'); world.dataset.scene = config.id;
      world.append(originalBackdrop(canvas, base, mask, preview, config));
      const animations = active.animations, size = scene.getBoundingClientRect();
      const width = size.width || canvas.width, height = size.height || canvas.height;
      sprites.forEach(({object, sprite, box}, index) => {
        const actor = document.createElement('div'); actor.className = 'paint-motion-object';
        actor.dataset.motion = object.motion; actor.dataset.object = object.name;
        let origin = object.origin || (['flip', 'spin', 'fly', 'bee-loop', 'leaf-tumble'].includes(object.motion) ? [.5, .5] : [.5, .75]);
        let motionBox = box, motionOrigin = origin, motionName = object.motion;
        const partners = object.moveWith ? sprites.filter(item => item.object.moveWith === object.moveWith) : [];
        if (partners.length > 1) {
          // A source photo cannot reveal the part of a bag hidden by goggles.
          // Keep those overlapping layers together in world space so their real
          // occlusion is preserved throughout the hop, squash and turn.
          motionBox = [Math.min(...partners.map(item => item.box[0])), Math.min(...partners.map(item => item.box[1])),
            Math.max(...partners.map(item => item.box[2])), Math.max(...partners.map(item => item.box[3]))];
          motionOrigin = object.groupOrigin || [.5, .75]; motionName = object.groupMotion || object.motion;
          origin = [(motionBox[0] + (motionBox[2] - motionBox[0]) * motionOrigin[0] - box[0]) / (box[2] - box[0]),
            (motionBox[1] + (motionBox[3] - motionBox[1]) * motionOrigin[1] - box[1]) / (box[3] - box[1])];
          actor.dataset.motionGroup = object.moveWith;
        }
        Object.assign(actor.style, {left: `${box[0] * 100}%`, top: `${box[1] * 100}%`, width: `${(box[2] - box[0]) * 100}%`, height: `${(box[3] - box[1]) * 100}%`, zIndex: String(object.layer ?? 1), transformOrigin: `${origin[0] * 100}% ${origin[1] * 100}%`});
        Object.assign(sprite.style, {position: 'static', width: '100%', height: '100%', display: 'block'});
        actor.append(sprite); world.append(actor);
        if (!reduced && actor.animate) {
          animations.push(actor.animate(keyframes(motionName, width, height, index, motionBox, motionOrigin), {duration: 4800, easing: ['ride', 'bee-loop'].includes(motionName) ? 'linear' : 'ease-in-out', fill: 'both'}));
          addEffect(actor, object, animations, width * (box[2] - box[0]), height * (box[3] - box[1]));
        }
      });
      if (!reduced) for (let i = 0; i < 9; i++) {
        const star = document.createElement('span'); star.className = 'paint-motion-sparkle'; star.textContent = '✦';
        Object.assign(star.style, {left: `${9 + i * 10}%`, top: `${35 + (i % 3) * 18}%`, color: ['#ffe474', '#b8eaff', '#ffaed2'][i % 3]});
        world.append(star);
        if (star.animate) animations.push(star.animate([{opacity: 0, transform: 'scale(.2)'}, {opacity: 1, transform: 'translateY(-12px) scale(1.2)', offset: .3}, {opacity: 0, transform: 'translateY(-45px) scale(.3)'}], {duration: 1200, delay: 500 + i * 160, fill: 'both'}));
      }
      active.world = world;
      scene.append(world); scene.classList.add('paint-is-moving');
      canvas.style.opacity = '0'; canvas.dataset.motionState = 'playing';
      active.timer = setTimeout(() => settle(true), reduced ? 650 : 4800);
    }
    function settle(success) {
      if (!active) return;
      const previous = active; active = null;
      clearTimeout(previous.timer); previous.animations.forEach(animation => animation.cancel());
      previous.world?.remove(); scene.classList.remove('paint-is-moving');
      canvas.style.opacity = previous.opacity; canvas.dataset.motionState = 'idle';
      previous.resolve(success);
    }
    const hidden = () => { if (document.visibilityState === 'hidden') settle(false); };
    const leave = () => settle(false);
    document.addEventListener('visibilitychange', hidden);
    addEventListener('pagehide', leave);
    return {play, dispose() {
      disposed = true; settle(false);
      preview.onload = null; preview.onerror = null;
      document.removeEventListener('visibilitychange', hidden);
      removeEventListener('pagehide', leave);
    }};
  }
  window.Month9ColorMotion = {create};
})();
