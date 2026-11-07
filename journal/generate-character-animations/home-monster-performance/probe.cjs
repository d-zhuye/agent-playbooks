const fs = require('node:fs');
const path = require('node:path');
const Module = require('node:module');
const { performance } = require('node:perf_hooks');
const { createHash } = require('node:crypto');
const os = require('node:os');
const root = process.cwd();
const sourceRoot = process.argv[2] ? path.resolve(process.argv[2]) : root;
const ref = process.argv[3] ?? 'working-tree';
const read = relative => fs.readFileSync(path.join(sourceRoot,relative));
const ts = require(path.join(root, 'node_modules/typescript'));
const filename = path.join(root, 'src/ui/homeMonsters.ts');
const source = read('src/ui/homeMonsters.ts').toString('utf8');
function load(text) {
  const instance = new Module(filename, module);
  instance.filename = filename;
  instance.paths = Module._nodeModulePaths(path.dirname(filename));
  const originalRequire=instance.require.bind(instance);
  instance.require=request=>request.startsWith('./home') && request.endsWith('.json') ? JSON.parse(read(`src/ui/${request.slice(2)}`).toString('utf8')) : originalRequire(request);
  instance._compile(ts.transpileModule(text, { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 } }).outputText, filename);
  return instance.exports;
}
const engine = load(source);
const { MONSTERS, TRANSFORM, START, step, evaluate, scene, stageMarkup, channelIndex, nodeValue, matrix } = engine;
function parts(who) {
  const result = [];
  function walk(node, ancestors, solo) {
    const slots = TRANSFORM.map(p => channelIndex(who, `${node.id}.${p}`));
    result.push({ node, slots, ancestors, solo, animated: slots.some(s => s >= 0) || !!solo });
    const soloSlot = node.solo !== undefined ? channelIndex(who, `${node.id}.solo`) : -1;
    (node.children ?? []).forEach((child, i) => {
      if (node.solo !== undefined && soloSlot < 0 && i !== node.solo) return;
      walk(child, [...ancestors, { node, solo, slots }], soloSlot >= 0 ? { slot: soloSlot, index: i } : undefined);
    });
  }
  walk(who.rig, [], undefined);
  return result;
}
function shown(who, values, descriptor) {
  return nodeValue(who, values, descriptor.node, 'opacity') > 0 && (!descriptor.solo || Math.round(values[descriptor.solo.slot]) === descriptor.solo.index);
}
function visible(who, values, descriptor) {
  return shown(who, values, descriptor) && descriptor.ancestors.every(a => shown(who, values, a));
}
function output(who, values, descriptor) {
  const v = TRANSFORM.map(p => nodeValue(who, values, descriptor.node, p));
  return [...matrix(...v.slice(0, 5)), shown(who, values, descriptor) ? v[5] : 0];
}
const descriptors = MONSTERS.map(parts);
const counts = MONSTERS.map((who, i) => {
  const file = {adult:'homeMonsters',lime:'homeLime',pear:'homePear',teen:'homeTeen'}[who.name];
  const data = read(`src/ui/${file}.json`);
  const bytes = data.length;
  const timelines = Object.values(JSON.parse(data.toString('utf8')).timelines);
  const keys = timelines.flatMap(t => Object.values(t.channels)).flat();
  const fixedLoopChannels = who.runtime.loop.keys.filter((keys,j)=>keys.every(k=>k[1]===who.runtime.storyEnd[who.runtime.loop.slots[j]])).length;
  return {name:who.name, jsonBytes:bytes, mountedGroups:descriptors[i].length, mountedPaths:descriptors[i].filter(p=>p.node.d).length, animatedGroups:descriptors[i].filter(p=>p.animated).length, channels:who.channels.length, storyChannels:who.runtime.story.slots.length, loopChannels:who.runtime.loop.slots.length, fixedLoopChannels, keys:keys.length};
});
const snapshots = [0, 120, 500, 800, 1100, 1500].map(clock => {
  const values = scene(MONSTERS.map(()=>({...START, clock})), false);
  return {clock, visibleAnimatedGroups:MONSTERS.map((who,i)=>descriptors[i].filter(p=>p.animated && visible(who,values[i],p)).length), visiblePaths:MONSTERS.map((who,i)=>descriptors[i].filter(p=>p.node.d && visible(who,values[i],p)).length)};
});
function sampleKind(keys, frame) {
  if (frame <= keys[0][0] || frame >= keys.at(-1)[0]) return {boundary:1};
  let lo=0, hi=keys.length-1;
  while(hi-lo>1) {const mid=(lo+hi)>>1; if(keys[mid][0]<=frame) lo=mid; else hi=mid;}
  const a=keys[lo], b=keys[hi];
  return {sampled:1, cubic:a[2]===2?1:0, constantCubic:a[2]===2 && a[1]===b[1]?1:0};
}
function phase(begin,end) {
  const sums = {animated:0, visibleAnimated:0, changed:0, visibleChanged:0, sampled:0, boundary:0, cubic:0, constantCubic:0};
  for(let clock=begin;clock<end;clock++) {
    MONSTERS.forEach((who,i)=>{
      const current=evaluate(who.runtime,{...START,clock},false,[]);
      const previous=evaluate(who.runtime,{...START,clock:Math.max(0,clock-1)},false,[]);
      descriptors[i].filter(p=>p.animated).forEach(p=>{
        sums.animated++;
        const isVisible=visible(who,current,p);
        if(isVisible) sums.visibleAnimated++;
        const next=output(who,current,p), old=output(who,previous,p);
        if(next.some((v,j)=>v!==old[j])) {sums.changed++;if(isVisible) sums.visibleChanged++;}
      });
      const track=clock>=who.runtime.story.duration?who.runtime.loop:who.runtime.story;
      const at=clock>=who.runtime.story.duration?(clock-who.runtime.story.duration)%track.duration:clock;
      track.keys.forEach(keys=>{for(const [k,n] of Object.entries(sampleKind(keys,at))) sums[k]+=n;});
    });
  }
  return {begin,end, averagesPerFrame:Object.fromEntries(Object.entries(sums).map(([k,v])=>[k,Number((v/(end-begin)).toFixed(2))]))};
}
function benchmark(mod, begin, end, tapped) {
  const iterations=20000;
  let machines=mod.MONSTERS.map(()=>({...mod.START,clock:begin}));
  let checksum=0;
  function frame(f) {
    if (machines[0].clock >= end) machines.forEach(m => {m.clock=begin;});
    machines=machines.map((m,i)=>mod.step(mod.MONSTERS[i].runtime,m,1,tapped && f%90===0 && i===Math.floor(f/90)%mod.MONSTERS.length,0.5,false));
    const values=machines.map((m,i)=>mod.evaluate(mod.MONSTERS[i].runtime,m,false,new Array(mod.MONSTERS[i].channels.length).fill(0)));
    checksum+=values[1][0];
  }
  for(let f=0;f<3000;f++) frame(f);
  const runs=[];
  for(let r=0;r<7;r++) {const start=performance.now();for(let f=0;f<iterations;f++) frame(f);runs.push((performance.now()-start)*1000/iterations);}
  runs.sort((a,b)=>a-b);
  return {medianMicrosecondsPerFourMonsterTick:Number(runs[3].toFixed(2)), min:Number(runs[0].toFixed(2)), max:Number(runs.at(-1).toFixed(2)),checksum:Number(checksum.toFixed(2))};
}
// A separate in-memory engine tests one hypothesis; the production source is untouched.
// Every removed loop channel is already supplied by evaluate()'s storyEnd baseline.
const candidate=load(source);
candidate.MONSTERS.forEach(who=>{
  const track=who.runtime.loop;
  const keep=track.keys.map((keys,i)=>!keys.every(k=>k[1]===who.runtime.storyEnd[track.slots[i]]));
  who.runtime.loop={...track,slots:track.slots.filter((_,i)=>keep[i]),keys:track.keys.filter((_,i)=>keep[i])};
});
let parityChecks=0;
MONSTERS.forEach((who,i)=>{
  let m=START;
  for(let f=0;f<4600;f++) {
    m=step(who.runtime,m,0.5,f%91===0,0.5,false);
    const a=evaluate(who.runtime,m,false,[]), b=candidate.evaluate(candidate.MONSTERS[i].runtime,m,false,[]);
    a.forEach((v,j)=>{if(v!==b[j]) throw new Error(`Mismatch ${who.name}, frame ${f}, channel ${j}`);parityChecks++;});
  }
});
const benchmarkResults={};
for(const [name,begin,end,tapped] of [['story',0,1066,false],['loop',1066,1966,false],['greetings',1066,1966,true]]) {
  benchmarkResults[name]=benchmark(engine,begin,end,tapped);
}
const still=stageMarkup(scene(MONSTERS.map(()=>START),true));
const greetings=MONSTERS.map((who,i)=>{
  const m=step(who.runtime,START,0,true,0,true);
  const values=scene(MONSTERS.map(()=>START),true);
  values[i]=evaluate(who.runtime,m,true,[]);
  return Buffer.byteLength(stageMarkup(values));
});
console.log(JSON.stringify({ref,runtime:process.version, platform:process.platform,cpu:os.cpus()[0]?.model,sourceSha256:createHash('sha256').update(source).digest('hex'), counts,snapshots,phases:[phase(0,engine.STORY_FRAMES),phase(engine.STORY_FRAMES,engine.STORY_FRAMES+engine.LOOP_FRAMES)],stillMarkupBytes:Buffer.byteLength(still),stillGreetingMarkupBytes:greetings, parityChecks, benchmarkResults},null,2));
